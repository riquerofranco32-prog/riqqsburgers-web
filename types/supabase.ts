export interface Tenant {
  id: string
  slug: string
  name: string
  tagline: string | null
  logo_url: string | null
  whatsapp_number: string
  mp_link: string | null
  delivery_cost: number
  primary_color: string
  secondary_color: string
  background_color: string
  instagram_handle: string | null
  address: string | null
  active: boolean
  created_at: string
}

export interface Category {
  id: string
  tenant_id: string
  name: string
  emoji: string | null
  sort_order: number
  active: boolean
}

export interface Product {
  id: string
  tenant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  badge: string | null
  available: boolean
  sort_order: number
  created_at: string
}

export interface Order {
  id: string
  tenant_id: string
  order_ref: string
  customer_name: string | null
  customer_phone: string | null
  delivery_type: 'domicilio' | 'retiro'
  address: string | null
  payment_method: 'mercadopago' | 'efectivo'
  items: OrderItem[]
  subtotal: number
  delivery_cost: number
  total: number
  status: string
  created_at: string
}

export interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
}

export interface TenantUser {
  id: string
  user_id: string
  tenant_id: string
  role: string
}

export type Database = {
  public: {
    Tables: {
      tenants: { Row: Tenant; Insert: Omit<Tenant, 'id' | 'created_at'>; Update: Partial<Omit<Tenant, 'id'>> }
      categories: { Row: Category; Insert: Omit<Category, 'id'>; Update: Partial<Omit<Category, 'id'>> }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at'>; Update: Partial<Omit<Product, 'id'>> }
      orders: { Row: Order; Insert: Omit<Order, 'id' | 'created_at'>; Update: Partial<Omit<Order, 'id'>> }
      tenant_users: { Row: TenantUser; Insert: Omit<TenantUser, 'id'>; Update: Partial<Omit<TenantUser, 'id'>> }
    }
  }
}
