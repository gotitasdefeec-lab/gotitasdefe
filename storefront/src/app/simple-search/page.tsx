'use client';

import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';

export default function SimpleSearchPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('SimpleSearch: Cargando productos...');
        const data = await productService.getProducts();
        console.log('SimpleSearch: Productos cargados:', data);
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('SimpleSearch: Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Búsqueda Simple</h1>
          <div className="bg-white p-8 rounded-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Búsqueda Simple</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-2xl font-bold text-blue-600">{products.length}</div>
              <div className="text-sm text-gray-600">Total Productos</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-2xl font-bold text-green-600">{filteredProducts.length}</div>
              <div className="text-sm text-gray-600">Filtrados</div>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <div className="text-2xl font-bold text-purple-600">{searchTerm.length}</div>
              <div className="text-sm text-gray-600">Caracteres</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Productos {searchTerm ? `(búsqueda: "${searchTerm}")` : ''}
          </h2>
          
          {filteredProducts.length === 0 ? (
            <div className="bg-white p-8 rounded-lg text-center">
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProducts.map((product, index) => (
                <div key={product.id || index} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {product.name || 'Sin nombre'}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {product.description || 'Sin descripción'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        SKU: {product.sku || 'N/A'} | Stock: {product.stock || 0}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xl font-bold text-blue-600">
                        ${product.price || 0}
                      </div>
                      {product.featured && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-2">
                          Destacado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}