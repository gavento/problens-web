// components/widgets/FinanceSlider.tsx
"use client";

import React, { useState, useEffect } from "react";

type ImageItem = {
  src: string;
  index: number;
};

const importAll = (r: any): ImageItem[] =>
  r.keys().map((key: string) => ({
    src: r(key).default as string,
    index: parseInt(key.match(/\d+(?=\.png$)/)![0], 10),
  }));

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
        <img
          src={images[currentIdx].src}
          alt={`${mode.toUpperCase()} Plot ${images[currentIdx].index}`}
          className="max-w-full h-auto border rounded-md shadow"
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
