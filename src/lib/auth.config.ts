import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = (auth?.user as { role?: string })?.role;
      const isAdmin = userRole === "ADMIN";
      
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnAuth = nextUrl.pathname.startsWith("/login") || 
                       nextUrl.pathname.startsWith("/register");

      // Si está logueado y va a login/register, redirigir según rol
      if (isLoggedIn && isOnAuth) {
        if (isAdmin) {
          return Response.redirect(new URL("/admin", nextUrl));
        }
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // Si no está logueado y va a dashboard o admin, redirigir a login
      if (!isLoggedIn && (isOnDashboard || isOnAdmin)) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      // Si está logueado pero no es admin e intenta acceder a /admin
      if (isLoggedIn && isOnAdmin && !isAdmin) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // Providers se agregan en auth.ts
};
