"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AuthenticationRequiredError, requireAuthenticatedUser } from "@/lib/permissions";
import type { SettingsActionState } from "../types";

function currentUserId(userId: string) {
  const id = Number(userId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function updateProfileAction(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return { success: false, message: "Please sign in again to update your profile." };
    }
    throw error;
  }

  const id = currentUserId(user.id);
  const name = formData.get("name");
  if (!id || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    return {
      success: false,
      message: "Please correct the highlighted field.",
      fieldErrors: { name: ["Enter a name between 2 and 100 characters."] },
    };
  }

  try {
    await prisma.user.update({ where: { id }, data: { name: name.trim() }, select: { id: true } });
  } catch {
    return { success: false, message: "Unable to update your profile right now. Please try again." };
  }

  revalidatePath("/settings/profile");
  return { success: true, message: "Profile updated successfully." };
}

export async function changePasswordAction(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return { success: false, message: "Please sign in again to update your password." };
    }
    throw error;
  }

  const id = currentUserId(user.id);
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");
  const fieldErrors: NonNullable<SettingsActionState["fieldErrors"]> = {};

  if (typeof currentPassword !== "string" || !currentPassword) {
    fieldErrors.currentPassword = ["Enter your current password."];
  }
  if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 72) {
    fieldErrors.newPassword = ["Password must be between 8 and 72 characters."];
  }
  if (typeof confirmPassword !== "string" || confirmPassword !== newPassword) {
    fieldErrors.confirmPassword = ["Passwords do not match."];
  }
  if (Object.keys(fieldErrors).length) {
    return { success: false, message: "Please correct the highlighted fields.", fieldErrors };
  }
  if (!id) return { success: false, message: "Your account could not be verified. Please sign in again." };

  try {
    const account = await prisma.user.findUnique({ where: { id }, select: { password: true, isActive: true } });
    if (!account?.isActive) {
      return { success: false, message: "Your account could not be verified. Please sign in again." };
    }
    if (!(await bcrypt.compare(currentPassword as string, account.password))) {
      return {
        success: false,
        message: "The current password is incorrect.",
        fieldErrors: { currentPassword: ["Check your current password and try again."] },
      };
    }
    const passwordHash = await bcrypt.hash(newPassword as string, 12);
    await prisma.user.update({
      where: { id },
      data: { password: passwordHash, sessionVersion: { increment: 1 } },
      select: { id: true },
    });
  } catch {
    return { success: false, message: "Unable to update your password right now. Please try again." };
  }
  revalidatePath("/settings/profile");
  return { success: true, message: "Password updated. Sign in again with your new password." };
}
