"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import {
  deleteUserIfUnreferenced,
  findUserDeleteInfo,
  LastActiveAdminDeletionError,
} from "../repositories/user.repository";
import { userIdSchema, type UserDeleteState } from "../schemas/user.schema";

export async function deleteUserAction(
  _previousState: UserDeleteState,
  formData: FormData,
): Promise<UserDeleteState> {
  let actor;
  try {
    actor = await requirePermission("user:manage");
  } catch (error) {
    if (error instanceof AuthenticationRequiredError || error instanceof AuthorizationError) {
      return { success: false, message: "You are not authorized to manage users." };
    }
    throw error;
  }

  const actorId = Number(actor.id);
  if (!Number.isSafeInteger(actorId) || actorId < 1) {
    return { success: false, message: "Your account could not be verified. Please sign in again." };
  }

  const idResult = userIdSchema.safeParse(formData.get("userId"));
  if (!idResult.success) {
    return { success: false, message: "The selected user is invalid." };
  }
  if (idResult.data === actorId) {
    return { success: false, message: "You cannot delete your own account. Deactivate it only after another administrator can manage the system." };
  }

  try {
    const result = await deleteUserIfUnreferenced(idResult.data, actorId);
    if (result.kind === "deleted") {
      revalidatePath("/users");
      return { success: true, message: "User deleted successfully." };
    }
    if (result.kind === "missing") {
      return { success: false, message: "This user no longer exists." };
    }

    const user = await findUserDeleteInfo(idResult.data);
    if (!user) return { success: false, message: "This user no longer exists." };
    const blockers = [
      user.ticketCount > 0 ? "ticket history" : "",
      user.commentCount > 0 ? "comments" : "",
      user.attachmentCount > 0 ? "uploaded attachments" : "",
      user.notificationCount > 0 ? "notifications" : "",
      user.auditLogCount > 0 ? "audit history" : "",
      user.oauthIdentityCount > 0 ? "linked sign-in accounts" : "",
      user.passwordResetTokenCount > 0 ? "password reset records" : "",
      user.hasNotificationPreference ? "notification settings" : "",
    ].filter(Boolean);
    return {
      success: false,
      message: blockers.length
        ? `This account has ${blockers.join(", ")}. Deactivate the account instead to preserve its records.`
        : "Unable to delete this user right now. Refresh and try again.",
    };
  } catch (error) {
    if (error instanceof LastActiveAdminDeletionError) {
      return { success: false, message: "The last active administrator cannot be deleted." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { success: false, message: "This account has related records. Deactivate it instead to preserve its history." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { success: false, message: "User data changed before deletion completed. Refresh and try again." };
    }
    return { success: false, message: "Unable to delete this user right now. Please try again." };
  }
}
