import "server-only";

import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export class ProfilePhotoStorageError extends Error {
  constructor(
    message: string,
    readonly category:
      | "configuration_missing"
      | "configuration_invalid"
      | "invalid_stored_key"
      | "s3_put_failed"
      | "s3_read_failed"
      | "s3_read_not_found"
      | "s3_delete_failed",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ProfilePhotoStorageError";
  }
}

type StorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

let cachedClient: S3Client | null = null;

function getStorageConfig(): StorageConfig {
  const endpoint = process.env.PROFILE_PHOTO_S3_ENDPOINT;
  const region = process.env.PROFILE_PHOTO_S3_REGION;
  const bucket = process.env.PROFILE_PHOTO_S3_BUCKET;
  const accessKeyId = process.env.PROFILE_PHOTO_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.PROFILE_PHOTO_S3_SECRET_ACCESS_KEY;

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new ProfilePhotoStorageError("Profile photo storage is not configured.", "configuration_missing");
  }

  try {
    new URL(endpoint);
  } catch (error) {
    throw new ProfilePhotoStorageError("Profile photo storage is not configured.", "configuration_invalid", { cause: error });
  }

  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}

function getStorageClient(config: StorageConfig) {
  if (!cachedClient) {
    cachedClient = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return cachedClient;
}

export function assertProfilePhotoStorageConfigured() {
  getStorageConfig();
}

function isProfilePhotoKey(key: string): boolean {
  return /^profile-photos\/[1-9]\d*\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/u.test(key);
}

export async function storeProfilePhoto(
  userId: number,
  bytes: Buffer,
  contentType: string,
  extension: "jpg" | "png" | "webp",
) {
  const config = getStorageConfig();
  const key = `profile-photos/${userId}/${randomUUID()}.${extension}`;
  try {
    const client = getStorageClient(config);
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        CacheControl: "private, no-store",
      }),
    );
    return key;
  } catch (error) {
    try {
      await getStorageClient(config).send(
        new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
      );
    } catch {
      console.error("A failed profile photo upload may have left an object that needs cleanup.");
    }
    throw new ProfilePhotoStorageError("Unable to store the profile photo.", "s3_put_failed", { cause: error });
  }
}

export async function readProfilePhoto(key: string) {
  if (!isProfilePhotoKey(key)) {
    throw new ProfilePhotoStorageError("The stored profile photo reference is invalid.", "invalid_stored_key");
  }
  const config = getStorageConfig();
  try {
    const result = await getStorageClient(config).send(
      new GetObjectCommand({ Bucket: config.bucket, Key: key }),
    );
    if (!result.Body) throw new Error("The stored object has no body.");
    const bytes = await result.Body.transformToByteArray();
    return {
      bytes: Buffer.from(bytes),
      contentType: contentTypeFromKey(key),
    };
  } catch (error) {
    const status = typeof error === "object" && error !== null && "$metadata" in error
      ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
      : undefined;
    const name = typeof error === "object" && error !== null && "name" in error
      ? (error as { name?: string }).name
      : undefined;
    const category = status === 404 || name === "NoSuchKey" || name === "NotFound"
      ? "s3_read_not_found"
      : "s3_read_failed";
    throw new ProfilePhotoStorageError("Unable to read the profile photo.", category, { cause: error });
  }
}

export async function removeProfilePhoto(key: string) {
  if (!isProfilePhotoKey(key)) {
    throw new ProfilePhotoStorageError("The stored profile photo reference is invalid.", "invalid_stored_key");
  }
  const config = getStorageConfig();
  try {
    await getStorageClient(config).send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
    );
  } catch (error) {
    throw new ProfilePhotoStorageError("Unable to remove the profile photo.", "s3_delete_failed", { cause: error });
  }
}

function contentTypeFromKey(key: string) {
  return key.endsWith(".jpg") ? "image/jpeg" : key.endsWith(".png") ? "image/png" : "image/webp";
}