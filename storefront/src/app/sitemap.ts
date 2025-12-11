import { MetadataRoute } from 'next';
import { productService, categoryService } from '@/services/productService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://gotasdefe.com';

    // Static routes
    const routes = [
        '',
        '/about',
        '/products',
        '/contact',
        '/login',
        '/register',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    // Fetch dynamic data
    let products: any[] = [];
    let categories: any[] = [];

    try {
        products = await productService.getProducts();
    } catch (e) {
        console.error('Error fetching products for sitemap', e);
    }

    try {
        categories = await categoryService.getCategories();
    } catch (e) {
        console.error('Error fetching categories for sitemap', e);
    }

    const productRoutes = products.map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(product.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const categoryRoutes = categories.map((category) => ({
        url: `${baseUrl}/products?category=${encodeURIComponent(category.name)}`,
        lastModified: new Date(category.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...routes, ...productRoutes, ...categoryRoutes];
}
