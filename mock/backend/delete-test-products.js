const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Eliminando productos de prueba...');
  
  // Eliminar inventario relacionado primero
  await prisma.inventory.deleteMany({
    where: {
      productId: { in: [1, 2, 3, 4] }
    }
  });
  
  // Eliminar productos
  const result = await prisma.product.deleteMany({
    where: {
      id: { in: [1, 2, 3, 4] }
    }
  });
  
  console.log(`✅ ${result.count} productos eliminados`);
  
  // Verificar que no queden productos
  const remaining = await prisma.product.count();
  console.log(`Productos restantes: ${remaining}`);
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
