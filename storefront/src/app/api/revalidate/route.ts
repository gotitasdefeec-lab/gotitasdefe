import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para Revalidación Bajo Demanda (On-Demand Revalidation)
 * 
 * Uso:
 * POST /api/revalidate
 * Body: {
 *   secret: "tu-secret-token",
 *   path: "/products",
 *   paths: ["/", "/products"] // opcional, para revalidar múltiples paths
 * }
 * 
 * Ejemplos de paths:
 * - "/" (home)
 * - "/products" (lista de productos)
 * - "/products/[id]" (producto específico)
 * - "/policies" (políticas)
 */

// Helper para agregar headers CORS
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // Permite cualquier origen (o especifica: https://gotitasdefe.vercel.app)
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Manejar preflight request (OPTIONS)
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: getCorsHeaders()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, path, paths, productId, action } = body;

    // Validar secret token (configurar en variables de entorno)
    const REVALIDATE_SECRET = process.env.REVALIDATION_TOKEN || 'dev-secret-token';
    
    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json(
        { message: 'Invalid secret token' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    const revalidatedPaths: string[] = [];

    // Revalidar por acción predefinida (tag-like behavior)
    if (action) {
      const actionPaths: Record<string, string[]> = {
        'products': ['/products', '/'],
        'featured-products': ['/'],
        'carousel': ['/'],
        'all-products': ['/products'],
        'home': ['/'],
        'store-config': ['/'],
        'store-logo': ['/'],
        'store-general': ['/contact', '/about'],
        'policies': ['/'],
        'categories': ['/products']
      };
      
      const pathsToRevalidate = actionPaths[action] || [];
      pathsToRevalidate.forEach(p => {
        revalidatePath(p);
        revalidatedPaths.push(p);
      });
      
      console.log(`✅ Revalidated action "${action}": ${pathsToRevalidate.join(', ')}`);
    }

    // Revalidar por path específico
    if (path) {
      revalidatePath(path);
      revalidatedPaths.push(path);
      console.log(`✅ Revalidated path: ${path}`);
    }

    // Revalidar múltiples paths
    if (paths && Array.isArray(paths)) {
      paths.forEach(p => {
        revalidatePath(p);
        revalidatedPaths.push(p);
      });
      console.log(`✅ Revalidated paths: ${paths.join(', ')}`);
    }

    // Revalidar producto específico
    if (productId) {
      const productPath = `/products/${productId}`;
      revalidatePath(productPath);
      revalidatedPaths.push(productPath);
      console.log(`✅ Revalidated product: ${productId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Revalidation successful',
      revalidated: {
        paths: revalidatedPaths,
        action: action || null,
        productId: productId || null,
        timestamp: new Date().toISOString()
      }
    }, { headers: getCorsHeaders() });

  } catch (error) {
    console.error('❌ Revalidation error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error during revalidation',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

// Endpoint GET para verificar que la API está activa
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'On-Demand Revalidation API',
    usage: {
      method: 'POST',
      body: {
        secret: 'your-secret-token',
        path: '/products (optional - single path)',
        paths: '["/", "/products"] (optional - multiple paths)',
        action: 'products | featured-products | carousel | store-config | store-logo | policies | categories | home (optional - predefined actions)',
        productId: '123 (optional - specific product)'
      }
    },
    actions: {
      'products': 'Revalidates /products and /',
      'featured-products': 'Revalidates /',
      'carousel': 'Revalidates /',
      'store-config': 'Revalidates /',
      'store-logo': 'Revalidates /',
      'store-general': 'Revalidates /contact and /about',
      'policies': 'Revalidates /',
      'categories': 'Revalidates /products',
      'home': 'Revalidates /',
      'all-products': 'Revalidates /products'
    }
  }, { headers: getCorsHeaders() });
}
