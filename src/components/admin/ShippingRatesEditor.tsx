import React, { useState } from 'react';

interface ShippingRate {
  id: string;
  zone: string;
  rate: number;
  eta: string;
}

interface Props {
  initialRates: ShippingRate[];
  onSave: (rates: ShippingRate[]) => void;
}

const defaultEta = '3-5 días';

export default function ShippingRatesEditor({ initialRates, onSave }: Props) {
  const [rates, setRates] = useState<ShippingRate[]>(initialRates);
  const [newRate, setNewRate] = useState<ShippingRate>({
    id: '',
    zone: '',
    rate: 0,
    eta: defaultEta,
  });

  const handleChange = (id: string, field: keyof ShippingRate, value: string | number) => {
    setRates(rates =>
      rates.map(rate =>
        rate.id === id ? { ...rate, [field]: value } : rate
      )
    );
  };

  const handleAdd = () => {
    if (!newRate.zone || newRate.rate <= 0) return;
    setRates([...rates, { ...newRate, id: Date.now().toString() }]);
    setNewRate({ id: '', zone: '', rate: 0, eta: defaultEta });
  };

  const handleDelete = (id: string) => {
    setRates(rates => rates.filter(rate => rate.id !== id));
  };

  const handleSave = () => {
    onSave(rates);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Tarifas de envío</h2>
      <table className="w-full mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Zona</th>
            <th className="p-2 text-left">Precio</th>
            <th className="p-2 text-left">Entrega estimada</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {rates.map(rate => (
            <tr key={rate.id}>
              <td className="p-2">
                <input
                  type="text"
                  value={rate.zone}
                  onChange={e => handleChange(rate.id, 'zone', e.target.value)}
                  className="border px-2 py-1 rounded w-full"
                  required
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={rate.rate}
                  onChange={e => handleChange(rate.id, 'rate', Number(e.target.value))}
                  className="border px-2 py-1 rounded w-full"
                  required
                />
              </td>
              <td className="p-2">
                <input
                  type="text"
                  value={rate.eta}
                  onChange={e => handleChange(rate.id, 'eta', e.target.value)}
                  className="border px-2 py-1 rounded w-full"
                />
              </td>
              <td className="p-2">
                <button
                  type="button"
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(rate.id)}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td className="p-2">
              <input
                type="text"
                value={newRate.zone}
                onChange={e => setNewRate(r => ({ ...r, zone: e.target.value }))}
                className="border px-2 py-1 rounded w-full"
                placeholder="Nueva zona"
              />
            </td>
            <td className="p-2">
              <input
                type="number"
                min={0}
                step={0.01}
                value={newRate.rate}
                onChange={e => setNewRate(r => ({ ...r, rate: Number(e.target.value) }))}
                className="border px-2 py-1 rounded w-full"
                placeholder="Precio"
              />
            </td>
            <td className="p-2">
              <input
                type="text"
                value={newRate.eta}
                onChange={e => setNewRate(r => ({ ...r, eta: e.target.value }))}
                className="border px-2 py-1 rounded w-full"
                placeholder="Entrega estimada"
              />
            </td>
            <td className="p-2">
              <button
                type="button"
                className="text-green-600 hover:text-green-800"
                onClick={handleAdd}
                title="Agregar"
              >
                +
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <button
        type="button"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleSave}
      >
        Guardar tarifas
      </button>
    </div>
  );
}
