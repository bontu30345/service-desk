import { Prisma } from "@prisma/client";
import type { TicketListScope } from "@/features/tickets/types/ticket";
import {
  createTicketAttachment,
  findPersistedAttachment,
  isTicketAccessible,
} from "../repositories/attachment.repository";
import {
  removeStoredAttachment,
  storeAttachmentBytes,
  type StoredExtension,
} from "./attachment-storage";
import type { SafeAttachment } from "../types/attachment";

export type ValidatedAttachmentFile = {
  fileName: string;
  fileType: string;
  fileSize: number;
  extension: StoredExtension;
  bytes: Buffer;
};

export async function createAttachmentFromUpload(
  ticketId: number,
  uploaderId: number,
  scope: TicketListScope,
  file: ValidatedAttachmentFile,
): Promise<SafeAttachment | null> {
  const accessibleTicket = await isTicketAccessible(ticketId, scope);
  if (!accessibleTicket) {
    return null;
  }

  const storageKey = await storeAttachmentBytes(file.bytes, file.extension);
  const data = {
    fileName: file.fileName,
    fileUrl: storageKey,
    fileType: file.fileType,
    fileSize: file.fileSize,
  };

  try {
    const attachment = await createTicketAttachment(
      ticketId,
      uploaderId,
      scope,
      data,
    );
    if (attachment) {
      return attachment;
    }
  } catch (databaseError) {
    let persisted: SafeAttachment | null;
    try {
      persisted = await findPersistedAttachment(
        storageKey,
        ticketId,
        uploaderId,
      );
    } catch (verificationError) {
      throw new AggregateError(
        [databaseError, verificationError],
        "The attachment database result could not be verified; its file was retained.",
      );
    }

    if (persisted) {
      return persisted;
    }

    try {
      await removeStoredAttachment(storageKey);
    } catch (cleanupError) {
      throw new AggregateError(
        [databaseError, cleanupError],
        "The attachment record was not saved and its file could not be removed.",
      );
    }

    throw databaseError;
  }

  await removeStoredAttachment(storageKey);
  return null;
}

export function isKnownAttachmentDatabaseError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}
