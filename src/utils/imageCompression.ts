/**
 * Utilidad para comprimir y optimizar imágenes antes de subirlas
 * Reduce imágenes de 19MB a ~200-500KB manteniendo calidad visual
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 - 1.0
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: ImageCompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85, // 85% mantiene buena calidad
  maxSizeMB: 1, // Máximo 1MB por imagen
};

/**
 * Comprime una imagen a un tamaño y calidad óptimos
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calcular nuevas dimensiones manteniendo aspect ratio
          let { width, height } = img;
          const maxWidth = opts.maxWidth!;
          const maxHeight = opts.maxHeight!;

          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;

            if (width > height) {
              width = Math.min(width, maxWidth);
              height = width / aspectRatio;
            } else {
              height = Math.min(height, maxHeight);
              width = height * aspectRatio;
            }
          }

          // Crear canvas y comprimir
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a base64 con compresión
          let quality = opts.quality!;
          let compressed = canvas.toDataURL('image/jpeg', quality);

          // Reducir calidad iterativamente si excede el tamaño máximo
          while (compressed.length > opts.maxSizeMB! * 1024 * 1024 * 1.37 && quality > 0.1) {
            quality -= 0.05;
            compressed = canvas.toDataURL('image/jpeg', quality);
          }

          // Limpiar
          canvas.remove();
          resolve(compressed);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime múltiples imágenes en paralelo
 */
export async function compressImages(
  files: FileList | File[],
  options?: ImageCompressionOptions
): Promise<string[]> {
  const fileArray = Array.from(files);

  // Validar formatos
  const validFiles = fileArray.filter((file) => {
    const isValid = file.type.startsWith('image/');
    if (!isValid) {
      console.warn(`Archivo ignorado (no es imagen): ${file.name}`);
    }
    return isValid;
  });

  if (validFiles.length === 0) {
    throw new Error('No se encontraron imágenes válidas');
  }

  // Comprimir todas en paralelo
  const compressionPromises = validFiles.map((file) => {
    console.log(`📦 Comprimiendo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    return compressImage(file, options);
  });

  const compressed = await Promise.all(compressionPromises);

  // Mostrar estadísticas
  compressed.forEach((data, index) => {
    const originalSize = validFiles[index].size / 1024 / 1024;
    const compressedSize = (data.length * 0.75) / 1024 / 1024; // Base64 es ~133% del tamaño real
    const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    console.log(
      `✅ ${validFiles[index].name}: ${originalSize.toFixed(2)} MB → ${compressedSize.toFixed(2)} MB (Ahorro: ${savings}%)`
    );
  });

  return compressed;
}

/**
 * Obtiene información de una imagen sin cargarla completamente
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
        });
      };
      img.onerror = () => reject(new Error('Error al leer dimensiones'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Valida que un archivo no exceda límites
 */
export function validateImageFile(file: File, maxSizeMB: number = 20): boolean {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} no es una imagen válida`);
  }

  const sizeMB = file.size / 1024 / 1024;
  if (sizeMB > maxSizeMB) {
    throw new Error(
      `${file.name} es demasiado grande (${sizeMB.toFixed(1)} MB). Máximo: ${maxSizeMB} MB`
    );
  }

  return true;
}
