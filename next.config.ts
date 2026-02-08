import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.verygana.com',
      },
      {
        protocol: 'https',
        hostname: 'verygana-bucket.e1cb6cf5ad3bfde79bd415645b6a29e0.r2.cloudflarestorage.com',
      },
    ],
  }
};

export default nextConfig;
