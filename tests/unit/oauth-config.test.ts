import assert from "node:assert/strict";
import test from "node:test";
import { getConfiguredOAuthProviders } from "../../src/features/auth/oauth-config";

test("OAuth buttons are enabled only when both provider credentials are configured", () => {
  const environmentKeys = [
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "AUTH_GITHUB_ID",
    "AUTH_GITHUB_SECRET",
  ] as const;
  const previousEnvironment = new Map(
    environmentKeys.map((key) => [key, process.env[key]]),
  );

  try {
    for (const key of environmentKeys) delete process.env[key];
    assert.deepEqual(getConfiguredOAuthProviders(), []);

    process.env.AUTH_GOOGLE_ID = "configured-client-id";
    assert.deepEqual(getConfiguredOAuthProviders(), []);

    process.env.AUTH_GOOGLE_SECRET = "configured-client-secret";
    process.env.AUTH_GITHUB_ID = "configured-client-id";
    process.env.AUTH_GITHUB_SECRET = "configured-client-secret";
    assert.deepEqual(getConfiguredOAuthProviders(), ["google", "github"]);
  } finally {
    for (const key of environmentKeys) {
      const previousValue = previousEnvironment.get(key);
      if (previousValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previousValue;
      }
    }
  }
});
