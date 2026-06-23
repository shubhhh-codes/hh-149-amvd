import { NextApiRequest, NextApiResponse } from 'next';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import clientPromise from '../../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const client = await clientPromise;
  const db = client.db();

  // Get all registered passkeys for the admin
  const passkeys = await db.collection('admin_passkeys').find({}).toArray();

  const rpID = req.headers.host?.split(':')[0] || 'localhost';

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: passkeys.map((pk) => ({
      id: pk.credentialID, // ID is already a base64url string
      type: 'public-key',
    })),
    userVerification: 'preferred',
  });

  // Store the challenge in the DB temporarily
  const challengeDoc = await db.collection('passkey_challenges').insertOne({
    challenge: options.challenge,
    createdAt: new Date(),
  });

  res.json({
    options,
    challengeId: challengeDoc.insertedId.toString(),
  });
}
