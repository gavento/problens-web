'use client';

import React from 'react';
import { getAssetPath } from '@/lib/utils';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

/**
 * Custom Image component that handles basePath for deployment
 * Works both locally and in GitHub Pages deployment
 */
export default function Image({ src, alt, ...props }: ImageProps) {
  return (
    <img
      src={getAssetPath(src)}
      alt={alt}
      {...props}
    />
  );
}