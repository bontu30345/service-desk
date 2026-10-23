"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { createCategory } from "../repositories/category.repository";
import { categorySchema } from "../schemas/category.schema";
import type { CategoryActionState } from "../schemas/category.schema";

export async function createCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  let actor;
  try {
    actor = await requirePermission("category:manage");
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return {
        success: false,
        message: "You are not authorized to manage categories.",
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

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createCategory(parsed.data, actorId);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "A category with this name already exists.",
        fieldErrors: {
          name: ["A category with this name already exists."],
        },
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to create the category right now. Please try again.",
      };
    }

    throw error;
  }

  revalidatePath("/categories");

  return {
    success: true,
    message: "Category created successfully.",
  };
}
