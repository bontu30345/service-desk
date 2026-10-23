"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { createDepartment } from "../repositories/department.repository";
import { departmentSchema } from "../schemas/department.schema";
import type { DepartmentActionState } from "../schemas/department.schema";

export async function createDepartmentAction(
  _previousState: DepartmentActionState,
  formData: FormData,
): Promise<DepartmentActionState> {
  let actor;
  try {
    actor = await requirePermission("department:manage");
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

  const actorId = Number(actor.id);
  if (!Number.isSafeInteger(actorId) || actorId < 1) {
    return {
      success: false,
      message: "Your account could not be verified. Please sign in again.",
    };
  }

  const parsed = departmentSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted field.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createDepartment(parsed.data, actorId);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "A department with this name already exists.",
        fieldErrors: {
          name: ["A department with this name already exists."],
        },
      };
    }

    return {
      success: false,
      message: "Unable to create the department right now. Please try again.",
    };
  }

  revalidatePath("/departments");

  return {
    success: true,
    message: "Department created successfully.",
  };
}
