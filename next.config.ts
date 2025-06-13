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
    // Turbotrace reduces build time by creating smaller function traces
    // This can speed up builds by 20-30% for larger projects
    turbotrace: {
      logLevel: "error",
      logDetail: false,
      memoryLimit: 6144, // MB
    },
    
    // Use SWC's minifier instead of Terser for faster builds
    swcMinify: true,
  },
};

export default nextConfig;
