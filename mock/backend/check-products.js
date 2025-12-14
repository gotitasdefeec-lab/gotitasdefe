const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      image: true,
      status: true
    }
  });
  
  console.log('Total productos activos:', products.length);
  products.forEach(p => {
    const imgPreview = p.image 
      ? (p.image.startsWith('data:image') 
          ? `base64 (${p.image.substring(0, 50)}...)` 
          : p.image)
      : 'NO IMAGE';
    console.log(`\n[${p.id}] ${p.name}`);
    console.log(`    Image: ${imgPreview}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
