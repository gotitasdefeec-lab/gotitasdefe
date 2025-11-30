import React from 'react';
import "./globals.css";
import Layout from '@/components/layout/Layout';
import ClientProviders from '@/components/layout/ClientProviders';
import { Inter } from 'next/font/google';

const BASE = process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'http://localhost:4001';
const inter = Inter({ subsets: ['latin'], display: 'swap', weight: ['300','400','500','600','700'] });

async function getStoreConfig() {
  try {
    const res = await fetch(`${BASE}/public/store/config`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Failed to load store config: ${res.status}`);
    return await res.json();
  } catch (_) {
    return null;
  }
}

async function getLogoUrl() {
  try {
    const res = await fetch(`${BASE}/public/store/logo`, { next: { revalidate: 60 } });
    if (!res.ok) return '';
    const data = await res.json();
    return data?.url || '';
  } catch (_) {
    return '';
  }
}

async function getPolicies() {
  try {
    const res = await fetch(`${BASE}/public/policies`, { next: { revalidate: 300 } });
    if (!res.ok) return [] as any[];
    return await res.json();
  } catch (_) {
    return [] as any[];
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [storeConfig, logoUrl, policies] = await Promise.all([
    getStoreConfig(),
    getLogoUrl(),
    getPolicies(),
  ]);

  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <ClientProviders>
          <Layout initialStoreConfig={storeConfig} initialLogoUrl={logoUrl} initialPolicies={policies}>
            {children}
          </Layout>
        </ClientProviders>
      </body>
    </html>
  );
}
