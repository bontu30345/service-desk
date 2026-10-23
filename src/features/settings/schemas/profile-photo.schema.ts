export const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;

export type ProfilePhotoFormat = "jpeg" | "png" | "webp";
export type ProfilePhotoActionState = {
  success: boolean;
  message: string;
  hasPhoto?: boolean;
};
