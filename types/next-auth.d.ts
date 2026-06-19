import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      userId: string;
      role?: string;
      createdAt?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    username: string;
    userId: string;
    role?: string;
    createdAt?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    username?: string;
    userId?: string;
    role?: string;
    createdAt?: string | null;
  }
}
