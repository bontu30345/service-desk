"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import { getTicketAssignmentScope } from "../access";
import {
  findActiveTicketAssignee,
  findTicketById,
  updateTicketAssignment,
} from "../repositories/ticket.repository";
import {
  assignTicketSchema,
  ticketNumericIdSchema,
} from "../schemas/ticket.schema";
import type { TicketAssignmentActionState } from "../schemas/ticket.schema";

export async function assignTicketAction(
  rawTicketId: number,
  _previousState: TicketAssignmentActionState,
  formData: FormData,
): Promise<TicketAssignmentActionState> {
  let user;
  try {
    user = await requireAuthenticatedUser();
    await requirePermission("ticket:assign");
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        message: "You must sign in to assign tickets.",
      };
    }
    if (error instanceof AuthorizationError) {
      return {
        success: false,
        message: "You are not authorized to assign tickets.",
      };
    }
    throw error;
  }

  const idResult = ticketNumericIdSchema.safeParse(rawTicketId);
  if (!idResult.success) {
    return { success: false, message: "The selected ticket is invalid." };
  }

  const userId = Number(user.id);
  const scope = getTicketAssignmentScope(user.role, userId);
  if (
    !scope ||
    (scope.kind !== "all" &&
      (!Number.isSafeInteger(userId) || userId < 1))
  ) {
    return {
      success: false,
      message: "You are not authorized to assign this ticket.",
    };
  }

  const parsed = assignTicketSchema.safeParse({
    assigneeId: formData.get("assigneeId"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Choose a valid active agent.",
      fieldErrors: parsed.error.flatten().fieldErrors,
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

    if ((ticket.assignee?.id ?? null) === parsed.data.assigneeId) {
      return {
        success: true,
        message: "The ticket assignment is unchanged.",
      };
    }

    if (parsed.data.assigneeId !== null) {
      const assignee = await findActiveTicketAssignee(parsed.data.assigneeId);
      if (!assignee) {
        return {
          success: false,
          message: "Choose an active agent.",
          fieldErrors: {
            assigneeId: ["The selected user is not an active agent."],
          },
        };
      }
    }

    const updated = await updateTicketAssignment(
      idResult.data,
      scope,
      ticket.assignee?.id ?? null,
      parsed.data.assigneeId,
      userId,
    );
    if (!updated) {
      return {
        success: false,
        message: "The ticket assignment changed. Refresh and try again.",
      };
    }

    revalidatePath("/tickets");
    revalidatePath(`/tickets/${idResult.data}`);
    revalidatePath(`/tickets/${idResult.data}/edit`);
    return { success: true, message: "Ticket assignment updated." };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        message: "The selected agent is no longer available.",
        fieldErrors: {
          assigneeId: ["Choose an active agent."],
        },
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to update the assignment. Please try again.",
      };
    }

    throw error;
  }
}
