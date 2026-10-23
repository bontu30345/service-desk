"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import {
  deleteCategoryIfUnused,
  findCategoryDeleteInfo,
} from "../repositories/category.repository";
import { categoryIdSchema } from "../schemas/category.schema";
import type { CategoryDeleteState } from "../schemas/category.schema";

export async function deleteCategoryAction(
  _previousState: CategoryDeleteState,
  formData: FormData,
): Promise<CategoryDeleteState> {
  try {
    await requirePermission("category:manage");
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

  const idResult = categoryIdSchema.safeParse(formData.get("categoryId"));
  if (!idResult.success) {
    return {
      success: false,
      message: "The selected category is invalid.",
    };
  }

  try {
    const result = await deleteCategoryIfUnused(idResult.data);

    if (result.count === 1) {
      revalidatePath("/categories");
      return {
        success: true,
        message: "Category deleted successfully.",
      };
    }

    const category = await findCategoryDeleteInfo(idResult.data);
    if (!category) {
      return {
        success: false,
        message: "This category no longer exists.",
      };
    }

    if (category.ticketCount > 0) {
      return {
        success: false,
        message:
          "Cannot delete this category because it is being used by existing tickets.",
      };
    }

    return {
      success: false,
      message: "Unable to delete the category right now. Please try again.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        message:
          "Cannot delete this category because it is being used by existing tickets.",
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to delete the category right now. Please try again.",
      };
    }

    throw error;
  }
}
