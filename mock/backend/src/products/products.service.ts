import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageOptimizationService } from '../common/image-optimization.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private imageOptimization: ImageOptimizationService,
  ) {}

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Buscar productos destacados (optimizado para homepage)
   * Solo trae campos necesarios para reducir tamaño del response
   */
  async findFeatured(limit: number = 8) {
    return this.prisma.product.findMany({
      where: { 
        status: 'active',
        // featured: true, // Descomentar cuando agregues campo 'featured' al schema
      },
      take: limit,
      orderBy: { id: 'desc' }, // Más recientes primero
      select: {
        id: true,
        name: true,
        description: true, // Necesario para mapProductForStorefront()
        price: true,
        stock: true,
        images: true, // URLs optimizadas: ["/uploads/products/img.webp"]
        image: true, // Campo legacy
        category: true,
        sku: true,
        status: true, // Necesario para mapear 'active'
        createdAt: true, // Timestamps pequeños
        updatedAt: true,
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const { images, ...rest } = createProductDto;
    
    try {
      // ✨ Optimizar imágenes automáticamente (19MB → 300KB) y guardar como archivos
      const optimizedImages = Array.isArray(images) && images.length > 0
        ? await this.imageOptimization.optimizeImages(images, { type: 'product' })
        : [];
      
      const product = await this.prisma.product.create({
        data: {
          ...rest,
          images: optimizedImages,
          minStock: createProductDto.minStock ?? 10,
          status: createProductDto.status ?? 'active',
        },
      });

      // Create corresponding inventory entry
      await this.prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: createProductDto.stock,
          minStock: createProductDto.minStock ?? 10,
          maxStock: 100,
          location: 'Almacén',
        },
      });

      return product;
    } catch (error) {
      // Manejar errores de campos únicos de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes('sku')) {
            throw new ConflictException('El SKU ya existe. Por favor usa un código único diferente.');
          }
          throw new ConflictException('Ya existe un producto con estos datos únicos.');
        }
      }
      throw error;
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const existingProduct = await this.findOne(id); // Validate exists

    const { images, ...rest } = updateProductDto;
    
    // ✨ Optimizar nuevas imágenes si se actualizaron
    let processedImages = images;
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      // Eliminar imágenes antiguas si hay nuevas
      if (existingProduct.images && Array.isArray(existingProduct.images)) {
        await this.imageOptimization.deleteImages(existingProduct.images as string[]);
      }
      
      // Optimizar y guardar nuevas imágenes
      processedImages = await this.imageOptimization.optimizeImages(images, { type: 'product' });
    }
    
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(processedImages !== undefined ? { images: processedImages } : {}),
      },
    });

    // Update inventory if stock changed
    if (updateProductDto.stock !== undefined) {
      await this.prisma.inventory.updateMany({
        where: { productId: id },
        data: { quantity: updateProductDto.stock },
      });
    }

    return product;
  }

  async remove(id: number) {
    const product = await this.findOne(id); // Validate exists
    
    // Eliminar imágenes físicas antes de borrar el producto
    if (product.images && Array.isArray(product.images)) {
      await this.imageOptimization.deleteImages(product.images as string[]);
    }
    
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
