import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it } from "vitest";
import { formatGbp } from "@/lib/money";
import { createOrderStore } from "@/lib/orders";
import {
  OrderValidationError,
  buildOrderItem,
  canTransition,
  priceUnitPence,
} from "@/lib/pricing";
import type { Menu } from "@/lib/types";

const menu: Menu = {
  cafeName: "Test Café",
  tagline: "Test",
  currency: "GBP",
  drinks: [
    {
      id: "espresso",
      name: "Espresso",
      description: "Short",
      accent: "#000",
      foam: "#fff",
      extras: ["extra-shot"],
      sizes: [
        { id: "single", name: "Single", pricePence: 220 },
        { id: "double", name: "Double", pricePence: 260 },
      ],
    },
    {
      id: "latte",
      name: "Latte",
      description: "Milky",
      accent: "#000",
      foam: "#fff",
      extras: ["oat", "almond", "extra-shot", "syrup"],
      sizes: [
        { id: "small", name: "Small", pricePence: 340 },
        { id: "regular", name: "Regular", pricePence: 380 },
        { id: "large", name: "Large", pricePence: 420 },
      ],
    },
  ],
  extras: [
    { id: "oat", name: "Oat milk", pricePence: 40, group: "milk" },
    { id: "almond", name: "Almond milk", pricePence: 40, group: "milk" },
    { id: "extra-shot", name: "Extra shot", pricePence: 60, group: "shot" },
    { id: "syrup", name: "Syrup", pricePence: 40, group: "syrup" },
  ],
};

describe("pricing", () => {
  it("formats British pounds from pence", () => {
    expect(formatGbp(220)).toBe("£2.20");
    expect(formatGbp(380)).toBe("£3.80");
  });

  it("prices espresso single and double with no large", () => {
    expect(priceUnitPence(menu.drinks[0], "single", [], menu.extras)).toBe(220);
    expect(priceUnitPence(menu.drinks[0], "double", [], menu.extras)).toBe(260);
    expect(menu.drinks[0].sizes.map((size) => size.id)).toEqual(["single", "double"]);
  });

  it("adds oat milk, extra shot and syrup to a regular latte", () => {
    expect(
      priceUnitPence(menu.drinks[1], "regular", ["oat", "extra-shot", "syrup"], menu.extras),
    ).toBe(380 + 40 + 60 + 40);
  });

  it("rejects two milk alternatives on one drink", () => {
    expect(() =>
      priceUnitPence(menu.drinks[1], "regular", ["oat", "almond"], menu.extras),
    ).toThrow(OrderValidationError);
  });

  it("rejects oat milk on espresso", () => {
    expect(() => priceUnitPence(menu.drinks[0], "single", ["oat"], menu.extras)).toThrow(
      /not available/,
    );
  });

  it("builds a line total from quantity", () => {
    const item = buildOrderItem(
      menu,
      { drinkId: "latte", sizeId: "large", extraIds: ["oat"], quantity: 2 },
      "line-1",
    );
    expect(item.lineTotalPence).toBe((420 + 40) * 2);
    expect(item.extras.map((extra) => extra.name)).toEqual(["Oat milk"]);
  });
});

describe("status transitions", () => {
  it("allows barista flow with a restore from completed", () => {
    expect(canTransition("queued", "ready")).toBe(true);
    expect(canTransition("queued", "completed")).toBe(true);
    expect(canTransition("ready", "completed")).toBe(true);
    expect(canTransition("completed", "ready")).toBe(true);
    expect(canTransition("completed", "queued")).toBe(false);
  });
});

describe("order store", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    dirs.length = 0;
  });

  function tempStore() {
    const dir = mkdtempSync(path.join(tmpdir(), "barista-orders-"));
    dirs.push(dir);
    return createOrderStore(path.join(dir, "orders.json"), new EventEmitter());
  }

  it("persists an order, lists oldest first, and survives reload", () => {
    const filePath = path.join(mkdtempSync(path.join(tmpdir(), "barista-orders-")), "orders.json");
    dirs.push(path.dirname(filePath));
    const events = new EventEmitter();
    const store = createOrderStore(filePath, events);

    const first = store.create({
      customerName: "  Alex  ",
      items: [{ drinkId: "latte", sizeId: "regular", extraIds: ["oat"], quantity: 1 }],
    });
    const second = store.create({
      customerName: "Sam",
      items: [{ drinkId: "espresso", sizeId: "double", extraIds: [], quantity: 1 }],
    });

    expect(first.ticketNumber).toBe(1);
    expect(first.customerName).toBe("Alex");
    expect(first.totalPence).toBe(420);
    expect(second.ticketNumber).toBe(2);

    const listed = store.list();
    expect(listed.map((order) => order.id)).toEqual([first.id, second.id]);

    const reloaded = createOrderStore(filePath, new EventEmitter());
    expect(reloaded.list()).toHaveLength(2);
    expect(reloaded.list()[0].customerName).toBe("Alex");
  });

  it("moves tickets from queued to ready to completed", () => {
    const store = tempStore();
    const order = store.create({
      items: [{ drinkId: "americano", sizeId: "small", extraIds: [], quantity: 1 }],
    });

    expect(store.updateStatus(order.id, "ready").status).toBe("ready");
    expect(store.updateStatus(order.id, "completed").status).toBe("completed");
    expect(store.list()[0].status).toBe("completed");
  });

  it("rejects an empty order", () => {
    const store = tempStore();
    expect(() => store.create({ items: [] })).toThrow(/at least one drink/);
  });
});
