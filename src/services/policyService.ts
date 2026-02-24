import api from './api';
import { StorePolicy } from '../types/policy';

const API_URL = '/policies';

export const getPolicies = async (): Promise<StorePolicy[]> => {
  const res = await api.get(API_URL);
  return res.data as StorePolicy[];
};

export const addPolicy = async (data: Omit<StorePolicy, 'id'>): Promise<StorePolicy> => {
  const res = await api.post(API_URL, data);
  return res.data as StorePolicy;
};

export const updatePolicy = async (id: number, data: Omit<StorePolicy, 'id'>): Promise<StorePolicy> => {
  const res = await api.put(`${API_URL}/${id}`, data);
  return res.data as StorePolicy;
};

export const deletePolicy = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};
