"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { createUserSchema } from "../schemas/user.schema";
import {
  createUser,
  departmentExists,
} from "../repositories/user.repository";
import type { UserActionState } from "../types/user";

export async function createUserAction(
  _previousState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
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
        message: "You must be an authorized administrator to create users.",
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

  const { password, departmentId, ...userInput } = parsed.data;

  if (departmentId !== undefined) {
    let department;

    try {
      department = await departmentExists(departmentId);
    } catch {
      return {
        success: false,
        message: "Unable to verify the selected department. Please try again.",
      };
    }

    if (!department) {
      return {
        success: false,
        message: "The selected department is no longer available.",
        fieldErrors: {
          departmentId: ["Choose an available department."],
        },
      };
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await createUser(
      {
        ...userInput,
        ...(departmentId === undefined ? {} : { departmentId }),
      },
      passwordHash,
      actorId,
    );
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

    return {
      success: false,
      message: "Unable to create the user right now. Please try again.",
    };
  }

  revalidatePath("/users");

  return {
    success: true,
    message: "User created successfully.",
  };
}
