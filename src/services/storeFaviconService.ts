import api from './api';
import { StoreFavicon } from '../types/storeFavicon';

const API_URL = '/storeFavicon';

export const getStoreFavicon = async (): Promise<StoreFavicon> => {
  const res = await api.get(API_URL);
  return res.data as StoreFavicon;
};

export const updateStoreFavicon = async (data: StoreFavicon): Promise<StoreFavicon> => {
  const res = await api.put(API_URL, data);
  return res.data as StoreFavicon;
};
