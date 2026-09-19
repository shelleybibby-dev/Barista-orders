import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { getOrderEvents } from "@/lib/events";
import { getMenu } from "@/lib/menu";
import {
  OrderValidationError,
  buildOrderItem,
  canTransition,
} from "@/lib/pricing";
import { resolveOrdersPath } from "@/lib/storage-path";
import type { CreateOrderInput, Order, OrderStatus } from "@/lib/types";

const COMPLETED_KEEP_MS = 45 * 60 * 1000;
const COMPLETED_KEEP_COUNT = 12;
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

interface PersistedStore {
  nextTicket: number;
  orders: Order[];
}

export class OrderStore {
  constructor(
    private readonly filePath: string,
    private readonly events: EventEmitter,
  ) {
    this.ensureLoaded();
  }

  private cache: PersistedStore | null = null;

  list(): Order[] {
    this.pruneCompleted();
    const { queued, ready, completed } = this.grouped();
    return [...queued, ...ready, ...completed];
  }

  create(input: CreateOrderInput): Order {
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new OrderValidationError("Add at least one item before placing an order.");
    }

    if (input.items.length > 20) {
      throw new OrderValidationError("Too many items on one order.");
    }

    const menu = getMenu();
    const items = input.items.map((item, index) =>
      buildOrderItem(menu, item, randomUUID() + "-" + index),
    );

    const customerName = sanitiseName(input.customerName);
    const now = new Date().toISOString();
    const store = this.ensureLoaded();

    const order: Order = {
      id: randomUUID(),
      ticketNumber: store.nextTicket,
      customerName,
      items,
      totalPence: items.reduce((sum, item) => sum + item.lineTotalPence, 0),
      status: "queued",
      createdAt: now,
      readyAt: null,
      completedAt: null,
    };

    store.nextTicket += 1;
    store.orders.push(order);
    this.persist();
    this.events.emit("change");
    return order;
  }

  updateStatus(id: string, status: OrderStatus): Order {
    const store = this.ensureLoaded();
    const order = store.orders.find((item) => item.id === id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }

    if (order.status === status) {
      return order;
    }

    if (!canTransition(order.status, status)) {
      throw new OrderValidationError(
        `Cannot move an order from ${order.status} to ${status}.`,
      );
    }

    const now = new Date().toISOString();
    order.status = status;
    if (status === "ready") {
      order.readyAt = now;
      order.completedAt = null;
    }
    if (status === "completed") {
      order.completedAt = now;
    }
    if (status === "queued") {
      order.readyAt = null;
      order.completedAt = null;
    }

    this.persist();
    this.events.emit("change");
    return order;
  }

  private grouped() {
    const store = this.ensureLoaded();
    const queued = store.orders
      .filter((order) => order.status === "queued")
      .sort(byCreated);
    const ready = store.orders
      .filter((order) => order.status === "ready")
      .sort(byCreated);
    const completed = store.orders
      .filter((order) => order.status === "completed")
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
      .slice(0, COMPLETED_KEEP_COUNT)
      .filter((order) => {
        if (!order.completedAt) return true;
        return Date.now() - new Date(order.completedAt).getTime() < COMPLETED_KEEP_MS;
      })
      .reverse();

    return { queued, ready, completed };
  }

  private pruneCompleted() {
    const store = this.ensureLoaded();
    const cutoff = Date.now() - PRUNE_AFTER_MS;
    const next = store.orders.filter((order) => {
      if (order.status !== "completed" || !order.completedAt) return true;
      return new Date(order.completedAt).getTime() >= cutoff;
    });

    if (next.length !== store.orders.length) {
      store.orders = next;
      this.persist();
    }
  }

  private ensureLoaded(): PersistedStore {
    if (this.cache) return this.cache;

    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as PersistedStore;
      this.cache = {
        nextTicket: parsed.nextTicket || 1,
        orders: Array.isArray(parsed.orders)
          ? parsed.orders.map((order) => {
              const cleaned = { ...order } as Order & { workers?: unknown };
              delete cleaned.workers;
              return cleaned as Order;
            })
          : [],
      };
    } catch {
      this.cache = { nextTicket: 1, orders: [] };
    }

    return this.cache;
  }

  private persist() {
    const store = this.ensureLoaded();
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
    fs.renameSync(tmp, this.filePath);
  }
}

export class OrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Order ${id} was not found.`);
    this.name = "OrderNotFoundError";
  }
}

function sanitiseName(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 40);
}

function byCreated(a: Order, b: Order): number {
  return a.createdAt.localeCompare(b.createdAt);
}

export function createOrderStore(
  filePath = resolveOrdersPath(),
  events = getOrderEvents(),
): OrderStore {
  return new OrderStore(filePath, events);
}

export function getOrderStore(): OrderStore {
  const globalForStore = globalThis as typeof globalThis & {
    __baristaOrderStore?: OrderStore;
  };

  if (!globalForStore.__baristaOrderStore) {
    const filePath = resolveOrdersPath();
    console.info(`[barista-orders] Saving the live queue to ${filePath}`);
    globalForStore.__baristaOrderStore = createOrderStore(filePath);
  }

  return globalForStore.__baristaOrderStore;
}
