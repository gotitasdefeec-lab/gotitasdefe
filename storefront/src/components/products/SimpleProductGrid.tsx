'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import { productService } from '@/services/productService';

interface SimpleProductGridProps {
  title?: string;
  subtitle?: string;
  searchQuery?: string;
  categoryName?: string | null;
  initialProducts?: Product[];
}

const SimpleProductGrid: React.FC<SimpleProductGridProps> = ({ 
  title = "Todos los Productos",
  subtitle = "Descubre nuestra amplia selección de productos",
  searchQuery,
  categoryName,
  initialProducts
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(!initialProducts);
  const [error, setError] = useState<string | null>(null);

  // Mantener sincronizado el estado cuando el servidor envía nuevos productos (cambio de categoría vía navegación)
  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
      setLoading(false);
      setError(null);
    }
  }, [initialProducts]);

  // Si no hay initialProducts (p. ej., render solo cliente), cargar desde API y reaccionar a cambios de categoría
  useEffect(() => {
    if (initialProducts) return; // El servidor ya proveyó los productos correctos
    const loadProducts = async () => {
      try {
        setLoading(true);
        console.log('SimpleProductGrid: Cargando productos...');
        let data;
        if (categoryName) {
          data = await productService.getProductsByCategory(categoryName);
        } else {
          data = await productService.getProducts();
        }
        console.log('SimpleProductGrid: Productos cargados:', data.length);
        setProducts(data);
        setError(null);
      } catch (err: any) {
        console.error('SimpleProductGrid: Error loading products:', err);
        setError('Error al cargar productos');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categoryName, initialProducts]);

  // Filtrar productos basado en searchQuery si se proporciona
  const filteredProducts = searchQuery 
    ? products.filter(product => 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-3">{title}</h1>
          <div className="w-24 h-px bg-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-light">{subtitle}</p>
        </div>
        
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-gray-900 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 text-sm font-light">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-12">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-3">{title}</h1>
          <div className="w-24 h-px bg-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-light">{subtitle}</p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center max-w-md mx-auto">
          <h3 className="text-gray-900 font-light mb-3 text-lg">Error al cargar productos</h3>
          <p className="text-gray-600 font-light mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-light"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Título y subtítulo */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-3">{title}</h1>
        <div className="w-24 h-px bg-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-light">{subtitle}</p>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-4 font-light">
            Resultados para: <span className="text-gray-900">"{searchQuery}"</span>
          </p>
        )}
      </div>

      {/* Resumen de productos */}
      <div className="border-t border-b border-gray-100 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-gray-900 font-light">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
            </p>
            {searchQuery && filteredProducts.length !== products.length && (
              <p className="text-sm text-gray-500 font-light mt-1">
                de {products.length} total{products.length !== 1 ? 'es' : ''}
              </p>
            )}
          </div>
          
          {searchQuery && (
            <a
              href="/products"
              className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors"
            >
              Ver todos los productos →
            </a>
          )}
        </div>
      </div>

      {/* Grid de productos */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="opacity-0 animate-fade-in"
              style={{ 
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <ProductCard 
                product={product}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <h3 className="text-xl font-light text-gray-900 mb-3">
            {searchQuery ? 'No se encontraron productos' : 'No hay productos disponibles'}
          </h3>
          
          <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
            {searchQuery 
              ? `No hay productos que coincidan con "${searchQuery}"`
              : "Actualmente no hay productos disponibles"
            }
          </p>

          {searchQuery && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 font-light space-y-2">
                <p>Sugerencias:</p>
                <ul className="text-gray-500 space-y-1">
                  <li>Revisa la ortografía</li>
                  <li>Intenta con términos más generales</li>
                  <li>Explora otras categorías</li>
                </ul>
              </div>
              <div className="mt-6">
                <a
                  href="/products"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-light text-gray-900"
                >
                  Ver todos los productos
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SimpleProductGrid;