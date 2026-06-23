/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const session = req.nextauth.token;

    if (path.startsWith('/admin')) {
      if (!session?.email || session.email !== 'admin@humorshub.com') {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.email === 'admin@humorshub.com';
        }
        return true;
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
);

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
  ],
};