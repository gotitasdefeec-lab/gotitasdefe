import api from './api';
import { StorePayment } from '../types/storePayment';

export const getStorePayment = async (): Promise<StorePayment> => {
  const res = await api.get('/storePayment');
  return res.data;
};

export const updateStorePayment = async (data: StorePayment): Promise<StorePayment> => {
  const res = await api.put('/storePayment', data);
  return res.data;
};
