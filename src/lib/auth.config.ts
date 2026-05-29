import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "./auth-secret";

declare module "next-auth" {
  interface User {
    role?: string;
    clientId?: string | null;
  }
  interface Session {
    user: User & { role?: string; clientId?: string | null };
  }
  interface JWT {
    role?: string;
    clientId?: string | null;
  }
}

/** Edge-safe auth config — NO Prisma, NO bcrypt */
const authConfig: NextAuthConfig = {
  secret: getAuthSecret(),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientId = user.clientId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
        session.user.clientId = (token.clientId as string | null) ?? null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role as string | undefined;
      const { pathname } = nextUrl;

      // Public auth pages — always accessible
      if (pathname === "/auth/select") return true;
      if (pathname === "/login") return true;
      if (pathname === "/admin/login") return true;
      if (pathname === "/partner/login") return true;
      if (pathname === "/customer-dashboard-login") return true;
      if (pathname === "/customer-momoge-login") return true;
      if (pathname === "/energy-dashboard-login") return true;
      if (pathname === "/online-classroom-login") return true;
      if (pathname === "/ge-energy-erp-login") return true;
      if (pathname === "/ge-energy-tech/login") return true;

      // ระบบผู้ดูแล — ADMIN / SUPER_ADMIN เท่านั้น
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return Response.redirect(new URL("/admin/login", nextUrl));
        if (role !== "ADMIN" && role !== "SUPER_ADMIN")
          return Response.redirect(new URL("/admin/login", nextUrl));
      }

      // พอร์ทัลพาร์ทเนอร์ — PARTNER / ADMIN / SUPER_ADMIN
      if (pathname.startsWith("/partner")) {
        if (!isLoggedIn) return Response.redirect(new URL("/partner/login", nextUrl));
        if (role !== "PARTNER" && role !== "ADMIN" && role !== "SUPER_ADMIN")
          return Response.redirect(new URL("/partner/login", nextUrl));
      }

      if (pathname.startsWith("/mct-product")) {
        if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
      }

      return true;
    },
  },
};

export default authConfig;
