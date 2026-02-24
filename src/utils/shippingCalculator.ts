import { StoreShipping } from '../types/storeShipping';

export interface ShippingCalculationResult {
  price: number;
  carrierId?: number;
  rateId?: number;
  freeShipping: boolean;
  scope: 'ciudad' | 'provincia' | 'pais' | 'estandar';
}

/**
 * Calcula la tarifa de envío más específica disponible para el destino.
 * Prioridad: ciudad > provincia > país > estándar. Si supera el mínimo, aplica envío gratis.
 * @param shipping StoreShipping config
 * @param destino { ciudad, provincia, pais }
 * @param subtotal Monto de la compra
 */
export function calcularEnvio(
  shipping: StoreShipping,
  destino: { ciudad?: string; provincia?: string; pais?: string },
  subtotal: number
): ShippingCalculationResult {
  // Si supera el mínimo, envío gratis
  if (subtotal >= shipping.freeShippingMin) {
    return {
      price: 0,
      freeShipping: true,
      scope: 'estandar',
    };
  }
  // Buscar tarifa más específica
  const { ciudad, provincia, pais } = destino;
  const match: { scope: 'ciudad' | 'provincia' | 'pais'; region: string }[] = [];
  if (ciudad) match.push({ scope: 'ciudad', region: ciudad });
  if (provincia) match.push({ scope: 'provincia', region: provincia });
  if (pais) match.push({ scope: 'pais', region: pais });
  for (const m of match) {
    const rate = shipping.rates.find(
      r => r.scope === m.scope && r.region.trim().toLowerCase() === m.region.trim().toLowerCase()
    );
    if (rate) {
      return {
        price: rate.price,
        carrierId: rate.carrierId,
        rateId: rate.id,
        freeShipping: false,
        scope: rate.scope,
      };
    }
  }
  // Si no hay tarifa específica, usar estándar
  return {
    price: shipping.standardCost,
    freeShipping: false,
    scope: 'estandar',
  };
}
