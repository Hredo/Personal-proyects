import NextAuth from "next-auth";
import db from "@/lib/db";
import authConfig from "./auth.config";
import { compare } from "bcryptjs";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        if (!email || !password) {
          return null;
        }

        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
          return null;
        }

        const isValid = await compare(password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
