"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import {
  LastActiveAdminError,
  setUserActive,
} from "../repositories/user.repository";
import type { UserActionState } from "../types/user";

export async function setUserStatusAction(
  userId: number,
  isActive: boolean,
  previousState: UserActionState,
): Promise<UserActionState> {
  void previousState;

  let actor;
  try {
    actor = await requirePermission("user:manage");
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return {
        success: false,
        message: "You must be an authorized administrator to change user status.",
      };
    }

    throw error;
  }

  const actorId = Number(actor.id);
  if (!Number.isSafeInteger(actorId) || actorId < 1) {
    return {
      success: false,
      message: "Your account could not be verified. Please sign in again.",
    };
  }

  if (!Number.isSafeInteger(userId) || userId < 1) {
    return {
      success: false,
      message: "The selected user is invalid.",
    };
  }

  if (typeof isActive !== "boolean") {
    return {
      success: false,
      message: "The requested status is invalid.",
    };
  }

  try {
    const user = await setUserActive(userId, isActive, actorId);

    if (!user) {
      return {
        success: false,
        message: "This user no longer exists.",
      };
    }
  } catch (error) {
    if (error instanceof LastActiveAdminError) {
      return {
        success: false,
        message: "The last active administrator cannot be deactivated.",
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2025" || error.code === "P2034")
    ) {
      return {
        success: false,
        message: "User status changed before this request completed. Refresh and try again.",
      };
    }

    return {
      success: false,
      message: "Unable to change user status right now. Please try again.",
    };
  }

  revalidatePath("/users");

  return {
    success: true,
    message: isActive ? "User activated." : "User deactivated.",
  };
}
