import type { PrismaClient } from "@prisma/client";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function refreshSessionToken(
  token: JWT,
  database: Pick<PrismaClient, "user"> = prisma,
  newlyAuthenticated = false,
): Promise<JWT> {
  const userId = typeof token.id === "string" ? Number(token.id) : NaN;
  if (!Number.isSafeInteger(userId) || userId < 1) {
    token.id = "";
    token.role = "EMPLOYEE";
    token.isActive = false;
    token.sessionVersion = undefined;
    token.name = null;
    token.email = null;
    return token;
  }

  const user = await database.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      sessionVersion: true,
    },
  });

  if (
    !user?.isActive ||
    (!newlyAuthenticated &&
      (!Number.isSafeInteger(token.sessionVersion) ||
        token.sessionVersion !== user.sessionVersion))
  ) {
    token.id = "";
    token.role = "EMPLOYEE";
    token.isActive = false;
    token.sessionVersion = undefined;
    token.name = null;
    token.email = null;
    return token;
  }

  token.id = String(user.id);
  token.name = user.name;
  token.email = user.email;
  token.role = user.role;
  token.isActive = true;
  token.sessionVersion = user.sessionVersion;
  return token;
}
