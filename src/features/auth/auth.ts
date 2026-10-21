import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { Role } from "@prisma/client";
import { authorizeCredentials } from "./credentials";
import { findProvisionedOAuthUser } from "./oauth-identities";
import { refreshSessionToken } from "./session-token";

function isRole(value: unknown): value is Role {
  return value === "EMPLOYEE" || value === "AGENT" || value === "ADMIN";
}

const providers = [
  Credentials({
    credentials: {
      email: {},
      password: {},
    },

    authorize: (credentials) => authorizeCredentials(credentials),
  }),
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : []),
  ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
    ? [
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),
      ]
    : []),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers,

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true;
      }

      if (
        !account ||
        (account.provider !== "google" && account.provider !== "github") ||
        !account.providerAccountId
      ) {
        return false;
      }

      const provisionedUser = await findProvisionedOAuthUser(
        account.provider,
        account.providerAccountId,
      );
      if (!provisionedUser) {
        return false;
      }

      user.id = String(provisionedUser.id);
      user.name = provisionedUser.name;
      user.email = provisionedUser.email;
      user.role = provisionedUser.role;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return refreshSessionToken(token, undefined, Boolean(user));
    },

    async session({ session, token }) {
      if (session.user) {
        if (token.isActive !== true || !token.id || !isRole(token.role)) {
          session.user.id = "";
          session.user.name = null;
          session.user.email = "";
          session.user.role = "EMPLOYEE";
          return session;
        }

        session.user.id = token.id as string;
        session.user.name = token.name;
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
        session.user.role = token.role;
      }

      return session;
    },
  },
});
