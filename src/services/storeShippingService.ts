import api from './api';
import { StoreShipping } from '../types/storeShipping';

export const getStoreShipping = async (): Promise<StoreShipping> => {
  const res = await api.get('/storeShipping');
  return res.data;
};

export const updateStoreShipping = async (data: StoreShipping): Promise<StoreShipping> => {
  const res = await api.put('/storeShipping', data);
  return res.data;
};
