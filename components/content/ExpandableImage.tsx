"use client";

import React, { useState } from "react";
import { getAssetPath } from "@/lib/utils";

interface ExpandableImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}

const ExpandableImage: React.FC<ExpandableImageProps> = ({ 
  src, 
  alt, 
  style, 
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const imageSrc = getAssetPath(src);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  if (isExpanded) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={handleClick}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={imageSrc}
              alt={alt}
              className="max-w-full max-h-full object-contain cursor-pointer"
              onClick={handleClick}
            />
            <button
              className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
              onClick={handleClick}
            >
              ×
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      style={{ cursor: 'pointer', ...style }}
      className={className}
      onClick={handleClick}
    />
  );
};

export default ExpandableImage;