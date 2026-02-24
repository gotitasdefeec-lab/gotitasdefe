import api from './api';
import { StoreLogo } from '../types/storeLogo';

const API_URL = '/storeLogo';

export const getStoreLogo = async (): Promise<StoreLogo> => {
  const res = await api.get(API_URL);
  return res.data as StoreLogo;
};

export const updateStoreLogo = async (data: StoreLogo): Promise<StoreLogo> => {
  const res = await api.put(API_URL, data);
  return res.data as StoreLogo;
};
