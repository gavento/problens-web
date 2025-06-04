// components/widgets/FinanceSlider.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image"; // <--- ADD THIS LINE

type ImageItem = {
  src: string;
  index: number;
  // You might not need width/height if using fill, or if Next.js can infer from static import
  // For dynamic 'src', you might still need to provide them or use a custom loader config.
  // Let's assume for now Next.js can infer if `require.context` works as a static-like import.
  // If not, you'll need to define width/height for each image or use a loader.
};

const importAll = (r: any): ImageItem[] =>
  r.keys().map((key: string) => {
    // When using next/image, `r(key)` directly might be sufficient,
    // or you might still need `.default` depending on your webpack/Next.js config.
    // `.default` is safer if you're not sure how context resolves.
    return {
      src: r(key).default as string,
      index: parseInt(key.match(/\d+(?=\.png$)/)![0], 10),
    };
  });

// Note: `require.context` works best in webpack environments.
// If you're using Next.js 13+ with the App Router and SWC (which is the default),
// `require.context` might behave slightly differently or require specific
// Next.js configurations for static assets. However, for local files,
// Next.js's `Image` component typically handles them well.

const sapImages: ImageItem[] = importAll((require as any).context("./financial", false, /sap_plot\d+\.png$/)).sort(
  (a: ImageItem, b: ImageItem) => a.index - b.index,
);

const btcImages: ImageItem[] = importAll((require as any).context("./financial", false, /btc_plot\d+\.png$/)).sort(
  (a: ImageItem, b: ImageItem) => a.index - b.index,
);

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
  // You'll need to know the dimensions of your images, or decide on a fixed size for the display.
  // If your images have varying sizes, you might need a more dynamic approach or use `fill`.
  const imageWidth = 800; // Example width
  const imageHeight = 600; // Example height (adjust as needed, maintain aspect ratio)

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
        {/* <img // <--- REMOVE THIS
          src={images[currentIdx].src}
          alt={`${mode.toUpperCase()} Plot ${images[currentIdx].index}`}
          className="max-w-full h-auto border rounded-md shadow"
        /> */}
        <Image // <--- USE NEXT.JS IMAGE COMPONENT
          src={images[currentIdx].src}
          alt={`${mode.toUpperCase()} Plot ${images[currentIdx].index}`}
          width={imageWidth} // <--- ADD WIDTH
          height={imageHeight} // <--- ADD HEIGHT
          className="max-w-full h-auto border rounded-md shadow"
          // Consider adding `priority` if this image is above the fold
          // priority={true}
        />
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div className="text-center text-sm text-gray-700">
          {mode.toUpperCase()} Plot: <strong>{images[currentIdx].index}</strong>
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
