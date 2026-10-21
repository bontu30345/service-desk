import assert from "node:assert/strict";
import test from "node:test";
import {
  getPasswordResetPublicOrigin,
  isPasswordResetEmailConfigured,
  sendPasswordResetEmail,
} from "../../src/features/auth/services/password-reset-email";

const environmentKeys = [
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "SERVICE_DESK_PUBLIC_URL",
] as const;

function saveEnvironment() {
  const previous = new Map(
    environmentKeys.map((key) => [key, process.env[key]]),
  );
  return () => {
    for (const key of environmentKeys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

test("password recovery configuration rejects missing and unsafe public URLs", (t) => {
  const restoreEnvironment = saveEnvironment();
  t.after(restoreEnvironment);

  process.env.RESEND_API_KEY = "unit-test-key";
  process.env.RESEND_FROM_EMAIL = "Support <support@example.invalid>";
  delete process.env.SERVICE_DESK_PUBLIC_URL;
  assert.equal(isPasswordResetEmailConfigured(), false);
  assert.throws(() => getPasswordResetPublicOrigin(), /not configured/);

  process.env.SERVICE_DESK_PUBLIC_URL = "http://service-desk.example.invalid";
  assert.equal(isPasswordResetEmailConfigured(), false);
  assert.throws(() => getPasswordResetPublicOrigin(), /invalid/);

  process.env.SERVICE_DESK_PUBLIC_URL = "https://user:pass@example.invalid";
  assert.equal(isPasswordResetEmailConfigured(), false);
  assert.throws(() => getPasswordResetPublicOrigin(), /invalid/);

  process.env.SERVICE_DESK_PUBLIC_URL = "http://localhost:3000";
  assert.equal(isPasswordResetEmailConfigured(), true);
  assert.equal(getPasswordResetPublicOrigin(), "http://localhost:3000");
});

test("reset email link uses the configured public origin and safely encodes its token", async (t) => {
  const restoreEnvironment = saveEnvironment();
  const originalFetch = globalThis.fetch;
  t.after(() => {
    restoreEnvironment();
    globalThis.fetch = originalFetch;
  });

  process.env.RESEND_API_KEY = "unit-test-key";
  process.env.RESEND_FROM_EMAIL = "Support <support@example.invalid>";
  process.env.SERVICE_DESK_PUBLIC_URL = "https://desk.example.invalid/base/path";
  let requestBody = "";
  globalThis.fetch = (async (_input, init) => {
    requestBody = String(init?.body ?? "");
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  await sendPasswordResetEmail("person@example.invalid", "token+with/slash");

  const message = JSON.parse(requestBody) as {
    text: string;
    html: string;
  };
  const link = new URL(message.text.match(/https?:\/\/\S+/)?.[0] ?? "");
  assert.equal(link.origin, "https://desk.example.invalid");
  assert.equal(link.pathname, "/reset-password");
  assert.equal(link.searchParams.get("token"), "token+with/slash");
  assert.match(message.html, /https:\/\/desk\.example\.invalid\/reset-password\?/);
});

test("email provider failures return a generic error without echoing the token", async (t) => {
  const restoreEnvironment = saveEnvironment();
  const originalFetch = globalThis.fetch;
  t.after(() => {
    restoreEnvironment();
    globalThis.fetch = originalFetch;
  });

  process.env.RESEND_API_KEY = "unit-test-key";
  process.env.RESEND_FROM_EMAIL = "Support <support@example.invalid>";
  process.env.SERVICE_DESK_PUBLIC_URL = "https://desk.example.invalid";
  globalThis.fetch = (async () =>
    new Response(null, { status: 503 })) as typeof fetch;

  await assert.rejects(
    sendPasswordResetEmail("person@example.invalid", "private-test-token"),
    (error: unknown) => {
      assert(error instanceof Error);
      assert.equal(error.message, "Password recovery email delivery failed.");
      assert(!error.message.includes("private-test-token"));
      return true;
    },
  );
});
