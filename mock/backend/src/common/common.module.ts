import { Global, Module } from '@nestjs/common';
import { ImageOptimizationService } from './image-optimization.service';

/**
 * Módulo global para servicios comunes
 * Permite usar ImageOptimizationService en cualquier módulo sin importarlo explícitamente
 */
@Global()
@Module({
  providers: [ImageOptimizationService],
  exports: [ImageOptimizationService],
})
export class CommonModule {}
