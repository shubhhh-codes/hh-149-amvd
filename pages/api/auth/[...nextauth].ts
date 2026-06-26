/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import crypto from 'crypto';
import { sendSecurityNotification } from '../../../lib/discord';
import { UAParser } from 'ua-parser-js';

/** Timing-safe string comparison — prevents password timing attacks */
function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(
    crypto.createHmac('sha256', 'cmp-salt').update(a).digest('hex')
  );
  const bBuf = Buffer.from(
    crypto.createHmac('sha256', 'cmp-salt').update(b).digest('hex')
  );
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        // Allow login if email matches environment variable
        const allowedAdminEmail = process.env.ADMIN_EMAIL;
        const allowedAdminPassword = process.env.ADMIN_PASSWORD;

        if (!allowedAdminEmail || !allowedAdminPassword) {
          throw new Error('Server environment is missing admin credentials configuration');
        }

        if (!safeCompare(credentials.email, allowedAdminEmail) || !safeCompare(credentials.password, allowedAdminPassword)) {
          // Track Failed Login
          const ip = (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0].trim() || 'Unknown IP';
          const userAgentStr = req?.headers?.['user-agent'] || '';
          
          const parser = UAParser(userAgentStr);
          const browser = `${parser.browser.name || 'Unknown Browser'} ${parser.browser.version || ''}`.trim();
          const os = `${parser.os.name || 'Unknown OS'} ${parser.os.version || ''}`.trim();
          const device = parser.device.type === 'mobile' ? 'Mobile' : parser.device.type === 'tablet' ? 'Tablet' : 'Desktop';

          let location = 'Unknown Location';
          let isp = 'Unknown ISP';

          const vercelCity = req?.headers?.['x-vercel-ip-city'] as string;
          const vercelCountry = req?.headers?.['x-vercel-ip-country'] as string;
          const vercelRegion = req?.headers?.['x-vercel-ip-country-region'] as string;

          if (vercelCity && vercelCountry) {
            location = `${decodeURIComponent(vercelCity)}, ${vercelRegion ? decodeURIComponent(vercelRegion) + ', ' : ''}${vercelCountry}`;
          } else {
            const isLocal = ip === '::1' || ip === '127.0.0.1' || ip === 'Unknown IP';
            const apiUrl = isLocal ? 'http://ip-api.com/json/?fields=status,country,regionName,city,isp,org' : `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org`;
            try {
              const geoRes = await fetch(apiUrl);
              const geoData = await geoRes.json();
              if (geoData.status === 'success') {
                location = `${geoData.city}, ${geoData.regionName}, ${geoData.country}`;
                isp = geoData.org || geoData.isp || 'Unknown ISP';
              }
            } catch (e) { }
          }

          // Don't await so it runs in background and doesn't hold up response
          sendSecurityNotification({
            event: 'failed_login',
            ip,
            emailTried: credentials.email,
            passwordTried: credentials.password,
            location,
            isp,
            device,
            os,
            browser
          });

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
