import type { Prisma } from "@prisma/client";

export const safeNotificationSelect = {
  id: true,
  title: true,
  message: true,
  isRead: true,
  ticket: {
    select: {
      id: true,
      title: true,
    },
  },
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export type SafeNotification = Prisma.NotificationGetPayload<{
  select: typeof safeNotificationSelect;
}>;

export type MarkNotificationReadState = {
  success: boolean;
  message: string;
};
