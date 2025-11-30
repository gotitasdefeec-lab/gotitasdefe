'use client';

import React from 'react';
import { formatCurrency } from '@/utils/formatCurrency';

export interface ShippingMethodOption {
  id: string;
  name: string;
  description?: string;
  cost: number;
  eta?: string;
}

interface ShippingMethodSelectorProps {
  methods: ShippingMethodOption[];
  value?: string;
  onChange: (methodId: string) => void;
  currency?: string;
}

const formatPrice = (price: number, currency?: string | null) => {
  const safeCurrency = currency || 'USD';
  return formatCurrency(price, safeCurrency, 'es-US');
};

export default function ShippingMethodSelector({ methods, value, onChange, currency }: ShippingMethodSelectorProps) {
  if (!methods || methods.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm">
        No hay métodos de envío disponibles. Continúa y calcularemos el envío más adelante.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map((m) => (
        <label key={m.id} className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${value === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="shippingMethod"
              value={m.id}
              checked={value === m.id}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">{m.name}</div>
              {m.description && (
                <div className="text-sm text-gray-500">{m.description}</div>
              )}
              {m.eta && (
                <div className="text-xs text-gray-400">Entrega estimada: {m.eta}</div>
              )}
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {m.cost === 0 ? <span className="text-green-600">Gratis</span> : formatPrice(m.cost, currency)}
          </div>
        </label>
      ))}
    </div>
  );
}
