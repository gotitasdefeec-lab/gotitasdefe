import { Injectable, Logger } from '@nestjs/common';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaypalService {
    private readonly logger = new Logger(PaypalService.name);
    private client: paypal.core.PayPalHttpClient;

    constructor() {
        this.initializeClient();
    }

    private initializeClient() {
        const clientId = process.env.PAYPAL_CLIENT_ID || '';
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
        const mode = process.env.PAYPAL_MODE || 'sandbox';

        if (!clientId || !clientSecret) {
            this.logger.warn('PayPal credentials not configured. PayPal payments will not work.');
            return;
        }

        let environment;
        if (mode === 'live') {
            environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
        } else {
            environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
        }

        this.client = new paypal.core.PayPalHttpClient(environment);
        this.logger.log(`PayPal client initialized in ${mode} mode`);
    }

    /**
     * Creates a PayPal order
     */
    async createOrder(amount: number, currency: string = 'USD') {
        if (!this.client) {
            throw new Error('PayPal client not initialized. Please configure PayPal credentials.');
        }

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: currency,
                        value: amount.toFixed(2),
                    },
                },
            ],
            payer: {
                address: {
                    country_code: 'EC', // Ecuador como país predeterminado
                },
            },
            application_context: {
                shipping_preference: 'NO_SHIPPING', // No pedir dirección de envío
                user_action: 'PAY_NOW', // Mostrar "Pagar ahora" en lugar de "Continuar"
                brand_name: 'Tu Tienda', // Nombre de tu tienda
                locale: 'es-EC', // Idioma español de Ecuador
            },
        });

        try {
            const response = await this.client.execute(request);
            this.logger.log(`PayPal order created: ${response.result.id}`);
            return {
                id: response.result.id,
                status: response.result.status,
                links: response.result.links,
            };
        } catch (error) {
            this.logger.error('Error creating PayPal order:', error);
            throw new Error('Failed to create PayPal order');
        }
    }

    /**
     * Captures a PayPal order (completes the payment)
     */
    async captureOrder(orderId: string) {
        if (!this.client) {
            throw new Error('PayPal client not initialized. Please configure PayPal credentials.');
        }

        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        try {
            const response = await this.client.execute(request);
            this.logger.log(`PayPal order captured: ${orderId}`);
            return {
                id: response.result.id,
                status: response.result.status,
                payer: response.result.payer,
                purchase_units: response.result.purchase_units,
            };
        } catch (error) {
            this.logger.error('Error capturing PayPal order:', error);
            throw new Error('Failed to capture PayPal order');
        }
    }

    /**
     * Gets order details
     */
    async getOrderDetails(orderId: string) {
        if (!this.client) {
            throw new Error('PayPal client not initialized. Please configure PayPal credentials.');
        }

        const request = new paypal.orders.OrdersGetRequest(orderId);

        try {
            const response = await this.client.execute(request);
            return response.result;
        } catch (error) {
            this.logger.error('Error getting PayPal order details:', error);
            throw new Error('Failed to get PayPal order details');
        }
    }
}
