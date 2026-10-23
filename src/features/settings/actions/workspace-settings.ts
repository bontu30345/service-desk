"use server";

import { Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthenticationRequiredError, AuthorizationError, requireRole } from "@/lib/permissions";
import { saveWorkspaceSettings } from "../repositories/settings.repository";
import type { SettingsActionState, WorkspaceSettingsData } from "../types";

const workspaceSettingsSchema = z.object({
  workspaceName: z.string().trim().min(2, "Enter a workspace name.").max(100, "Workspace name must be 100 characters or fewer."),
  supportEmail: z.string().trim().email("Enter a valid support email address.").max(254),
  defaultTicketPriority: z.nativeEnum(Priority),
  autoAssignment: z.boolean(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid six-digit hex color."),
}).strict();
const workspaceSettingFields = [
  "workspaceName",
  "supportEmail",
  "defaultTicketPriority",
  "autoAssignment",
  "brandColor",
] as const satisfies readonly (keyof WorkspaceSettingsData)[];

export async function updateWorkspaceSettings(data: unknown): Promise<SettingsActionState> {
  try {
    await requireRole("ADMIN");
  } catch (error) {
    if (error instanceof AuthenticationRequiredError || error instanceof AuthorizationError) {
      return { success: false, message: "Only an authenticated administrator can update workspace settings." };
    }
    throw error;
  }

  const parsed = workspaceSettingsSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: NonNullable<SettingsActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      const key = field as keyof WorkspaceSettingsData;
      if (workspaceSettingFields.includes(key)) {
        fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
      }
    }
    return { success: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  try {
    await saveWorkspaceSettings(parsed.data);
  } catch {
    return { success: false, message: "Unable to save workspace settings right now. Please try again." };
  }

  revalidatePath("/settings/workspace");
  return { success: true, message: "Workspace settings saved." };
}
