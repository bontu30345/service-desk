"use server";

import { AuthError } from "next-auth";
import { signIn } from "../auth";

export type LoginActionState = {
  message: string;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message:
          error.type === "CredentialsSignin"
            ? "We couldn’t sign you in. Check your email and password and try again."
            : "Sign-in couldn’t be completed. Please try again or contact your administrator.",
      };
    }

    throw error;
  }

  return { message: "" };
}