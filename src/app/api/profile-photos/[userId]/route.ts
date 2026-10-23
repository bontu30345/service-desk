import { hasPermission } from "@/lib/permission-policy";
import {
  AuthenticationRequiredError,
  requireAuthenticatedUser,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  ProfilePhotoStorageError,
  readProfilePhoto,
} from "@/features/settings/services/profile-photo-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(status: number, message: string) {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  let actor;
  try {
    actor = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return errorResponse(401, "Sign in to view profile photos.");
    }
    throw error;
  }

  const { userId: rawUserId } = await params;
  if (!/^[1-9]\d*$/u.test(rawUserId)) {
    return errorResponse(404, "Profile photo not found.");
  }
  const targetId = Number(rawUserId);
  const actorId = Number(actor.id);
  if (!Number.isSafeInteger(targetId) || !Number.isSafeInteger(actorId) || actorId < 1) {
    return errorResponse(404, "Profile photo not found.");
  }
  if (targetId !== actorId && !hasPermission(actor.role, "user:manage")) {
    return errorResponse(403, "You are not authorized to view this profile photo.");
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { profilePhotoKey: true },
    });
  } catch {
    console.error("[profile-photo] lookup failed (category=database_query_failed).");
    return errorResponse(503, "Profile photo is temporarily unavailable.");
  }
  if (!user?.profilePhotoKey) {
    return errorResponse(404, "Profile photo not found.");
  }

  try {
    const photo = await readProfilePhoto(user.profilePhotoKey);
    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Length": String(photo.bytes.byteLength),
        "Content-Disposition": "inline",
        "Content-Security-Policy": "sandbox",
        "Content-Type": photo.contentType,
        Vary: "Cookie",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ProfilePhotoStorageError) {
      if (error.category === "s3_read_not_found") {
        return errorResponse(404, "Profile photo not found.");
      }
      console.error(`[profile-photo] read failed (category=${error.category}).`);
      return errorResponse(503, "Profile photo is temporarily unavailable.");
    }
    console.error("[profile-photo] read failed (category=unexpected_failure).");
    return errorResponse(503, "Profile photo is temporarily unavailable.");
  }
}
