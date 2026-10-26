import type { NextConfig } from "next";
// Import relativo y módulo sin dependencias: Next transpila este archivo solo para cargar la configuración.
import { petGameRewrites, resolvePetGameOrigin } from "./src/lib/pet/gameOrigin";

const nextConfig: NextConfig = {
  // Salida autocontenida para la imagen Docker (server.js + solo las dependencias que se usan).
  output: 'standalone',
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
      // Buckets propios de beta (SCRUM-105).
      {
        protocol: 'https',
        hostname: 'cdn-beta.verygana.com',
      },
      {
        protocol: 'https',
        hostname: 'mascotas-beta.verygana.com',
      },
      {
        protocol: 'https',
        hostname: 'verygana-beta-bucket.e1cb6cf5ad3bfde79bd415645b6a29e0.r2.cloudflarestorage.com',
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
    // SCRUM-105: el origen del build de mascotas sale de NEXT_PUBLIC_PET_GAME_ORIGIN, que se lee al
    // construir (con `output: 'standalone'` las reescrituras quedan fijas en el build). Sin la
    // variable se usa el bucket de dev; en beta, https://mascotas-beta.verygana.com.
    // Un valor inválido hace fallar el build con un mensaje claro.
    //
    // /pet-game sirve el build de Unity. /pet-assets sirve los assets de las escenas, por el mismo
    // motivo pero por otra vía: el juego los pide con fetch y r2.dev contesta 200 sin
    // `Access-Control-Allow-Origin`, así que el navegador los descarta y la escena sale vacía.
    // Servidos desde acá son mismo-origen que la página del juego y no hay CORS que valga.
    //
    // Para que el backend emita estas URLs hay que ponerle PETS_ASSET_BASE_URL:
    // en local http://localhost:3000/pet-assets; en beta https://beta.verygana.com/pet-assets
    return petGameRewrites(resolvePetGameOrigin(process.env.NEXT_PUBLIC_PET_GAME_ORIGIN));
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