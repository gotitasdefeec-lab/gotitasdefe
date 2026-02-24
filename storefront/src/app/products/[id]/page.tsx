import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/products/ProductDetailClient';

// Cache de 24 horas para ahorrar bandwidth. On-Demand Revalidation actualiza instantáneamente cuando editas el producto
export const revalidate = 86400; // 24 horas = máximo ahorro en Vercel

const BASE = (process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'https://api.gotasdefe.com').replace(/\/$/, '');

type PageProps = {
  params: Promise<{ id: string }>;
};

// Función para obtener un producto usando fetch con tags para revalidación
async function getProduct(id: number) {
  try {
    const url = `${BASE}/public/products/${id}`;
    const res = await fetch(url, { 
      next: { revalidate: 86400, tags: ['products', `product-${id}`] } // 24h cache + on-demand revalidation
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch product: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// 1. Función para extraer el ID numérico de forma segura
// Ejemplo: "1-camiseta-premium" -> devuelve 1
const getSafeId = (param: string): number | null => {
  const id = parseInt(param, 10);
  return isNaN(id) ? null : id;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id: idParam } = await params;
  
  const id = getSafeId(idParam);
  
  if (!id) {
    console.error(`ID inválido recibido en la URL: ${idParam}`);
    return notFound();
  }

  try {
    const product = await getProduct(id);
    
    if (!product) {
      console.warn(`Producto no encontrado para ID: ${id}`);
      return notFound();
    }

    return <ProductDetailClient product={product} relatedProducts={[]} />;
  } catch (error) {
    console.error('Error cargando producto:', error);
    return notFound();
  }
}

// 2. También corregimos los metadatos para que el título de la pestaña no falle
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idParam } = await params;
  const id = getSafeId(idParam);
  
  if (!id) return { title: 'Producto no encontrado' };

  try {
    const product = await getProduct(id);
    if (!product) return { title: 'Producto no encontrado' };

    return {
      title: product.name,
      description: product.description?.replace(/<[^>]+>/g, '').slice(0, 160),
      openGraph: {
        title: product.name,
        description: product.description?.replace(/<[^>]+>/g, '').slice(0, 160),
        images: (Array.isArray(product.images) && product.images.length > 0 
          ? product.images 
          : product.image ? [product.image] : []),
      },
    };
  } catch {
    return { title: 'Detalle del Producto' };
  }
}