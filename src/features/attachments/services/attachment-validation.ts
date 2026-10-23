import type { StoredExtension } from "./attachment-storage";

const allowedTypes: Record<
  string,
  { fileType: string; extension: StoredExtension }
> = {
  pdf: { fileType: "application/pdf", extension: "pdf" },
  png: { fileType: "image/png", extension: "png" },
  jpg: { fileType: "image/jpeg", extension: "jpg" },
  jpeg: { fileType: "image/jpeg", extension: "jpg" },
  txt: { fileType: "text/plain", extension: "txt" },
};

function hasValidSignature(bytes: Buffer, extension: string) {
  switch (extension) {
    case "pdf":
      return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
    case "png":
      return bytes.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
    case "jpg":
    case "jpeg":
      return (
        bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff
      );
    case "txt":
      try {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export function validateAttachmentContents(
  fileName: string,
  declaredType: string,
  bytes: Buffer,
):
  | {
      success: true;
      fileType: string;
      extension: StoredExtension;
    }
  | { success: false; message: string } {
  const sourceExtension = fileName.split(".").at(-1)?.toLowerCase() ?? "";
  const fileType = allowedTypes[sourceExtension];

  if (!fileType) {
    return {
      success: false,
      message: "Choose a PDF, PNG, JPG, JPEG, or TXT file.",
    };
  }
  if (declaredType && declaredType !== fileType.fileType) {
    return {
      success: false,
      message: "The file type does not match its extension.",
    };
  }
  if (!hasValidSignature(bytes, sourceExtension)) {
    return {
      success: false,
      message: "The file contents do not match an allowed file type.",
    };
  }

  return {
    success: true,
    fileType: fileType.fileType,
    extension: fileType.extension,
  };
}
