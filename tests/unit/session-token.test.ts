import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@prisma/client";
import type { JWT } from "next-auth/jwt";
import { refreshSessionToken } from "../../src/features/auth/session-token";

function makeDatabase(user: unknown): Pick<PrismaClient, "user"> {
  return {
    user: {
      findUnique: async () => user,
    },
  } as unknown as Pick<PrismaClient, "user">;
}

test("session refresh uses the current role and profile from the database", async () => {
  const token = {
    id: "17",
    role: "ADMIN",
    isActive: true,
    sessionVersion: 3,
    name: "Old name",
    email: "old@example.invalid",
  } as JWT;

  const refreshed = await refreshSessionToken(
    token,
    makeDatabase({
      id: 17,
      role: "EMPLOYEE",
      isActive: true,
      sessionVersion: 3,
      name: "Current name",
      email: "current@example.invalid",
    }),
  );

  assert.equal(refreshed.id, "17");
  assert.equal(refreshed.role, "EMPLOYEE");
  assert.equal(refreshed.isActive, true);
  assert.equal(refreshed.sessionVersion, 3);
  assert.equal(refreshed.name, "Current name");
  assert.equal(refreshed.email, "current@example.invalid");
});

test("deactivated or deleted users are removed from the session identity", async () => {
  for (const currentUser of [
    {
      id: 17,
      role: "ADMIN",
      isActive: false,
      sessionVersion: 3,
      name: "Inactive user",
      email: "inactive@example.invalid",
    },
    null,
  ]) {
    const token = {
      id: "17",
      role: "ADMIN",
      isActive: true,
      sessionVersion: 3,
      name: "Previous name",
      email: "previous@example.invalid",
    } as JWT;

    const refreshed = await refreshSessionToken(
      token,
      makeDatabase(currentUser),
    );

    assert.equal(refreshed.id, "");
    assert.equal(refreshed.role, "EMPLOYEE");
    assert.equal(refreshed.isActive, false);
    assert.equal(refreshed.sessionVersion, undefined);
    assert.equal(refreshed.name, null);
    assert.equal(refreshed.email, null);
  }
});

test("old and versionless tokens fail closed while a new login reads the server version", async () => {
  const database = makeDatabase({
    id: 17,
    role: "AGENT",
    isActive: true,
    sessionVersion: 5,
    name: "Current user",
    email: "current@example.invalid",
  });

  for (const sessionVersion of [4, undefined]) {
    const oldToken = {
      id: "17",
      role: "ADMIN",
      isActive: true,
      sessionVersion,
    } as JWT;
    const rejected = await refreshSessionToken(oldToken, database);
    assert.equal(rejected.id, "");
    assert.equal(rejected.isActive, false);
  }

  const newLoginToken = {
    id: "17",
    role: "ADMIN",
    isActive: true,
  } as JWT;
  const accepted = await refreshSessionToken(newLoginToken, database, true);
  assert.equal(accepted.id, "17");
  assert.equal(accepted.role, "AGENT");
  assert.equal(accepted.sessionVersion, 5);
  assert.equal(accepted.isActive, true);
});
