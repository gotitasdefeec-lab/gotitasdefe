const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllSales() {
  try {
    console.log('Eliminando todas las ventas...');
    
    // Prisma eliminará automáticamente los items relacionados por la cascada
    const result = await prisma.sale.deleteMany({});
    
    console.log(`✓ ${result.count} ventas eliminadas exitosamente`);
    
    // Verificar
    const remaining = await prisma.sale.count();
    console.log(`Ventas restantes: ${remaining}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllSales();
