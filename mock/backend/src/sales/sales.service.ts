import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface OrderItemPayload {
  productId: number;
  quantity: number;
}

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private async createSaleTransaction(
    tx: Prisma.TransactionClient,
    items: OrderItemPayload[],
    data: any,
    customerId?: number
  ) {
    const productIds = items.map((item) => item.productId);
    const productsInDb = await tx.product.findMany({
      where: { id: { in: productIds } },
      include: { inventory: true },
    });

    const productsMap = new Map(productsInDb.map((p) => [p.id, p]));
    let secureSubtotal = 0;

    for (const item of items) {
      const product = productsMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`El producto con ID ${item.productId} no fue encontrado.`);
      }
      const stock = product.inventory?.quantity ?? 0;
      if (stock < item.quantity) {
        throw new BadRequestException(`No hay suficiente stock para el producto "${product.name}".`);
      }
      secureSubtotal += product.price * item.quantity;
    }

    const shippingCost = Number(data.shippingCost) || 0;
    const secureTotal = secureSubtotal + shippingCost;

    const saleData: Prisma.SaleCreateInput = {
      status: 'pending',
      subtotal: secureSubtotal,
      total: secureTotal,
      shippingCost: shippingCost,
      shippingAddress: data.shippingAddress || '',
      shippingMethodName: data.shippingMethodName || '',
      notes: data.notes || '',
      items: {
        create: items.map(item => {
          const product = productsMap.get(item.productId)!;
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          };
        }),
      },
    };

    if (customerId) {
      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        throw new NotFoundException('Cliente no encontrado.');
      }
      saleData.customer = { connect: { id: customerId } };
      saleData.customerName = customer.name;
      saleData.customerEmail = customer.email;
      saleData.cedula = data.cedula || customer.cedula || '';
      saleData.shippingPhone = data.shippingPhone || customer.phone || '';

      // Update customer stats and info from the order
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalPurchases: { increment: secureTotal },
          lastPurchaseDate: new Date(),
          cedula: customer.cedula || data.cedula || undefined,
          phone: customer.phone || data.shippingPhone || undefined,
          address: customer.address || data.shippingAddress || undefined,
        },
      });

    } else {
      saleData.customerName = data.customerName || 'N/A';
      saleData.customerEmail = data.customerEmail || '';
      saleData.cedula = data.cedula || '';
      saleData.shippingPhone = data.shippingPhone || '';
    }

    const sale = await tx.sale.create({ data: saleData });

    for (const item of items) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return sale;
  }

  async create(data: any) {
    const items: OrderItemPayload[] = Array.isArray(data.items)
      ? data.items.filter(it => it.productId && it.quantity > 0)
      : [];

    if (items.length === 0) {
      throw new BadRequestException('La orden debe contener al menos un item válido.');
    }

    const sale = await this.prisma.$transaction(async (tx) => {
      return this.createSaleTransaction(tx, items, data);
    });

    // Fire-and-forget push notification about new sale
    this.notifications
      .sendToAll({
        title: '🛒 Nueva venta',
        body: `Venta #${sale.id} creada por $${Number(sale.total || 0).toFixed(2)}`,
        icon: '/favicon.png',
        badge: '/favicon.png',
        data: { url: '/sales' },
      })
      .catch(() => {});

    // Optional: low stock alerts for any affected products
    try {
      const productIds = items.map((i) => i.productId);
      if (productIds.length) {
        const prods = await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          include: { inventory: true },
        });
        const low = prods.filter((p) => {
          const stock = p.inventory?.quantity ?? p.stock ?? 0;
          const min = p.inventory?.minStock ?? p.minStock ?? 10;
          return stock <= min;
        });
        if (low.length) {
          const names = low.slice(0, 3).map((p) => `"${p.name}"`).join(', ');
          const extra = low.length > 3 ? ` y ${low.length - 3} más` : '';
          this.notifications
            .sendToAll({
              title: '⚠️ Stock bajo',
              body: `${names}${extra} en mínimo de stock`,
              icon: '/favicon.png',
              badge: '/favicon.png',
              data: { url: '/inventory' },
            })
            .catch(() => {});
        }
      }
    } catch {}

    return sale;
  }

  async createForCustomer(customerId: number, data: any) {
    const items: OrderItemPayload[] = Array.isArray(data.items)
      ? data.items.filter(it => it.productId && it.quantity > 0)
      : [];

    if (items.length === 0) {
      throw new BadRequestException('La orden debe contener al menos un item válido.');
    }

    const sale = await this.prisma.$transaction(async (tx) => {
      return this.createSaleTransaction(tx, items, data, customerId);
    });

    this.notifications
      .sendToAll({
        title: '🛒 Nueva venta',
        body: `Venta #${sale.id} creada por $${Number(sale.total || 0).toFixed(2)}`,
        icon: '/favicon.png',
        badge: '/favicon.png',
        data: { url: '/sales' },
      })
      .catch(() => {});

    // Optional low-stock check similar to create()
    try {
      const productIds = items.map((i) => i.productId);
      if (productIds.length) {
        const prods = await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          include: { inventory: true },
        });
        const low = prods.filter((p) => {
          const stock = p.inventory?.quantity ?? p.stock ?? 0;
          const min = p.inventory?.minStock ?? p.minStock ?? 10;
          return stock <= min;
        });
        if (low.length) {
          const names = low.slice(0, 3).map((p) => `"${p.name}"`).join(', ');
          const extra = low.length > 3 ? ` y ${low.length - 3} más` : '';
          this.notifications
            .sendToAll({
              title: '⚠️ Stock bajo',
              body: `${names}${extra} en mínimo de stock`,
              icon: '/favicon.png',
              badge: '/favicon.png',
              data: { url: '/inventory' },
            })
            .catch(() => {});
        }
      }
    } catch {}

    return sale;
  }

  async findAll() {
    return this.prisma.sale.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const updatedSale = await tx.sale.update({
        where: { id },
        data: data,
      });

      const completedStatuses = ['paid', 'completed', 'delivered'];
      const isCompletingOrder = data.status && completedStatuses.includes(data.status.toLowerCase());

      if (isCompletingOrder) {
        const saleDetails = await tx.sale.findUnique({ where: { id } });
        
        if (!saleDetails.customerId && saleDetails.customerEmail) {
          let customer = await tx.customer.findUnique({
            where: { email: saleDetails.customerEmail },
          });

          if (customer) {
            // Customer exists, update their stats and info
            customer = await tx.customer.update({
              where: { id: customer.id },
              data: {
                totalPurchases: { increment: saleDetails.total },
                lastPurchaseDate: new Date(),
                cedula: customer.cedula || saleDetails.cedula || '',
                phone: customer.phone || saleDetails.shippingPhone || '',
                address: customer.address || saleDetails.shippingAddress || '',
              },
            });
          } else {
            // Customer does not exist, create them
            customer = await tx.customer.create({
              data: {
                name: saleDetails.customerName || 'Usuario Invitado',
                email: saleDetails.customerEmail,
                phone: saleDetails.shippingPhone || '',
                address: saleDetails.shippingAddress || '',
                cedula: saleDetails.cedula || '',
                totalPurchases: saleDetails.total,
                lastPurchaseDate: new Date(),
              },
            });
          }

          // Associate the sale with the customer
          await tx.sale.update({
            where: { id },
            data: { customerId: customer.id },
          });
        }
      }

      return updatedSale;
    });
  }

  async delete(id: number) {
    return this.prisma.sale.delete({ where: { id } });
  }

  async cancel(id: number, reason?: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      throw new NotFoundException(`Venta con id ${id} no encontrada`);
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.sale.update({
        where: { id },
        data: { status: 'cancelled', cancellationReason: reason || 'Cancelado por el sistema' },
      });
    });
  }
}
