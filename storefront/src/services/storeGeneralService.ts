
import { StoreGeneral } from '../../../src/types/storeGeneral';


export const getStoreGeneral = async (): Promise<StoreGeneral> => {
  // Usar la misma variable que el resto del proyecto con fallback
  const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_API_URL || 
                  process.env.NEXT_PUBLIC_API_BASE_URL || 
                  process.env.NEXT_PUBLIC_API_URL || 
                  'https://api.gotasdefe.com';
  
  const url = `${baseUrl}/public/store/general`;
  console.log('🔄 Fetching store general from:', url);
  
  try {
    const res = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📡 Response status:', res.status, res.statusText);
    
    if (!res.ok) {
      const text = await res.text();
      console.error('❌ Response error:', text);
      throw new Error(`No se pudo obtener la configuración general: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('✅ Store general data loaded:', { 
      hasAbout: !!data.about, 
      hasContact: !!data.contact,
      aboutLength: data.about?.length,
      contactLength: data.contact?.length
    });
    return data;
  } catch (error) {
    console.error('❌ Error in getStoreGeneral:', error);
    throw error;
  }
};
