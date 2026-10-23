import sharp from "sharp";
import type { ProfilePhotoFormat } from "../schemas/profile-photo.schema";

const maxPixels = 25_000_000;

export class InvalidProfilePhotoError extends Error {
  constructor() {
    super("The uploaded file is not a supported image.");
    this.name = "InvalidProfilePhotoError";
  }
}

export async function normalizeProfilePhoto(bytes: Buffer) {
  try {
    const source = sharp(bytes, { failOn: "error", limitInputPixels: maxPixels });
    const metadata = await source.metadata();
    const format = metadata.format;
    if (format !== "jpeg" && format !== "png" && format !== "webp") {
      throw new InvalidProfilePhotoError();
    }

    let pipeline = sharp(bytes, {
      failOn: "error",
      limitInputPixels: maxPixels,
      animated: false,
    })
      .rotate()
      .resize(512, 512, { fit: "cover", withoutEnlargement: true });

    if (format === "jpeg") pipeline = pipeline.jpeg({ quality: 86, mozjpeg: true });
    else if (format === "png") pipeline = pipeline.png({ compressionLevel: 9 });
    else pipeline = pipeline.webp({ quality: 86 });

    const normalizedBytes = await pipeline.toBuffer();
    const extension = (format === "jpeg" ? "jpg" : format) as
      | "jpg"
      | "png"
      | "webp";
    return {
      bytes: normalizedBytes,
      contentType: `image/${format}`,
      extension,
    };
  } catch (error) {
    if (error instanceof InvalidProfilePhotoError) throw error;
    throw new InvalidProfilePhotoError();
  }
}

export function profilePhotoContentType(format: ProfilePhotoFormat) {
  return `image/${format}`;
}
