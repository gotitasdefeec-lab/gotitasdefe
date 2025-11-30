import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Permitir que el dev server sirva assets a través del dominio de ngrok
  allowedDevOrigins: [
    "https://ejemplo-tienda.ngrok.dev",
    "http://ejemplo-tienda.ngrok.dev",
  ],

  // Evita la advertencia de "inferred workspace root" en monorepo
  outputFileTracingRoot: path.join(__dirname, ".."),
  
  // Configuración de WebSocket para HMR con ngrok
  webpackDevMiddleware: (config: any) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },

  // Deshabilitar overlay de errores para WebSocket (solo en desarrollo con ngrok)
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // Mantener builds aunque haya errores de ESLint (opcional en dev)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuración de imágenes optimizada
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['images.unsplash.com', 'localhost'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: '**.ngrok-free.app' },
      { protocol: 'https', hostname: '**.ngrok-free.dev' },
      { protocol: 'http', hostname: '**.ngrok-free.app' },
      { protocol: 'http', hostname: '**.ngrok-free.dev' },
    ],
  },

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'react-icons'],
  },

  // Rewrites locales hacia el backend (usa variable de entorno en producción)
  async rewrites() {
    return [
      {
        source: "/public/policies",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001'}/public/policies`,
      },
    ];
  },

  // Caching agresivo para assets estáticos y optimizados
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/image/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/:all*(js|css|png|jpg|jpeg|gif|svg|webp|avif|ico|ttf|otf|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
