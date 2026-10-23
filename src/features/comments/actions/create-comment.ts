"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import { getTicketReadScope } from "@/features/tickets/access";
import { getTicketCommentPermission } from "@/features/tickets/access";
import { ticketNumericIdSchema } from "@/features/tickets/schemas/ticket.schema";
import { createTicketComment } from "../repositories/comment.repository";
import { commentSchema } from "../schemas/comment.schema";
import type { CommentCreateState } from "../types/comment";

export async function createCommentAction(
  rawTicketId: number,
  _previousState: CommentCreateState,
  formData: FormData,
): Promise<CommentCreateState> {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        message: "You must sign in to comment on tickets.",
      };
    }
    throw error;
  }

  try {
    await requirePermission(getTicketCommentPermission(user.role));
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return {
        success: false,
        message: "You are not authorized to comment on this ticket.",
      };
    }
    throw error;
  }

  const ticketIdResult = ticketNumericIdSchema.safeParse(rawTicketId);
  if (!ticketIdResult.success) {
    return {
      success: false,
      message: "The selected ticket is invalid.",
    };
  }

  const authorId = Number(user.id);
  if (!Number.isSafeInteger(authorId) || authorId < 1) {
    return {
      success: false,
      message: "Your account could not be verified. Please sign in again.",
    };
  }

  const parsed = commentSchema.safeParse({
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted field.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const comment = await createTicketComment(
      ticketIdResult.data,
      authorId,
      getTicketReadScope(user.role, authorId),
      parsed.data,
    );

    if (!comment) {
      return {
        success: false,
        message: "This ticket was not found or is not available to you.",
      };
    }

    revalidatePath(`/tickets/${ticketIdResult.data}`);
    return {
      success: true,
      message: "Comment added.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2003" || error.code === "P2025")
    ) {
      return {
        success: false,
        message: "The ticket or your account is no longer available.",
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to add your comment right now. Please try again.",
      };
    }

    throw error;
  }
}
