import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { safeNotificationSelect } from "../types/notification";

export function listUserNotifications(
  userId: number,
  database: PrismaClient = prisma,
) {
  return database.notification.findMany({
    where: { userId },
    select: safeNotificationSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export function listRecentUserNotifications(
  userId: number,
  limit: number,
  database: PrismaClient = prisma,
) {
  return database.notification.findMany({
    where: { userId },
    select: safeNotificationSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
}

export async function markUserNotificationAsRead(
  notificationId: number,
  userId: number,
  database: PrismaClient = prisma,
) {
  const result = await database.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  if (result.count === 1) {
    return "updated" as const;
  }

  const notification = await database.notification.findFirst({
    where: { id: notificationId, userId },
    select: { isRead: true },
  });

  if (!notification) {
    return "not-found" as const;
  }

  return "already-read" as const;
}

export function markAllUserNotificationsAsRead(
  userId: number,
  database: PrismaClient = prisma,
) {
  return database.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
