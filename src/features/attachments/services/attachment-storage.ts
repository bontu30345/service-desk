import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, readFile, realpath, unlink } from "node:fs/promises";
import path from "node:path";

export type StoredExtension = "pdf" | "png" | "jpg" | "txt";

export class AttachmentStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AttachmentStorageError";
  }
}

function isWithin(parentPath: string, childPath: string) {
  const relativePath = path.relative(parentPath, childPath);
  return (
    relativePath === "" ||
    (relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath))
  );
}

async function getPrivateStorageRoot() {
  const configuredPath = process.env.ATTACHMENT_STORAGE_DIR;
  const requestedRoot = path.resolve(
    configuredPath ?? path.join(process.cwd(), ".private", "attachments"),
  );

  try {
    await mkdir(requestedRoot, { recursive: true, mode: 0o700 });
    const [storageRoot, publicRoot] = await Promise.all([
      realpath(requestedRoot),
      realpath(path.join(process.cwd(), "public")),
    ]);

    if (isWithin(publicRoot, storageRoot)) {
      throw new AttachmentStorageError(
        "Attachment storage must not be inside the public directory.",
      );
    }

    return storageRoot;
  } catch (error) {
    if (error instanceof AttachmentStorageError) {
      throw error;
    }

    throw new AttachmentStorageError(
      "Private attachment storage is unavailable.",
      { cause: error },
    );
  }
}

function isStorageKey(value: string): value is string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg|txt)$/u.test(
    value,
  );
}

async function getStorageFilePath(storageKey: string) {
  if (!isStorageKey(storageKey)) {
    throw new AttachmentStorageError("The stored attachment key is invalid.");
  }

  const root = await getPrivateStorageRoot();
  const filePath = path.resolve(root, storageKey);
  if (!isWithin(root, filePath) || filePath === root) {
    throw new AttachmentStorageError("The stored attachment path is invalid.");
  }

  return filePath;
}

export async function storeAttachmentBytes(
  bytes: Buffer,
  extension: StoredExtension,
) {
  const storageKey = `${randomUUID()}.${extension}`;
  const filePath = await getStorageFilePath(storageKey);
  let fileHandle;

  try {
    fileHandle = await open(
      filePath,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o600,
    );
    await fileHandle.writeFile(bytes);
    await fileHandle.close();
    return storageKey;
  } catch (error) {
    if (fileHandle) {
      const cleanupErrors: unknown[] = [];
      try {
        await fileHandle.close();
      } catch (closeError) {
        cleanupErrors.push(closeError);
      }

      try {
        await unlink(filePath);
      } catch (cleanupError) {
        if (
          !(cleanupError instanceof Error) ||
          !("code" in cleanupError) ||
          cleanupError.code !== "ENOENT"
        ) {
          cleanupErrors.push(cleanupError);
        }
      }

      if (cleanupErrors.length > 0) {
        throw new AggregateError(
          [error, ...cleanupErrors],
          "Attachment storage failed and its partial file cleanup was incomplete.",
        );
      }
    }

    throw new AttachmentStorageError("Unable to store the uploaded file.", {
      cause: error,
    });
  }
}

export async function readStoredAttachment(storageKey: string) {
  const filePath = await getStorageFilePath(storageKey);

  try {
    const info = await lstat(filePath);
    if (!info.isFile()) {
      throw new AttachmentStorageError("The stored attachment is not a file.");
    }

    return await readFile(filePath);
  } catch (error) {
    if (error instanceof AttachmentStorageError) {
      throw error;
    }

    throw new AttachmentStorageError("The stored attachment is unavailable.", {
      cause: error,
    });
  }
}

export async function removeStoredAttachment(storageKey: string) {
  const filePath = await getStorageFilePath(storageKey);
  try {
    await unlink(filePath);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    throw new AttachmentStorageError(
      "The stored attachment could not be removed.",
      { cause: error },
    );
  }
}
