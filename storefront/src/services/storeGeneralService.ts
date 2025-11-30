
import { StoreGeneral } from '../../../src/types/storeGeneral';


export const getStoreGeneral = async (): Promise<StoreGeneral> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) throw new Error('Falta la variable NEXT_PUBLIC_API_BASE_URL en el entorno');
  const res = await fetch(`${baseUrl}/public/store/general`, { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo obtener la configuración general');
  return res.json();
};
