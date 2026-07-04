import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { queryGeserverhub } from "@/lib/geserverhub-db";
import { getAuthSecret } from "@/lib/auth-secret";
import authConfig from "@/lib/auth.config";
import {
  isRoleAllowedForNextAuthPortal,
  NEXTAUTH_PORTAL_ROLES,
} from "@/lib/login-portals";
import { getCtmAdminFallbackUser } from "@/lib/charoenthaimart-login.mjs";

export { NEXTAUTH_PORTAL_ROLES };

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: getAuthSecret(),
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
          const fallbackUser = getCtmAdminFallbackUser(identifier, credentials.password);
          const user = fallbackUser ??
            (await prisma.user.findUnique({ where: { email: identifier } })) ??
            (await prisma.user.findUnique({ where: { username: identifier } })) ??
            (await prisma.user.findFirst({ where: { name: identifier } }));

          console.log("[auth] user found:", user ? `${user.email} role=${user.role}` : "null");

          if (!user) return null;

          // Fallback users have pre-validated credentials — skip bcrypt
          if (!fallbackUser) {
            if (!user.password) return null;

            if (user.isActive === false) {
              console.log("[auth] user disabled:", user.email);
              return null;
            }

            const valid = await bcrypt.compare(credentials.password, user.password);
            console.log("[auth] password valid:", valid);
            if (!valid) return null;
          }

          const portal = credentials.portal?.trim();
          if (!isRoleAllowedForNextAuthPortal(portal, user.role)) {
            console.log("[auth] role blocked for portal:", portal, "role=", user.role);
            return null;
          }

          if (portal && user.role !== 'SUPER_ADMIN') {
            const PORTAL_ROLES = {
              admin: ['ADMIN', 'SUPER_ADMIN'],
              partner: ['PARTNER', 'ADMIN', 'SUPER_ADMIN'],
              client: ['CLIENT', 'ADMIN', 'SUPER_ADMIN'],
            };
            if (PORTAL_ROLES[portal] && !PORTAL_ROLES[portal].includes(user.role)) {
              console.log("[auth] role not allowed for portal:", portal, "role:", user.role);
              return null;
            }

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
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientId = user.clientId || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.clientId = token.clientId || null;
      }
      return session;
    },
  },
});
