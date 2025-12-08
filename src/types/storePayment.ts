export interface PaymentMethod {
  key: string;   // e.g., 'efectivo', 'transferencia', 'tarjeta', 'paypal', 'stripe', 'contraentrega'
  label: string; // etiqueta para UI
  enabled: boolean;
  // Opcionales: permiten personalizar instrucciones y datos bancarios por método
  instructions?: string; // instrucciones específicas para el cliente
  bankInfo?: string;     // datos bancarios (para transferencia/depósito)
}

export interface StorePayment {
  info: string;              // texto informativo general mostrado al cliente
  methods: PaymentMethod[];  // métodos disponibles
  // PayPal Configuration
  paypalClientId?: string;   // PayPal Client ID
  paypalClientSecret?: string; // PayPal Client Secret (solo backend)
  paypalMode?: 'sandbox' | 'live'; // Modo de PayPal
}
