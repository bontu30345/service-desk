"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import {
  deleteDepartmentIfUnused,
  findDepartmentDeleteInfo,
} from "../repositories/department.repository";
import {
  departmentIdSchema,
  type DepartmentDeleteState,
} from "../schemas/department.schema";

export async function deleteDepartmentAction(
  _previousState: DepartmentDeleteState,
  formData: FormData,
): Promise<DepartmentDeleteState> {
  try {
    await requirePermission("department:manage");
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return {
        success: false,
        message: "You are not authorized to manage departments.",
      };
    }
    throw error;
  }

  const idResult = departmentIdSchema.safeParse(formData.get("departmentId"));
  if (!idResult.success) {
    return { success: false, message: "The selected department is invalid." };
  }

  try {
    const result = await deleteDepartmentIfUnused(idResult.data);
    if (result.count === 1) {
      revalidatePath("/departments");
      return { success: true, message: "Department deleted successfully." };
    }

    const department = await findDepartmentDeleteInfo(idResult.data);
    if (!department) {
      return { success: false, message: "This department no longer exists." };
    }
    if (department.userCount > 0 || department.ticketCount > 0) {
      const references = [
        department.userCount > 0 ? "users" : "",
        department.ticketCount > 0 ? "tickets" : "",
      ].filter(Boolean);
      return {
        success: false,
        message: `Cannot delete this department because it is used by ${references.join(" and ")}.`,
      };
    }
    return {
      success: false,
      message: "Unable to delete the department right now. Please try again.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        message: "Cannot delete this department because it is used by users or tickets.",
      };
    }
    return {
      success: false,
      message: "Unable to delete the department right now. Please try again.",
    };
  }
}
