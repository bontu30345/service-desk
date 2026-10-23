"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthenticationRequiredError, requireAuthenticatedUser } from "@/lib/permissions";
import { saveUserNotificationPreferences } from "../repositories/settings.repository";
import type { NotificationPreferenceData, SettingsActionState } from "../types";

const notificationPreferencesSchema: z.ZodType<NotificationPreferenceData> = z.object({
  ticketAssignedInApp: z.boolean(),
  ticketAssignedEmail: z.boolean(),
  newCommentInApp: z.boolean(),
  newCommentEmail: z.boolean(),
  ticketStatusUpdatedInApp: z.boolean(),
  ticketStatusUpdatedEmail: z.boolean(),
  slaAlertsInApp: z.boolean(),
  slaAlertsEmail: z.boolean(),
}).strict();

export async function updateNotificationPreferences(data: unknown): Promise<SettingsActionState> {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return { success: false, message: "Sign in to update your notification preferences." };
    }
    throw error;
  }

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return { success: false, message: "Your account could not be verified. Please sign in again." };
  }

  const parsed = notificationPreferencesSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "The notification preferences are invalid. Review your selections and try again." };
  }

  try {
    await saveUserNotificationPreferences(userId, parsed.data);
  } catch {
    return { success: false, message: "Unable to save notification preferences right now. Please try again." };
  }

  revalidatePath("/settings/notifications");
  return { success: true, message: "Notification preferences saved." };
}
