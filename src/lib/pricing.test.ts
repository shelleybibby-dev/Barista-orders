import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it } from "vitest";
import { extraChoiceLabel } from "@/lib/menu-helpers";
import { getMenu } from "@/lib/menu";
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
      extras: ["oat", "soya", "extra-shot", "syrup-vanilla", "syrup-caramel"],
      sizes: [
        { id: "small", name: "Small", pricePence: 340 },
        { id: "regular", name: "Regular", pricePence: 380 },
        { id: "large", name: "Large", pricePence: 420 },
      ],
    },
  ],
  extras: [
    { id: "oat", name: "Oat milk", pricePence: 40, group: "milk" },
    { id: "soya", name: "Soya milk", pricePence: 40, group: "milk" },
    { id: "extra-shot", name: "Extra shot", pricePence: 60, group: "shot" },
    { id: "syrup-vanilla", name: "Vanilla syrup", pricePence: 40, group: "syrup" },
    { id: "syrup-caramel", name: "Caramel syrup", pricePence: 40, group: "syrup" },
  ],
  donuts: [
    {
      id: "sugared",
      name: "Sugared",
      description: "Sugar-dusted",
      accent: "#c9a227",
      foam: "#f7e7b4",
      extras: [],
      sizes: [
        { id: "pack-2", name: "2 donuts", pricePence: 300 },
        { id: "pack-4", name: "4 donuts", pricePence: 500 },
        { id: "pack-6", name: "6 donuts", pricePence: 800 },
      ],
    },
    {
      id: "biscoff",
      name: "Biscoff topped",
      description: "Biscoff",
      accent: "#9a5a28",
      foam: "#e0b07a",
      extras: [],
      sizes: [
        { id: "pack-2", name: "2 donuts", pricePence: 400 },
        { id: "pack-4", name: "4 donuts", pricePence: 700 },
        { id: "pack-6", name: "6 donuts", pricePence: 1100 },
      ],
    },
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

  it("adds oat milk, extra shot and vanilla syrup to a regular latte", () => {
    expect(
      priceUnitPence(
        menu.drinks[1],
        "regular",
        ["oat", "extra-shot", "syrup-vanilla"],
        menu.extras,
      ),
    ).toBe(380 + 40 + 60 + 40);
  });

  it("rejects two milk alternatives on one drink", () => {
    expect(() =>
      priceUnitPence(menu.drinks[1], "regular", ["oat", "soya"], menu.extras),
    ).toThrow(OrderValidationError);
  });

  it("rejects two syrup flavours on one drink", () => {
    expect(() =>
      priceUnitPence(
        menu.drinks[1],
        "regular",
        ["syrup-vanilla", "syrup-caramel"],
        menu.extras,
      ),
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
    expect(item.kind).toBe("drink");
    expect(item.extras.map((extra) => extra.name)).toEqual(["Oat milk"]);
  });

  it("stores the chosen syrup flavour name on the line", () => {
    const item = buildOrderItem(
      menu,
      { drinkId: "latte", sizeId: "regular", extraIds: ["syrup-vanilla"], quantity: 1 },
      "line-2",
    );
    expect(item.extras.map((extra) => extra.name)).toEqual(["Vanilla syrup"]);
    expect(item.unitPricePence).toBe(380 + 40);
  });

  it("prices donut packs from the truck menu", () => {
    expect(priceUnitPence(menu.donuts[0], "pack-2", [], menu.extras)).toBe(300);
    expect(priceUnitPence(menu.donuts[0], "pack-4", [], menu.extras)).toBe(500);
    expect(priceUnitPence(menu.donuts[0], "pack-6", [], menu.extras)).toBe(800);
    expect(priceUnitPence(menu.donuts[1], "pack-2", [], menu.extras)).toBe(400);
    expect(priceUnitPence(menu.donuts[1], "pack-4", [], menu.extras)).toBe(700);
    expect(priceUnitPence(menu.donuts[1], "pack-6", [], menu.extras)).toBe(1100);
  });

  it("builds a donut pack line", () => {
    const item = buildOrderItem(
      menu,
      { drinkId: "sugared", sizeId: "pack-4", extraIds: [], quantity: 1 },
      "donut-1",
    );
    expect(item.kind).toBe("donut");
    expect(item.drinkName).toBe("Sugared");
    expect(item.sizeName).toBe("4 donuts");
    expect(item.lineTotalPence).toBe(500);
  });
});

