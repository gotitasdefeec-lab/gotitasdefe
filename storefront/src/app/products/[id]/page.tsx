import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Product } from '@/types';
import { productService } from '@/services/productService';
import ProductDetailClient from '@/components/products/ProductDetailClient';

export const revalidate = 3600; // ISR: refresh product detail every 1 hour (reduce API calls)
export const dynamicParams = true; // Permitir params dinámicos

type PageProps = {
  params: Promise<{ id: string }>;
};

// Pre-generate static pages for top products at build time
// export async function generateStaticParams() {
//   try {
//     const products = await productService.getProducts();
//     // Generate pages for first 20 products (most common)
//     return products.slice(0, 20).map((product) => ({
//       id: String(product.id),
//     }));
//   } catch (error) {
//     console.error('Error generating static params:', error);
//     return [];
//   }
// }

export default async function ProductDetailPage({ params }: PageProps) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) return notFound();

  // Solo fetch del producto individual - productos relacionados se cargan en el cliente
  const product = await productService.getProduct(id);

  if (!product) return notFound();

  return <ProductDetailClient product={product} relatedProducts={[]} />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) return {};
  const product = await productService.getProduct(id);
  if (!product) return {};
  return {
    title: `${product.name} | Tienda`,
    description: product.description?.replace(/<[^>]+>/g, '').slice(0, 160) || undefined,
    openGraph: {
      title: product.name,
      description: product.description?.replace(/<[^>]+>/g, '') || undefined,
      images: (Array.isArray(product.images) && product.images.length > 0 ? product.images : product.image ? [product.image] : []),
    },
    alternates: {
      canonical: `/products/${id}`,
    },
  };
}
