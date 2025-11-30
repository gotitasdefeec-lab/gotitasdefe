export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  images?: string[];
  image?: string;
  categoryId: number;
  category?: Category;
  stock: number;
  sku: string;
  active: boolean;
  featured: boolean;
  tags?: string[];
  specifications?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  cedula?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  customerId: number;
  customer?: Customer;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
  total: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface StoreConfig {
  general: {
    name: string;
    description: string;
    email: string;
    phone: string;
    address: string;
    currency: string;
    about?: string;
    contact?: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    darkMode: boolean;
  };
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string; // legacy support
    x?: string;       // X (Twitter)
    whatsapp?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
  };
  shipping: {
    policy?: string;
    standardCost?: number;
    freeShippingMin?: number;
    freeShippingThreshold?: number;
    carriers?: Array<{
      id: number;
      name: string;
      enabled: boolean;
    }>;
    rates?: Array<{
      id: number;
      scope: 'pais' | 'provincia' | 'ciudad';
      region: string;
      price: number;
      carrierId?: number;
    }>;
    shippingRates?: Array<{
      zone: string;
      rate: number;
    }>;
  };
  payment: {
    methods: Array<
      string |
      {
        key: string;
        label: string;
        enabled: boolean;
        instructions?: string;
        bankInfo?: string;
      }
    >;
    instructions?: Record<string, string>;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}