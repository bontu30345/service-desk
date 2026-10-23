"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import {
  getTicketUpdatePermission,
  getTicketUpdateScope,
} from "../access";
import { updateTicketSLA } from "../repositories/ticket.repository";
import {
  assignTicketSLASchema,
  ticketNumericIdSchema,
} from "../schemas/ticket.schema";
import type { TicketSlaAssignmentActionState } from "../types/ticket";

export async function assignTicketSLAAction(
  rawTicketId: number,
  _previousState: TicketSlaAssignmentActionState,
  formData: FormData,
): Promise<TicketSlaAssignmentActionState> {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        message: "You must sign in to change a ticket SLA.",
      };
    }
    throw error;
  }

  const permission = getTicketUpdatePermission(user.role);
  const userId = Number(user.id);
  const scope = getTicketUpdateScope(user.role, userId);
  if (!permission || !scope) {
    return {
      success: false,
      message: "You are not authorized to change this ticket's SLA.",
    };
  }

  try {
    await requirePermission(permission);
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return {
        success: false,
        message: "You are not authorized to change this ticket's SLA.",
      };
    }
    throw error;
  }

  const ticketIdResult = ticketNumericIdSchema.safeParse(rawTicketId);
  if (!ticketIdResult.success) {
    return { success: false, message: "The selected ticket is invalid." };
  }
  if (
    scope.kind !== "all" &&
    (!Number.isSafeInteger(userId) || userId < 1)
  ) {
    return {
      success: false,
      message: "Your account could not be verified. Please sign in again.",
    };
  }

  const parsed = assignTicketSLASchema.safeParse(formData.get("slaId"));
  if (!parsed.success) {
    return {
      success: false,
      message: "Choose an active SLA policy or remove the current one.",
      fieldErrors: {
        slaId: parsed.error.issues.map((issue) => issue.message),
      },
    };
  }

  try {
    const result = await updateTicketSLA(
      ticketIdResult.data,
      scope,
      parsed.data,
      userId,
    );
    if (result === "missing-ticket") {
      return {
        success: false,
        message: "This ticket was not found or is not available to you.",
      };
    }
    if (result === "unavailable-sla") {
      return {
        success: false,
        message: "Choose an available active SLA policy.",
        fieldErrors: { slaId: ["The selected SLA policy is not active."] },
      };
    }
    if (result === "conflict") {
      return {
        success: false,
        message: "The ticket SLA changed. Refresh and try again.",
      };
    }

    revalidatePath("/tickets");
    revalidatePath(`/tickets/${ticketIdResult.data}`);
    revalidatePath(`/tickets/${ticketIdResult.data}/edit`);
    return {
      success: true,
      message:
        result === "unchanged"
          ? "The ticket SLA is unchanged."
          : "Ticket SLA updated.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        success: false,
        message: "The ticket or SLA policy changed. Refresh and try again.",
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to change the ticket SLA. Please try again.",
      };
    }
    throw error;
  }
}
