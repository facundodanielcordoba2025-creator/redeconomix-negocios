export type SaleProduct = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type HybridSale = {
  id: string;
  total: number;
  products: SaleProduct[];
  status: "pending" | "completed";
  date: string; // ISO Date String
  retailerId: string;
  paymentMethod?: string;
};

export type DailyStats = {
  sales: number;
  expenses: number;
  purchases: number;
  losses: number;
};
