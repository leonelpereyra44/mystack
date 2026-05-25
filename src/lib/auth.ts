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
      // allowDangerousEmailAccountLinking eliminado: permitía que una cuenta
      // Google se vincule silenciosamente a cualquier cuenta email/password
      // existente sin confirmación. Si el usuario ya tiene cuenta con email
      // y contraseña, debe iniciar sesión con esas credenciales.
      // El error OAuthAccountNotLinked es manejado en el form de login.
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
      // En login inicial, user está presente
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }

      // Para usuarios OAuth: si no tenemos el role en el token, lo buscamos en DB
      if (account?.provider === "google" && token.id && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        token.role = dbUser?.role;
      }

      // Detectar si el usuario de Google necesita crear su negocio.
      // Se re-evalúa en cada refresco del token mientras needsOnboarding sea true,
      // de modo que una vez creado el negocio el flag se limpia automáticamente
      // sin necesidad de que el usuario cierre sesión.
      if (token.id && (account?.provider === "google" || token.needsOnboarding === true)) {
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
