"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import { getTicketUpdatePermission, getTicketUpdateScope } from "../access";
import {
  findTicketById,
  findTicketCategoryById,
  findTicketDepartmentById,
  updateTicket,
} from "../repositories/ticket.repository";
import {
  ticketNumericIdSchema,
  updateTicketSchema,
} from "../schemas/ticket.schema";
import type { TicketUpdateActionState } from "../schemas/ticket.schema";

export async function updateTicketAction(
  rawTicketId: number,
  _previousState: TicketUpdateActionState,
  formData: FormData,
): Promise<TicketUpdateActionState> {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        message: "You must sign in to update tickets.",
      };
    }

    throw error;
  }

  const permission = getTicketUpdatePermission(user.role);
  const scope = getTicketUpdateScope(user.role, Number(user.id));
  if (!permission || !scope) {
    return {
      success: false,
      message: "You are not authorized to update tickets.",
    };
  }

  try {
    await requirePermission(permission);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        success: false,
        message: "You are not authorized to update tickets.",
      };
    }

    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        message: "You must sign in to update tickets.",
      };
    }

    throw error;
  }

  const idResult = ticketNumericIdSchema.safeParse(rawTicketId);
  if (!idResult.success) {
    return {
      success: false,
      message: "The selected ticket is invalid.",
    };
  }

  if (
    scope.kind !== "all" &&
    (!Number.isSafeInteger(scope.userId) || scope.userId < 1)
  ) {
    return {
      success: false,
      message: "Your account could not be verified. Please sign in again.",
    };
  }

  let ticket;
  try {
    ticket = await findTicketById(idResult.data, scope);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to load the ticket right now. Please try again.",
      };
    }

    throw error;
  }

  if (!ticket) {
    return {
      success: false,
      message: "This ticket was not found or is not available to you.",
    };
  }

  const parsed = updateTicketSchema.safeParse({
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

  try {
    const [department, category] = await Promise.all([
      findTicketDepartmentById(parsed.data.departmentId),
      findTicketCategoryById(parsed.data.categoryId),
    ]);

    if (!department || !category) {
      return {
        success: false,
        message: "The selected Department or Category is unavailable.",
        fieldErrors: {
          ...(!department
            ? { departmentId: ["Choose an available department."] }
            : {}),
          ...(!category
            ? { categoryId: ["Choose an available category."] }
            : {}),
        },
      };
    }

    const actorId = Number(user.id);
    if (!Number.isSafeInteger(actorId) || actorId < 1) {
      return {
        success: false,
        message: "Your account could not be verified. Please sign in again.",
      };
    }

    const updated = await updateTicket(
      idResult.data,
      scope,
      parsed.data,
      actorId,
    );
    if (!updated) {
      return {
        success: false,
        message: "This ticket was not found or is no longer available to you.",
      };
    }

    revalidatePath("/tickets");
    revalidatePath(`/tickets/${idResult.data}`);
    revalidatePath(`/tickets/${idResult.data}/edit`);

    return {
      success: true,
      message: "Ticket updated successfully.",
      ticketId: idResult.data,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        message:
          "A related record is no longer available. Refresh and try again.",
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to update the ticket right now. Please try again.",
      };
    }

    throw error;
  }
}
