import React, { useEffect, useState } from 'react';
import { Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, CircularProgress, Typography } from '@mui/material';
import { getStorePayment } from '../../services/storePaymentService';
import { StorePayment, PaymentMethod } from '../../types/storePayment';

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (methodKey: string) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ value, onChange }) => {
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [info, setInfo] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const payment: StorePayment = await getStorePayment();
        setMethods(payment.methods.filter(m => m.enabled));
        setInfo(payment.info);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <CircularProgress size={24} />;
  if (!methods.length) return <Typography color="error">No hay métodos de pago activos.</Typography>;

  return (
    <FormControl component="fieldset" sx={{ mt: 2 }}>
      <FormLabel component="legend">Método de pago</FormLabel>
      <RadioGroup value={value} onChange={e => onChange(e.target.value)}>
        {methods.map(m => (
          <FormControlLabel key={m.key} value={m.key} control={<Radio />} label={m.label} />
        ))}
      </RadioGroup>
      {info && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{info}</Typography>}
    </FormControl>
  );
};

export default PaymentMethodSelector;
