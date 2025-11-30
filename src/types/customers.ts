export interface Customer {
  id: number;
  name: string;
  cedula?: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  postalCode?: string;
  country?: string;
  registrationDate?: string;
  createdAt?: string; // Para compatibilidad con datos existentes
  totalPurchases?: number;
  lastPurchaseDate?: string;
  status?: 'active' | 'inactive';
  notes?: string;
}

export interface CreateCustomerData {
  name: string;
  cedula?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  id: number;
  status?: 'active' | 'inactive';
}

export interface CustomerFilters {
  status?: 'active' | 'inactive' | 'all';
  city?: string;
  country?: string;
  search?: string;
}