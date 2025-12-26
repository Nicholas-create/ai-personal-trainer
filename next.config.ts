import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output configuration for Firebase Hosting
  // Firebase's web frameworks integration handles this automatically

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },

  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  },
};

export default nextConfig;
