"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import {
  findUserById,
  updateUser,
  departmentExists,
} from "../repositories/user.repository";
import { updateUserSchema } from "../schemas/user.schema";
import type { UserActionState } from "../types/user";

export async function updateUserAction(
  userId: number,
  _previousState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
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
        message: "You must be an authorized administrator to update users.",
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

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    if (!(await findUserById(userId))) {
      return {
        success: false,
        message: "This user no longer exists.",
      };
    }

    if (
      parsed.data.departmentId !== null &&
      !(await departmentExists(parsed.data.departmentId))
    ) {
      return {
        success: false,
        message: "The selected department is no longer available.",
        fieldErrors: {
          departmentId: ["Choose an available department."],
        },
      };
    }

    await updateUser(userId, parsed.data, actorId);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target === "email" ||
        (Array.isArray(error.meta?.target) &&
          error.meta.target.includes("email")))
    ) {
      return {
        success: false,
        message: "A user with this email already exists.",
        fieldErrors: {
          email: ["A user with this email already exists."],
        },
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        message: "The selected department is no longer available.",
        fieldErrors: {
          departmentId: ["Choose an available department."],
        },
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        message: "This user no longer exists.",
      };
    }

    return {
      success: false,
      message: "Unable to update the user right now. Please try again.",
    };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${userId}/edit`);
  return { success: true, message: "User updated successfully." };
}
