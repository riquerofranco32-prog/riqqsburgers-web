export type DashboardKPIs = {
  ordersToday: number;
  ordersTodayChange: number | null;
  revenueToday: number;
  revenueTodayChange: number | null;
  avgTicketToday: number;
  avgTicketChange: number | null;
  topProductToday: { name: string; qty: number } | null;
};

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

export type AnalyticsResponse = {
  revenue: number;
  orderCount: number;
  avgTicket: number;
  topProducts: { name: string; quantity: number }[];
  dailyRevenue: DailyRevenue[];
};
