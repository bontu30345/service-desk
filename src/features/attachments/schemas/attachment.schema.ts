import { z } from "zod";

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const supportedExtensions = ["pdf", "png", "jpg", "jpeg", "txt"] as const;

export const attachmentUploadMetadataSchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(1, "Choose a file.")
      .max(255, "The filename must be 255 characters or fewer.")
      .refine(
        (name) => !/[\\/:*\u0000-\u001f\u007f]/u.test(name),
        "The filename contains an unsafe character.",
      ),
    fileSize: z
      .number()
      .int()
      .positive("The selected file is empty.")
      .max(
        MAX_ATTACHMENT_SIZE,
        "Files must be 5 MiB or smaller.",
      ),
  })
  .superRefine(({ fileName }, context) => {
    const extension = fileName.split(".").at(-1)?.toLowerCase();

    if (
      fileName.lastIndexOf(".") < 1 ||
      !supportedExtensions.some((allowed) => allowed === extension)
    ) {
      context.addIssue({
        code: "custom",
        path: ["fileName"],
        message: "Choose a PDF, PNG, JPG, JPEG, or TXT file.",
      });
    }
  });

export type AttachmentUploadMetadata = z.infer<
  typeof attachmentUploadMetadataSchema
>;

export type AttachmentUploadActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    fileName?: string[];
  };
};
