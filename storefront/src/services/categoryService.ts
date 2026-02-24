import { publicApi } from './api';
import { Category } from '@/types';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await publicApi.get<Category[]>('/public/categories');
    return response.data;
  },
};