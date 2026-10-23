"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requirePermission,
} from "@/lib/permissions";
import { notificationIdSchema } from "../schemas/notification.schema";
import {
  markAllUserNotificationsAsRead,
  markUserNotificationAsRead,
} from "../repositories/notification.repository";
import type { MarkNotificationReadState } from "../types/notification";

export async function markNotificationReadAction(
  rawNotificationId: number,
  previousState: MarkNotificationReadState,
): Promise<MarkNotificationReadState> {
  void previousState;
  let user;
  try {
    user = await requirePermission("notification:read:own");
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return {
        success: false,
        message: "You are not authorized to update this notification.",
      };
    }
    throw error;
  }

  const notificationIdResult = notificationIdSchema.safeParse(
    rawNotificationId,
  );
  if (!notificationIdResult.success) {
    return { success: false, message: "This notification is unavailable." };
  }

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return {
      success: false,
      message: "Your account could not be verified. Please sign in again.",
    };
  }

  try {
    const result = await markUserNotificationAsRead(
      notificationIdResult.data,
      userId,
    );
    if (result === "not-found") {
      return { success: false, message: "This notification is unavailable." };
    }

    revalidatePath("/notifications");
    return {
      success: true,
      message:
        result === "updated"
          ? "Notification marked as read."
          : "Notification was already read.",
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to update this notification. Please try again.",
      };
    }
    throw error;
  }
}

export async function markAllNotificationsReadAction(
  previousState: MarkNotificationReadState,
): Promise<MarkNotificationReadState> {
  void previousState;
  let user;
  try {
    user = await requirePermission("notification:read:own");
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return {
        success: false,
        message: "You are not authorized to update these notifications.",
      };
    }
    throw error;
  }

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return {
      success: false,
      message: "Your account could not be verified. Please sign in again.",
    };
  }

  try {
    const result = await markAllUserNotificationsAsRead(userId);
    if (result.count === 0) {
      return { success: true, message: "There are no unread notifications." };
    }

    revalidatePath("/notifications");
    return {
      success: true,
      message: `${result.count} ${result.count === 1 ? "notification" : "notifications"} marked as read.`,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        message: "Unable to update notifications right now. Please try again.",
      };
    }
    throw error;
  }
}
