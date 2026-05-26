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
      const needsOnboarding = (auth?.user as { needsOnboarding?: boolean })?.needsOnboarding;
      const isAdmin = userRole === "ADMIN";

      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnRegister = nextUrl.pathname.startsWith("/register");
      const isOnBusinessOnboarding = nextUrl.pathname.startsWith("/register/business");
      const isOnInvalidSession = nextUrl.pathname.startsWith("/invalid-session");
      const isOnOnboarding = nextUrl.pathname.startsWith("/onboarding");
      const isOnAnyOnboarding = isOnBusinessOnboarding || isOnOnboarding;

      // Permitir /invalid-session siempre (necesario para limpiar sesiones corruptas)
      if (isOnInvalidSession) return true;

      // Onboarding requiere autenticación
      if (!isLoggedIn && isOnAnyOnboarding) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      if (isLoggedIn && isOnAnyOnboarding) return true;

      // Si el usuario de Google no tiene negocio aún, redirigir al onboarding
      if (isLoggedIn && needsOnboarding && !isOnAnyOnboarding) {
        return Response.redirect(new URL("/register/business", nextUrl));
      }

      // Si está logueado y va a login/register, redirigir según rol
      // Si viene con callbackUrl=/admin, dejar pasar para que pueda
      // cerrar sesión y loguearse con cuenta admin
      const callbackUrl = nextUrl.searchParams.get("callbackUrl") ?? "";
      const wantsAdmin = callbackUrl.includes("/admin");
      if (isLoggedIn && (isOnLogin || isOnRegister) && !wantsAdmin) {
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
