import React, { useState, useEffect } from "react";

("use client");

// Dynamically load all SAP and BTC plot images from the `public/images` folder (or wherever you store them).
// Adjust the path to your image folder as needed.
const importAll = (r) =>
  r.keys().map((key) => ({
    // Extract the numeric part (XXXX) for sorting
    src: r(key).default,
    index: parseInt(key.match(/\d+(?=\.png$)/)[0], 10),
  }));

// Note: adjust the relative path "./sap_plots" and "./btc_plots" to match where your images live.
// In many setups, placing images in `public/images/sap_plots` and `public/images/btc_plots` is common.
const sapImages = importAll(require.context("../public/images/sap_plots", false, /sap_plot\d+\.png$/)).sort(
  (a, b) => a.index - b.index,
);

const btcImages = importAll(require.context("../public/images/btc_plots", false, /btc_plot\d+\.png$/)).sort(
  (a, b) => a.index - b.index,
);

const ImageSliderWidget = () => {
  const [mode, setMode] = useState<"sap" | "btc">("sap");
  const [currentIdx, setCurrentIdx] = useState(0);

  // Determine which array to use based on toggle
  const images = mode === "sap" ? sapImages : btcImages;

  // If switching mode, reset index to 0
  useEffect(() => {
    setCurrentIdx(0);
  }, [mode]);

  // If there are no images, render a fallback message
  if (images.length === 0) {
    return (
      <div className="p-4 bg-red-50 rounded-md text-red-700">No {mode === "sap" ? "SAP" : "Bitcoin"} plots found.</div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      {/* Toggle between SAP and BTC */}
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

      {/* Display current image */}
      <div className="flex justify-center">
        <img
          src={images[currentIdx].src}
          alt={`${mode.toUpperCase()} Plot ${images[currentIdx].index}`}
          className="max-w-full h-auto border rounded-md shadow"
        />
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div className="text-center text-sm text-gray-700">
          {/* Show the actual filename or index above the slider */}
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

export default ImageSliderWidget;

// In your MDX page, simply import and render <ImageSliderWidget /> where you want it to appear.
// Example:
//
// import ImageSliderWidget from "./components/ImageSliderWidget.mdx";
//
// <ImageSliderWidget />
