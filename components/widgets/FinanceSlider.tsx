// components/widgets/FinanceSlider.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

type ImageItem = {
  src: string; // This will now store the full public path, e.g., '/financial/sap_plot0020.png'
  index: number;
};

// Use a dynamic import for require.context to ensure it runs client-side if needed,
// though in this case, it's about resolving paths at build time.
// The key is to get the correct *public path* from the context.
const importAll = (r: any, basePath: string): ImageItem[] =>
  r.keys().map((key: string) => {
    // `key` will be something like './sap_plot0020.png'
    // `basePath` will be '/financial/'
    const imagePath = `${basePath}${key.replace("./", "")}`; // Constructs '/financial/sap_plot0020.png'

    return {
      src: imagePath, // Store the public path
      index: parseInt(key.match(/\d+(?=\.png$)/)![0], 10),
    };
  });

// Important: require.context cannot directly access files in `public/` from source code like this.
// `require.context` looks for modules to bundle. Files in `public` are static assets not bundled by webpack.
//
// The way `require.context` is usually used with images is when the images are IN THE SOURCE (e.g., `src/images/`),
// and webpack then processes them and outputs them to `/_next/static/media` etc.
//
// Since your images are in `public/financial`, they are *already* static assets.
// You do NOT need `require.context` to get their `src`.
// You just need to know their names and construct the paths.

// Option 1: Manually list file names (least dynamic, but clearest)
// const sapImageNames = ['sap_plot0300.png', 'sap_plot0320.png', ...]; // list all of them
// const sapImages: ImageItem[] = sapImageNames.map((name, idx) => ({
//   src: `/financial/${name}`,
//   index: idx + 1, // or parse index from name
// }));

// Option 2: Fetch list of filenames dynamically (more complex for build time)
// This is typically done with a server-side API endpoint that reads the public directory,
// or by generating a manifest at build time.

// Option 3: If you absolutely must use `require.context` to *list* the files,
// you would need to move your `financial` folder from `public/` to `components/widgets/financial`
// (or `src/financial` or similar) so webpack can resolve it as a module.
// But then the paths in `src` would change.

// Given your current setup (images in `public/financial`), you need a different approach.
//
// Here's a common pattern:
// 1. You can't use `require.context` to list files *directly from `public`* at compile time
//    because `public` assets are not part of the webpack module graph in that sense.
// 2. The `Module not found` error confirms this: webpack is looking for `./financial`
//    as a module *relative to the current component*.

// The simplest workaround for your specific problem (Module not found) is to simulate `require.context`
// by generating the list of image paths. This is not ideal if you add images very often
// and don't want to update a list, but it works directly with `public/` assets.

// Let's create dummy arrays for demonstration, assuming you have 20 SAP plots and 20 BTC plots.
// You would need to ensure these arrays correctly reflect your actual filenames.
// The best way to get this list dynamically at build time for public assets
// would be to have a small script that runs before `next build` to generate a TS file
// containing these lists.

// For now, let's just make the `require.context` path absolute from the project root IF
// you were placing images in a source folder that webpack *does* process, e.g. `src/assets`.
// But since they are in `public`, this is not how it works.

// --- The core problem is that `require.context` is for Webpack's module system.
// --- Files in `public/` are served statically. You can't `require` them from source.
// --- You need to construct the URL directly.

// To resolve the "Module not found" error, you need to realize that `require.context`
// is *not* for listing files in your `public` directory.
// Files in `public` are accessible via their path relative to the public root.
// So, `/financial/sap_plot0020.png` is the direct URL.

// The `require.context` calls are the source of your error because they are looking
// for source modules.

// You need to get the list of image filenames. The most robust way to do this
// dynamically (without manually listing them) at build time for `public` assets
// often involves a custom Webpack plugin or a Node.js script that runs pre-build.

// However, if your image filenames follow a predictable pattern like `sap_plotXXXX.png`
// and `btc_plotXXXX.png` with consistent indexing, you can generate the paths.
// Let's assume you know the range of your indexes.

// Example: If your SAP plots go from 0300 to 6720 with a step of 20,
// and BTC plots from 0020 to 2300 with a step of 20.
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

const sapImages: ImageItem[] = generateImagePaths("sap", 300, 6720, 20); // Adjust range/step based on your `ls` output
const btcImages: ImageItem[] = generateImagePaths("btc", 20, 2300, 20); // Adjust range/step based on your `ls` output

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
