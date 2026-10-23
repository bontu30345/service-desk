import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/features/audit-logs/repositories/audit-log.repository";
import { safeCommentSelect } from "../types/comment";
import type { CommentInput } from "../schemas/comment.schema";
import type { TicketListScope } from "@/features/tickets/types/ticket";
import { notifyTicketCommentAdded } from "@/features/notifications/services/notification-events";

function scopedTicketWhere(
  ticketId: number,
  scope: TicketListScope,
): Prisma.TicketWhereInput {
  return {
    id: ticketId,
    ...(scope.kind === "created-by"
      ? { creatorId: scope.userId }
      : scope.kind === "assigned-to"
        ? { assigneeId: scope.userId }
        : {}),
  };
}

export function listTicketComments(
  ticketId: number,
  database: PrismaClient = prisma,
) {
  return database.comment.findMany({
    where: { ticketId },
    select: safeCommentSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

export async function createTicketComment(
  ticketId: number,
  authorId: number,
  scope: TicketListScope,
  input: CommentInput,
  database: PrismaClient = prisma,
) {
  return database.$transaction(
    async (transaction) => {
      const ticket = await transaction.ticket.findFirst({
        where: scopedTicketWhere(ticketId, scope),
        select: {
          id: true,
          title: true,
          creatorId: true,
          assigneeId: true,
        },
      });

      if (!ticket) {
        return null;
      }

      const comment = await transaction.comment.create({
        data: {
          content: input.content,
          ticketId: ticket.id,
          authorId,
        },
        select: safeCommentSelect,
      });

      await notifyTicketCommentAdded(transaction, {
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        creatorId: ticket.creatorId,
        assigneeId: ticket.assigneeId,
        authorId,
      });
      await createAuditLog(transaction, {
        actorId: authorId,
        action: "Comment created",
        resource: "Comment",
        entityId: comment.id,
        ticketId: ticket.id,
      });

      return comment;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
