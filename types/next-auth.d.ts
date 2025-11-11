/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      userId: string;
      name?: string | null;
      image?: string | null;
      createdAt?: string | null;
    }
  }

  interface User {
    id: string;
    email: string;
    username: string;
    userId: string;
    name?: string | null;
    image?: string | null;
    createdAt?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    username: string;
    userId: string;
    name?: string | null;
    image?: string | null;
    createdAt?: string | null;
  }
} 