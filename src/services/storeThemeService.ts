import api from './api';
import { StoreTheme } from '../types/storeTheme';

const API_URL = '/storeTheme';

export const getStoreTheme = async (): Promise<StoreTheme> => {
  const res = await api.get(API_URL);
  return res.data as StoreTheme;
};

export const updateStoreTheme = async (data: StoreTheme): Promise<StoreTheme> => {
  // json-server para objetos únicos acepta PUT/PATCH directo a la ruta
  const res = await api.put(API_URL, data);
  return res.data as StoreTheme;
};
