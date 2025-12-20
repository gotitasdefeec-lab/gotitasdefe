import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) { }

  // --- ARREGLO AQUÍ: Store General ---
  async getGeneral() {
    try {
      const general = await this.prisma.storeGeneral.findUnique({ where: { id: 1 } });
      
      // Si no existe, devolvemos un objeto por defecto PERO con todos los campos necesarios
      if (!general) {
        return { 
          id: 1, 
          name: 'Tienda', 
          email: '', 
          phone: '', 
          address: '', 
          currency: 'USD',
          about: '',   // <--- IMPORTANTE: Agregado
          contact: ''  // <--- IMPORTANTE: Agregado
        } as any;
      }
      
      return { 
        ...general, 
        currency: (general as any).currency || 'USD',
        // Aseguramos que nunca sean null/undefined
        about: (general as any).about || '',
        contact: (general as any).contact || ''
      };

    } catch (err: any) {
      console.error('Error obteniendo general info:', err);
      
      // Intentar recuperación con query cruda si Prisma falla
      try {
        const rows: any = await this.prisma.$queryRaw`SELECT * FROM store_general WHERE id = 1 LIMIT 1`;
        const row = Array.isArray(rows) && rows.length ? rows[0] : null;
        
        if (row) {
          return {
            ...row,
            currency: row.currency || 'USD',
            about: row.about || '',     // <--- IMPORTANTE
            contact: row.contact || ''  // <--- IMPORTANTE
          } as any;
        }
      } catch (rawErr) {
        console.error('Error fallback raw:', rawErr);
      }

      // Fallback final de emergencia (ahora incluye about y contact)
      return { 
        id: 1, 
        name: 'Tienda', 
        email: '', 
        phone: '', 
        address: '', 
        currency: 'USD',
        about: '',
        contact: '' 
      } as any;
    }
  }

  async updateGeneral(data: any) {
    return this.prisma.storeGeneral.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  }

  // Store Social
  async getSocial() {
    return this.prisma.storeSocial.findUnique({ where: { id: 1 } });
  }

  async updateSocial(data: any) {
    return this.prisma.storeSocial.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  }

  // Store Schedule
  async getSchedule() {
    return this.prisma.storeSchedule.findUnique({ where: { id: 1 } });
  }

  async updateSchedule(data: any) {
    return this.prisma.storeSchedule.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  }

  // Store Payment
  async getPayment() {
    const payment = await this.prisma.storePayment.findUnique({ where: { id: 1 } });

    // Inject PayPal Client ID from environment if available
    // This ensures frontend uses the same credentials as backend
    if (process.env.PAYPAL_CLIENT_ID) {
      return {
        ...payment,
        paypalClientId: process.env.PAYPAL_CLIENT_ID
      } as any;
    }

    return payment;
  }

  async updatePayment(data: any) {
    return this.prisma.storePayment.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  }

  // Store Shipping
  async getShipping() {
    const s = await this.prisma.storeShipping.findUnique({ where: { id: 1 } });
    if (!s) return { policy: '', standardCost: 0, freeShippingMin: 0, carriers: [], rates: [] };
    return {
      ...s,
      carriers: Array.isArray((s as any).carriers) ? (s as any).carriers : [],
      rates: Array.isArray((s as any).rates) ? (s as any).rates : [],
    } as any;
  }

  async updateShipping(data: any) {
    const payload = {
      policy: data?.policy ?? '',
      standardCost: Number(data?.standardCost ?? 0),
      freeShippingMin: Number(data?.freeShippingMin ?? 0),
      carriers: Array.isArray(data?.carriers) ? data.carriers : [],
      rates: Array.isArray(data?.rates) ? data.rates : [],
    };
    return this.prisma.storeShipping.upsert({
      where: { id: 1 },
      update: payload,
      create: { id: 1, ...payload },
    });
  }

  // Store Theme
  async getTheme() {
    return this.prisma.storeTheme.findUnique({ where: { id: 1 } });
  }

  async updateTheme(data: any) {
    return this.prisma.storeTheme.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  }

  // Store Logo
  async getLogo() {
    return this.prisma.storeLogo.findUnique({ where: { id: 1 } });
  }

  async updateLogo(data: any) {
    return this.prisma.storeLogo.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  }

  // Store Favicon
  async getFavicon() {
    return this.prisma.storeFavicon.findUnique({ where: { id: 1 } });
  }

  async updateFavicon(data: any) {
    return this.prisma.storeFavicon.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  }
}
