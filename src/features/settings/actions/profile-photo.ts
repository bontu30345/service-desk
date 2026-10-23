"use server";

import { revalidatePath } from "next/cache";
import {
  AuthenticationRequiredError,
  requireAuthenticatedUser,
} from "@/lib/permissions";
import {
  isProfilePhotoKeyCurrent,
  updateProfilePhotoKey,
} from "../repositories/settings.repository";
import {
  MAX_PROFILE_PHOTO_SIZE,
  type ProfilePhotoActionState,
} from "../schemas/profile-photo.schema";
import {
  assertProfilePhotoStorageConfigured,
  ProfilePhotoStorageError,
  removeProfilePhoto,
  storeProfilePhoto,
} from "../services/profile-photo-storage";
import {
  InvalidProfilePhotoError,
  normalizeProfilePhoto,
} from "../services/profile-photo-validation";

const authMessage = "Sign in to update your profile photo.";
const unavailableMessage = "Unable to update your profile photo right now. Please try again.";

function logProfilePhotoFailure(stage: string, category: string) {
  console.error(`[profile-photo] ${stage} failed (category=${category}).`);
}

async function getActorId() {
  try {
    const user = await requireAuthenticatedUser();
    const userId = Number(user.id);
    return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return null;
    throw error;
  }
}

function refreshPhotoViews() {
  revalidatePath("/settings/profile");
  revalidatePath("/users");
  revalidatePath("/dashboard");
}

export async function uploadProfilePhotoAction(
  _previous: ProfilePhotoActionState,
  formData: FormData,
): Promise<ProfilePhotoActionState> {
  const userId = await getActorId();
  if (!userId) return { success: false, message: authMessage };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Choose a non-empty image to upload." };
  }
  if (file.size > MAX_PROFILE_PHOTO_SIZE) {
    return { success: false, message: "Profile photos must be 5 MB or smaller." };
  }

  let normalized;
  try {
    normalized = await normalizeProfilePhoto(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof InvalidProfilePhotoError) {
      return { success: false, message: "Choose a valid JPEG, PNG, or WebP image." };
    }
    logProfilePhotoFailure("image_normalization", "unexpected_failure");
    return { success: false, message: unavailableMessage };
  }

  let newKey: string;
  try {
    newKey = await storeProfilePhoto(
      userId,
      normalized.bytes,
      normalized.contentType,
      normalized.extension,
    );
  } catch (error) {
    if (error instanceof ProfilePhotoStorageError) {
      logProfilePhotoFailure("upload", error.category ?? "unexpected_failure");
      return { success: false, message: unavailableMessage };
    }
    logProfilePhotoFailure("upload", "unexpected_failure");
    return { success: false, message: unavailableMessage };
  }

  let previousKey: string | null;
  try {
    previousKey = await updateProfilePhotoKey(userId, newKey);
  } catch {
    try {
      if (await isProfilePhotoKeyCurrent(userId, newKey)) {
        refreshPhotoViews();
        return {
          success: true,
          message: "Profile photo updated. Previous photo cleanup may be needed.",
          hasPhoto: true,
        };
      }
    } catch {
      logProfilePhotoFailure("database_verification", "query_failed");
      return {
        success: false,
        message: "The photo update could not be verified. Contact support before retrying.",
      };
    }
    logProfilePhotoFailure("database_update", "query_failed");
    try {
      await removeProfilePhoto(newKey);
    } catch (error) {
      logProfilePhotoFailure(
        "failed_upload_cleanup",
        error instanceof ProfilePhotoStorageError ? error.category ?? "unexpected_failure" : "unexpected_failure",
      );
      return {
        success: false,
        message: "The photo could not be saved and temporary-file cleanup failed. Contact support.",
      };
    }
    return { success: false, message: unavailableMessage };
  }

  let message = "Profile photo updated.";
  if (previousKey) {
    try {
      await removeProfilePhoto(previousKey);
    } catch (error) {
      message = "Profile photo updated, but the previous stored image could not be cleaned up.";
      logProfilePhotoFailure(
        "replacement_cleanup",
        error instanceof ProfilePhotoStorageError ? error.category ?? "unexpected_failure" : "unexpected_failure",
      );
    }
  }

  refreshPhotoViews();
  return { success: true, message, hasPhoto: true };
}

export async function removeProfilePhotoAction(
  _previous: ProfilePhotoActionState,
): Promise<ProfilePhotoActionState> {
  void _previous;
  const userId = await getActorId();
  if (!userId) return { success: false, message: authMessage };

  let previousKey: string | null;
  try {
    assertProfilePhotoStorageConfigured();
    previousKey = await updateProfilePhotoKey(userId, null);
  } catch (error) {
    if (error instanceof ProfilePhotoStorageError) {
      logProfilePhotoFailure("removal_configuration", error.category);
      return { success: false, message: unavailableMessage };
    }
    logProfilePhotoFailure("removal_database_update", "query_failed");
    return { success: false, message: unavailableMessage };
  }

  let message = "Profile photo removed.";
  if (previousKey) {
    try {
      await removeProfilePhoto(previousKey);
    } catch (error) {
      message = "Profile photo removed, but the stored image could not be cleaned up.";
      logProfilePhotoFailure(
        "removal_cleanup",
        error instanceof ProfilePhotoStorageError ? error.category ?? "unexpected_failure" : "unexpected_failure",
      );
    }
  }

  refreshPhotoViews();
  return { success: true, message, hasPhoto: false };
}
