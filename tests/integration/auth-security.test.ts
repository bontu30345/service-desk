import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import type { JWT } from "next-auth/jwt";
import { authorizeCredentials } from "../../src/features/auth/credentials";
import {
  consumePasswordResetLimit,
  consumePasswordResetToken,
  isPasswordResetTokenValid,
  issuePasswordResetToken,
} from "../../src/features/auth/repositories/password-reset.repository";
import { findProvisionedOAuthUser } from "../../src/features/auth/oauth-identities";
import { refreshSessionToken } from "../../src/features/auth/session-token";
import { createIsolatedTestPrismaClient } from "./test-database";

test("password-reset tokens and OAuth identities enforce explicit provisioning", async (t) => {
  const database = await createIsolatedTestPrismaClient();
  const marker = `auth-security-${randomUUID()}`;
  const oldPassword = `old-test-password-${marker}`;
  const newPasswordA = `new-test-password-a-${marker}`;
  const newPasswordB = `new-test-password-b-${marker}`;
  const oldPasswordHash = await bcrypt.hash(oldPassword, 4);
  const newPasswordHashA = await bcrypt.hash(newPasswordA, 4);
  const newPasswordHashB = await bcrypt.hash(newPasswordB, 4);
  const rateLimitKeys = [`${marker}-limit`];
  const userIds: number[] = [];

  t.after(async () => {
    try {
      if (userIds.length > 0) {
        await database.user.deleteMany({ where: { id: { in: userIds } } });
      }
      await database.passwordResetRequestLimit.deleteMany({
        where: { keyHash: { in: rateLimitKeys } },
      });

      const remainingUsers = await database.user.count({
        where: { id: { in: userIds } },
      });
      const remainingLimits = await database.passwordResetRequestLimit.count({
        where: { keyHash: { in: rateLimitKeys } },
      });
      const remainingTokens = await database.passwordResetToken.count({
        where: { userId: { in: userIds } },
      });
      const remainingIdentities = await database.oAuthIdentity.count({
        where: { userId: { in: userIds } },
      });
      assert.equal(
        remainingUsers +
          remainingLimits +
          remainingTokens +
          remainingIdentities,
        0,
      );
    } finally {
      await database.$disconnect();
    }
  });

  const user = await database.user.create({
    data: {
      name: `${marker}-employee`,
      email: `${marker}@example.invalid`,
      password: oldPasswordHash,
      role: Role.EMPLOYEE,
    },
    select: { id: true, email: true, role: true, sessionVersion: true },
  });
  userIds.push(user.id);
  const inactiveUser = await database.user.create({
    data: {
      name: `${marker}-inactive`,
      email: `${marker}-inactive@example.invalid`,
      password: oldPasswordHash,
      role: Role.ADMIN,
      isActive: false,
    },
    select: { id: true },
  });
  userIds.push(inactiveUser.id);

  const googleSubject = `${marker}-google-subject`;
  const githubSubject = `${marker}-github-subject`;
  const inactiveSubject = `${marker}-inactive-subject`;
  await database.oAuthIdentity.createMany({
    data: [
      {
        provider: "google",
        providerAccountId: googleSubject,
        userId: user.id,
      },
      {
        provider: "github",
        providerAccountId: githubSubject,
        userId: user.id,
      },
      {
        provider: "google",
        providerAccountId: inactiveSubject,
        userId: inactiveUser.id,
      },
    ],
  });

  await t.test("OAuth accepts only exact pre-provisioned active subject IDs and uses the local role", async () => {
    const googleUser = await findProvisionedOAuthUser(
      "google",
      googleSubject,
      database,
    );
    assert.equal(googleUser?.id, user.id);
    assert.equal(googleUser?.role, Role.EMPLOYEE);

    const githubUser = await findProvisionedOAuthUser(
      "github",
      githubSubject,
      database,
    );
    assert.equal(githubUser?.id, user.id);
    assert.equal(githubUser?.role, Role.EMPLOYEE);

    assert.equal(
      await findProvisionedOAuthUser("google", `${marker}-unknown`, database),
      null,
    );
    assert.equal(
      await findProvisionedOAuthUser("google", inactiveSubject, database),
      null,
    );
  });

  await t.test("expired and reused password-reset tokens cannot change credentials", async () => {
    const now = new Date();
    const expiredHash = `${marker}-expired-hash`;
    await database.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: expiredHash,
        expiresAt: new Date(now.getTime() - 1_000),
      },
    });
    assert.equal(
      await isPasswordResetTokenValid(expiredHash, now, database),
      false,
    );
    assert.equal(
      await consumePasswordResetToken(
        expiredHash,
        "should-not-be-used",
        now,
        database,
      ),
      false,
    );

    const existingSession = {
      id: String(user.id),
      role: user.role,
      isActive: true,
      sessionVersion: user.sessionVersion,
    } as JWT;
    const validHash = `${marker}-valid-hash`;
    await issuePasswordResetToken(
      user.id,
      validHash,
      new Date(now.getTime() + 30 * 60 * 1000),
      database,
    );
    assert.equal(
      await isPasswordResetTokenValid(validHash, now, database),
      true,
    );
    const concurrentConsumers = await Promise.all([
      consumePasswordResetToken(
        validHash,
        newPasswordHashA,
        now,
        database,
      ),
      consumePasswordResetToken(
        validHash,
        newPasswordHashB,
        now,
        database,
      ),
    ]);
    assert.deepEqual(concurrentConsumers.sort(), [false, true]);
    assert.equal(
      await consumePasswordResetToken(
        validHash,
        await bcrypt.hash("reused-test-password", 4),
        now,
        database,
      ),
      false,
    );
    const updatedPassword = (
      await database.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { password: true },
      })
    ).password;
    assert.ok([newPasswordHashA, newPasswordHashB].includes(updatedPassword));
    assert.equal(await bcrypt.compare(oldPassword, updatedPassword), false);

    const oldPasswordResult = await authorizeCredentials(
      { email: user.email, password: oldPassword },
      database,
    );
    assert.equal(oldPasswordResult, null);
    const acceptedNewPassword = await Promise.any(
      [newPasswordA, newPasswordB].map(async (password) => {
        const result = await authorizeCredentials(
          { email: user.email, password },
          database,
        );
        if (!result) throw new Error("Password did not match the updated hash.");
        return result;
      }),
    );
    assert.equal(acceptedNewPassword.id, String(user.id));

    const revokedSession = await refreshSessionToken(existingSession, database);
    assert.equal(revokedSession.id, "");
    assert.equal(revokedSession.isActive, false);

    const newLoginToken = {
      id: String(user.id),
      role: user.role,
      isActive: true,
    } as JWT;
    const acceptedNewSession = await refreshSessionToken(
      newLoginToken,
      database,
      true,
    );
    assert.equal(acceptedNewSession.id, String(user.id));
    assert.equal(acceptedNewSession.isActive, true);
    assert.equal(
      acceptedNewSession.sessionVersion,
      user.sessionVersion + 1,
    );
    assert.equal(
      (await refreshSessionToken(acceptedNewSession, database)).id,
      String(user.id),
    );
    assert.equal(
      await database.passwordResetToken.count({ where: { userId: user.id } }),
      0,
    );
  });

  await t.test("password-reset rate limits are atomic, scoped, and expire", async () => {
    const key = `${marker}-limit`;
    const now = new Date();
    assert.equal(await consumePasswordResetLimit(key, now, database), true);
    assert.equal(await consumePasswordResetLimit(key, now, database), true);
    assert.equal(await consumePasswordResetLimit(key, now, database), true);
    assert.equal(await consumePasswordResetLimit(key, now, database), false);
    const nextWindow = new Date(now.getTime() + 60 * 60 * 1000 + 1);
    const concurrentRequests = await Promise.all(
      Array.from({ length: 10 }, () =>
        consumePasswordResetLimit(key, nextWindow, database),
      ),
    );
    assert.equal(concurrentRequests.filter(Boolean).length, 3);
  });
});
