import api from './api';

const API_URL = '/carousel';

export const getCarousel = async () => {
  const res = await api.get(API_URL);
  return res.data;
};

export const addCarouselImage = async (data: any) => {
  const res = await api.post(API_URL, data);
  return res.data;
};

export const updateCarouselImage = async (id: number, data: any) => {
  const res = await api.put(`${API_URL}/${id}`, data);
  return res.data;
};

export const deleteCarouselImage = async (id: number) => {
  const res = await api.delete(`${API_URL}/${id}`);
  return res.data;
};
