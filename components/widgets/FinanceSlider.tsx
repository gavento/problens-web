// components/widgets/FinanceSlider.tsx
"use client";

import React, { useState, useEffect } from "react";

type ImageItem = {
  src: string;
  index: number;
};

const generateImagePaths = (prefix: string, start: number, end: number, step: number): ImageItem[] => {
  const images: ImageItem[] = [];
  for (let i = start; i <= end; i += step) {
    const paddedIndex = String(i).padStart(4, "0");
    images.push({
      src: `/problens-web/financial/${prefix}_plot${paddedIndex}.png`,
      index: i,
    });
  }
  return images;
};

// Image ranges based on your actual files
const sapImages: ImageItem[] = generateImagePaths("sap", 20, 7460, 20);
const btcImages: ImageItem[] = generateImagePaths("btc", 20, 2840, 20);

const FinanceSlider: React.FC = () => {
  const [mode, setMode] = useState<"sap" | "btc">("sap");
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  useEffect(() => {
    setCurrentIdx(0);
  }, [mode]);

  const images = mode === "sap" ? sapImages : btcImages;

  if (images.length === 0) {
    return (
      <div className="p-4 bg-red-50 rounded-md text-red-700">No {mode === "sap" ? "SAP" : "Bitcoin"} plots found.</div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      {/* Mode toggle */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setMode("sap")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            mode === "sap" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          S&P
        </button>
        <button
          onClick={() => setMode("btc")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            mode === "btc"
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Bitcoin
        </button>
      </div>

      {/* Image display */}
      <div className="flex justify-center">
        <div className="relative">
          <img
            src={images[currentIdx].src}
            alt={`${mode.toUpperCase()} Plot ${images[currentIdx].index}`}
            className="max-w-full h-auto border rounded-md shadow-lg"
            style={{ maxHeight: '600px' }}
            onError={(e) => {
              console.error('Image failed to load:', images[currentIdx].src);
              console.error('Error details:', e);
              (e.target as HTMLImageElement).style.border = '2px solid red';
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', images[currentIdx].src);
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">
            Past {images[currentIdx].index} Days
          </div>
          <div className="text-sm text-gray-600">
            {currentIdx + 1} of {images.length}
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={images.length - 1}
            step={1}
            value={currentIdx}
            onChange={(e) => setCurrentIdx(Number(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />

          {/* Navigation buttons */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentIdx(Math.min(images.length - 1, currentIdx + 1))}
              disabled={currentIdx === images.length - 1}
              className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceSlider;
