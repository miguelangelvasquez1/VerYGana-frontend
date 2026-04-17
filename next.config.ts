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
        hostname: 'pub-0fec976d129742a0bb0410d3aa1abc86.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'games.verygana.com',
      },
      {
        protocol: 'https',
        hostname: 'verygana-bucket.e1cb6cf5ad3bfde79bd415645b6a29e0.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'freepnglogo.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/pet',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'fullscreen=*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;