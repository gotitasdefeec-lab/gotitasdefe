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

  eslint: {
    // Allow production builds to complete even if there are ESLint errors
    ignoreDuringBuilds: true,
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
