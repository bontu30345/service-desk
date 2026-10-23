import { Priority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NotificationPreferenceData, WorkspaceSettingsData } from "../types";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferenceData = {
  ticketAssignedInApp: true,
  ticketAssignedEmail: true,
  newCommentInApp: true,
  newCommentEmail: true,
  ticketStatusUpdatedInApp: true,
  ticketStatusUpdatedEmail: true,
  slaAlertsInApp: true,
  slaAlertsEmail: true,
};

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettingsData = {
  workspaceName: "Service Desk",
  supportEmail: "",
  defaultTicketPriority: Priority.MEDIUM,
  autoAssignment: false,
  brandColor: "#2563EB",
};

const notificationPreferenceSelect = {
  ticketAssignedInApp: true,
  ticketAssignedEmail: true,
  newCommentInApp: true,
  newCommentEmail: true,
  ticketStatusUpdatedInApp: true,
  ticketStatusUpdatedEmail: true,
  slaAlertsInApp: true,
  slaAlertsEmail: true,
} as const;

const workspaceSettingKey = "default";
const workspaceSettingSelect = {
  workspaceName: true,
  supportEmail: true,
  defaultTicketPriority: true,
  autoAssignment: true,
  brandColor: true,
} as const;

export async function getUserNotificationPreferences(userId: number): Promise<NotificationPreferenceData> {
  const preferences = await prisma.userNotificationPreference.findUnique({
    where: { userId },
    select: notificationPreferenceSelect,
  });
  return preferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
}

export function saveUserNotificationPreferences(userId: number, data: NotificationPreferenceData) {
  return prisma.userNotificationPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select: notificationPreferenceSelect,
  });
}

export async function getWorkspaceSettings(): Promise<WorkspaceSettingsData> {
  const settings = await prisma.workspaceSetting.findUnique({
    where: { key: workspaceSettingKey },
    select: workspaceSettingSelect,
  });
  return settings ?? DEFAULT_WORKSPACE_SETTINGS;
}

export function saveWorkspaceSettings(data: WorkspaceSettingsData) {
  return prisma.workspaceSetting.upsert({
    where: { key: workspaceSettingKey },
    create: { key: workspaceSettingKey, ...data },
    update: data,
    select: workspaceSettingSelect,
  });
}

export async function getProfilePhotoPresentation(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePhotoKey: true, updatedAt: true },
  });
  return user
    ? { hasPhoto: user.profilePhotoKey !== null, version: user.updatedAt.getTime() }
    : null;
}

export async function isProfilePhotoKeyCurrent(userId: number, key: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePhotoKey: true },
  });
  return user?.profilePhotoKey === key;
}

export async function updateProfilePhotoKey(userId: number, key: string | null) {
  return prisma.$transaction(
    async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId },
        select: { profilePhotoKey: true },
      });
      if (!user) throw new Error("The account no longer exists.");

      await transaction.user.update({
        where: { id: userId },
        data: { profilePhotoKey: key },
        select: { id: true },
      });
      return user.profilePhotoKey;
    },
    { isolationLevel: "Serializable" },
  );
}
