import React from 'react';
import type { Metadata } from 'next';
import "./globals.css";
import Layout from '@/components/layout/Layout';
import ClientProviders from '@/components/layout/ClientProviders';
import { Inter } from 'next/font/google';

const BASE = process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'https://api.gotasdefe.com/api';
const inter = Inter({ subsets: ['latin'], display: 'swap', weight: ['300', '400', '500', '600', '700'] });

async function getStoreConfig() {
  try {
    const res = await fetch(`${BASE}/public/store/config`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Failed to load store config: ${res.status}`);
    return await res.json();
  } catch (_) {
    return null;
  }
}

async function getLogoUrl() {
  try {
    const res = await fetch(`${BASE}/public/store/logo`, { next: { revalidate: 3600 } });
    if (!res.ok) return '';
    const data = await res.json();
    return data?.url || '';
  } catch (_) {
    return '';
  }
}

async function getPolicies() {
  try {
    const res = await fetch(`${BASE}/public/policies`, { next: { revalidate: 86400 } });
    if (!res.ok) return [] as any[];
    return await res.json();
  } catch (_) {
    return [] as any[];
  }
}


export async function generateMetadata(): Promise<Metadata> {
  const storeConfig = await getStoreConfig();
  const general = storeConfig?.general || {};
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://gotasdefe.com';

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: general.name || 'Gotitas de Fe',
      template: `%s | ${general.name || 'Gotitas de Fe'}`
    },
    description: general.description || 'Tienda en línea de productos religiosos y espirituales.',
    keywords: ['tienda', 'ecommerce', 'religioso', 'espiritual', 'gotitas de fe'],
    authors: [{ name: general.name }],
    openGraph: {
      type: 'website',
      locale: 'es_EC',
      url: baseUrl,
      title: general.name || 'Gotitas de Fe',
      description: general.description || 'Tienda en línea de productos religiosos y espirituales.',
      siteName: general.name || 'Gotitas de Fe',
    },
    verification: {
      google: 'zrFsydo1FWgVscWTNkKScyCSGoltsELP1zrdxS5wNBI',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
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
