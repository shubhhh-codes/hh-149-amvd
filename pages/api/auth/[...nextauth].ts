/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        // Allow login if email matches environment variable
        const allowedAdminEmail = process.env.ADMIN_EMAIL;
        const allowedAdminPassword = process.env.ADMIN_PASSWORD;

        if (!allowedAdminEmail || !allowedAdminPassword) {
          throw new Error('Server environment is missing admin credentials configuration');
        }

        if (credentials.email !== allowedAdminEmail || credentials.password !== allowedAdminPassword) {
          throw new Error('Invalid email or password');
        }

        return {
          id: 'super-admin-env',
          email: credentials.email,
          role: 'admin',
        };
      }
    }),
    CredentialsProvider({
      id: 'webauthn',
      name: 'WebAuthn',
      credentials: {
        authResponse: { label: "authResponse", type: "text" },
        challengeId: { label: "challengeId", type: "text" }
      },
      async authorize(credentials, req) {
        if (!credentials?.authResponse || !credentials?.challengeId) {
          throw new Error('Missing webauthn credentials');
        }

        const { verifyAuthenticationResponse } = await import('@simplewebauthn/server');
        const clientPromise = (await import('../../../lib/mongodb')).default;
        const { ObjectId } = await import('mongodb');

        const client = await clientPromise;
        const db = client.db();

        const challengeDoc = await db.collection('passkey_challenges').findOne({
          _id: new ObjectId(credentials.challengeId)
        });

        if (!challengeDoc) {
          throw new Error('Challenge expired or not found');
        }

        const expectedChallenge = challengeDoc.challenge;
        await db.collection('passkey_challenges').deleteOne({ _id: new ObjectId(credentials.challengeId) });

        const authResponse = JSON.parse(credentials.authResponse);
        
        // Find the passkey
        const passkey = await db.collection('admin_passkeys').findOne({
          credentialID: authResponse.id
        });

        if (!passkey) {
          throw new Error('Passkey not registered');
        }

        // Host header isn't directly available in NextAuth authorize args without some digging,
        // but we can use the NEXTAUTH_URL or extract from req
        const host = req.headers?.host || 'localhost:3000';
        const rpID = host.split(':')[0];
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const expectedOrigin = `${protocol}://${host}`;

        const verification = await verifyAuthenticationResponse({
          response: authResponse,
          expectedChallenge,
          expectedOrigin,
          expectedRPID: rpID,
          credential: {
            id: passkey.credentialID, // already a base64url string
            publicKey: Buffer.from(passkey.credentialPublicKey, 'base64'),
            counter: passkey.counter,
          },
        });

        if (verification.verified) {
          // Update the counter
          await db.collection('admin_passkeys').updateOne(
            { _id: passkey._id },
            { $set: { counter: verification.authenticationInfo.newCounter } }
          );

          return {
            id: 'super-admin-env',
            email: process.env.ADMIN_EMAIL || 'admin@humorshub.com',
            role: 'admin',
          };
        }

        throw new Error('WebAuthn verification failed');
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 1800, // 30 minutes
  },
};

export default NextAuth(authOptions);
