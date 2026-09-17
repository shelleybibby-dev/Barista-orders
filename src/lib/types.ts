export type ExtraGroup = "milk" | "shot" | "syrup";

export type OrderStatus = "queued" | "ready" | "completed";

export interface MenuSize {
  id: string;
  name: string;
  pricePence: number;
}

export interface MenuDrink {
  id: string;
  name: string;
  description: string;
  accent: string;
  foam: string;
  extras: string[];
  sizes: MenuSize[];
}

export interface MenuExtra {
  id: string;
  name: string;
  pricePence: number;
  group: ExtraGroup;
}

export interface Menu {
  cafeName: string;
  tagline: string;
  currency: "GBP";
  drinks: MenuDrink[];
  extras: MenuExtra[];
}

export interface OrderItemInput {
  drinkId: string;
  sizeId: string;
  extraIds: string[];
  quantity: number;
}

export interface OrderItemExtra {
  id: string;
  name: string;
  pricePence: number;
}

export interface OrderItem {
  id: string;
  drinkId: string;
  drinkName: string;
  sizeId: string;
  sizeName: string;
  extras: OrderItemExtra[];
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
}

export interface Order {
  id: string;
  ticketNumber: number;
  customerName: string;
  items: OrderItem[];
  totalPence: number;
  status: OrderStatus;
  createdAt: string;
  readyAt: string | null;
  completedAt: string | null;
}

export interface CreateOrderInput {
  customerName?: string;
  items: OrderItemInput[];
}

export interface OrdersPayload {
  type: "orders";
  orders: Order[];
}
