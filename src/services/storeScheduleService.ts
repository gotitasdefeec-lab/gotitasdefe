import api from './api';
import { StoreSchedule } from '../types/storeSchedule';

export const getStoreSchedule = async (): Promise<StoreSchedule> => {
  const res = await api.get('/storeSchedule');
  return res.data;
};

export const updateStoreSchedule = async (data: StoreSchedule): Promise<StoreSchedule> => {
  const res = await api.put('/storeSchedule', data);
  return res.data;
};
