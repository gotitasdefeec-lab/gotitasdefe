import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://gotasdefe.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/account/', '/checkout/', '/admin/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
