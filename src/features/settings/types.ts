import type { Priority } from "@prisma/client";

export type NotificationPreferenceData = {
  ticketAssignedInApp: boolean;
  ticketAssignedEmail: boolean;
  newCommentInApp: boolean;
  newCommentEmail: boolean;
  ticketStatusUpdatedInApp: boolean;
  ticketStatusUpdatedEmail: boolean;
  slaAlertsInApp: boolean;
  slaAlertsEmail: boolean;
};

export type WorkspaceSettingsData = {
  workspaceName: string;
  supportEmail: string;
  defaultTicketPriority: Priority;
  autoAssignment: boolean;
  brandColor: string;
};

export type SettingsActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Partial<Record<
    | "name"
    | "currentPassword"
    | "newPassword"
    | "confirmPassword"
    | keyof NotificationPreferenceData
    | keyof WorkspaceSettingsData,
    string[]
  >>;
};
