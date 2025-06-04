// lib/assetUtils.ts
// Reusable utilities for handling assets in widgets

export type AssetItem = {
  src: string;
  index: number;
  [key: string]: any; // Allow additional metadata
};

/**
 * Generate asset paths for a series of numbered files
 * @param basePath - Base path in public folder (e.g., "financial", "charts")
 * @param prefix - File prefix (e.g., "sap", "btc")
 * @param start - Starting number
 * @param end - Ending number
 * @param step - Step between numbers
 * @param extension - File extension (default: "png")
 * @param paddedLength - Zero-padding length (default: 4)
 */
export function generateAssetPaths(
  basePath: string,
  prefix: string,
  start: number,
  end: number,
  step: number,
  extension: string = "png",
  paddedLength: number = 4,
): AssetItem[] {
  const assets: AssetItem[] = [];

  for (let i = start; i <= end; i += step) {
    const paddedIndex = String(i).padStart(paddedLength, "0");
    assets.push({
      src: `/${basePath}/${prefix}_plot${paddedIndex}.${extension}`,
      index: i,
    });
  }

  return assets;
}

/**
 * Generate asset paths from a list of filenames
 * @param basePath - Base path in public folder
 * @param filenames - Array of filenames
 */
export function generateAssetPathsFromList(basePath: string, filenames: string[]): AssetItem[] {
  return filenames.map((filename, idx) => ({
    src: `/${basePath}/${filename}`,
    index: idx,
    filename,
  }));
}

/**
 * Common image dimensions for different chart types
 */
export const CHART_DIMENSIONS = {
  standard: { width: 800, height: 600 },
  wide: { width: 1200, height: 600 },
  square: { width: 600, height: 600 },
  tall: { width: 600, height: 800 },
} as const;

/**
 * Common styling classes for widgets
 */
export const WIDGET_STYLES = {
  container: "p-4 bg-gray-50 rounded-lg space-y-4",
  buttonActive: "bg-blue-600 text-white hover:bg-blue-700",
  buttonInactive: "bg-gray-200 text-gray-700 hover:bg-gray-300",
  button: "px-4 py-2 rounded-md font-medium transition-colors",
  image: "max-w-full h-auto border rounded-md shadow-lg",
  slider: "w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500",
} as const;
