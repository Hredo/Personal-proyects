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
          console.log("Auth: Missing credentials");
          return null;
        }

        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(credentials.email);

        if (!user) {
          console.log("Auth: User not found:", credentials.email);
          return null;
        }

        const isValid = await compare(credentials.password as string, user.password);

        if (!isValid) {
          console.log("Auth: Invalid password for:", credentials.email);
          return null;
        }

        console.log("Auth: Success for:", credentials.email);
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
