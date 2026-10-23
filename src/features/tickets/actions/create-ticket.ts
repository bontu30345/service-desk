"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { createTicket } from "../repositories/ticket.repository";
import { createTicketSchema } from "../schemas/ticket.schema";
import type { TicketCreateActionState } from "../schemas/ticket.schema";

export async function createTicketAction(
  _previousState: TicketCreateActionState,
  formData: FormData,
): Promise<TicketCreateActionState> {
  let user;
  try {
    user = await requirePermission("ticket:create");
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return {
        success: false,
        message: "You are not authorized to create tickets.",
      };
    }

    throw error;
  }

  const parsed = createTicketSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    departmentId: formData.get("departmentId"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const creatorId = Number(user.id);
  if (!Number.isSafeInteger(creatorId) || creatorId < 1) {
    return {
      success: false,
      message: "Your account could not be verified. Please sign in again.",
    };
  }

  try {
    const ticket = await createTicket(creatorId, parsed.data);

    revalidatePath("/tickets");

    return {
      success: true,
      message: "Ticket created successfully.",
      ticketId: ticket.id,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        message:
          "The account or a selected option is no longer available. Refresh and try again.",
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to create the ticket right now. Please try again.",
      };
    }

    throw error;
  }
}
