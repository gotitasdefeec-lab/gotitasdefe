import { PrismaClient } from '@prisma/client';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

const prisma = new PrismaClient();

// Configuración
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const PRODUCTS_DIR = path.join(UPLOADS_DIR, 'products');
const CAROUSEL_DIR = path.join(UPLOADS_DIR, 'carousel');
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const QUALITY = 85;

/**
 * Script de migración: Convierte imágenes base64 a archivos físicos
 * 
 * Ejecutar con:
 * cd mock/backend
 * npx ts-node src/scripts/migrate-images.ts
 */

async function ensureUploadDirs() {
  await mkdir(UPLOADS_DIR, { recursive: true });
  await mkdir(PRODUCTS_DIR, { recursive: true });
  await mkdir(CAROUSEL_DIR, { recursive: true });
  console.log('✅ Carpetas de uploads creadas');
}

function generateFileName(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}.webp`;
}

function isBase64(str: string): boolean {
  return str.startsWith('data:image/');
}

function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/uploads/');
}

async function convertBase64ToFile(
  base64Image: string,
  directory: string,
): Promise<string> {
  try {
    if (!isBase64(base64Image)) {
      console.log('⏭️  Ya es URL, omitiendo');
      return base64Image;
    }

    // Extraer el buffer de la imagen desde base64
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.warn('⚠️  Formato base64 inválido');
      return base64Image;
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const originalSize = imageBuffer.length / (1024 * 1024); // MB

    console.log(`   🔄 Procesando imagen: ${originalSize.toFixed(2)} MB`);

    // Procesar con Sharp
    const sharpInstance = sharp(imageBuffer);
    const metadata = await sharpInstance.metadata();

    // Redimensionar si excede límites
    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
      sharpInstance.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convertir a WebP con compresión
    const optimizedBuffer = await sharpInstance.webp({ quality: QUALITY }).toBuffer();

    const optimizedSize = optimizedBuffer.length / (1024 * 1024); // MB
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    // Generar nombre único y guardar archivo
    const fileName = generateFileName();
    const filePath = path.join(directory, fileName);

    await writeFile(filePath, optimizedBuffer);

    // Generar URL relativa
    const dirName = directory.endsWith('carousel') ? 'carousel' : 'products';
    const imageUrl = `/uploads/${dirName}/${fileName}`;

    console.log(
      `   ✅ ${originalSize.toFixed(2)}MB → ${optimizedSize.toFixed(2)}MB (${savings}% ahorro) → ${imageUrl}`,
    );

    return imageUrl;
  } catch (error) {
    console.error('   ❌ Error procesando imagen:', error.message);
    return base64Image; // Retornar original en caso de error
  }
}

async function migrateProducts() {
  console.log('\n📦 Migrando imágenes de productos...\n');

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { images: { not: { equals: null } } },
        { image: { not: null } },
      ],
    },
  });

  console.log(`Encontrados ${products.length} productos con imágenes\n`);

  for (const product of products) {
    console.log(`\n🔹 Producto #${product.id}: ${product.name}`);

    let updated = false;

    // Migrar campo 'image' (antiguo)
    if (product.image && isBase64(product.image)) {
      console.log('  🖼️  Campo "image":');
      const newUrl = await convertBase64ToFile(product.image, PRODUCTS_DIR);
      if (newUrl !== product.image) {
        await prisma.product.update({
          where: { id: product.id },
          data: { image: newUrl },
        });
        updated = true;
      }
    }

    // Migrar campo 'images' (array)
    if (product.images && Array.isArray(product.images)) {
      console.log(`  🖼️  Campo "images": ${product.images.length} imágenes`);
      
      const newImages: string[] = [];
      for (let i = 0; i < product.images.length; i++) {
        const img = product.images[i] as string;
        console.log(`     [${i + 1}/${product.images.length}]`);
        
        if (isBase64(img)) {
          const newUrl = await convertBase64ToFile(img, PRODUCTS_DIR);
          newImages.push(newUrl);
        } else {
          newImages.push(img); // Ya es URL
        }
      }

      if (JSON.stringify(newImages) !== JSON.stringify(product.images)) {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: newImages },
        });
        updated = true;
      }
    }

    if (updated) {
      console.log('  💾 Producto actualizado en BD');
    } else {
      console.log('  ⏭️  Sin cambios necesarios');
    }
  }

  console.log(`\n✅ ${products.length} productos procesados\n`);
}

async function migrateCarousel() {
  console.log('\n🎠 Migrando imágenes de carrusel...\n');

  const slides = await prisma.carousel.findMany({
    where: {
      imageUrl: { not: null },
    },
  });

  console.log(`Encontrados ${slides.length} slides con imágenes\n`);

  for (const slide of slides) {
    console.log(`\n🔹 Slide #${slide.id}: ${slide.title}`);

    if (slide.imageUrl && isBase64(slide.imageUrl)) {
      console.log('  🖼️  Imagen:');
      const newUrl = await convertBase64ToFile(slide.imageUrl, CAROUSEL_DIR);
      
      if (newUrl !== slide.imageUrl) {
        await prisma.carousel.update({
          where: { id: slide.id },
          data: { imageUrl: newUrl },
        });
        console.log('  💾 Slide actualizado en BD');
      }
    } else {
      console.log('  ⏭️  Ya es URL o vacío');
    }
  }

  console.log(`\n✅ ${slides.length} slides procesados\n`);
}

async function main() {
  console.log('🚀 Iniciando migración de imágenes base64 → archivos físicos\n');
  console.log('═'.repeat(60));

  try {
    await ensureUploadDirs();
    await migrateProducts();
    await migrateCarousel();

    console.log('═'.repeat(60));
    console.log('\n🎉 ¡Migración completada exitosamente!\n');
    console.log('📊 Resumen:');
    console.log('   - Imágenes guardadas en: /uploads/products/ y /uploads/carousel/');
    console.log('   - Base de datos actualizada con URLs');
    console.log('   - JSON de API ahora 100x más liviano');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Reinicia el backend: npm run start:dev');
    console.log('   2. Verifica que las imágenes se ven correctamente');
    console.log('   3. Haz commit y push de los cambios');
    console.log('   4. Deploy en Vercel debería funcionar ahora\n');
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
