import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function consumePasswordResetLimit(
  keyHash: string,
  now: Date,
  database: PrismaClient = prisma,
) {
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000);

  return database.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      DELETE FROM "PasswordResetRequestLimit"
      WHERE "windowStartedAt" < ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}
    `;

    const rows = await transaction.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "PasswordResetRequestLimit"
        ("keyHash", "count", "windowStartedAt", "updatedAt")
      VALUES (${keyHash}, 1, ${now}, ${now})
      ON CONFLICT ("keyHash") DO UPDATE SET
        "count" = CASE
          WHEN "PasswordResetRequestLimit"."windowStartedAt" <= ${windowStart}
            THEN 1
          ELSE "PasswordResetRequestLimit"."count" + 1
        END,
        "windowStartedAt" = CASE
          WHEN "PasswordResetRequestLimit"."windowStartedAt" <= ${windowStart}
            THEN ${now}
          ELSE "PasswordResetRequestLimit"."windowStartedAt"
        END,
        "updatedAt" = ${now}
      RETURNING "count"
    `;

    return (rows[0]?.count ?? 0) <= 3;
  });
}

export async function issuePasswordResetToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date,
  database: PrismaClient = prisma,
) {
  return database.$transaction(async (transaction) => {
    await transaction.passwordResetToken.deleteMany({
      where: { OR: [{ userId }, { expiresAt: { lte: new Date() } }] },
    });

    await transaction.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  });
}

export async function deletePasswordResetToken(
  tokenHash: string,
  database: PrismaClient = prisma,
) {
  await database.passwordResetToken.deleteMany({ where: { tokenHash } });
}

export async function isPasswordResetTokenValid(
  tokenHash: string,
  now: Date,
  database: PrismaClient = prisma,
) {
  const token = await database.passwordResetToken.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: now },
      user: { isActive: true },
    },
    select: { id: true },
  });

  return token !== null;
}

export async function consumePasswordResetToken(
  tokenHash: string,
  passwordHash: string,
  now: Date,
  database: PrismaClient = prisma,
) {
  return database.$transaction(async (transaction) => {
    const token = await transaction.passwordResetToken.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
        expiresAt: { gt: now },
        user: { isActive: true },
      },
      select: { id: true, userId: true },
    });
    if (!token) {
      return false;
    }

    const claimed = await transaction.passwordResetToken.updateMany({
      where: {
        id: token.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });
    if (claimed.count !== 1) {
      return false;
    }

    await transaction.user.update({
      where: { id: token.userId },
      data: {
        password: passwordHash,
        sessionVersion: { increment: 1 },
      },
    });
    await transaction.passwordResetToken.deleteMany({
      where: { userId: token.userId },
    });

    return true;
  });
}
