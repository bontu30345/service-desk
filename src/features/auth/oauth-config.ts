import type { OAuthProvider } from "./oauth-identities";

export function getConfiguredOAuthProviders(): OAuthProvider[] {
  return [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? (["google"] as const)
      : []),
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? (["github"] as const)
      : []),
  ];
}
