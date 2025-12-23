'use client';

import React from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { checkoutService } from '@/services/checkoutService';
import toast from 'react-hot-toast';

interface PayPalButtonProps {
    amount: number;
    currency: string;
    orderData: {
        customerName: string;
        customerEmail: string;
        cedula: string;
        shippingAddress: string;
        shippingPhone: string;
        notes?: string;
        paymentMethod?: string;
        items: Array<{
            productId: number;
            quantity: number;
            price: number;
            name: string;
        }>;
        subtotal: number;
        total: number;
        shippingCost: number;
        shippingMethodName?: string;
    };
    onSuccess: (orderId: number) => void;
    onError: (error: string) => void;
}

export default function PayPalButton({
    amount,
    currency,
    orderData,
    onSuccess,
    onError,
}: PayPalButtonProps) {
    const [{ isPending }] = usePayPalScriptReducer();

    const createOrder = async () => {
        try {
            // Crear orden de PayPal en nuestro backend
            const response = await checkoutService.createPayPalOrder({
                amount,
                currency,
                orderData,
            });

            if (!response.paypalOrderId) {
                throw new Error('No se recibió el ID de orden de PayPal');
            }

            return response.paypalOrderId;
        } catch (error: any) {
            console.error('Error creating PayPal order:', error);
            const errorMsg = error.response?.data?.message || 'Error al crear la orden de PayPal';
            toast.error(errorMsg);
            onError(errorMsg);
            throw error;
        }
    };

    const onApprove = async (data: any) => {
        try {
            // Capturar el pago en nuestro backend
            const response = await checkoutService.capturePayPalOrder(data.orderID);

            if (response.success && response.orderId) {
                toast.success('¡Pago completado con éxito!');
                onSuccess(response.orderId);
            } else {
                throw new Error('No se pudo completar el pago');
            }
        } catch (error: any) {
            console.error('Error capturing PayPal order:', error);
            const errorMsg = error.response?.data?.message || 'Error al procesar el pago';
            toast.error(errorMsg);
            onError(errorMsg);
        }
    };

    const onCancel = () => {
        toast.error('Pago cancelado');
        onError('El usuario canceló el pago');
    };

    const onErrorHandler = (err: any) => {
        console.error('PayPal error:', err);
        toast.error('Error en el proceso de pago');
        onError('Error en el proceso de pago de PayPal');
    };

    if (isPending) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando PayPal...</span>
            </div>
        );
    }

    return (
        <div className="paypal-button-container">
            <PayPalButtons
                style={{
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'paypal',
                }}
                createOrder={createOrder}
                onApprove={onApprove}
                onCancel={onCancel}
                onError={onErrorHandler}
                forceReRender={[amount, currency]}
            />
        </div>
    );
}
