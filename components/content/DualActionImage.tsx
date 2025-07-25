"use client";

import React from "react";
import { getAssetPath } from "@/lib/utils";
import Link from "next/link";

interface DualActionImageProps {
  /** Image source */
  src: string;
  /** Alt text */
  alt?: string;
  /** Optional CSS width (e.g. "75%" or numeric px) */
  width?: string | number;
  /** Optional className for outer wrapper */
  className?: string;
}

/**
 * Displays an image with an invisible click-hotspot in the bottom-left corner
 * that navigates to "/01-kl_intro"
 *
 * Useful for the Matrix "red pill" illustration.
 */
export default function DualActionImage({ src, alt = "image", width = "75%", className = "" }: DualActionImageProps) {
  return (
    <div
      className={`relative mx-auto my-6 flex justify-center ${className}`}
      style={typeof width === "string" ? { width } : { width }}
    >
      {/* The core image */}
      <img 
        src={getAssetPath(src)} 
        alt={alt} 
        className="block max-w-full h-auto select-none" 
        title="Image source: https://www.pngegg.com/en/png-nllqe/"
      />

      {/* Bottom-left clickable quadrant (25% width & height) */}
      <Link
        href="/01-kl_intro"
        className="absolute bottom-0 left-0 hover:bg-red-300/20"
        style={{ width: "33%", height: "33%" }}
        aria-label="Go to first chapter"
      />

    </div>
  );
}
