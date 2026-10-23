"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { createSLAPolicy } from "../repositories/sla.repository";
import { slaPolicySchema } from "../schemas/sla.schema";
import type { SLAPolicyActionState } from "../schemas/sla.schema";

export async function createSLAPolicyAction(
  _previousState: SLAPolicyActionState,
  formData: FormData,
): Promise<SLAPolicyActionState> {
  try {
    await requirePermission("sla:manage");
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return {
        success: false,
        message: "You are not authorized to manage SLA policies.",
      };
    }
    throw error;
  }

  const parsed = slaPolicySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    responseTimeMinutes: formData.get("responseTimeMinutes"),
    resolutionTimeMinutes: formData.get("resolutionTimeMinutes"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createSLAPolicy(parsed.data);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "An SLA policy with this name already exists.",
        fieldErrors: { name: ["An SLA policy with this name already exists."] },
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to create the SLA policy right now. Please try again.",
      };
    }
    throw error;
  }

  revalidatePath("/sla");
  return { success: true, message: "SLA policy created successfully." };
}
