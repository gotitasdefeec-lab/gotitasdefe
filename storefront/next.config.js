/** @type {import('next').NextConfig} */

const path = require('path');

const nextConfig = {
  // Permitir servir assets a través del dominio de ngrok en dev
  allowedDevOrigins: [
    'https://ejemplo-tienda.ngrok.dev',
    'http://ejemplo-tienda.ngrok.dev',
  ],

  // Evita advertencia de raíz inferida en monorepo
  outputFileTracingRoot: path.join(__dirname, '..'),

  // Configuración de Next.js Image Optimization para dominios remotos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.gotasdefe.com',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/public/policies',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001'}/public/policies`,
      },
    ];
  },
};

module.exports = nextConfig;
