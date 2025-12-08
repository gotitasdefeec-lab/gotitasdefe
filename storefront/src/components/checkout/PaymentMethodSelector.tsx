'use client';

import React from 'react';
import { CreditCardIcon, BanknotesIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';


export interface PaymentMethod {
  key: string;
  label: string;
  enabled: boolean;
  // Opcional: instrucciones que el admin configuró para este método
  instructions?: string;
}

export interface PaymentMethodSelectorProps {
  value: string;
  onChange: (method: string) => void;
  methods: PaymentMethod[];
}

export default function PaymentMethodSelector({ value, onChange, methods }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      {methods.filter(m => m.enabled).map((method) => (
        <div key={method.key} className="relative">
          <label
            className={`
              relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors
              hover:bg-gray-50
              ${value === method.key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.key}
              checked={value === method.key}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />
            <div className="flex items-center space-x-4 w-full">
              {/* Optionally add icons based on key */}
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-lg
                ${value === method.key ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                {/* Example: show icon for known keys */}
                {method.key === 'efectivo' && <span role="img" aria-label="Efectivo">💵</span>}
                {method.key === 'transferencia' && <span role="img" aria-label="Transferencia">🏦</span>}
                {method.key === 'tarjeta' && <span role="img" aria-label="Tarjeta">💳</span>}
                {method.key === 'paypal' && <span role="img" aria-label="PayPal" className="text-2xl">🅿️</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {method.label}
                  </h3>
                </div>
                {/* Optionally add description for known keys */}
                <p className="text-sm mt-1 text-gray-600">
                  {method.key === 'efectivo' && 'Paga cuando recibas tu pedido'}
                  {method.key === 'transferencia' && 'Transfiere directamente a nuestra cuenta'}
                  {method.key === 'tarjeta' && 'Visa, MasterCard, American Express'}
                  {method.key === 'paypal' && 'Paga de forma segura con PayPal o tarjeta'}
                </p>
              </div>
              <div className={`
                w-5 h-5 border-2 rounded-full flex items-center justify-center
                ${value === method.key
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white'
                }
              `}>
                {value === method.key && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </label>

          {/* Detalle del método seleccionado */}
          {value === method.key && method.instructions && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-900 whitespace-pre-line">
              {method.instructions}
            </div>
          )}

          {value === method.key && method.key === 'efectivo' && !method.instructions && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-900">
              Podrás pagar en efectivo cuando recibas tu pedido. Asegúrate de tener el monto exacto.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}