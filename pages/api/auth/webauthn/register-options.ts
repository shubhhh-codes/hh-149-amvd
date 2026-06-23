import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import clientPromise from '../../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Must be authenticated as admin to register a passkey
  const session = await getServerSession(req, res, authOptions);
  if (session?.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const rpName = 'Humors Hub Admin';
  // Use the host from headers to support localhost and Vercel
  const rpID = req.headers.host?.split(':')[0] || 'localhost';

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new Uint8Array(Buffer.from('super-admin-env')),
    userName: session.user.email || process.env.ADMIN_EMAIL || 'admin',
    userDisplayName: 'Humours Hub Admin',
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });

  // Store the challenge in the DB temporarily
  const client = await clientPromise;
  const db = client.db();
  const challengeDoc = await db.collection('passkey_challenges').insertOne({
    challenge: options.challenge,
    createdAt: new Date(),
  });

  res.json({
    options,
    challengeId: challengeDoc.insertedId.toString(),
  });
}
