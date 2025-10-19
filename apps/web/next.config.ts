import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
