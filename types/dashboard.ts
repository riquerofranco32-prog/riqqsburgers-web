export type DailyRevenue = {
  date: string;
  total: number;
};

export type CategoryRevenue = {
  name: string;
  value: number;
  color: string;
};

export type TopProduct = {
  product_id: string;
  name: string;
  category_name: string | null;
  category_emoji: string | null;
  quantity: number;
  revenue: number;
};

export type AnalyticsRange = "today" | "week" | "month";

/** Returned by /api/[slug]/admin/kpis — today KPIs computed server-side */
export type TodayKPIsResponse = {
  ordersToday: number;
  ordersTodayChange: number | null;
  revenueToday: number;
  revenueTodayChange: number | null;
  avgTicketToday: number;
  avgTicketChange: number | null;
  topProductToday: { name: string; qty: number } | null;
  activeProducts: number;
  salesLast7Days: DailyRevenue[];
  categoryRevenue: CategoryRevenue[];
  topProducts: TopProduct[];
};

export type AnalyticsResponse = {
  revenue: number;
  orderCount: number;
  avgTicket: number;
  revenueChange: number | null;
  orderCountChange: number | null;
  avgTicketChange: number | null;
  topProducts: TopProduct[];
  dailyRevenue: DailyRevenue[];
  categoryRevenue: CategoryRevenue[];
};
