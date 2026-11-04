"use client";

import Image from "next/image";

export function CalendarEventImageBanner({
  imagePath,
  altText,
}: {
  imagePath: string | null;
  altText: string;
}) {
  if (!imagePath) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Image
        src={imagePath}
        alt={altText}
        width={800}
        height={300}
        unoptimized
        className="max-h-48 w-full object-cover"
      />
    </div>
  );
}
