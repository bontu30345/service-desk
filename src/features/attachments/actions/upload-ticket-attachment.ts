"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import {
  getTicketCommentPermission,
  getTicketReadScope,
} from "@/features/tickets/access";
import { ticketNumericIdSchema } from "@/features/tickets/schemas/ticket.schema";
import {
  attachmentUploadMetadataSchema,
  MAX_ATTACHMENT_SIZE,
} from "../schemas/attachment.schema";
import type { AttachmentUploadActionState } from "../schemas/attachment.schema";
import {
  AttachmentStorageError,
} from "../services/attachment-storage";
import { createAttachmentFromUpload } from "../services/attachment.service";
import { validateAttachmentContents } from "../services/attachment-validation";

function invalidFile(message: string): AttachmentUploadActionState {
  return {
    success: false,
    message: "Please choose a valid file.",
    fieldErrors: { fileName: [message] },
  };
}

export async function uploadTicketAttachmentAction(
  rawTicketId: number,
  _previousState: AttachmentUploadActionState,
  formData: FormData,
): Promise<AttachmentUploadActionState> {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return { success: false, message: "Sign in to upload an attachment." };
    }
    throw error;
  }

  try {
    await requirePermission(getTicketCommentPermission(user.role));
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return {
        success: false,
        message: "You are not authorized to attach files to this ticket.",
      };
    }
    throw error;
  }

  const ticketIdResult = ticketNumericIdSchema.safeParse(rawTicketId);
  if (!ticketIdResult.success) {
    return { success: false, message: "The selected ticket is invalid." };
  }

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return {
      success: false,
      message: "Your account could not be verified. Please sign in again.",
    };
  }

  const uploadedFile = formData.get("file");
  if (!(uploadedFile instanceof File) || !uploadedFile.name) {
    return invalidFile("Choose a file to upload.");
  }
  if (uploadedFile.size > MAX_ATTACHMENT_SIZE) {
    return invalidFile("Files must be 5 MiB or smaller.");
  }

  const metadata = attachmentUploadMetadataSchema.safeParse({
    fileName: uploadedFile.name,
    fileSize: uploadedFile.size,
  });
  if (!metadata.success) {
    return invalidFile(
      metadata.error.issues[0]?.message ?? "The selected file is invalid.",
    );
  }

  const bytes = Buffer.from(await uploadedFile.arrayBuffer());
  const validation = validateAttachmentContents(
    metadata.data.fileName,
    uploadedFile.type,
    bytes,
  );
  if (!validation.success) {
    return invalidFile(validation.message);
  }

  try {
    const attachment = await createAttachmentFromUpload(
      ticketIdResult.data,
      userId,
      getTicketReadScope(user.role, userId),
      {
        fileName: metadata.data.fileName,
        fileType: validation.fileType,
        fileSize: metadata.data.fileSize,
        extension: validation.extension,
        bytes,
      },
    );

    if (!attachment) {
      return {
        success: false,
        message: "This ticket was not found or is not available to you.",
      };
    }

    revalidatePath(`/tickets/${ticketIdResult.data}`);
    return { success: true, message: "Attachment uploaded." };
  } catch (error) {
    if (
      error instanceof AttachmentStorageError ||
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      return {
        success: false,
        message: "Unable to upload the attachment right now. Please try again.",
      };
    }

    throw error;
  }
}
