"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BobaIcon } from "@/components/BobaIcon";
import { ColdDrinkIcon } from "@/components/ColdDrinkIcon";
import { CoffeeCup } from "@/components/CoffeeCup";
import { IcedCoffeeCup } from "@/components/IcedCoffeeCup";
import { HotChocolateIcon } from "@/components/HotChocolateIcon";
import { BrandLockup } from "@/components/CoffeeBeansLogo";
import { DonutIcon } from "@/components/DonutIcon";
import { MilkshakeIcon } from "@/components/MilkshakeIcon";
import {
  defaultExtraIds,
  defaultSizeId,
  extraChoiceLabel,
  extrasForDrink,
  findProduct,
  lowestPricePence,
  productCardName,
} from "@/lib/menu-helpers";
import { formatGbp } from "@/lib/money";
import { cartKey, priceUnitPence } from "@/lib/pricing";
import type { Menu, MenuDrink, MenuExtra, Order, OrderItemInput, ProductKind } from "@/lib/types";

interface CartLine extends OrderItemInput {
  key: string;
}

interface Draft {
  product: MenuDrink;
  kind: ProductKind;
  sizeId: string;
  extraIds: string[];
  quantity: number;
}

export function CustomerKiosk({ menu }: { menu: Menu }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Order | null>(null);

  const pricedCart = useMemo(
    () =>
      cart.map((line) => {
        const match = findProduct(menu, line.drinkId);
        if (!match) return null;
        const { product, kind } = match;
        const size = product.sizes.find((item) => item.id === line.sizeId);
        const extras = (line.extraIds
          .map((id) => menu.extras.find((extra) => extra.id === id))
          .filter(Boolean) ?? []) as MenuExtra[];
        const unitPricePence = priceUnitPence(product, line.sizeId, line.extraIds, menu.extras);
        return {
          ...line,
          kind,
          product,
          sizeName: size?.name ?? line.sizeId,
          extras,
          unitPricePence,
          lineTotalPence: unitPricePence * line.quantity,
        };
      }).filter((line) => line !== null),
    [cart, menu],
  );

  const itemCount = pricedCart.reduce((sum, line) => sum + line.quantity, 0);
  const totalPence = pricedCart.reduce((sum, line) => sum + line.lineTotalPence, 0);

  function openProduct(product: MenuDrink, kind: ProductKind) {
    setDraft({
      product,
      kind,
      sizeId: defaultSizeId(product, kind),
      extraIds: defaultExtraIds(menu, product),
      quantity: 1,
    });
    setError(null);
  }

  function toggleExtra(extra: MenuExtra) {
    setDraft((current) => {
      if (!current) return current;
      const withoutGroup = current.extraIds.filter((id) => {
        const match = menu.extras.find((item) => item.id === id);
        return match?.group !== extra.group;
      });
      const alreadyOn = current.extraIds.includes(extra.id);
      if (alreadyOn && (extra.group === "cream" || extra.group === "serve")) {
        const choices = extrasForDrink(menu, current.product).filter(
          (item) => item.group === extra.group,
        );
        if (choices.length > 1) return current;
      }
      return {
        ...current,
        extraIds: alreadyOn ? withoutGroup : [...withoutGroup, extra.id],
      };
    });
  }

  function addDraftToCart() {
    if (!draft) return;
    const key = cartKey({
      drinkId: draft.product.id,
      sizeId: draft.sizeId,
      extraIds: draft.extraIds,
    });
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key
            ? { ...line, quantity: Math.min(9, line.quantity + draft.quantity) }
            : line,
        );
      }
      return [
        ...current,
        {
          key,
          drinkId: draft.product.id,
          sizeId: draft.sizeId,
          extraIds: draft.extraIds,
          quantity: draft.quantity,
        },
      ];
    });
    setDraft(null);
    setCartOpen(true);
  }

  function setLineQuantity(key: string, quantity: number) {
    setCart((current) => {
      if (quantity < 1) return current.filter((line) => line.key !== key);
      return current.map((line) =>
        line.key === key ? { ...line, quantity: Math.min(9, quantity) } : line,
      );
    });
  }

  async function placeOrder() {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          items: cart.map(({ drinkId, sizeId, extraIds, quantity }) => ({
            drinkId,
            sizeId,
            extraIds,
            quantity,
          })),
        }),
      });
      const payload = (await response.json()) as { order?: Order; error?: string };
      if (!response.ok || !payload.order) {
        throw new Error(payload.error || "Could not place the order.");
      }
      setPlaced(payload.order);
      setCart([]);
      setCustomerName("");
      setCartOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order.");
    } finally {
      setSubmitting(false);
    }
  }

  function startNewOrder() {
    setPlaced(null);
    setDraft(null);
    setCartOpen(false);
    setError(null);
  }

  const sections = useMemo(
    () =>
      [
        menu.drinks.length > 0 ? { id: "coffees", label: "Coffees" } : null,
        (menu.specials ?? []).length > 0 ? { id: "specials", label: "Specials" } : null,
        (menu.teas ?? []).length > 0 ? { id: "teas", label: "Teas" } : null,
        (menu.hotChocolates ?? []).length > 0
          ? { id: "hot-chocolates", label: "Hot chocolates" }
          : null,
        (menu.milkshakes ?? []).length > 0 ? { id: "milkshakes", label: "Milkshakes" } : null,
        (menu.bobas ?? []).length > 0 ? { id: "boba", label: "Boba" } : null,
        (menu.coldDrinks ?? []).length > 0 ? { id: "cold-drinks", label: "Cold drinks" } : null,
        (menu.donuts ?? []).length > 0 ? { id: "donuts", label: "Donuts" } : null,
      ].filter((section) => section !== null),
    [menu],
  );
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "coffees");
  const scrollLock = useRef<string | null>(null);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-menu-section]"));
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollLock.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const next = visible[0]?.target.id;
        if (next) setActiveSection(next);
      },
      { rootMargin: "-132px 0px -50% 0px", threshold: [0, 0.2] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [sections]);

  function jumpToSection(id: string) {
    setActiveSection(id);
    scrollLock.current = id;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById(`section-tab-${id}`)?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    window.setTimeout(() => {
      if (scrollLock.current === id) scrollLock.current = null;
    }, 800);
  }

  return (
    <div className="relative min-h-dvh bg-cream text-espresso">
      <div className="sticky top-0 z-20 border-b border-espresso/10 bg-cream/95 backdrop-blur-md safe-top">
        <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 pb-1">
          <BrandLockup name={menu.cafeName} subtitle={menu.tagline} size="sm" />
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="tap min-h-11 shrink-0 rounded-xl bg-espresso px-3 text-left text-foam shadow-lg"
          >
            <span className="block text-[0.65rem] uppercase tracking-[0.16em] text-caramel">Order</span>
            <span className="block text-sm font-semibold">
              {itemCount} · {formatGbp(totalPence)}
            </span>
          </button>
        </header>
        <nav aria-label="Menu sections" className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-3 pb-2">
          {sections.map((section) => {
            const selected = activeSection === section.id;
            return (
              <button
                key={section.id}
                id={`section-tab-${section.id}`}
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => jumpToSection(section.id)}
                className={`tap min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold ${
                  selected ? "bg-espresso text-foam" : "bg-foam text-espresso ring-1 ring-espresso/10"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-3 py-3 pb-24">
        {menu.drinks.length > 0 ? (
          <MenuSection
            id="coffees"
            title="Coffees"
            blurb="Espresso has Single or Double. Other drinks are one size. Americano is black or white. Decaf is free on coffee. Cream on top is +£0.50 on latte and iced latte. Cappuccino can have free chocolate on top."
          >
            {menu.drinks.map((drink) => (
              <DrinkCard key={drink.id} product={drink} onOpen={() => openProduct(drink, "drink")} />
            ))}
          </MenuSection>
        ) : null}

        {(menu.specials ?? []).length > 0 ? (
          <MenuSection id="specials" title="Specials" blurb="£4.50. Optional free cream.">
            {(menu.specials ?? []).map((drink) => (
              <DrinkCard key={drink.id} product={drink} onOpen={() => openProduct(drink, "special")} />
            ))}
          </MenuSection>
        ) : null}

        {(menu.teas ?? []).length > 0 ? (
          <MenuSection id="teas" title="Teas" blurb="£3. No extras.">
            {(menu.teas ?? []).map((tea) => (
              <DrinkCard key={tea.id} product={tea} onOpen={() => openProduct(tea, "drink")} />
            ))}
          </MenuSection>
        ) : null}

        {(menu.hotChocolates ?? []).length > 0 ? (
          <MenuSection
            id="hot-chocolates"
            title="Hot chocolates"
            blurb="£2.50, £4 or £4.50. Cream & flake on hot chocolate, +£0.50. Flavoured hot chocolates include a free cream choice."
          >
            {(menu.hotChocolates ?? []).map((drink) => (
              <DrinkCard
                key={drink.id}
                product={drink}
                kind="hot-chocolate"
                onOpen={() => openProduct(drink, "hot-chocolate")}
              />
            ))}
          </MenuSection>
        ) : null}

        {(menu.milkshakes ?? []).length > 0 ? (
          <MenuSection id="milkshakes" title="Milkshakes" blurb="£5 or £5.50. Choose with or without cream.">
            {(menu.milkshakes ?? []).map((shake) => (
              <DrinkCard
                key={shake.id}
                product={shake}
                kind="milkshake"
                onOpen={() => openProduct(shake, "milkshake")}
              />
            ))}
          </MenuSection>
        ) : null}

        {(menu.bobas ?? []).length > 0 ? (
          <MenuSection id="boba" title="Boba" blurb="£4 or £5. One size. No extras.">
            {(menu.bobas ?? []).map((boba) => (
              <DrinkCard key={boba.id} product={boba} kind="boba" onOpen={() => openProduct(boba, "boba")} />
            ))}
          </MenuSection>
        ) : null}

        {(menu.coldDrinks ?? []).length > 0 ? (
          <MenuSection id="cold-drinks" title="Cold drinks" blurb="£2. Cans and bottles. No extras.">
            {(menu.coldDrinks ?? []).map((drink) => (
              <DrinkCard
                key={drink.id}
                product={drink}
                kind="cold-drink"
                onOpen={() => openProduct(drink, "cold-drink")}
              />
            ))}
          </MenuSection>
        ) : null}

        {(menu.donuts ?? []).length > 0 ? (
          <MenuSection id="donuts" title="Donuts" blurb="Freshly made. Choose a topping, then a pack of 2, 4 or 6.">
            {(menu.donuts ?? []).map((donut) => (
              <button
                key={donut.id}
                type="button"
                onClick={() => openProduct(donut, "donut")}
                className={itemCardClass}
              >
                <DonutIcon donut={donut} className="h-8 w-8 shrink-0" />
                <span className="line-clamp-2 w-full font-display text-[0.78rem] font-semibold leading-tight">
                  {donut.name}
                </span>
                <span className="text-[0.7rem] font-semibold leading-none text-mocha">
                  From {formatGbp(lowestPricePence(donut))}
                </span>
              </button>
            ))}
          </MenuSection>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-espresso/10 bg-cream/95 px-3 pt-2 backdrop-blur-md pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="tap mx-auto flex min-h-11 w-full max-w-6xl items-center justify-between rounded-xl bg-espresso px-4 text-foam shadow-lg"
        >
          <span className="text-base font-semibold">View order</span>
          <span className="text-sm">{itemCount} items · {formatGbp(totalPence)}</span>
        </button>
      </div>

      {draft ? (
        <CustomiseSheet
          menu={menu}
          draft={draft}
          onClose={() => setDraft(null)}
          onSize={(sizeId) => setDraft((current) => (current ? { ...current, sizeId } : current))}
          onExtra={toggleExtra}
          onQuantity={(quantity) =>
            setDraft((current) => (current ? { ...current, quantity } : current))
          }
          onAdd={addDraftToCart}
        />
      ) : null}

      {cartOpen ? (
        <CartDrawer
          menuName={menu.cafeName}
          lines={pricedCart}
          totalPence={totalPence}
          customerName={customerName}
          submitting={submitting}
          error={error}
          onClose={() => setCartOpen(false)}
          onName={setCustomerName}
          onQuantity={setLineQuantity}
          onPlace={placeOrder}
        />
      ) : null}

      {placed ? <OrderConfirmation order={placed} onNew={startNewOrder} /> : null}
    </div>
  );
}

const itemCardClass =
  "tap flex min-h-11 flex-col items-center justify-start gap-0.5 rounded-xl bg-foam px-1 py-1.5 text-center shadow-[0_4px_12px_rgba(42,24,16,0.06)] ring-1 ring-espresso/5";

const itemGridClass = "mt-1.5 grid grid-cols-2 gap-1.5 md:grid-cols-4 md:gap-2 lg:grid-cols-6";

function MenuSection({
  id,
  title,
  blurb,
  children,
}: {
  id: string;
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-menu-section className="scroll-mt-36">
      <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>
      <p className="text-[0.7rem] leading-snug text-coffee">{blurb}</p>
      <div className={itemGridClass}>{children}</div>
    </section>
  );
}

function DrinkCard({
  product,
  kind = "drink",
  onOpen,
}: {
  product: MenuDrink;
  kind?: ProductKind;
  onOpen: () => void;
}) {
  const price =
    product.sizes.length === 1
      ? formatGbp(lowestPricePence(product))
      : `From ${formatGbp(lowestPricePence(product))}`;
  return (
    <button type="button" onClick={onOpen} className={itemCardClass}>
      {kind === "milkshake" ? (
        <MilkshakeIcon shake={product} className="h-8 w-8 shrink-0" />
      ) : kind === "boba" ? (
        <BobaIcon drink={product} className="h-8 w-8 shrink-0" />
      ) : kind === "cold-drink" ? (
        <ColdDrinkIcon drink={product} className="h-8 w-8 shrink-0" />
      ) : kind === "hot-chocolate" || product.id.includes("hot-chocolate") ? (
        <HotChocolateIcon drink={product} className="h-8 w-8 shrink-0" />
      ) : product.id.startsWith("iced-") ? (
        <IcedCoffeeCup drink={product} className="h-8 w-8 shrink-0" />
      ) : (
        <CoffeeCup drink={product} className="h-8 w-8 shrink-0" />
      )}
      <span className="line-clamp-2 w-full font-display text-[0.78rem] font-semibold leading-tight">
        {productCardName(product)}
      </span>
      <span className="text-[0.7rem] font-semibold leading-none text-mocha">{price}</span>
    </button>
  );
}

function CustomiseSheet({
  menu,
  draft,
  onClose,
  onSize,
  onExtra,
  onQuantity,
  onAdd,
}: {
  menu: Menu;
  draft: Draft;
  onClose: () => void;
  onSize: (sizeId: string) => void;
  onExtra: (extra: MenuExtra) => void;
  onQuantity: (quantity: number) => void;
  onAdd: () => void;
}) {
  const extras = extrasForDrink(menu, draft.product);
  const serves = extras.filter((extra) => extra.group === "serve");
  const decafs = extras.filter((extra) => extra.group === "decaf");
  const milks = extras.filter((extra) => extra.group === "milk");
  const syrups = extras.filter((extra) => extra.group === "syrup");
  const creams = extras.filter((extra) => extra.group === "cream");
  const others = extras.filter(
    (extra) =>
      extra.group !== "milk" &&
      extra.group !== "syrup" &&
      extra.group !== "cream" &&
      extra.group !== "decaf" &&
      extra.group !== "serve",
  );
  const unitPrice = priceUnitPence(draft.product, draft.sizeId, draft.extraIds, menu.extras);
  const isDonut = draft.kind === "donut";
  const isMilkshake = draft.kind === "milkshake";
  const isBoba = draft.kind === "boba";
  const isColdDrink = draft.kind === "cold-drink";
  const isHotChocolate = draft.kind === "hot-chocolate";
  const sizeLabel = isDonut ? "Pack" : "Size";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-espresso/45 p-3 sm:items-center">
      <button className="absolute inset-0" type="button" aria-label="Close" onClick={onClose} />
      <section className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-foam p-6 shadow-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-2">
        <div className="flex items-start gap-4">
          {isDonut ? (
            <DonutIcon donut={draft.product} className="h-16 w-16" />
          ) : isMilkshake ? (
            <MilkshakeIcon shake={draft.product} className="h-16 w-16" />
          ) : isBoba ? (
            <BobaIcon drink={draft.product} className="h-16 w-16" />
          ) : isColdDrink ? (
            <ColdDrinkIcon drink={draft.product} className="h-16 w-16" />
          ) : isHotChocolate || draft.product.id.includes("hot-chocolate") ? (
            <HotChocolateIcon drink={draft.product} className="h-16 w-16" />
          ) : draft.product.id.startsWith("iced-") ? (
            <IcedCoffeeCup drink={draft.product} className="h-16 w-16" />
          ) : (
            <CoffeeCup drink={draft.product} className="h-16 w-16" />
          )}
          <div className="flex-1">
            <h2 className="font-display text-4xl font-semibold">{productCardName(draft.product)}</h2>
            <p className="text-lg text-coffee">{draft.product.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap min-h-12 min-w-12 rounded-full bg-cream text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {draft.product.sizes.length > 1 ? (
          <>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-coffee">{sizeLabel}</h3>
            <div
              className={`mt-3 grid gap-3 ${
                draft.product.sizes.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
              }`}
            >
              {draft.product.sizes.map((size) => {
                const selected = draft.sizeId === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => onSize(size.id)}
                    className={`tap min-h-20 rounded-2xl px-4 text-left ring-2 ${
                      selected
                        ? "bg-espresso text-foam ring-espresso"
                        : "bg-cream text-espresso ring-transparent"
                    }`}
                  >
                    <span className="block text-xl font-semibold">{size.name}</span>
                    <span className="block text-base opacity-80">{formatGbp(size.pricePence)}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {serves.length > 0 ? (
          <>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-coffee">
              Black or white
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {serves.map((option) => (
                <ChoiceChip
                  key={option.id}
                  label={option.name}
                  hint={option.pricePence === 0 ? "No extra charge" : `+ ${formatGbp(option.pricePence)}`}
                  selected={draft.extraIds.includes(option.id)}
                  onClick={() => onExtra(option)}
                />
              ))}
            </div>
          </>
        ) : null}

        {decafs.length > 0 ? (
          <>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-coffee">Decaf</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChoiceChip
                label="Regular"
                hint="Included"
                selected={!draft.extraIds.some((id) => decafs.some((option) => option.id === id))}
                onClick={() => {
                  decafs.forEach((option) => {
                    if (draft.extraIds.includes(option.id)) onExtra(option);
                  });
                }}
              />
              {decafs.map((option) => (
                <ChoiceChip
                  key={option.id}
                  label={option.name}
                  hint={option.pricePence === 0 ? "No extra charge" : `+ ${formatGbp(option.pricePence)}`}
                  selected={draft.extraIds.includes(option.id)}
                  onClick={() => onExtra(option)}
                />
              ))}
            </div>
          </>
        ) : null}

        {milks.length > 0 ? (
          <>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-coffee">Milk</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChoiceChip
                label="Dairy"
                hint="Included"
                selected={!draft.extraIds.some((id) => milks.some((milk) => milk.id === id))}
                onClick={() => {
                  milks.forEach((milk) => {
                    if (draft.extraIds.includes(milk.id)) onExtra(milk);
                  });
                }}
              />
              {milks.map((milk) => (
                <ChoiceChip
                  key={milk.id}
                  label={milk.name}
                  hint={
                    milk.pricePence === 0 ? "No extra charge" : `+ ${formatGbp(milk.pricePence)}`
                  }
                  selected={draft.extraIds.includes(milk.id)}
                  onClick={() => onExtra(milk)}
                />
              ))}
            </div>
          </>
        ) : null}

        {creams.length > 0 ? (
          <>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-coffee">
              Cream
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {creams.map((cream) => (
                <ChoiceChip
                  key={cream.id}
                  label={cream.name}
                  hint={
                    cream.pricePence === 0 ? "No extra charge" : `+ ${formatGbp(cream.pricePence)}`
                  }
                  selected={draft.extraIds.includes(cream.id)}
                  onClick={() => onExtra(cream)}
                />
              ))}
            </div>
          </>
        ) : null}

        {others.length > 0 ? (
          <>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-coffee">
              Extras
            </h3>
            <div
              className={`mt-3 grid gap-3 ${
                others.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {others.map((extra) => (
                <ChoiceChip
                  key={extra.id}
                  label={extra.name}
                  hint={
                    extra.pricePence === 0 ? "No extra charge" : `+ ${formatGbp(extra.pricePence)}`
                  }
                  selected={draft.extraIds.includes(extra.id)}
                  onClick={() => onExtra(extra)}
                />
              ))}
            </div>
          </>
        ) : null}

        {syrups.length > 0 ? (
          <>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-coffee">
              Syrup flavour
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ChoiceChip
                label="None"
                hint="No syrup"
                selected={!draft.extraIds.some((id) => syrups.some((syrup) => syrup.id === id))}
                onClick={() => {
                  syrups.forEach((syrup) => {
                    if (draft.extraIds.includes(syrup.id)) onExtra(syrup);
                  });
                }}
              />
              {syrups.map((syrup) => (
                <ChoiceChip
                  key={syrup.id}
                  label={extraChoiceLabel(syrup)}
                  hint={`+ ${formatGbp(syrup.pricePence)}`}
                  selected={draft.extraIds.includes(syrup.id)}
                  onClick={() => onExtra(syrup)}
                />
              ))}
            </div>
          </>
        ) : null}
        </div>

        <div className="mt-6 flex shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-cream p-2">
            <button
              type="button"
              className="tap min-h-14 min-w-14 rounded-xl bg-foam text-3xl"
              onClick={() => onQuantity(Math.max(1, draft.quantity - 1))}
              aria-label="Fewer"
            >
              −
            </button>
            <span className="min-w-10 text-center text-2xl font-semibold">{draft.quantity}</span>
            <button
              type="button"
              className="tap min-h-14 min-w-14 rounded-xl bg-foam text-3xl"
              onClick={() => onQuantity(Math.min(9, draft.quantity + 1))}
              aria-label="More"
            >
              +
            </button>
            {isDonut ? (
              <span className="pr-3 text-base font-semibold text-coffee">
                {draft.quantity === 1 ? "pack" : "packs"}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="tap min-h-16 flex-1 rounded-2xl bg-caramel px-6 text-xl font-semibold text-espresso shadow-md"
          >
            Add to order · {formatGbp(unitPrice * draft.quantity)}
          </button>
        </div>
      </section>
    </div>
  );
}

function ChoiceChip({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap min-h-20 rounded-2xl px-4 text-left ring-2 ${
        selected ? "bg-espresso text-foam ring-espresso" : "bg-cream text-espresso ring-transparent"
      }`}
    >
      <span className="block text-xl font-semibold">{label}</span>
      <span className="block text-base opacity-80">{hint}</span>
    </button>
  );
}

function CartDrawer({
  menuName,
  lines,
  totalPence,
  customerName,
  submitting,
  error,
  onClose,
  onName,
  onQuantity,
  onPlace,
}: {
  menuName: string;
  lines: Array<{
    key: string;
    kind: ProductKind;
    product: MenuDrink;
    sizeName: string;
    extras: MenuExtra[];
    quantity: number;
    lineTotalPence: number;
  }>;
  totalPence: number;
  customerName: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onName: (value: string) => void;
  onQuantity: (key: string, quantity: number) => void;
  onPlace: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-espresso/45 p-3 sm:items-center">
      <button className="absolute inset-0" type="button" aria-label="Close order" onClick={onClose} />
      <section className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-foam p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl font-semibold">Your order</h2>
            <p className="text-coffee">{menuName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap min-h-12 min-w-12 rounded-full bg-cream text-2xl"
            aria-label="Close order"
          >
            ×
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="mt-10 text-center text-xl text-coffee">
            Your tray is empty. Pick a drink or a donut pack to begin.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {lines.map((line) => (
              <li key={line.key} className="rounded-2xl bg-cream p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold">
                      {line.kind === "donut" ? "Donuts · " : line.kind === "special" ? "Specials · " : ""}
                      {line.product.name}
                      {line.sizeName ? (
                        <span className="ml-2 text-lg font-normal text-coffee">{line.sizeName}</span>
                      ) : null}
                    </p>
                    {line.extras.length > 0 ? (
                      <p className="text-base text-coffee">
                        {line.extras.map((extra) => extra.name).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xl font-semibold">{formatGbp(line.lineTotalPence)}</p>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    className="tap min-h-12 min-w-12 rounded-xl bg-foam text-2xl"
                    onClick={() => onQuantity(line.key, line.quantity - 1)}
                    aria-label="Remove one"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-xl font-semibold">{line.quantity}</span>
                  <button
                    type="button"
                    className="tap min-h-12 min-w-12 rounded-xl bg-foam text-2xl"
                    onClick={() => onQuantity(line.key, line.quantity + 1)}
                    aria-label="Add one"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-8 block">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-coffee">
            Name for this order
          </span>
          <input
            value={customerName}
            onChange={(event) => onName(event.target.value)}
            placeholder="Optional — e.g. Alex, or Table 4"
            maxLength={40}
            className="mt-2 min-h-16 w-full rounded-2xl border-0 bg-cream px-4 text-xl text-espresso outline-none ring-2 ring-transparent focus:ring-caramel"
          />
        </label>

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-lg text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={lines.length === 0 || submitting}
          onClick={onPlace}
          className="tap mt-6 min-h-20 w-full rounded-2xl bg-espresso text-2xl font-semibold text-foam disabled:opacity-40"
        >
          {submitting ? "Sending to the barista…" : `Place order · ${formatGbp(totalPence)}`}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="tap mt-3 min-h-16 w-full rounded-2xl bg-cream text-xl font-semibold text-espresso"
        >
          Continue shopping
        </button>
      </section>
    </div>
  );
}

function OrderConfirmation({ order, onNew }: { order: Order; onNew: () => void }) {
  const [seconds, setSeconds] = useState(8);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setSeconds((value) => value - 1);
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (seconds <= 0) onNew();
  }, [seconds, onNew]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso p-6 text-center text-foam">
      <div className="max-w-xl">
        <p className="text-sm uppercase tracking-[0.35em] text-caramel">Order placed</p>
        <p className="mt-4 font-display text-7xl font-semibold">#{order.ticketNumber}</p>
        <p className="mt-6 text-3xl leading-snug">
          {order.customerName ? `Thanks, ${order.customerName}. ` : "Thanks. "}
          The barista has your order.
        </p>
        <p className="mt-4 text-xl text-foam/80">Please wait to hear your name or number.</p>
        <button
          type="button"
          onClick={onNew}
          className="tap mt-10 min-h-20 w-full rounded-2xl bg-caramel text-2xl font-semibold text-espresso shadow-lg"
        >
          Continue shopping
        </button>
        <p className="mt-4 text-sm text-foam/60">Back to the menu in {Math.max(seconds, 0)}s</p>
      </div>
    </div>
  );
}
