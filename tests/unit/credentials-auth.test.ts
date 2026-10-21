import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";

test("credentials authorization validates input, active status, and password hash", async (t) => {
  const password = "correct-horse-battery";
  const passwordHash = await bcrypt.hash(password, 4);
  const inactivePasswordHash = await bcrypt.hash("inactive-account-pass", 4);
  const users = new Map([
    [
      "employee@example.invalid",
      {
        id: 41,
        name: "Service Employee",
        email: "employee@example.invalid",
        password: passwordHash,
        role: "EMPLOYEE",
        isActive: true,
      },
    ],
    [
      "inactive@example.invalid",
      {
        id: 42,
        name: "Inactive Employee",
        email: "inactive@example.invalid",
        password: inactivePasswordHash,
        role: "ADMIN",
        isActive: false,
      },
    ],
  ]);

  t.mock.module(new URL("../../src/lib/prisma.ts", import.meta.url).href, {
    namedExports: {
      prisma: {
        user: {
          findUnique: async ({ where }: { where: { email: string } }) =>
            users.get(where.email) ?? null,
        },
      },
    },
  });

  const { authorizeCredentials } = await import(
    "../../src/features/auth/credentials"
  );

  assert.deepEqual(
    await authorizeCredentials({
      email: "employee@example.invalid",
      password,
      role: "ADMIN",
    }),
    {
      id: "41",
      name: "Service Employee",
      email: "employee@example.invalid",
      role: "EMPLOYEE",
    },
  );

  assert.equal(
    await authorizeCredentials({
      email: "employee@example.invalid",
      password: "wrong-password-value",
    }),
    null,
  );
  assert.equal(
    await authorizeCredentials({
      email: "unknown@example.invalid",
      password,
    }),
    null,
  );
  assert.equal(
    await authorizeCredentials({
      email: "inactive@example.invalid",
      password: "inactive-account-pass",
    }),
    null,
  );
  assert.equal(
    await authorizeCredentials({ email: "not-an-email", password }),
    null,
  );
  assert.equal(await authorizeCredentials({ email: "employee@example.invalid" }), null);
});
