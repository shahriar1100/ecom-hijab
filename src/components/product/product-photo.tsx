"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import type { Photo } from "@/types/store";

export function ProductPhoto({ photo, sizes, loading }: { photo: Photo; sizes: string; loading?: "eager" | "lazy" }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (!photo.src || failedSource === photo.src) {
    return <span className="product-photo-placeholder" role="img" aria-label={`${photo.alt} — image unavailable`}><ImageOff aria-hidden="true" size={26} /><span>Image coming soon</span></span>;
  }
  return <Image src={photo.src} alt={photo.alt} fill sizes={sizes} loading={loading} style={{ objectPosition: photo.position }} onError={() => setFailedSource(photo.src)} />;
}
