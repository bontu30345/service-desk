import type { Prisma, TicketStatus } from "@prisma/client";

type NotificationTransaction = Prisma.TransactionClient;

function participantIds(
  creatorId: number,
  assigneeId: number | null,
  excludedUserId: number,
) {
  return [...new Set([creatorId, assigneeId].filter(
    (id): id is number => id !== null && id !== excludedUserId,
  ))];
}

export async function notifyTicketAssignment(
  transaction: NotificationTransaction,
  {
    ticketId,
    ticketTitle,
    assigneeId,
    actorId,
  }: {
    ticketId: number;
    ticketTitle: string;
    assigneeId: number | null;
    actorId: number;
  },
) {
  if (assigneeId === null || assigneeId === actorId) {
    return;
  }

  await transaction.notification.create({
    data: {
      title: "Ticket assigned to you",
      message: `Ticket #${ticketId} "${ticketTitle}" was assigned to you.`,
      userId: assigneeId,
      ticketId,
    },
  });
}

export async function notifyTicketStatusChanged(
  transaction: NotificationTransaction,
  {
    ticketId,
    ticketTitle,
    creatorId,
    assigneeId,
    actorId,
    previousStatus,
    nextStatus,
  }: {
    ticketId: number;
    ticketTitle: string;
    creatorId: number;
    assigneeId: number | null;
    actorId: number;
    previousStatus: TicketStatus;
    nextStatus: TicketStatus;
  },
) {
  const recipients = participantIds(creatorId, assigneeId, actorId);
  if (recipients.length === 0) {
    return;
  }

  await transaction.notification.createMany({
    data: recipients.map((userId) => ({
      title: "Ticket status updated",
      message: `Ticket #${ticketId} "${ticketTitle}" status changed from ${previousStatus.replaceAll("_", " ")} to ${nextStatus.replaceAll("_", " ")}.`,
      userId,
      ticketId,
    })),
  });
}

export async function notifyTicketCommentAdded(
  transaction: NotificationTransaction,
  {
    ticketId,
    ticketTitle,
    creatorId,
    assigneeId,
    authorId,
  }: {
    ticketId: number;
    ticketTitle: string;
    creatorId: number;
    assigneeId: number | null;
    authorId: number;
  },
) {
  const recipients = participantIds(creatorId, assigneeId, authorId);
  if (recipients.length === 0) {
    return;
  }

  await transaction.notification.createMany({
    data: recipients.map((userId) => ({
      title: "New ticket comment",
      message: `A new comment was added to ticket #${ticketId} "${ticketTitle}".`,
      userId,
      ticketId,
    })),
  });
}
