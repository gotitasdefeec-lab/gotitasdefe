import { PoliciesService } from '../policies/policies.service';
import { Controller, Get, Post, Body, Param, ParseIntPipe, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from '../products/products.service';
import { StoreService } from '../store/store.service';
import { CategoriesService } from '../categories/categories.service';
import { CarouselService } from '../carousel/carousel.service';
import { SalesService } from '../sales/sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaypalService } from '../paypal/paypal.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    private productsService: ProductsService,
    private storeService: StoreService,
    private categoriesService: CategoriesService,
    private salesService: SalesService,
    private carouselService: CarouselService,
    private inventoryService: InventoryService,
    private paypalService: PaypalService,
  ) { }

  // Helper to determine order status based on payment method
  private determineOrderStatus(paymentMethod?: string): string {
    if (!paymentMethod) return 'pending';
    
    const lowerMethod = paymentMethod.toLowerCase();
    const instantPaymentMethods = ['paypal', 'tarjeta', 'credit_card', 'tarjeta_credito', 'tarjeta_debito'];
    
    // Marcar como pagado si es un método de pago instantáneo
    if (instantPaymentMethods.includes(lowerMethod)) {
      return 'paid';
    }
    
    // Otros métodos (transferencia, depósito, etc.) quedan como pendientes
    return 'pending';
  }

  // Authenticated Checkout
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new order for authenticated customer' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async checkout(@Req() req, @Body() orderData: any) {
    const userId = req.user?.userId;
    return this.salesService.createForCustomer(userId, orderData);
  }


  // Helper to map product to storefront format
  private mapProductForStorefront(product: any) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      images: Array.isArray(product.images) ? product.images : [],
      categoryId: 1, // Default category ID
      category: product.category,
      stock: product.stock,
      sku: product.sku,
      active: product.status === 'active',
      featured: true, // All products in featured endpoint are featured
      tags: [],
      specifications: {},
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  // Public Product Endpoints
  @Get('products')
  @ApiOperation({ summary: 'Get all products (public)' })
  async getProducts() {
    const products = await this.productsService.findAll();
    // Only return active products for the storefront
    return products
      .filter(product => product.status === 'active')
      .map(product => this.mapProductForStorefront(product));
  }

  @Get('products/featured')
  @ApiOperation({ summary: 'Get featured products (public)' })
  async getFeaturedProducts() {
    const products = await this.productsService.findAll();
    // For now, just return active products. You can add a 'featured' field to the schema later
    return products
      .filter(product => product.status === 'active')
      .slice(0, 8)
      .map(product => this.mapProductForStorefront(product));
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID (public)' })
  async getProduct(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productsService.findOne(id);
    // Only return if product is active
    if (product.status !== 'active') {
      throw new Error('Product not found');
    }
    return this.mapProductForStorefront(product);
  }

  // Public Category Endpoints
  @Get('categories')
  @ApiOperation({ summary: 'Get all categories (public)' })
  getCategories() {
    return this.categoriesService.findAll();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID (public)' })
  async getCategory(@Param('id', ParseIntPipe) id: number) {
    const categories = await this.categoriesService.findAll();
    return categories.find(category => category.id === id);
  }

  @Get('categories/:name/products')
  @ApiOperation({ summary: 'Get products by category name (public)' })
  async getProductsByCategory(@Param('name') categoryName: string) {
    const products = await this.productsService.findAll();
    return products
      .filter(product => product.status === 'active' && product.category === categoryName)
      .map(product => this.mapProductForStorefront(product));
  }

  // Public Store Configuration Endpoints
  @Get('store/general')
  @ApiOperation({ summary: 'Get store general info (public)' })
  getStoreGeneral() {
    return this.storeService.getGeneral();
  }

  @Get('store/theme')
  @ApiOperation({ summary: 'Get store theme (public)' })
  getStoreTheme() {
    return this.storeService.getTheme();
  }

  @Get('store/social')
  @ApiOperation({ summary: 'Get store social links (public)' })
  getStoreSocial() {
    return this.storeService.getSocial();
  }

  @Get('store/schedule')
  @ApiOperation({ summary: 'Get store schedule (public)' })
  getStoreSchedule() {
    return this.storeService.getSchedule();
  }

  @Get('store/payment')
  @ApiOperation({ summary: 'Get store payment methods (public)' })
  getStorePayment() {
    return this.storeService.getPayment();
  }

  @Get('store/shipping')
  @ApiOperation({ summary: 'Get store shipping info (public)' })
  getStoreShipping() {
    return this.storeService.getShipping();
  }

  @Get('store/logo')
  @ApiOperation({ summary: 'Get store logo (public)' })
  getStoreLogo() {
    return this.storeService.getLogo();
  }

  @Get('store/favicon')
  @ApiOperation({ summary: 'Get store favicon (public)' })
  getStoreFavicon() {
    return this.storeService.getFavicon();
  }

  @Get('store/config')
  @ApiOperation({ summary: 'Get complete store configuration (public)' })
  async getCompleteStoreConfig() {
    const [general, theme, social, schedule, payment, shipping, logo, favicon] = await Promise.all([
      this.storeService.getGeneral(),
      this.storeService.getTheme(),
      this.storeService.getSocial(),
      this.storeService.getSchedule(),
      this.storeService.getPayment(),
      this.storeService.getShipping(),
      this.storeService.getLogo(),
      this.storeService.getFavicon(),
    ]);

    return {
      general,
      theme,
      social,
      schedule,
      payment,
      shipping,
      logo,
      favicon,
    };
  }

  // Public Carousel Endpoint
  @Get('carousel')
  @ApiOperation({ summary: 'Get carousel slides (public)' })
  async getCarousel() {
    try {
      // Get carousel data from the real service
      const carouselData = await this.carouselService.findAll();

      // Return in the expected format with the available fields
      return carouselData.map(slide => ({
        id: slide.id,
        title: slide.title || '',
        description: slide.description || '',
        imageUrl: slide.imageUrl,
        link: "/products",
        buttonText: "Ver Productos",
        active: true
      }));
    } catch (error) {
      console.error('Error fetching carousel data:', error);

      // Return empty array if service fails
      return [];
    }
  }

  // Public Order Endpoints
  @Post('orders')
  @ApiOperation({
    summary: 'Create new order (public)',
    description: 'Create a new order without authentication for checkout process'
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order data'
  })
  async createPublicOrder(@Body() orderData: any) {
    try {
      // Validate required fields
      if (!orderData.customerName || !orderData.total || !orderData.items) {
        throw new BadRequestException('Missing required order information');
      }

      if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new BadRequestException('Order must contain at least one item');
      }

      // Create sale record (using any type since we don't have the DTO available)
      // Compute shipping meta if present
      const shippingMeta = (() => {
        const meta: any = {};
        if (orderData.shippingMethodId) meta.shippingMethodId = String(orderData.shippingMethodId);
        if (orderData.shippingMethodName) meta.shippingMethodName = String(orderData.shippingMethodName);
        if (orderData.shippingCost != null) meta.shippingCost = Number(orderData.shippingCost);
        if (orderData.shippingCarrier) meta.shippingCarrier = String(orderData.shippingCarrier);
        if (orderData.shippingRegion) meta.shippingRegion = String(orderData.shippingRegion);
        if (orderData.shippingScope) meta.shippingScope = String(orderData.shippingScope);
        if (orderData.shippingEta) meta.shippingEta = String(orderData.shippingEta);
        return meta;
      })();

      const saleData = {
        customerName: orderData.customerName,
        cedula: orderData.cedula || '',
        customerEmail: orderData.customerEmail || '',
        status: this.determineOrderStatus(orderData.paymentMethod),
        total: orderData.total,
        subtotal: orderData.subtotal,
        taxPercent: orderData.taxPercent || 0,
        discountPercent: orderData.discountPercent || 0,
        items: orderData.items.map((item: any) => ({
          productId: item.productId,
          name: item.name || '',
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        notes: orderData.notes || '',
        shippingAddress: orderData.shippingAddress || '',
        shippingPhone: orderData.shippingPhone || '',
        ...shippingMeta,
        date: orderData.date || new Date().toISOString(),
        attachments: []
      };

      const sale: any = await this.salesService.create(saleData as any);

      return {
        id: sale.id,
        orderNumber: `ORD-${sale.id.toString().padStart(6, '0')}`,
        status: sale.status,
        total: sale.total,
        customerName: sale.customerName,
        createdAt: sale.createdAt || new Date(),
        // Echo shipping meta for confirmation
        shippingMethodId: sale.shippingMethodId,
        shippingMethodName: sale.shippingMethodName,
        shippingCost: sale.shippingCost,
        shippingCarrier: sale.shippingCarrier,
        shippingRegion: sale.shippingRegion,
        shippingScope: sale.shippingScope,
        shippingEta: sale.shippingEta
      };
    } catch (error) {
      console.error('Error creating public order:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to create order. Please try again.');
    }
  }
  // Public: Get order by ID with product details (for order details page)
  @Get('orders/:id')
  @ApiOperation({ summary: 'Get public order by ID (with product details)' })
  async getPublicOrder(@Param('id', ParseIntPipe) id: number) {
    // Use salesService.findOne, which now includes items.product
    const order = await this.salesService.findOne(id);
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    return order;
  }

  // PayPal Endpoints
  // Temporary storage for order data (in production, use Redis or database)
  private paypalOrderDataMap = new Map<string, any>();

  @Post('paypal/create-order')
  @ApiOperation({ summary: 'Create PayPal order' })
  @ApiResponse({ status: 201, description: 'PayPal order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createPayPalOrder(@Body() body: { amount: number; currency: string; orderData: any }) {
    try {
      const { amount, currency, orderData } = body;

      if (!amount || amount <= 0) {
        throw new BadRequestException('Invalid amount');
      }

      // Create PayPal order
      const paypalOrder = await this.paypalService.createOrder(amount, currency || 'USD');

      // Store order data temporarily (associate with PayPal order ID)
      this.paypalOrderDataMap.set(paypalOrder.id, orderData);

      // Clean up old entries after 1 hour
      setTimeout(() => {
        this.paypalOrderDataMap.delete(paypalOrder.id);
      }, 60 * 60 * 1000);

      return {
        paypalOrderId: paypalOrder.id,
        status: paypalOrder.status,
        links: paypalOrder.links,
      };
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw new BadRequestException(error.message || 'Failed to create PayPal order');
    }
  }

  @Post('paypal/capture-order/:orderId')
  @ApiOperation({ summary: 'Capture PayPal order and create sale' })
  @ApiResponse({ status: 200, description: 'Payment captured and order created' })
  @ApiResponse({ status: 400, description: 'Invalid request or payment failed' })
  async capturePayPalOrder(@Param('orderId') paypalOrderId: string, @Body() body?: any) {
    try {
      // Check if order data exists BEFORE capturing payment
      const orderData = this.paypalOrderDataMap.get(paypalOrderId);

      if (!orderData) {
        // Order already processed or doesn't exist
        throw new BadRequestException('Order already processed or not found. Please create a new order.');
      }

      // Clean up stored data immediately to prevent duplicate processing
      this.paypalOrderDataMap.delete(paypalOrderId);

      // Capture the PayPal payment
      const captureResult = await this.paypalService.captureOrder(paypalOrderId);

      if (captureResult.status !== 'COMPLETED') {
        throw new BadRequestException('Payment was not completed');
      }

      // Compute shipping meta if present
      const shippingMeta = (() => {
        const meta: any = {};
        if (orderData.shippingMethodId) meta.shippingMethodId = String(orderData.shippingMethodId);
        if (orderData.shippingMethodName) meta.shippingMethodName = String(orderData.shippingMethodName);
        if (orderData.shippingCost != null) meta.shippingCost = Number(orderData.shippingCost);
        if (orderData.shippingCarrier) meta.shippingCarrier = String(orderData.shippingCarrier);
        if (orderData.shippingRegion) meta.shippingRegion = String(orderData.shippingRegion);
        if (orderData.shippingScope) meta.shippingScope = String(orderData.shippingScope);
        if (orderData.shippingEta) meta.shippingEta = String(orderData.shippingEta);
        return meta;
      })();

      // Create sale record with the original order data
      const saleData = {
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail || captureResult.payer?.email_address || '',
        cedula: orderData.cedula || '',
        status: 'paid', // Mark as paid since PayPal payment is completed
        total: orderData.total,
        subtotal: orderData.subtotal,
        taxPercent: orderData.taxPercent || 0,
        discountPercent: orderData.discountPercent || 0,
        items: orderData.items.map((item: any) => ({
          productId: item.productId,
          name: item.name || '',
          quantity: item.quantity,
          price: item.price,
          total: item.total || item.price * item.quantity
        })),
        notes: orderData.notes ? `${orderData.notes}\n\nPayPal Order ID: ${paypalOrderId}` : `PayPal Order ID: ${paypalOrderId}`,
        shippingAddress: orderData.shippingAddress || '',
        shippingPhone: orderData.shippingPhone || '',
        ...shippingMeta,
        date: new Date().toISOString(),
        attachments: [],
        paymentMethod: 'paypal',
        paymentDetails: {
          paypalOrderId: paypalOrderId,
          paypalPayerId: captureResult.payer?.payer_id,
          paypalEmail: captureResult.payer?.email_address,
        },
      };

      const sale = await this.salesService.create(saleData as any);

      return {
        success: true,
        orderId: sale.id,
        paypalDetails: {
          orderId: paypalOrderId,
          status: captureResult.status,
          payer: captureResult.payer,
        },
      };
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      throw new BadRequestException(error.message || 'Failed to capture PayPal payment');
    }
  }
}