import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Ensure GitHub Pages compatibility
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: {
    unoptimized: true,
  },
  eslint: {
    // Include MDX and MD files in linting
    dirs: ["public", "components", "app", "lib"],
  },
};

export default nextConfig;
