import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.inventory.findMany({
      include: { product: true },
    });
  }

  async findByProductId(productId: number) {
    return this.prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });
  }

  async updateStock(id: number, quantity: number) {
    // Obtener el inventario para conocer el productId
    const inventory = await this.prisma.inventory.findUnique({ where: { id } });
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    // Usar transacción para actualizar inventory Y product stock simultáneamente
    return this.prisma.$transaction(async (tx) => {
      // Actualizar inventario
      const updatedInventory = await tx.inventory.update({
        where: { id },
        data: { quantity, lastMovement: new Date() },
      });

      // Actualizar stock del producto también para mantener sincronización
      await tx.product.update({
        where: { id: inventory.productId },
        data: { stock: quantity },
      });

      return updatedInventory;
    });
  }

  async registerMovement(
    id: number,
    type: 'entrada' | 'salida',
    quantity: number,
    reason?: string,
  ) {
    const inventory = await this.prisma.inventory.findUnique({ where: { id } });
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const movements = Array.isArray(inventory.movements)
      ? (inventory.movements as any[])
      : [];
    const stockHistory = Array.isArray(inventory.stockHistory)
      ? (inventory.stockHistory as any[])
      : [];

    const delta = type === 'entrada' ? quantity : -quantity;
    const newQuantity = Math.max(0, inventory.quantity + delta);
    const now = new Date().toISOString();

    // Usar transacción para actualizar inventory Y product stock simultáneamente
    return this.prisma.$transaction(async (tx) => {
      // Actualizar inventario
      const updatedInventory = await tx.inventory.update({
        where: { id },
        data: {
          quantity: newQuantity,
          lastMovement: new Date(),
          movements: [
            ...movements,
            { date: now, type, quantity, reason: reason || '' },
          ],
          stockHistory: [...stockHistory, { date: now, stock: newQuantity }],
        },
      });

      // Actualizar stock del producto también para mantener sincronización
      await tx.product.update({
        where: { id: inventory.productId },
        data: { stock: newQuantity },
      });

      return updatedInventory;
    });
  }
}
