import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Enable production optimizations
  swcMinify: true,

  // Optimize images
  images: {
    unoptimized: true, // Disable optimization to avoid sharp requirement
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enable experimental features for better tree-shaking
  experimental: {
    optimizePackageImports: ['react-icons', '@tanstack/react-query'],
  },

  // Compiler options for better optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default withBundleAnalyzer(nextConfig);
