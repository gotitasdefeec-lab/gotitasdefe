import api from './api';
import { StoreSocial } from '../types/storeSocial';

export const getStoreSocial = async (): Promise<StoreSocial> => {
  const res = await api.get('/storeSocial');
  return res.data;
};

export const updateStoreSocial = async (data: StoreSocial): Promise<StoreSocial> => {
  const res = await api.put('/storeSocial', data);
  return res.data;
};
