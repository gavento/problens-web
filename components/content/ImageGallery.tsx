import ExpandableImage from "./ExpandableImage";
import React from "react";
import ReactMarkdown from "react-markdown";

interface ImageItem {
  src: string;
  alt: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  caption?: string;
  height?: number;
}

const DEFAULT_HEIGHT = 160;

export default function ImageGallery({ images, caption, height = DEFAULT_HEIGHT }: ImageGalleryProps) {
  return (
    <div className="my-6">
      {/* Images grid */}
      <div className="w-full">
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4 place-items-center justify-center mx-auto"
          style={{ width: "fit-content" }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              style={{
                height: `${height}px`,
                width: "100%",
                maxWidth: `${height * 1.2}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              className="rounded shadow-sm overflow-hidden mx-auto bg-white"
            >
              <ExpandableImage src={image.src} alt={image.alt} className="w-full h-full object-contain block" />
            </div>
          ))}
        </div>
      </div>
      {/* Markdown caption below (always rendered) */}
      <div className="text-center text-sm text-gray-600 max-w-2xl mx-auto min-h-[1.5em]">
        {typeof caption === "string" ? <ReactMarkdown>{caption}</ReactMarkdown> : caption || null}
      </div>
    </div>
  );
}
