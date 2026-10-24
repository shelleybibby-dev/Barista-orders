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
    { id: "extra-shot", name: "Extra shot", pricePence: 50, group: "shot" },
    { id: "syrup-vanilla", name: "Vanilla syrup", pricePence: 50, group: "syrup" },
    { id: "syrup-caramel", name: "Caramel syrup", pricePence: 50, group: "syrup" },
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
        { id: "pack-6", name: "6 donuts", pricePence: 600 },
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
        { id: "pack-2", name: "2 donuts", pricePence: 500 },
        { id: "pack-4", name: "4 donuts", pricePence: 700 },
        { id: "pack-6", name: "6 donuts", pricePence: 900 },
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
    ).toBe(380 + 40 + 50 + 50);
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
    expect(item.unitPricePence).toBe(380 + 50);
  });

  it("prices donut packs from the truck menu", () => {
    expect(priceUnitPence(menu.donuts[0], "pack-2", [], menu.extras)).toBe(300);
    expect(priceUnitPence(menu.donuts[0], "pack-4", [], menu.extras)).toBe(500);
    expect(priceUnitPence(menu.donuts[0], "pack-6", [], menu.extras)).toBe(600);
    expect(priceUnitPence(menu.donuts[1], "pack-2", [], menu.extras)).toBe(500);
    expect(priceUnitPence(menu.donuts[1], "pack-4", [], menu.extras)).toBe(700);
    expect(priceUnitPence(menu.donuts[1], "pack-6", [], menu.extras)).toBe(900);
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
    expect(syrups.every((extra) => extra.pricePence === 50)).toBe(true);
    expect(cafeMenu.extras.find((extra) => extra.id === "extra-shot")?.pricePence).toBe(50);
    expect(cafeMenu.extras.find((extra) => extra.id === "oat")?.pricePence).toBe(0);
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

  it("gives each coffee one size except espresso Single and Double", () => {
    const cafeMenu = getMenu();
    const espresso = cafeMenu.drinks.find((drink) => drink.id === "espresso");
    expect(espresso?.sizes.map((size) => [size.id, size.pricePence])).toEqual([
      ["single", 250],
      ["double", 300],
    ]);

    const oneSize = [
      ["americano", 350],
      ["latte", 400],
      ["cappuccino", 400],
      ["flat-white", 400],
      ["mocha", 450],
    ] as const;

    for (const [id, price] of oneSize) {
      const drink = cafeMenu.drinks.find((item) => item.id === id);
      expect(drink?.sizes).toEqual([{ id: "standard", name: "", pricePence: price }]);
    }
  });

  it("offers six teas at a single £3 price with no extras", () => {
    const cafeMenu = getMenu();
    expect(cafeMenu.drinks.some((drink) => drink.id.includes("tea"))).toBe(false);

    const teas = [
      "tea",
      "decaf-tea",
      "green-tea",
      "peppermint-tea",
      "earl-grey",
      "strawberry-raspberry-tea",
    ].map((id) => {
      const drink = (cafeMenu.teas ?? []).find((item) => item.id === id);
      expect(drink).toBeDefined();
      return drink!;
    });

    expect(teas.map((drink) => drink.name)).toEqual([
      "Tea",
      "Decaf tea",
      "Green tea",
      "Pure peppermint tea",
      "Earl grey",
      "Strawberry & raspberry tea",
    ]);

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

  it("offers plain hot chocolate with cream and flake, and kids and flavoured hot chocolates with no add-ons", () => {
    const cafeMenu = getMenu();
    const plain = ["hot-chocolate", "Hot chocolate", 400] as const;
    const withoutAddOns = [
      ["hot-chocolate-kids", "Kids hot chocolate", 350],
      ["hot-chocolate-cadbury-caramel", "Caramel Hot Chocolate", 450],
      ["hot-chocolate-orange", "Orange Hot Chocolate", 450],
      ["hot-chocolate-dubai", "Dubai Hot Chocolate", 450],
      ["hot-chocolate-black-forest", "Black Forest Hot Chocolate", 450],
      ["hot-chocolate-mint", "Mint Hot Chocolate", 450],
    ] as const;

    expect(cafeMenu.hotChocolates?.map((drink) => drink.id)).toEqual([
      plain[0],
      ...withoutAddOns.map(([id]) => id),
    ]);
    expect(cafeMenu.extras.find((extra) => extra.id === "cream-and-flake")).toMatchObject({
      name: "Cream & flake",
      pricePence: 50,
      group: "cream",
    });
    expect(cafeMenu.extras.some((extra) => extra.id === "cream" || extra.id === "flake")).toBe(false);
    expect(cafeMenu.extras.find((extra) => extra.id === "with-cream")?.pricePence).toBe(0);
    expect(cafeMenu.extras.find((extra) => extra.id === "no-cream")?.pricePence).toBe(0);

    const kids = cafeMenu.hotChocolates?.find((item) => item.id === "hot-chocolate-kids");
    const hotChocolate = cafeMenu.hotChocolates?.[0];
    expect(kids?.accent).toBe(hotChocolate?.accent);
    expect(kids?.foam).toBe(hotChocolate?.foam);
    expect(hotChocolate?.name).toBe(plain[1]);
    expect(hotChocolate?.extras).toEqual(["cream-and-flake"]);
    expect(hotChocolate?.sizes).toEqual([{ id: "standard", name: "", pricePence: plain[2] }]);
    expect(priceUnitPence(hotChocolate!, "standard", [], cafeMenu.extras)).toBe(plain[2]);
    expect(priceUnitPence(hotChocolate!, "standard", ["cream-and-flake"], cafeMenu.extras)).toBe(
      plain[2] + 50,
    );

    for (const [id, name, pricePence] of withoutAddOns) {
      const drink = cafeMenu.hotChocolates?.find((item) => item.id === id);
      expect(drink?.name).toBe(name);
      expect(drink?.extras).toEqual([]);
      expect(drink?.sizes).toEqual([{ id: "standard", name: "", pricePence }]);
      expect(priceUnitPence(drink!, "standard", [], cafeMenu.extras)).toBe(pricePence);
      expect(() =>
        priceUnitPence(drink!, "standard", ["cream-and-flake"], cafeMenu.extras),
      ).toThrow(OrderValidationError);
    }

    for (const drink of cafeMenu.hotChocolates ?? []) {
      for (const blocked of ["oat", "extra-shot", "syrup-caramel", "with-cream", "cream", "flake"]) {
        expect(() => priceUnitPence(drink, "standard", [blocked], cafeMenu.extras)).toThrow(
          OrderValidationError,
        );
      }
    }

    const withTopping = buildOrderItem(
      cafeMenu,
      {
        drinkId: "hot-chocolate",
        sizeId: "standard",
        extraIds: ["cream-and-flake"],
        quantity: 1,
      },
      "cocoa-1",
    );
    expect(withTopping.kind).toBe("hot-chocolate");
    expect(withTopping.drinkName).toBe("Hot chocolate");
    expect(withTopping.extras).toEqual([{ id: "cream-and-flake", name: "Cream & flake", pricePence: 50 }]);
    expect(withTopping.lineTotalPence).toBe(450);

    const kidsOrder = buildOrderItem(
      cafeMenu,
      { drinkId: "hot-chocolate-kids", sizeId: "standard", extraIds: [], quantity: 1 },
      "cocoa-kids",
    );
    expect(kidsOrder.drinkName).toBe("Kids hot chocolate");
    expect(kidsOrder.extras).toEqual([]);
    expect(kidsOrder.lineTotalPence).toBe(350);

    const plainOrder = buildOrderItem(
      cafeMenu,
      { drinkId: "hot-chocolate", sizeId: "standard", extraIds: [], quantity: 1 },
      "cocoa-2",
    );
    expect(plainOrder.drinkName).toBe("Hot chocolate");
    expect(plainOrder.extras).toEqual([]);
    expect(plainOrder.lineTotalPence).toBe(400);
  });

  it("offers fruit milkshakes at £5 and Oreo and Biscoff at £5.50 with a cream choice", () => {
    const cafeMenu = getMenu();
    const shakes = [
      "milkshake-strawberry",
      "milkshake-vanilla",
      "milkshake-chocolate",
      "milkshake-oreo",
      "milkshake-biscoff",
    ].map((id) => {
      const drink = (cafeMenu.milkshakes ?? []).find((item) => item.id === id);
      expect(drink).toBeDefined();
      return drink!;
    });

    expect(shakes.map((drink) => drink.name)).toEqual([
      "Strawberry milkshake",
      "Vanilla milkshake",
      "Chocolate milkshake",
      "Oreo milkshake",
      "Biscoff milkshake",
    ]);

    for (const shake of shakes.slice(0, 3)) {
      expect(shake.extras).toEqual(["no-cream", "with-cream"]);
      expect(shake.sizes).toEqual([{ id: "standard", name: "", pricePence: 500 }]);
      expect(priceUnitPence(shake, "standard", ["no-cream"], cafeMenu.extras)).toBe(500);
      expect(priceUnitPence(shake, "standard", ["with-cream"], cafeMenu.extras)).toBe(500);
    }

    for (const shake of shakes.slice(3)) {
      expect(shake.extras).toEqual(["no-cream", "with-cream"]);
      expect(shake.sizes).toEqual([{ id: "standard", name: "", pricePence: 550 }]);
      expect(priceUnitPence(shake, "standard", ["no-cream"], cafeMenu.extras)).toBe(550);
      expect(priceUnitPence(shake, "standard", ["with-cream"], cafeMenu.extras)).toBe(550);
    }

    const withCream = buildOrderItem(
      cafeMenu,
      {
        drinkId: "milkshake-vanilla",
        sizeId: "standard",
        extraIds: ["with-cream"],
        quantity: 1,
      },
      "shake-1",
    );
    expect(withCream.kind).toBe("milkshake");
    expect(withCream.drinkName).toBe("Vanilla milkshake");
    expect(withCream.extras.map((extra) => extra.name)).toEqual(["With cream"]);
    expect(withCream.lineTotalPence).toBe(500);

    const oreo = buildOrderItem(
      cafeMenu,
      {
        drinkId: "milkshake-oreo",
        sizeId: "standard",
        extraIds: ["with-cream"],
        quantity: 1,
      },
      "shake-2",
    );
    expect(oreo.kind).toBe("milkshake");
    expect(oreo.drinkName).toBe("Oreo milkshake");
    expect(oreo.extras.map((extra) => extra.name)).toEqual(["With cream"]);
    expect(oreo.lineTotalPence).toBe(550);

    expect(() =>
      priceUnitPence(
        shakes[1],
        "standard",
        ["no-cream", "with-cream"],
        cafeMenu.extras,
      ),
    ).toThrow(OrderValidationError);
  });

  it("offers tropical with mango boba and strawberry and apple boba at £4 with no extras", () => {
    const cafeMenu = getMenu();
    const bobas = ["boba-tropical-mango", "boba-strawberry-apple"].map((id) => {
      const drink = (cafeMenu.bobas ?? []).find((item) => item.id === id);
      expect(drink).toBeDefined();
      return drink!;
    });

    expect(cafeMenu.bobas).toHaveLength(2);
    expect(bobas.map((drink) => drink.name)).toEqual([
      "Tropical with mango boba",
      "Strawberry and apple boba",
    ]);
    expect(bobas[1].description.toLowerCase()).toMatch(/boba/);
    expect(bobas[1].description.toLowerCase()).toMatch(/fruit tea/);

    for (const boba of bobas) {
      expect(boba.extras).toEqual([]);
      expect(boba.sizes).toEqual([{ id: "standard", name: "", pricePence: 400 }]);
      expect(priceUnitPence(boba, "standard", [], cafeMenu.extras)).toBe(400);
    }

    const item = buildOrderItem(
      cafeMenu,
      {
        drinkId: "boba-tropical-mango",
        sizeId: "standard",
        extraIds: [],
        quantity: 1,
      },
      "boba-1",
    );
    expect(item.kind).toBe("boba");
    expect(item.drinkName).toBe("Tropical with mango boba");
    expect(item.sizeName).toBe("");
    expect(item.lineTotalPence).toBe(400);
    expect(item.extras).toEqual([]);
  });

  it("prices sugared and cinnamon packs at £3 / £5 / £6 and topped packs at £5 / £7 / £9", () => {
    const cafeMenu = getMenu();
    const plain = ["sugared", "cinnamon"].map((id) =>
      cafeMenu.donuts.find((donut) => donut.id === id),
    );
    const topped = ["nutella", "oreo-nutella", "biscoff"].map((id) =>
      cafeMenu.donuts.find((donut) => donut.id === id),
    );

    for (const donut of plain) {
      expect(donut?.sizes.map((size) => [size.id, size.pricePence])).toEqual([
        ["pack-2", 300],
        ["pack-4", 500],
        ["pack-6", 600],
      ]);
    }

    for (const donut of topped) {
      expect(donut?.sizes.map((size) => [size.id, size.pricePence])).toEqual([
        ["pack-2", 500],
        ["pack-4", 700],
        ["pack-6", 900],
      ]);
    }
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
      items: [{ drinkId: "latte", sizeId: "standard", extraIds: ["oat"], quantity: 1 }],
    });
    const second = store.create({
      customerName: "Sam",
      items: [{ drinkId: "espresso", sizeId: "double", extraIds: [], quantity: 1 }],
    });

    expect(first.ticketNumber).toBe(1);
    expect(first.customerName).toBe("Alex");
    expect(first.totalPence).toBe(400);
    expect(first.items[0].extras).toEqual([{ id: "oat", name: "Oat milk", pricePence: 0 }]);
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
      items: [{ drinkId: "americano", sizeId: "standard", extraIds: [], quantity: 1 }],
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
        { drinkId: "latte", sizeId: "standard", extraIds: ["oat"], quantity: 1 },
        { drinkId: "biscoff", sizeId: "pack-4", extraIds: [], quantity: 1 },
      ],
    });

    expect(order.items).toHaveLength(2);
    expect(order.items[0].kind).toBe("drink");
    expect(order.items[0].made).toBe(false);
    expect(order.items[1].kind).toBe("donut");
    expect(order.items[1].made).toBe(false);
    expect(order.items[1].drinkName).toBe("Biscoff topped");
    expect(order.items[1].sizeName).toBe("4 donuts");
    expect(order.totalPence).toBe(400 + 700);
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

  it("places a vanilla milkshake with cream on a ticket", () => {
    const store = tempStore();
    const order = store.create({
      customerName: "Jules",
      items: [
        {
          drinkId: "milkshake-vanilla",
          sizeId: "standard",
          extraIds: ["with-cream"],
          quantity: 1,
        },
      ],
    });

    expect(order.items[0].kind).toBe("milkshake");
    expect(order.items[0].drinkName).toBe("Vanilla milkshake");
    expect(order.items[0].extras.map((extra) => extra.name)).toEqual(["With cream"]);
    expect(order.totalPence).toBe(500);
  });

  it("places a boba drink with the full name on a ticket", () => {
    const store = tempStore();
    const order = store.create({
      customerName: "Rae",
      items: [
        {
          drinkId: "boba-tropical-mango",
          sizeId: "standard",
          extraIds: [],
          quantity: 1,
        },
      ],
    });

    expect(order.items[0].kind).toBe("boba");
    expect(order.items[0].drinkName).toBe("Tropical with mango boba");
    expect(order.items[0].sizeName).toBe("");
    expect(order.items[0].extras).toEqual([]);
    expect(order.totalPence).toBe(400);
  });

  it("places plain hot chocolate with cream and flake on a ticket", () => {
    const store = tempStore();
    const order = store.create({
      customerName: "Noor",
      items: [
        {
          drinkId: "hot-chocolate",
          sizeId: "standard",
          extraIds: ["cream-and-flake"],
          quantity: 1,
        },
      ],
    });

    expect(order.items[0].kind).toBe("hot-chocolate");
    expect(order.items[0].drinkName).toBe("Hot chocolate");
    expect(order.items[0].extras).toEqual([
      { id: "cream-and-flake", name: "Cream & flake", pricePence: 50 },
    ]);
    expect(order.totalPence).toBe(450);
  });

  it("marks line items made independently and keeps them after reload", () => {
    const filePath = path.join(mkdtempSync(path.join(tmpdir(), "barista-orders-")), "orders.json");
    dirs.push(path.dirname(filePath));
    const store = createOrderStore(filePath, new EventEmitter());
    const order = store.create({
      customerName: "Maya",
      items: [
        { drinkId: "latte", sizeId: "standard", extraIds: [], quantity: 1 },
        { drinkId: "biscoff", sizeId: "pack-4", extraIds: [], quantity: 1 },
      ],
    });

    const drinkId = order.items[0].id;
    const donutId = order.items[1].id;

    expect(store.updateItemMade(order.id, drinkId, true).items.map((item) => item.made)).toEqual([
      true,
      false,
    ]);
    expect(store.updateItemMade(order.id, donutId, true).items.every((item) => item.made)).toBe(
      true,
    );
    expect(store.updateItemMade(order.id, drinkId, false).items.map((item) => item.made)).toEqual([
      false,
      true,
    ]);

    const reloaded = createOrderStore(filePath, new EventEmitter());
    expect(reloaded.list()[0].items.map((item) => item.made)).toEqual([false, true]);

    store.updateStatus(order.id, "completed");
    expect(() => store.updateItemMade(order.id, donutId, false)).toThrow(/already done/);
  });
});
