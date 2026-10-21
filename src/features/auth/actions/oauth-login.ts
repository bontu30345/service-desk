"use server";

import { AuthError } from "next-auth";
import { signIn } from "../auth";
import type { OAuthProvider } from "../oauth-identities";
import type { LoginActionState } from "./login";

export async function oauthLoginAction(
  provider: OAuthProvider,
  _previousState: LoginActionState,
): Promise<LoginActionState> {
  void _previousState;
  try {
    await signIn(provider, { redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message:
          error.type === "AccessDenied"
            ? "This account is not provisioned for Service Desk access. Contact your administrator."
            : "Sign-in could not be completed. Please try again.",
      };
    }

    throw error;
  }

  return { message: "" };
}
