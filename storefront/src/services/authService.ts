import { publicApi } from './api';

// Asumiendo que el DTO en el frontend tiene la misma estructura que en el backend
export interface RegisterCustomerDto {
  name: string;
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterCustomerDto): Promise<any> {
    try {
      const response = await publicApi.post('/auth/register/customer', data);
      return response.data;
    } catch (error: any) {
      // Lanza el error para que el componente que lo llama pueda manejarlo
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || 'Error en el registro.');
      }
      throw new Error('Ocurrió un error de red. Inténtalo de nuevo.');
    }
  },
};
