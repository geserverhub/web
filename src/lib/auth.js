import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { queryGeserverhub } from "@/lib/geserverhub-db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  useSecureCookies: false,
  basePath: "/api/auth",
  debug: process.env.NODE_ENV === "development",
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: { httpOnly: false, sameSite: "lax", path: "/", secure: false },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        portal: { label: "Portal", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const identifier = credentials.email.trim();
        console.log("[auth] authorize attempt:", identifier);

        try {
          // Search by email, username, or name
          const user =
            (await prisma.user.findUnique({ where: { email: identifier } })) ??
            (await prisma.user.findUnique({ where: { username: identifier } })) ??
            (await prisma.user.findFirst({ where: { name: identifier } }));

          console.log("[auth] user found:", user ? `${user.email} role=${user.role}` : "null");

          if (!user || !user.password) return null;

          const valid = await bcrypt.compare(credentials.password, user.password);
          console.log("[auth] password valid:", valid);
          if (!valid) return null;

          // Check portal permission (skip for SUPER_ADMIN)
          const portal = credentials.portal?.trim();
          if (portal && user.role !== 'SUPER_ADMIN') {
            try {
              const permRows = await queryGeserverhub(
                'SELECT is_allowed FROM user_permissions WHERE user_id = ? AND portal = ? LIMIT 1',
                [user.id, portal]
              );
              if (permRows.length > 0 && !permRows[0].is_allowed) {
                console.log("[auth] portal blocked:", portal, "for user:", user.id);
                return null;
              }
            } catch (permErr) {
              console.error("[auth] permission check error:", permErr.message);
              // Fail open — allow login if permission check fails
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clientId: user.clientId || null,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientId = user.clientId || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.clientId = token.clientId || null;
      }
      return session;
    },
  },
});
