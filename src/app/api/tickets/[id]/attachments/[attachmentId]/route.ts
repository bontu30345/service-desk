import { Prisma } from "@prisma/client";
import {
  AuthenticationRequiredError,
  AuthorizationError,
  requireAuthenticatedUser,
  requirePermission,
} from "@/lib/permissions";
import {
  getTicketReadPermission,
  getTicketReadScope,
} from "@/features/tickets/access";
import { ticketIdSchema } from "@/features/tickets/schemas/ticket.schema";
import { findAttachmentForDownload } from "@/features/attachments/repositories/attachment.repository";
import {
  AttachmentStorageError,
  readStoredAttachment,
} from "@/features/attachments/services/attachment-storage";

function errorResponse(status: number, message: string) {
  return Response.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

function contentDisposition(fileName: string) {
  const fallback =
    fileName
      .replace(/[^\x20-\x7e]|["\\]/gu, "_")
      .replace(/[\r\n]/gu, "") || "attachment";
  const encoded = encodeURIComponent(fileName).replace(
    /[!'()*]/gu,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const routeParams = await params;
  const ticketIdResult = ticketIdSchema.safeParse(routeParams.id);
  const attachmentIdResult = ticketIdSchema.safeParse(
    routeParams.attachmentId,
  );
  if (!ticketIdResult.success || !attachmentIdResult.success) {
    return errorResponse(404, "Attachment not found.");
  }

  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return errorResponse(401, "Sign in to access this attachment.");
    }
    throw error;
  }

  try {
    await requirePermission(getTicketReadPermission(user.role));
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof AuthorizationError
    ) {
      return errorResponse(403, "You are not authorized to access this attachment.");
    }
    throw error;
  }

  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return errorResponse(403, "Your account could not be verified.");
  }

  let attachment;
  try {
    attachment = await findAttachmentForDownload(
      attachmentIdResult.data,
      ticketIdResult.data,
      getTicketReadScope(user.role, userId),
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return errorResponse(500, "Unable to access this attachment.");
    }
    throw error;
  }

  if (!attachment) {
    return errorResponse(404, "Attachment not found.");
  }

  let bytes: Buffer;
  try {
    bytes = await readStoredAttachment(attachment.fileUrl);
  } catch (error) {
    if (error instanceof AttachmentStorageError) {
      return errorResponse(404, "Attachment file is unavailable.");
    }
    throw error;
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": contentDisposition(attachment.fileName),
      "Content-Length": String(bytes.byteLength),
      "Content-Security-Policy": "sandbox",
      "Content-Type": attachment.fileType ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
