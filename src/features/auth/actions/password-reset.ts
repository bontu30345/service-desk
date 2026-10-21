"use server";

import { createHash, createHmac, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  consumePasswordResetLimit,
  consumePasswordResetToken,
  deletePasswordResetToken,
  issuePasswordResetToken,
  isPasswordResetTokenValid,
} from "../repositories/password-reset.repository";
import {
  resetPasswordSchema,
  resetRequestSchema,
} from "../schemas/password-reset.schema";
import type { PasswordResetActionState } from "../schemas/password-reset.schema";
import {
  isPasswordResetEmailConfigured,
  sendPasswordResetEmail,
} from "../services/password-reset-email";

const requestMessage =
  "If an active account matches that email and recovery is configured, password reset instructions will be sent shortly. Contact your administrator if you need help.";

function getEmailKey(email: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Authentication secret is not configured.");
  }

  return createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordResetAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const parsed = resetRequestSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      message: "Enter a valid email address.",
    };
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, isActive: true },
    });

    if (user?.isActive && isPasswordResetEmailConfigured()) {
      const withinLimit = await consumePasswordResetLimit(
        getEmailKey(email),
        new Date(),
      );

      if (withinLimit) {
        const token = randomBytes(32).toString("base64url");
        const tokenHash = hashToken(token);
        await issuePasswordResetToken(
          user.id,
          tokenHash,
          new Date(Date.now() + 30 * 60 * 1000),
        );

        try {
          await sendPasswordResetEmail(email, token);
        } catch {
          await deletePasswordResetToken(tokenHash);
          console.error("Password reset email delivery failed.");
        }
      }
    }
  } catch {
    console.error("Password reset request could not be processed.");
  }

  return { message: requestMessage, success: true };
}

export async function resetPasswordAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Enter a valid password and confirmation.",
    };
  }

  const tokenHash = hashToken(parsed.data.token);
  try {
    if (!(await isPasswordResetTokenValid(tokenHash, new Date()))) {
      return {
        message: "This reset link is invalid or expired. Request a new link.",
      };
    }
  } catch {
    console.error("Password reset token validation failed.");
    return {
      message: "Password reset could not be completed. Please try again.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const consumed = await consumePasswordResetToken(
      tokenHash,
      passwordHash,
      new Date(),
    );

    if (!consumed) {
      return {
        message: "This reset link is invalid or expired. Request a new link.",
      };
    }
  } catch {
    console.error("Password reset could not be completed.");
    return {
      message: "Password reset could not be completed. Please try again.",
    };
  }

  return {
    message: "Your password has been reset. You can now sign in.",
    success: true,
  };
}
