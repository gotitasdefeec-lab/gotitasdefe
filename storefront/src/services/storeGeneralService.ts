
// Importamos la configuración central para usar la MISMA conexión que los productos
import { API_URL } from './api';
import { StoreGeneral } from '../../../src/types/storeGeneral';

export const getStoreGeneral = async (): Promise<StoreGeneral> => {
  // Construimos la URL usando la variable maestra API_URL
  // Esto asegura que si estás en local use localhost, y si estás en prod use el dominio real
  const baseUrl = API_URL.replace(/\/$/, ''); // Quitar slash final si existe para evitar duplicados
  const url = `${baseUrl}/public/store/general`;

  console.log('🔄 Cargando información general desde:', url);
  
  try {
    const res = await fetch(url, { 
      // 'no-store' es vital para que Next.js no guarde en caché información vieja
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo conectar con ${url}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('❌ Error al obtener información de la tienda:', error);
    // Devolvemos un objeto vacío seguro para que la página no se rompa
    return {
      name: '',
      description: '',
      email: '',
      phone: '',
      address: '',
      about: '',
      contact: ''
    };
  }
};
