import type { Prisma } from "@prisma/client";

export const safeAttachmentSelect = {
  id: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  createdAt: true,
  uploadedBy: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.AttachmentSelect;

export type SafeAttachment = Prisma.AttachmentGetPayload<{
  select: typeof safeAttachmentSelect;
}>;

export type AttachmentFileRecord = {
  id: number;
  ticketId: number;
  uploadedById: number;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
};
