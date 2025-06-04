// components/widgets/FinanceSlider.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

type ImageItem = {
  src: string;
  index: number;
};

const generateImagePaths = (prefix: string, start: number, end: number, step: number): ImageItem[] => {
  const images: ImageItem[] = [];
  for (let i = start; i <= end; i += step) {
    const paddedIndex = String(i).padStart(4, "0");
    images.push({
      src: `/financial/${prefix}_plot${paddedIndex}.png`,
      index: i,
    });
  }
  return images;
};

// Fixed ranges based on your actual files:
// SAP: sap_plot0020.png to sap_plot7460.png (step 20)
// BTC: btc_plot0020.png to btc_plot2840.png (step 20)
const sapImages: ImageItem[] = generateImagePaths("sap", 20, 7460, 20);
const btcImages: ImageItem[] = generateImagePaths("btc", 20, 2840, 20);

const FinanceSlider: React.FC = () => {
  const [mode, setMode] = useState<"sap" | "btc">("sap");
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Když se změní režim (SAP/BTC), vrátíme idx na 0
  useEffect(() => {
    setCurrentIdx(0);
  }, [mode]);

  const images = mode === "sap" ? sapImages : btcImages;

  if (images.length === 0) {
    return (
      <div className="p-4 bg-red-50 rounded-md text-red-700">No {mode === "sap" ? "SAP" : "Bitcoin"} plots found.</div>
    );
  }

  // Define width and height for the Image component.
  // Assuming all your plots are 800x600 as a common example.
  // Adjust these to your actual image dimensions for best results.
  const imageWidth = 800;
  const imageHeight = 600;

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      {/* Toggle mezi SAP a Bitcoin */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setMode("sap")}
          className={`px-4 py-2 rounded-md font-medium ${
            mode === "sap" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          SAP
        </button>
        <button
          onClick={() => setMode("btc")}
          className={`px-4 py-2 rounded-md font-medium ${
            mode === "btc"
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Bitcoin
        </button>
      </div>

      {/* Zobrazený obrázek */}
      <div className="flex justify-center">
        <Image
          src={images[currentIdx].src}
          alt={`${mode.toUpperCase()} Plot ${images[currentIdx].index}`}
          width={imageWidth}
          height={imageHeight}
          className="max-w-full h-auto border rounded-md shadow"
          // Consider adding `priority` if this image is above the fold
          // priority={true}
        />
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div className="text-center text-sm text-gray-700">
          {mode.toUpperCase()} Plot: <strong>{images[currentIdx].index}</strong> ({currentIdx + 1} of {images.length})
        </div>
        <input
          type="range"
          min={0}
          max={images.length - 1}
          step={1}
          value={currentIdx}
          onChange={(e) => setCurrentIdx(Number(e.target.value))}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
    </div>
  );
};

export default FinanceSlider;
