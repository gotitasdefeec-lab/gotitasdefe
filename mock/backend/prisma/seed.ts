import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Import data from frontend mock db.json
const mockData = {
  admin: [
    {
      id: 1,
      name: 'Administrador',
      email: 'admin@tienda.com',
      password: 'admin123',
    },
  ],
  categories: [
    { id: 1, name: 'Ropa' },
    { id: 2, name: 'Hogar' },
    { id: 3, name: 'Electrónica' },
  ],
  products: [
    {
      id: 1,
      name: 'Camiseta Premium',
      sku: 'TS-001',
      price: 19.99,
      stock: 50,
      minStock: 10,
      category: 'Ropa',
      description: 'Camiseta de algodón 100% premium con diseño moderno',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzMzOTlmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhbWlzZXRhPC90ZXh0Pjwvc3ZnPg==',
      status: 'active',
    },
    {
      id: 2,
      name: 'Taza Cerámica',
      sku: 'MG-002',
      price: 9.5,
      stock: 100,
      minStock: 10,
      category: 'Hogar',
      description: 'Taza de cerámica premium con diseño elegante',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzY2Y2NmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRhemE8L3RleHQ+PC9zdmc+',
      status: 'active',
    },
    {
      id: 3,
      name: 'Auriculares Bluetooth',
      sku: 'PB-003',
      price: 45.99,
      stock: 15,
      minStock: 5,
      category: 'Electrónica',
      description: 'Auriculares inalámbricos con cancelación de ruido',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzk5NjZmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkF1ZGlvPC90ZXh0Pjwvc3ZnPg==',
      status: 'active',
    },
    {
      id: 4,
      name: 'Lámpara LED',
      sku: 'HL-004',
      price: 34.99,
      stock: 25,
      minStock: 10,
      category: 'Hogar',
      description: 'Lámpara LED inteligente con control remoto',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2ZmY2M2NiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkzDoW1wYXJhPC90ZXh0Pjwvc3ZnPg==',
      status: 'active',
    },
  ],
  inventory: [
    {
      id: 1,
      productId: 1,
      quantity: 50,
      minStock: 10,
      maxStock: 200,
      location: 'Almacén',
      movements: [],
      stockHistory: [],
    },
    {
      id: 2,
      productId: 2,
      quantity: 100,
      minStock: 10,
      maxStock: 300,
      location: 'Almacén',
      movements: [],
      stockHistory: [],
    },
    {
      id: 3,
      productId: 3,
      quantity: 15,
      minStock: 5,
      maxStock: 50,
      location: 'Almacén',
      movements: [],
      stockHistory: [],
    },
    {
      id: 4,
      productId: 4,
      quantity: 25,
      minStock: 10,
      maxStock: 100,
      location: 'Almacén',
      movements: [],
      stockHistory: [],
    },
  ],
  customers: [
    {
      id: 1,
      name: 'Juan Pérez',
      cedula: '0912345678',
      email: 'juan.perez@example.com',
      phone: '+593991234567',
      address: 'Av. Siempre Viva 123',
      city: 'Guayaquil',
      postalCode: '090101',
      country: 'Ecuador',
      notes: 'Cliente frecuente',
      status: 'active',
      totalPurchases: 250.5,
      lastPurchaseDate: new Date('2025-09-20T12:00:00.000Z'),
      registrationDate: new Date('2025-01-10T10:00:00.000Z'),
    },
    {
      id: 2,
      name: 'María López',
      cedula: '0923456789',
      email: 'maria.lopez@example.com',
      phone: '+593981112223',
      address: 'Calle Falsa 456',
      city: 'Quito',
      postalCode: '170102',
      country: 'Ecuador',
      notes: 'Prefiere llamadas por la tarde',
      status: 'active',
      totalPurchases: 120,
      lastPurchaseDate: new Date('2025-10-01T15:30:00.000Z'),
      registrationDate: new Date('2025-03-05T09:30:00.000Z'),
    },
  ],
  sales: [
    {
      id: 1,
      customerId: 1,
      status: 'completed',
      total: 100.5,
      date: new Date('2025-09-20T12:00:00.000Z'),
    },
    {
      id: 2,
      customerId: 2,
      status: 'pending',
      total: 50,
      date: new Date('2025-10-01T15:30:00.000Z'),
    },
  ],
  storeGeneral: {
    name: 'Mi Tienda Online',
    description: 'La mejor tienda para tus compras.',
    email: 'contacto@mitienda.com',
    phone: '+593991234567',
    address: 'Av. Principal 123, Ciudad, País',
  },
  storeSocial: {
    facebook: 'https://facebook.com/mitienda',
    instagram: 'https://instagram.com/mitienda',
    whatsapp: 'https://wa.me/593991234567',
    x: 'https://x.com/mitienda',
    tiktok: 'https://tiktok.com/@mitienda',
    youtube: 'https://youtube.com/mitienda',
    linkedin: 'https://linkedin.com/company/mitienda',
  },
  storeSchedule: {
    days: [
      { day: 'Lunes', open: '09:00', close: '18:00', closed: false },
      { day: 'Martes', open: '09:00', close: '18:00', closed: false },
      { day: 'Miércoles', open: '09:00', close: '18:00', closed: false },
      { day: 'Jueves', open: '09:00', close: '18:00', closed: false },
      { day: 'Viernes', open: '09:00', close: '18:00', closed: false },
      { day: 'Sábado', open: '10:00', close: '14:00', closed: false },
      { day: 'Domingo', open: '', close: '', closed: true },
    ],
  },
  storeShipping: {
    policy: 'Enviamos a todo el país. El tiempo de entrega es de 2 a 5 días hábiles.',
    standardCost: 4.99,
    freeShippingMin: 50,
    carriers: [
      { id: 1, name: 'Correo Nacional', enabled: true },
      { id: 2, name: 'Rápido Express', enabled: true }
    ],
    rates: [
      { id: 1, scope: 'pais', region: 'Ecuador', price: 3.5, carrierId: 1 },
      { id: 2, scope: 'provincia', region: 'Pichincha', price: 2.0, carrierId: 2 },
      { id: 3, scope: 'ciudad', region: 'Quito', price: 0 }
    ],
  },
  storePayment: {
    info: 'Aceptamos varios métodos de pago. Elige el que prefieras.',
    methods: [
      { key: 'efectivo', label: 'Pago en efectivo', enabled: true },
      { key: 'transferencia', label: 'Transferencia bancaria', enabled: true },
      { key: 'tarjeta', label: 'Tarjeta de crédito/débito', enabled: false },
    ],
  },
  storeTheme: {
    primary: '#2196f3',
    secondary: '#ff9800',
    background: '#f5f7fa',
  },
  carousel: [
    {
      id: 1,
      imageUrl: '/carousel-placeholder.svg',
      title: 'Bienvenido a Nuestra Tienda',
      description: 'Descubre los mejores productos con la mejor calidad y precios increíbles',
    },
    {
      id: 2,
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=300&fit=crop',
      title: 'Ofertas Especiales',
      description: 'No te pierdas nuestras ofertas exclusivas',
    },
    {
      id: 3,
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=300&fit=crop',
      title: 'Calidad Garantizada',
      description: 'Todos nuestros productos tienen garantía de calidad',
    },
  ],
};

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🗑️  Cleaning database...');
  await prisma.sale.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.storeGeneral.deleteMany();
  await prisma.storeSocial.deleteMany();
  await prisma.storeSchedule.deleteMany();
  await prisma.storeShipping.deleteMany();
  await prisma.storePayment.deleteMany();
  await prisma.storeTheme.deleteMany();
  await prisma.carousel.deleteMany();

  // Seed Admin (hash password)
  console.log('👤 Seeding admin...');
  const hashedPassword = await bcrypt.hash(mockData.admin[0].password, 10);
  await prisma.admin.create({
    data: {
      ...mockData.admin[0],
      password: hashedPassword,
    },
  });

  // Seed Categories
  console.log('📂 Seeding categories...');
  for (const category of mockData.categories) {
    await prisma.category.create({ data: category });
  }

  // Seed Products
  console.log('📦 Seeding products...');
  for (const product of mockData.products) {
    await prisma.product.create({
      data: {
        ...product,
        status: product.status || 'active',
      },
    });
  }

  // Seed Inventory
  console.log('📊 Seeding inventory...');
  for (const inv of mockData.inventory) {
    await prisma.inventory.create({
      data: {
        ...inv,
        movements: inv.movements as any,
        stockHistory: inv.stockHistory as any,
      },
    });
  }

  // Seed Customers
  console.log('👥 Seeding customers...');
  for (const customer of mockData.customers) {
    await prisma.customer.create({ data: customer });
  }

  // Seed Sales
  console.log('💰 Seeding sales...');
  for (const sale of mockData.sales) {
    await prisma.sale.create({ data: sale });
  }

  // Seed Store Configuration
  console.log('🏪 Seeding store configuration...');
  await prisma.storeGeneral.create({
    data: { id: 1, ...mockData.storeGeneral },
  });
  await prisma.storeSocial.create({
    data: { id: 1, ...mockData.storeSocial },
  });
  await prisma.storeSchedule.create({
    data: { id: 1, days: mockData.storeSchedule.days as any },
  });
  await prisma.storeShipping.create({
    data: { id: 1, ...mockData.storeShipping },
  });
  await prisma.storePayment.create({
    data: { id: 1, methods: mockData.storePayment.methods as any, info: mockData.storePayment.info },
  });
  await prisma.storeTheme.create({
    data: { id: 1, ...mockData.storeTheme },
  });

  // Seed Carousel
  console.log('🎠 Seeding carousel...');
  for (const slide of mockData.carousel) {
    await prisma.carousel.create({ data: slide });
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
