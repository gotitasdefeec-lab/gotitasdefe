import api, { publicApi } from './api';

export interface CarouselImage {
  id: number;
  imageUrl: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const carouselService = {
  async getCarousel(): Promise<CarouselImage[]> {
    try {
  const response = await publicApi.get('/public/carousel');
      return response.data;
    } catch (error) {
      console.error('Error fetching carousel:', error);
      return [];
    }
  }
};