import { cache } from "react";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signup", error: "/auth-error" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      if (token.id) {
        try {
          const u = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { handle: true },
          });
          token.handle = u?.handle ?? null;
        } catch {
          // Keep whatever handle the token already carries rather than
          // failing the session: a sleeping database should not sign
          // someone out.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.handle = (token.handle as string | null) ?? null;
      }
      return session;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;

// A page and the root layout both read the session in one request, and
// the jwt callback above queries the database each time. cache() collapses
// the calls within a request to a single lookup.
export const auth = cache(nextAuth.auth);
