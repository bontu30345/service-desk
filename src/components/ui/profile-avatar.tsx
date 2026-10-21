"use client";

import { useState } from "react";
import Image from "next/image";

function initials(name: string) {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  return (parts.length > 1
    ? `${parts[0][0]}${parts.at(-1)?.[0]}`
    : parts[0]?.slice(0, 2) ?? "U"
  ).toUpperCase();
}

const sizes = {
  small: "h-9 w-9 text-xs",
  medium: "h-10 w-10 text-sm",
  large: "h-16 w-16 text-lg",
} as const;

export function ProfileAvatar({
  userId,
  name,
  version,
  hasPhoto,
  size = "medium",
  previewSrc,
}: {
  userId: number;
  name: string;
  version: number;
  hasPhoto: boolean;
  size?: keyof typeof sizes;
  previewSrc?: string | null;
}) {
  const source = previewSrc ?? (hasPhoto ? `/api/profile-photos/${userId}?v=${version}` : null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageFailed = failedImage === source;

  return (
    <span
      role="img"
      aria-label={`${name || "User"} profile photo`}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-800 ${sizes[size]}`}
    >
      {source && !imageFailed ? (
        <Image
          src={source}
          alt=""
          fill
          sizes="64px"
          unoptimized
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedImage(source)}
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}
