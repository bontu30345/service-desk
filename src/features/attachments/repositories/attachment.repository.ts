import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TicketListScope } from "@/features/tickets/types/ticket";
import { safeAttachmentSelect } from "../types/attachment";

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

export function isTicketAccessible(
  ticketId: number,
  scope: TicketListScope,
) {
  return prisma.ticket.findFirst({
    where: scopedTicketWhere(ticketId, scope),
    select: { id: true },
  });
}

export function listTicketAttachments(ticketId: number) {
  return prisma.attachment.findMany({
    where: { ticketId },
    select: safeAttachmentSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

export function createTicketAttachment(
  ticketId: number,
  uploaderId: number,
  scope: TicketListScope,
  data: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  },
) {
  return prisma.$transaction(
    async (transaction) => {
      const ticket = await transaction.ticket.findFirst({
        where: scopedTicketWhere(ticketId, scope),
        select: { id: true },
      });

      if (!ticket) {
        return null;
      }

      return transaction.attachment.create({
        data: {
          ...data,
          ticketId: ticket.id,
          uploadedById: uploaderId,
        },
        select: safeAttachmentSelect,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export function findAttachmentForDownload(
  attachmentId: number,
  ticketId: number,
  scope: TicketListScope,
) {
  return prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      ticket: scopedTicketWhere(ticketId, scope),
    },
    select: {
      id: true,
      ticketId: true,
      uploadedById: true,
      fileName: true,
      fileUrl: true,
      fileType: true,
      fileSize: true,
    },
  });
}

export function findPersistedAttachment(
  storageKey: string,
  ticketId: number,
  uploaderId: number,
) {
  return prisma.attachment.findFirst({
    where: {
      fileUrl: storageKey,
      ticketId,
      uploadedById: uploaderId,
    },
    select: safeAttachmentSelect,
  });
}
