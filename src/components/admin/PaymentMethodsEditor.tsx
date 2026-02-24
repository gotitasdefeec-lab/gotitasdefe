import React, { useState } from 'react';

interface PaymentMethodConfig {
  key: string;
  label: string;
  enabled: boolean;
  instructions?: string;
  bankInfo?: string;
}

interface Props {
  methods: PaymentMethodConfig[];
  onChange: (methods: PaymentMethodConfig[]) => void;
}

const defaultBankInfo = `Banco Ejemplo\nCuenta Corriente: 123456789\nTitular: Nombre de la empresa\nRUC: 1234567890\nEmail: pagos@ejemplo.com`;

export default function PaymentMethodsEditor({ methods, onChange }: Props) {
  const [localMethods, setLocalMethods] = useState<PaymentMethodConfig[]>(methods);

  const handleMethodChange = (idx: number, field: keyof PaymentMethodConfig, value: string | boolean) => {
    const updated = [...localMethods];
    updated[idx] = { ...updated[idx], [field]: value };
    setLocalMethods(updated);
    onChange(updated);
  };

  const addMethod = () => {
    setLocalMethods([
      ...localMethods,
      { key: '', label: '', enabled: true }
    ]);
  };

  const removeMethod = (idx: number) => {
    const updated = localMethods.filter((_, i) => i !== idx);
    setLocalMethods(updated);
    onChange(updated);
  };

  return (
    <div>
      <h2>Métodos de pago</h2>
      {localMethods.map((method, idx) => (
        <div key={idx} style={{ border: '1px solid #eee', padding: 12, marginBottom: 12 }}>
          <label>
            Clave:
            <input value={method.key} onChange={e => handleMethodChange(idx, 'key', e.target.value)} />
          </label>
          <label>
            Nombre:
            <input value={method.label} onChange={e => handleMethodChange(idx, 'label', e.target.value)} />
          </label>
          <label>
            Habilitado:
            <input type="checkbox" checked={method.enabled} onChange={e => handleMethodChange(idx, 'enabled', e.target.checked)} />
          </label>
          {(method.key === 'transferencia' || method.key === 'deposito') && (
            <>
              <label>
                Instrucciones para el cliente:
                <textarea value={method.instructions || ''} onChange={e => handleMethodChange(idx, 'instructions', e.target.value)} placeholder="Ej: Realiza la transferencia y envía el comprobante por WhatsApp." />
              </label>
              <label>
                Información bancaria:
                <textarea value={method.bankInfo || defaultBankInfo} onChange={e => handleMethodChange(idx, 'bankInfo', e.target.value)} placeholder={defaultBankInfo} />
              </label>
            </>
          )}
          <button type="button" onClick={() => removeMethod(idx)}>Eliminar</button>
        </div>
      ))}
      <button type="button" onClick={addMethod}>Agregar método</button>
    </div>
  );
}
