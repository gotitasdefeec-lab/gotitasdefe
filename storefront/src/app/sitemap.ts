import { MetadataRoute } from 'next';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';

// Función para limpiar el nombre (ej: "Camiseta Premium" -> "camiseta-premium")
const slugify = (text: string) => {
    return text
        .toString()
        .normalize('NFD')               // Separa tildes
        .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Espacios a guiones
        .replace(/[^\w\-]+/g, '')       // Borra caracteres raros
        .replace(/\-\-+/g, '-');        // Borra guiones dobles
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://gotasdefe.com';

    // Rutas estáticas
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

    // Fetch dynamic data with timeout protection
    let products: any[] = [];
    let categories: any[] = [];

    try {
        // Set a timeout for the API call
        const productsPromise = Promise.race([
            productService.getProducts(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Products fetch timeout')), 5000)
            )
        ]);
        products = await productsPromise as any[];
    } catch (e: any) {
        console.warn('Sitemap: Could not fetch products, continuing with static routes only', e?.message || e);
    }

    try {
        // Set a timeout for the API call
        const categoriesPromise = Promise.race([
            categoryService.getCategories(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Categories fetch timeout')), 5000)
            )
        ]);
        categories = await categoriesPromise as any[];
    } catch (e: any) {
        console.warn('Sitemap: Could not fetch categories, continuing with static routes only', e?.message || e);
    }

    // --- CAMBIO APLICADO AQUÍ ---
    // Genera URLs tipo: .../products/6-camiseta-premium
    const productRoutes = Array.isArray(products) ? products.map((product) => ({
        url: `${baseUrl}/products/${product.id}-${slugify(product.name)}`,
        lastModified: new Date(product.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    })) : [];

    const categoryRoutes = Array.isArray(categories) ? categories.map((category) => ({
        url: `${baseUrl}/products?category=${encodeURIComponent(category.name)}`,
        lastModified: new Date(category.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    })) : [];

    return [...routes, ...productRoutes, ...categoryRoutes];
}
