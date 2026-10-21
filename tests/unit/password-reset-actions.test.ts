import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";

test("password-reset requests do not disclose account existence", async (t) => {
  let knownUser:
    | { id: number; isActive: boolean }
    | null = null;
  let rateLimitAllowed = true;
  let mailCalls = 0;
  let failEmailDelivery = false;
  let deletedTokenCount = 0;
  let issuedTokenHash = "";
  let deliveredToken = "";
  let tokenValidity = false;
  let consumedTokenCount = 0;
  let consumedPasswordHash = "";

  const environmentKeys = [
    "AUTH_SECRET",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "SERVICE_DESK_PUBLIC_URL",
  ] as const;
  const previousEnvironment = new Map(
    environmentKeys.map((key) => [key, process.env[key]]),
  );
  process.env.AUTH_SECRET = "unit-test-secret";
  process.env.RESEND_API_KEY = "unit-test-resend-key";
  process.env.RESEND_FROM_EMAIL = "Service Desk <support@example.invalid>";
  process.env.SERVICE_DESK_PUBLIC_URL = "https://service-desk.example.invalid";
  t.after(() => {
    for (const key of environmentKeys) {
      const previousValue = previousEnvironment.get(key);
      if (previousValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previousValue;
      }
    }
  });

  const sourceUrl = (path: string) =>
    new URL(`../../src/${path}`, import.meta.url).href;

  t.mock.module(sourceUrl("lib/prisma.ts"), {
    namedExports: {
      prisma: {
        user: {
          findFirst: async () => knownUser,
        },
        passwordResetToken: {
          deleteMany: async () => ({ count: 1 }),
        },
      },
    },
  });
  t.mock.module(
    sourceUrl("features/auth/repositories/password-reset.repository.ts"),
    {
      namedExports: {
        consumePasswordResetLimit: async () => rateLimitAllowed,
        consumePasswordResetToken: async (
          _tokenHash: string,
          passwordHash: string,
        ) => {
          consumedTokenCount += 1;
          consumedPasswordHash = passwordHash;
          return true;
        },
        deletePasswordResetToken: async () => {
          deletedTokenCount += 1;
          return { count: 1 };
        },
        issuePasswordResetToken: async (
          _userId: number,
          tokenHash: string,
        ) => {
          issuedTokenHash = tokenHash;
        },
        isPasswordResetTokenValid: async () => tokenValidity,
      },
    },
  );
  t.mock.module(sourceUrl("features/auth/services/password-reset-email.ts"), {
    namedExports: {
      isPasswordResetEmailConfigured: () => true,
      sendPasswordResetEmail: async (_email: string, token: string) => {
        mailCalls += 1;
        deliveredToken = token;
        if (failEmailDelivery) throw new Error("provider response is private");
      },
    },
  });

  const { requestPasswordResetAction, resetPasswordAction } = await import(
    "../../src/features/auth/actions/password-reset"
  );
  const request = async (email: string) => {
    const form = new FormData();
    form.set("email", email);
    return requestPasswordResetAction({ message: "" }, form);
  };

  const missingAccount = await request("missing@example.invalid");
  knownUser = { id: 42, isActive: true };
  const existingAccount = await request("employee@example.invalid");

  assert.deepEqual(existingAccount, missingAccount);
  assert.equal(existingAccount.success, true);
  assert(!existingAccount.message.includes("employee@example.invalid"));
  assert(!existingAccount.message.includes("missing@example.invalid"));
  assert.equal(mailCalls, 1);
  assert.equal(deliveredToken.length, 43);
  assert.notEqual(issuedTokenHash, deliveredToken);

  failEmailDelivery = true;
  const failedDeliveryResponse = await request("employee@example.invalid");
  failEmailDelivery = false;
  assert.deepEqual(failedDeliveryResponse, missingAccount);
  assert.equal(mailCalls, 2);
  assert.equal(deletedTokenCount, 1);

  rateLimitAllowed = false;
  const limitedResponse = await request("employee@example.invalid");
  assert.deepEqual(limitedResponse, missingAccount);
  assert.equal(mailCalls, 2);

  const invalidPassword = new FormData();
  invalidPassword.set("token", "this-is-a-long-enough-reset-token");
  invalidPassword.set("password", "new-password");
  invalidPassword.set("confirmPassword", "different-password");
  const mismatch = await resetPasswordAction({ message: "" }, invalidPassword);
  assert.equal(mismatch.success, undefined);
  assert.equal(mismatch.message, "Passwords do not match.");
  assert.equal(consumedTokenCount, 0);

  tokenValidity = false;
  invalidPassword.set("confirmPassword", "new-password");
  const expired = await resetPasswordAction({ message: "" }, invalidPassword);
  assert.equal(expired.message, "This reset link is invalid or expired. Request a new link.");
  assert.equal(consumedTokenCount, 0);

  tokenValidity = true;
  const reset = await resetPasswordAction({ message: "" }, invalidPassword);
  assert.equal(reset.success, true);
  assert.equal(
    await bcrypt.compare("new-password", consumedPasswordHash),
    true,
  );
  assert.notEqual(consumedPasswordHash, "new-password");
  assert.equal(consumedTokenCount, 1);
});
