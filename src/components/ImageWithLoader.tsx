"use client";
import { useState } from "react";

interface ImageWithLoaderProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function ImageWithLoader({ src, alt, className = "", onClick }: ImageWithLoaderProps): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div className={`relative ${onClick ? "cursor-pointer" : ""}`} onClick={handleClick}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-gray-500 text-sm">Failed to load</div>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading || error ? "opacity-0" : "opacity-100"} transition-opacity`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}

