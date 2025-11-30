import { publicApi } from './api';

export interface StorePolicy {
  id: number;
  title: string;
  content: string;
}

export const getPolicies = async (): Promise<StorePolicy[]> => {
  const res = await publicApi.get('/public/policies');
  return res.data as StorePolicy[];
};
