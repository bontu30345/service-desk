import type { Role } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type OAuthProvider = "google" | "github";

export type ProvisionedOAuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
};

export async function findProvisionedOAuthUser(
  provider: OAuthProvider,
  providerAccountId: string,
  database: PrismaClient = prisma,
): Promise<ProvisionedOAuthUser | null> {
  const identity = await database.oAuthIdentity.findUnique({
    where: {
      provider_providerAccountId: { provider, providerAccountId },
    },
    select: {
      user: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
    },
  });

  if (!identity?.user.isActive) {
    return null;
  }

  return identity.user;
}
