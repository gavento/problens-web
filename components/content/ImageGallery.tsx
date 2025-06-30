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
  fullWidth?: boolean;
}

const DEFAULT_HEIGHT = 160;

export default function ImageGallery({ images, caption, height = DEFAULT_HEIGHT, fullWidth = false }: ImageGalleryProps) {
  // Special handling for single image with fullWidth
  if (fullWidth && images.length === 1) {
    const image = images[0];
    return (
      <div className="my-6">
        <div className="w-full rounded shadow-sm overflow-hidden bg-white">
          <ExpandableImage 
            src={image.src} 
            alt={image.alt} 
            className="w-full h-auto object-contain block" 
          />
        </div>
        {/* Markdown caption below */}
        <div className="text-center text-sm text-gray-600 max-w-2xl mx-auto min-h-[1.5em] mt-4 px-6 py-2">
          {typeof caption === "string" ? <ReactMarkdown>{caption}</ReactMarkdown> : caption || null}
        </div>
      </div>
    );
  }

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
      <div className="text-center text-sm text-gray-600 max-w-2xl mx-auto min-h-[1.5em] px-6 py-2">
        {typeof caption === "string" ? <ReactMarkdown>{caption}</ReactMarkdown> : caption || null}
      </div>
    </div>
  );
}
