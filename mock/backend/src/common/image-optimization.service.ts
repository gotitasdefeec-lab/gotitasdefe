import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as crypto from 'crypto';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);

/**
 * Servicio de optimización de imágenes usando Sharp
 * 
 * V2: Guarda archivos físicos en lugar de base64
 * 
 * Beneficios:
 * - Convierte automáticamente a WebP (70% más ligero)
 * - Redimensiona a máx 1920x1920px
 * - Reduce tamaño en ~98% (19MB → 300KB)
 * - Devuelve URLs en lugar de base64 (JSON 100x más liviano)
 * - API pasa de 95MB → 50KB
 */
@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);

  // Configuración por defecto
  private readonly MAX_WIDTH = 1920;
  private readonly MAX_HEIGHT = 1920;
  private readonly QUALITY = 85;
  private readonly THUMBNAIL_SIZE = 400;
  
  // Rutas de archivos
  private readonly UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  private readonly PRODUCTS_DIR = path.join(this.UPLOADS_DIR, 'products');
  private readonly CAROUSEL_DIR = path.join(this.UPLOADS_DIR, 'carousel');
  
  constructor() {
    this.ensureUploadDirs();
  }

  /**
   * Crea carpetas de uploads si no existen
   */
  private async ensureUploadDirs() {
    try {
      await mkdir(this.UPLOADS_DIR, { recursive: true });
      await mkdir(this.PRODUCTS_DIR, { recursive: true });
      await mkdir(this.CAROUSEL_DIR, { recursive: true });
      this.logger.log('✅ Carpetas de uploads verificadas');
    } catch (error) {
      this.logger.error('❌ Error creando carpetas de uploads:', error.message);
    }
  }
  
  /**
   * Genera nombre único para archivo
   */
  private generateFileName(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${random}.webp`;
  }

  
  /**
   * Detecta si es una URL (ya procesada) o base64 (necesita procesamiento)
   */
  private isUrl(imageString: string): boolean {
    return imageString.startsWith('http://') || imageString.startsWith('https://') || imageString.startsWith('/uploads/');
  }

  /**
   * Detecta si una imagen base64 ya está optimizada
   */
  private isAlreadyOptimized(base64: string): boolean {
    // Si ya es URL, está optimizada
    if (this.isUrl(base64)) {
      return true;
    }

    // Si ya es WebP pequeño, probablemente ya está optimizada
    if (base64.startsWith('data:image/webp')) {
      const sizeInBytes = (base64.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      if (sizeInMB < 0.5) {
        this.logger.log(`Imagen WebP pequeña (~${sizeInMB.toFixed(2)}MB), omitiendo`);
        return true;
      }
    }

    return false;
  }

  /**
   * Optimiza una imagen base64 y la guarda como archivo físico
   * @param base64Image Imagen en formato base64 (data:image/jpeg;base64,...)
   * @param options Opciones de optimización
   * @returns URL del archivo guardado
   */
  async optimizeImage(
    base64Image: string,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      type?: 'product' | 'carousel';
      forceOptimization?: boolean;
    },
  ): Promise<string> {
    try {
      // Si no hay imagen, retornar vacío
      if (!base64Image || typeof base64Image !== 'string') {
        return '';
      }

      // Si ya es una URL, retornar tal cual
      if (this.isUrl(base64Image)) {
        return base64Image;
      }

      // Detectar si ya viene optimizada (a menos que se fuerce)
      if (!options?.forceOptimization && this.isAlreadyOptimized(base64Image)) {
        return base64Image;
      }

      const maxWidth = options?.maxWidth || this.MAX_WIDTH;
      const maxHeight = options?.maxHeight || this.MAX_HEIGHT;
      const quality = options?.quality || this.QUALITY;
      const type = options?.type || 'product';

      // Extraer el buffer de la imagen desde base64
      const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        this.logger.warn('Formato base64 inválido, retornando vacío');
        return '';
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

      // Generar nombre único y guardar archivo
      const fileName = this.generateFileName();
      const directory = type === 'carousel' ? this.CAROUSEL_DIR : this.PRODUCTS_DIR;
      const filePath = path.join(directory, fileName);
      
      await writeFile(filePath, optimizedBuffer);

      // Generar URL relativa
      const imageUrl = `/uploads/${type === 'carousel' ? 'carousel' : 'products'}/${fileName}`;

      this.logger.log(
        `✅ Optimización exitosa: ${originalSize.toFixed(2)}MB → ${optimizedSize.toFixed(2)}MB (Ahorro: ${savings}%) → ${imageUrl}`,
      );

      return imageUrl;
    } catch (error) {
      this.logger.error('❌ Error optimizando imagen:', error.message);
      // En caso de error, retornar vacío
      return '';
    }
  }

  /**
   * Optimiza múltiples imágenes en paralelo y las guarda como archivos
   * @returns Array de URLs
   */
  async optimizeImages(
    base64Images: string[],
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      type?: 'product' | 'carousel';
    },
  ): Promise<string[]> {
    if (!Array.isArray(base64Images) || base64Images.length === 0) {
      return [];
    }

    this.logger.log(`📦 Optimizando ${base64Images.length} imágenes...`);

    const optimizationPromises = base64Images.map((img) =>
      this.optimizeImage(img, options),
    );

    const optimizedUrls = await Promise.all(optimizationPromises);

    // Filtrar URLs vacías (errores)
    const validUrls = optimizedUrls.filter(url => url !== '');

    this.logger.log(`✅ ${validUrls.length}/${base64Images.length} imágenes optimizadas y guardadas`);

    return validUrls;
  }


  /**
   * Elimina un archivo de imagen del disco
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
        return;
      }

      const filePath = path.join(process.cwd(), imageUrl);
      const fileExists = await exists(filePath);
      
      if (fileExists) {
        await unlink(filePath);
        this.logger.log(`🗑️ Imagen eliminada: ${imageUrl}`);
      }
    } catch (error) {
      this.logger.error('❌ Error eliminando imagen:', error.message);
    }
  }

  /**
   * Elimina múltiples imágenes
   */
  async deleteImages(imageUrls: string[]): Promise<void> {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return;
    }

    this.logger.log(`🗑️ Eliminando ${imageUrls.length} imágenes...`);

    const deletionPromises = imageUrls.map(url => this.deleteImage(url));
    await Promise.all(deletionPromises);

    this.logger.log(`✅ Imágenes eliminadas`);
  }

  /**
   * Genera una miniatura de una imagen
   */
  async generateThumbnail(
    base64Image: string,
    size: number = this.THUMBNAIL_SIZE,
  ): Promise<string> {
    try {
      // Si ya es URL, no podemos generar thumbnail (necesitaríamos leer el archivo)
      if (this.isUrl(base64Image)) {
        return base64Image;
      }

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
    
    // Si es URL, no podemos calcular tamaño
    if (this.isUrl(base64Image)) {
      return 0;
    }
    
    const sizeInBytes = (base64Image.length * 3) / 4;
    return sizeInBytes / (1024 * 1024); // MB
  }

  /**
   * Valida que las imágenes no excedan un tamaño máximo
   */
  validateImageSizes(base64Images: string[], maxMB: number = 20): boolean {
    if (!Array.isArray(base64Images)) return true;

    for (const img of base64Images) {
      // Skip URLs
      if (this.isUrl(img)) continue;
      
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
