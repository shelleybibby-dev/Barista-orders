export type ExtraGroup = "milk" | "shot" | "syrup" | "cream";

export type OrderStatus = "queued" | "ready" | "completed";

export type ProductKind = "drink" | "donut" | "milkshake" | "boba";

export interface MenuSize {
  id: string;
  name: string;
  pricePence: number;
}

export interface MenuProduct {
  id: string;
  name: string;
  description: string;
  accent: string;
  foam: string;
  extras: string[];
  sizes: MenuSize[];
}

export type MenuDrink = MenuProduct;
export type MenuDonut = MenuProduct;

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
  teas?: MenuDrink[];
  milkshakes?: MenuDrink[];
  bobas?: MenuDrink[];
  donuts: MenuDonut[];
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
  kind?: ProductKind;
  drinkId: string;
  drinkName: string;
  sizeId: string;
  sizeName: string;
  extras: OrderItemExtra[];
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
}

export type WorkerAction = "join" | "leave";

export interface Order {
  id: string;
  ticketNumber: number;
  customerName: string;
  items: OrderItem[];
  totalPence: number;
  status: OrderStatus;
  workers: string[];
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