describe("café menu syrup flavours", () => {
  it("lists seven named syrups and no generic syrup extra", () => {
    const cafeMenu = getMenu();
    const syrups = cafeMenu.extras.filter((extra) => extra.group === "syrup");
    expect(cafeMenu.extras.some((extra) => extra.id === "syrup")).toBe(false);
    expect(syrups.map((extra) => extraChoiceLabel(extra))).toEqual([
      "Caramel",
      "Hazelnut",
      "Vanilla",
      "Toasted marshmallow",
      "Pistachio",
      "Cherry",
      "Orange",
    ]);
    expect(syrups.every((extra) => extra.pricePence === 40)).toBe(true);
    expect(syrups.map((extra) => extra.name)).toEqual([
      "Caramel syrup",
      "Hazelnut syrup",
      "Vanilla syrup",
      "Toasted marshmallow syrup",
      "Pistachio syrup",
      "Cherry syrup",
      "Orange syrup",
    ]);

    const flavourIds = syrups.map((extra) => extra.id);
    const coffeeWithSyrup = new Set([
      "americano",
      "latte",
      "cappuccino",
      "flat-white",
      "mocha",
    ]);
    for (const drink of cafeMenu.drinks) {
      if (coffeeWithSyrup.has(drink.id)) {
        expect(drink.extras).toEqual(expect.arrayContaining(flavourIds));
        expect(drink.extras).not.toContain("syrup");
        continue;
      }
      expect(drink.extras.some((id) => id.startsWith("syrup-"))).toBe(false);
    }
  });

  it("offers tea, decaf tea and green tea at a single £3 price with no extras", () => {
    const cafeMenu = getMenu();
    expect(cafeMenu.drinks.some((drink) => drink.id.includes("tea"))).toBe(false);

    const teas = ["tea", "decaf-tea", "green-tea"].map((id) => {
      const drink = (cafeMenu.teas ?? []).find((item) => item.id === id);
      expect(drink).toBeDefined();
      return drink!;
    });

    expect(teas.map((drink) => drink.name)).toEqual(["Tea", "Decaf tea", "Green tea"]);

    for (const tea of teas) {
      expect(tea.extras).toEqual([]);
      expect(tea.sizes).toEqual([{ id: "standard", name: "", pricePence: 300 }]);
      expect(priceUnitPence(tea, "standard", [], cafeMenu.extras)).toBe(300);
    }

    const item = buildOrderItem(
      cafeMenu,
      { drinkId: "green-tea", sizeId: "standard", extraIds: [], quantity: 1 },
      "tea-1",
    );
    expect(item.kind).toBe("drink");
    expect(item.drinkName).toBe("Green tea");
    expect(item.sizeName).toBe("");
    expect(item.lineTotalPence).toBe(300);
    expect(item.extras).toEqual([]);
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
    expect(() => store.create({ items: [] })).toThrow(/at least one item/);
  });

  it("places coffee and a donut pack on the same ticket", () => {
    const store = tempStore();
    const order = store.create({
      customerName: "Maya",
      items: [
        { drinkId: "latte", sizeId: "regular", extraIds: ["oat"], quantity: 1 },
        { drinkId: "biscoff", sizeId: "pack-4", extraIds: [], quantity: 1 },
      ],
    });

    expect(order.items).toHaveLength(2);
    expect(order.items[0].kind).toBe("drink");
    expect(order.items[1].kind).toBe("donut");
    expect(order.items[1].drinkName).toBe("Biscoff topped");
    expect(order.items[1].sizeName).toBe("4 donuts");
    expect(order.totalPence).toBe(420 + 700);
  });

  it("places tea with the chosen size on a ticket", () => {
    const store = tempStore();
    const order = store.create({
      customerName: "Priya",
      items: [{ drinkId: "decaf-tea", sizeId: "standard", extraIds: [], quantity: 1 }],
    });

    expect(order.items[0].drinkName).toBe("Decaf tea");
    expect(order.items[0].sizeName).toBe("");
    expect(order.items[0].extras).toEqual([]);
    expect(order.totalPence).toBe(300);
  });
});
