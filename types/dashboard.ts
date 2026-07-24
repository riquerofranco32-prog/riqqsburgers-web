export type DailyRevenue = {
  date: string;
  total: number;
  /** YYYY-MM-DD en Argentina — permite pedir el cierre de caja de este día */
  isoDate: string;
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

export type AnalyticsRange = "today" | "week" | "twoWeeks" | "month";

export type StockAlertProduct = { id: string; name: string };
export type LowStockAlertProduct = StockAlertProduct & {
  stock_quantity: number;
};

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
  unavailableProducts: StockAlertProduct[];
  lowStockProducts: LowStockAlertProduct[];
  /** Pedidos cancelados hoy y su % sobre el total de pedidos de hoy (incl. cancelados) */
  cancelledCount: number;
  cancelledRate: number;
};

export type CategoryRevenueTrend = {
  name: string;
  value: number;
  /** % vs. el período anterior de igual longitud, null si no hubo ventas antes */
  changePct: number | null;
};

export type BranchRevenue = {
  branch_id: string;
  name: string;
  revenue: number;
  orderCount: number;
  cancelledRate: number;
};

/** Alerta calculada sobre datos ya agregados — sin queries extra */
export type Insight = {
  severity: "warn" | "info";
  message: string;
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
  categoryRevenueChange: CategoryRevenueTrend[];
  peakHour: { hour: number; count: number } | null;
  /** Pedidos cancelados en el período y su % sobre el total (incl. cancelados) */
  cancelledCount: number;
  cancelledRate: number;
  /** Solo presente si el tenant tiene más de 1 sucursal activa */
  branchRevenue: BranchRevenue[] | null;
  insights: Insight[];
};
