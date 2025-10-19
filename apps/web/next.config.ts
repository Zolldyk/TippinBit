import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [
      '@rainbow-me/rainbowkit',
      'viem',
      'wagmi',
      'framer-motion',
    ],
  },
};

export default nextConfig;
