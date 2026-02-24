import api from './api';
import { StoreGeneral } from '../types/storeGeneral';

export const getStoreGeneral = async (): Promise<StoreGeneral> => {
  const res = await api.get('/storeGeneral');
  return res.data;
};

export const updateStoreGeneral = async (data: StoreGeneral): Promise<StoreGeneral> => {
  const res = await api.put('/storeGeneral', data);
  return res.data;
};
