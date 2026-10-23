"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { updateCategory } from "../repositories/category.repository";
import {
  categoryIdSchema,
  categorySchema,
} from "../schemas/category.schema";
import type { CategoryActionState } from "../schemas/category.schema";

export async function updateCategoryAction(
  rawCategoryId: number,
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

  const idResult = categoryIdSchema.safeParse(rawCategoryId);
  if (!idResult.success) {
    return {
      success: false,
      message: "The selected category is invalid.",
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
    await updateCategory(idResult.data, parsed.data, actorId);
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

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        message: "This category no longer exists.",
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to update the category right now. Please try again.",
      };
    }

    throw error;
  }

  revalidatePath("/categories");
  revalidatePath(`/categories/${idResult.data}/edit`);

  return {
    success: true,
    message: "Category updated successfully.",
  };
}
