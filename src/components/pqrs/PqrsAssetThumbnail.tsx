"use client";

import { MediaType, PqrsAssetResponseDTO } from "@/types/Pqrs.types";
import { usePqrsAssetSrc } from "@/hooks/pqrs/usePqrsAssetSrc";

interface Props {
  asset: PqrsAssetResponseDTO;
}

const PqrsAssetThumbnail = ({ asset }: Props) => {
  const src = usePqrsAssetSrc(asset.viewUrl);

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => { if (!src) e.preventDefault(); }}
      className="block aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
    >
      {!src ? (
        <div className="w-full h-full animate-pulse bg-gray-100" />
      ) : asset.mediaType === MediaType.VIDEO ? (
        <video src={src} className="w-full h-full object-cover" muted />
      ) : (
        <img src={src} alt={asset.originalFileName} className="w-full h-full object-cover" />
      )}
    </a>
  );
};

export default PqrsAssetThumbnail;
