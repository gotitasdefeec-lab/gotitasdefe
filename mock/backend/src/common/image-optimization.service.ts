import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

/**
 * Servicio de optimización de imágenes usando Sharp
 * 
 * Beneficios:
 * - Convierte automáticamente a WebP (70% más ligero)
 * - Redimensiona a máx 1920x1920px
 * - Reduce tamaño en ~98% (19MB → 300KB)
 * - Detecta si ya viene optimizada (evita re-procesar)
 */
@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);

  // Configuración por defecto
  private readonly MAX_WIDTH = 1920;
  private readonly MAX_HEIGHT = 1920;
  private readonly QUALITY = 85;
  private readonly THUMBNAIL_SIZE = 400;

  /**
   * Detecta si una imagen base64 ya está optimizada
   */
  private isAlreadyOptimized(base64: string): boolean {
    // Si ya es WebP, probablemente ya está optimizada
    if (base64.startsWith('data:image/webp')) {
      return true;
    }

    // Si el tamaño es pequeño (<1MB), probablemente ya está optimizada
    const sizeInBytes = (base64.length * 3) / 4; // Aprox tamaño real
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB < 1) {
      this.logger.log(`Imagen ya optimizada (~${sizeInMB.toFixed(2)}MB), omitiendo procesamiento`);
      return true;
    }

    return false;
  }

  /**
   * Optimiza una imagen base64
   * @param base64Image Imagen en formato base64 (data:image/jpeg;base64,...)
   * @param options Opciones de optimización
   * @returns Imagen optimizada en base64
   */
  async optimizeImage(
    base64Image: string,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      forceOptimization?: boolean;
    },
  ): Promise<string> {
    try {
      // Si no hay imagen, retornar tal cual
      if (!base64Image || typeof base64Image !== 'string') {
        return base64Image;
      }

      // Detectar si ya viene optimizada (a menos que se fuerce)
      if (!options?.forceOptimization && this.isAlreadyOptimized(base64Image)) {
        return base64Image;
      }

      const maxWidth = options?.maxWidth || this.MAX_WIDTH;
      const maxHeight = options?.maxHeight || this.MAX_HEIGHT;
      const quality = options?.quality || this.QUALITY;

      // Extraer el buffer de la imagen desde base64
      const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        this.logger.warn('Formato base64 inválido, retornando imagen original');
        return base64Image;
      }

      const imageBuffer = Buffer.from(matches[2], 'base64');
      const originalSize = imageBuffer.length / (1024 * 1024); // MB

      this.logger.log(`🔄 Optimizando imagen: ${originalSize.toFixed(2)} MB`);

      // Procesar con Sharp
      const sharpInstance = sharp(imageBuffer);
      const metadata = await sharpInstance.metadata();

      // Redimensionar si excede límites
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside', // Mantiene aspect ratio
          withoutEnlargement: true, // No agranda imágenes pequeñas
        });
      }

      // Convertir a WebP con compresión
      const optimizedBuffer = await sharpInstance
        .webp({ quality })
        .toBuffer();

      const optimizedSize = optimizedBuffer.length / (1024 * 1024); // MB
      const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

      this.logger.log(
        `✅ Optimización exitosa: ${originalSize.toFixed(2)}MB → ${optimizedSize.toFixed(2)}MB (Ahorro: ${savings}%)`,
      );

      // Convertir de vuelta a base64
      const optimizedBase64 = `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;
      return optimizedBase64;
    } catch (error) {
      this.logger.error('❌ Error optimizando imagen:', error.message);
      // En caso de error, retornar la imagen original
      return base64Image;
    }
  }

  /**
   * Optimiza múltiples imágenes en paralelo
   */
  async optimizeImages(
    base64Images: string[],
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    },
  ): Promise<string[]> {
    if (!Array.isArray(base64Images) || base64Images.length === 0) {
      return base64Images;
    }

    this.logger.log(`📦 Optimizando ${base64Images.length} imágenes...`);

    const optimizationPromises = base64Images.map((img) =>
      this.optimizeImage(img, options),
    );

    const optimizedImages = await Promise.all(optimizationPromises);

    this.logger.log(`✅ ${base64Images.length} imágenes optimizadas`);

    return optimizedImages;
  }

  /**
   * Genera una miniatura de una imagen
   */
  async generateThumbnail(
    base64Image: string,
    size: number = this.THUMBNAIL_SIZE,
  ): Promise<string> {
    try {
      const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) return base64Image;

      const imageBuffer = Buffer.from(matches[2], 'base64');

      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 80 })
        .toBuffer();

      return `data:image/webp;base64,${thumbnailBuffer.toString('base64')}`;
    } catch (error) {
      this.logger.error('Error generando miniatura:', error.message);
      return base64Image;
    }
  }

  /**
   * Valida el tamaño de una imagen
   */
  getImageSize(base64Image: string): number {
    if (!base64Image) return 0;
    const sizeInBytes = (base64Image.length * 3) / 4;
    return sizeInBytes / (1024 * 1024); // MB
  }

  /**
   * Valida que las imágenes no excedan un tamaño máximo
   */
  validateImageSizes(base64Images: string[], maxMB: number = 20): boolean {
    if (!Array.isArray(base64Images)) return true;

    for (const img of base64Images) {
      const sizeMB = this.getImageSize(img);
      if (sizeMB > maxMB) {
        throw new Error(
          `Una imagen excede el tamaño máximo permitido (${sizeMB.toFixed(1)}MB > ${maxMB}MB)`,
        );
      }
    }

    return true;
  }
}
