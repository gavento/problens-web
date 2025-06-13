import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages subdirectory deployment
  basePath: "/problens-web",
  assetPrefix: "/problens-web",
  images: {
    unoptimized: true, // Required for static export
  },
  eslint: {
    dirs: ["public", "components", "app", "lib"],
  },
  // Ensure trailing slashes for better GitHub Pages compatibility
  trailingSlash: true,
  
  // Enable experimental features for faster builds
  experimental: {
    // Use SWC's minifier instead of Terser for faster builds
    swcMinify: true,
  },
};

export default nextConfig;
