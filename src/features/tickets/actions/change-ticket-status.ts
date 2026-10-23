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
  getAllowedTicketStatusTransitions,
  getTicketUpdatePermission,
  getTicketUpdateScope,
} from "../access";
import {
  findTicketById,
  transitionTicketStatus,
} from "../repositories/ticket.repository";
import {
  ticketNumericIdSchema,
  ticketStatusSchema,
} from "../schemas/ticket.schema";
import type { TicketStatusActionState } from "../schemas/ticket.schema";

export async function changeTicketStatusAction(
  rawTicketId: number,
  _previousState: TicketStatusActionState,
  formData: FormData,
): Promise<TicketStatusActionState> {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        message: "You must sign in to change ticket status.",
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
      message: "You are not authorized to change ticket status.",
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
        message: "You are not authorized to change ticket status.",
      };
    }
    throw error;
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

  const idResult = ticketNumericIdSchema.safeParse(rawTicketId);
  if (!idResult.success) {
    return { success: false, message: "The selected ticket is invalid." };
  }

  const parsedStatus = ticketStatusSchema.safeParse(formData.get("status"));
  if (!parsedStatus.success) {
    return {
      success: false,
      message: "Choose a valid status.",
      fieldErrors: {
        status: parsedStatus.error.issues.map((issue) => issue.message),
      },
    };
  }

  try {
    const ticket = await findTicketById(idResult.data, scope);
    if (!ticket) {
      return {
        success: false,
        message: "This ticket was not found or is not available to you.",
      };
    }

    if (
      !getAllowedTicketStatusTransitions(ticket.status).includes(
        parsedStatus.data,
      )
    ) {
      return {
        success: false,
        message: `Cannot change status from ${ticket.status.replaceAll("_", " ")} to ${parsedStatus.data.replaceAll("_", " ")}.`,
        fieldErrors: {
          status: ["This status transition is not allowed."],
        },
      };
    }

    const updated = await transitionTicketStatus(
      idResult.data,
      scope,
      ticket.status,
      ticket.resolvedAt,
      parsedStatus.data,
      userId,
    );
    if (!updated) {
      return {
        success: false,
        message: "The ticket status changed. Refresh and try again.",
      };
    }

    revalidatePath("/tickets");
    revalidatePath(`/tickets/${idResult.data}`);
    revalidatePath(`/tickets/${idResult.data}/edit`);
    return { success: true, message: "Ticket status updated." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to change ticket status. Please try again.",
      };
    }

    throw error;
  }
}
