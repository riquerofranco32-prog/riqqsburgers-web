import type { BusinessHours } from "@/lib/businessHours";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  banner_url: string | null;
  hero_video_url: string | null;
  whatsapp_number: string;
  mp_link: string | null;
  delivery_cost: number;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  instagram_handle: string | null;
  address: string | null;
  schedule: string | null;
  is_open: boolean;
  business_hours: BusinessHours | null;
  prep_time_minutes: number | null;
  active: boolean;
  brand: Record<string, string> | null;
  plan: string;
  min_order_amount: number | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  delivery_mode: "none" | "fixed" | "zones" | "distance";
  delivery_city_hint: string | null;
  delivery_out_of_range_msg: string;
}

export interface DeliveryZone {
  id: string;
  tenant_id: string;
  name: string;
  price: number;
  active: boolean;
  sort_order: number;
}

export interface DeliveryRange {
  id: string;
  tenant_id: string;
  max_km: number;
  price: number;
  active: boolean;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  mp_preapproval_id: string | null;
  mp_payer_id: string | null;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  active: boolean;
  visible_from: string | null;
  visible_to: string | null;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  badge: string | null;
  available: boolean;
  sort_order: number;
  is_featured: boolean;
  featured_order: number;
  created_at: string;
  extras: Array<{ name: string; price: number }>;
  addons: Array<{ name: string; price: number }>;
  stock_quantity: number | null;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_ref: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  delivery_type: "domicilio" | "retiro" | "pickup" | "delivery";
  address: string | null;
  payment_method: "mercadopago" | "efectivo" | "cash" | "transfer";
  notes: string | null;
  kitchen_notes: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_cost: number;
  total: number;
  status: string;
  created_at: string;
  coupon_code: string | null;
  discount_amount: number | null;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_zone_name: string | null;
  delivery_distance_km: number | null;
}

export interface Review {
  id: string;
  tenant_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  tenant_id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  uses: number;
  active: boolean;
  show_in_menu: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  extras?: Array<{ name: string; price: number; qty: number }>;
}

export interface TenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  role: "admin" | "superadmin";
}

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Omit<Tenant, "id" | "created_at">;
        Update: Partial<Omit<Tenant, "id">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id">;
        Update: Partial<Omit<Category, "id">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at">;
        Update: Partial<Omit<Product, "id">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at">;
        Update: Partial<Omit<Order, "id">>;
      };
      tenant_users: {
        Row: TenantUser;
        Insert: Omit<TenantUser, "id">;
        Update: Partial<Omit<TenantUser, "id">>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Subscription, "id" | "created_at">>;
      };
    };
  };
};
