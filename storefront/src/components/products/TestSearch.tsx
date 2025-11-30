'use client';

import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';

const TestSearch = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        console.log('TestSearch: Loading products...');
        const data = await productService.getProducts();
        console.log('TestSearch: Products loaded:', data);
        setProducts(data);
        setFilteredProducts(data);
        setError(null);
      } catch (err: any) {
        console.error('TestSearch: Error loading products:', err);
        setError('Error al cargar productos: ' + (err.message || 'Error desconocido'));
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      console.log('TestSearch: Filtered products:', filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Test de Búsqueda</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando productos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Test de Búsqueda</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test de Búsqueda</h2>
      
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Total de Productos</h3>
          <p className="text-2xl font-bold text-blue-600">{products.length}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Productos Filtrados</h3>
          <p className="text-2xl font-bold text-green-600">{filteredProducts.length}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Término de Búsqueda</h3>
          <p className="text-sm text-gray-600">{searchTerm || 'Sin búsqueda'}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Productos Encontrados:</h3>
        {filteredProducts.length === 0 ? (
          <p className="text-gray-500">No se encontraron productos</p>
        ) : (
          <div className="space-y-2">
            {filteredProducts.slice(0, 5).map((product, index) => (
              <div key={product.id || index} className="bg-white p-3 rounded border">
                <h4 className="font-medium">{product.name || 'Sin nombre'}</h4>
                <p className="text-sm text-gray-600">{product.description || 'Sin descripción'}</p>
                <p className="text-sm text-blue-600">${product.price || 0}</p>
              </div>
            ))}
            {filteredProducts.length > 5 && (
              <p className="text-sm text-gray-500">
                ... y {filteredProducts.length - 5} productos más
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSearch;