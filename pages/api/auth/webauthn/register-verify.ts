import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (session?.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { response, challengeId } = req.body;

  const client = await clientPromise;
  const db = client.db();
  
  // Retrieve the challenge
  const challengeDoc = await db.collection('passkey_challenges').findOne({
    _id: new ObjectId(challengeId)
  });

  if (!challengeDoc) {
    return res.status(400).json({ error: 'Challenge expired or not found' });
  }

  const expectedChallenge = challengeDoc.challenge;
  
  // Optionally clean up the challenge to prevent replay
  await db.collection('passkey_challenges').deleteOne({ _id: new ObjectId(challengeId) });

  const rpID = req.headers.host?.split(':')[0] || 'localhost';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const expectedOrigin = `${protocol}://${req.headers.host}`;

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;

      // Save passkey in DB
      await db.collection('admin_passkeys').insertOne({
        credentialID: credential.id, // String (base64url)
        credentialPublicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        createdAt: new Date(),
      });

      return res.status(200).json({ verified: true });
    }
  } catch (error: any) {
    console.error('Registration verification failed:', error);
    return res.status(400).json({ error: error.message });
  }

  return res.status(400).json({ error: 'Verification failed' });
}
