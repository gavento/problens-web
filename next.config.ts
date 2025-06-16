import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages subdirectory deployment - only in production
  basePath: isProd ? "/problens-web" : "",
  assetPrefix: isProd ? "/problens-web" : "",
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
    // Future experimental features can be enabled here
  },
};

export default nextConfig;
