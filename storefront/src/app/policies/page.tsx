"use client";
import React, { useEffect, useState } from 'react';
import { getPolicies, StorePolicy } from '@/services/policyService';

const PoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<StorePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPolicies().then(setPolicies).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f8f9fb' }}>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold mb-12 text-center text-gray-900 tracking-tight" style={{letterSpacing: '.01em'}}>Políticas de la Tienda</h1>
        {loading ? (
          <p className="text-center text-gray-400">Cargando...</p>
        ) : policies.length === 0 ? (
          <p className="text-center text-gray-400">No hay políticas registradas.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {policies.map((policy) => (
              <div
                key={policy.id}
                id={`policy-${policy.id}`}
                className="bg-white rounded-lg p-7 border border-gray-100 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
                style={{ boxShadow: '0 2px 12px 0 rgba(30,34,40,0.04)' }}
              >
                <h2 className="text-lg font-semibold mb-2 text-gray-800" style={{letterSpacing: '.01em'}}>{policy.title}</h2>
                <div
                  className="prose prose-sm text-gray-600"
                  style={{fontFamily: 'inherit'}}
                  dangerouslySetInnerHTML={{ __html: policy.content || '' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliciesPage;
