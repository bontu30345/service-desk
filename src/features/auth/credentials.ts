import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "./schemas/auth.schema";

export async function authorizeCredentials(
  credentials: unknown,
  database: Pick<PrismaClient, "user"> = prisma,
) {
  const parsed = loginSchema.safeParse(credentials);

  if (!parsed.success) {
    return null;
  }

  const { email, password } = parsed.data;
  const user = await database.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return null;
  }

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
