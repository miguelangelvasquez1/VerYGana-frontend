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
  /**
   * El build de Unity vive en R2, pero servirlo desde su dominio público rompe
   * en desarrollo: la página del juego quedaría en https://...r2.dev pegándole
   * a http://localhost:8080, y eso es (a) mixed content, que Safari bloquea sin
   * excepción posible, y (b) un salto al espacio `loopback`, que Chrome corta
   * con su permiso de Local Network Access.
   *
   * Proxyando el build por Next, la página queda en localhost:3000 y sus
   * llamadas a localhost:8080 son loopback → loopback: ni mixed content ni
   * permiso de red local. Y nadie necesita el build en su máquina.
   */
  async rewrites() {
    return [
      {
        source: '/pet-game/:path*',
        destination: 'https://pub-4c0bac3292364531a816300210b54c05.r2.dev/:path*',
      },
    ];
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