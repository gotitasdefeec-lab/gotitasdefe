export type ShippingScope = 'pais' | 'provincia' | 'ciudad';

export interface ShippingCarrier {
  id: number;
  name: string;
  enabled: boolean;
}

export interface ShippingRate {
  id: number;
  scope: ShippingScope; // nivel de aplicación de la tarifa
  region: string;       // nombre de país/provincia/ciudad
  price: number;        // costo fijo para la región
  carrierId?: number;   // referencia al transportista
}

export interface StoreShipping {
  policy: string;
  standardCost: number;
  freeShippingMin: number;
  carriers: ShippingCarrier[];
  rates: ShippingRate[];
}
