import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // Credentials provider attaches role directly on the user object.
        // OAuth providers don't — fetch role from DB instead.
        const directRole = (user as { role?: string }).role;
        if (directRole) {
          token.role = directRole;
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id as string },
            select: { role: true },
          });
          token.role = dbUser?.role ?? "BUSINESS_OWNER";
        }
      }

      if (account?.provider === "google" && token.id) {
        const businessCount = await prisma.business.count({
          where: { ownerId: token.id as string },
        });
        token.needsOnboarding = businessCount === 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { needsOnboarding?: boolean }).needsOnboarding =
          token.needsOnboarding as boolean | undefined;
      }
      return session;
    },
  },
});
