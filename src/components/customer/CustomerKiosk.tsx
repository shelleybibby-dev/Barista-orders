"use client";

import { useEffect, useMemo, useState } from "react";
import { CoffeeCup } from "@/components/CoffeeCup";
import { BrandLockup } from "@/components/CoffeeBeansLogo";
import { DonutIcon } from "@/components/DonutIcon";
import {
  defaultSizeId,
  extraChoiceLabel,
  extrasForDrink,
  findProduct,
  lowestPricePence,
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
      extraIds: [],
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

  return (
    <div className="relative min-h-dvh bg-cream text-espresso">
      <header className="sticky top-0 z-20 border-b border-espresso/10 bg-cream/95 px-5 py-4 backdrop-blur-md safe-top">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <BrandLockup name={menu.cafeName} subtitle={menu.tagline} size="md" />
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="tap min-h-16 min-w-16 rounded-2xl bg-espresso px-5 text-left text-foam shadow-lg"
          >
            <span className="block text-xs uppercase tracking-[0.2em] text-caramel">Order</span>
            <span className="block text-2xl font-semibold">
              {itemCount} · {formatGbp(totalPence)}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6 pb-44">
        <h1 className="font-display text-4xl font-semibold">Order here</h1>
        <p className="mt-2 text-lg text-coffee">
          Add coffee, tea and donut packs to the same tray. No payment needed.
        </p>

        <h2 className="mt-10 font-display text-3xl font-semibold">Drinks</h2>
        <p className="mt-1 text-base text-coffee">Tap a coffee, then pick a size.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {menu.drinks.map((drink) => (
            <DrinkCard key={drink.id} product={drink} onOpen={() => openProduct(drink, "drink")} />
          ))}
        </div>

        {(menu.teas ?? []).length > 0 ? (
          <>
            <h2 className="mt-12 font-display text-3xl font-semibold">Teas</h2>
            <p className="mt-1 text-base text-coffee">Regular or large. No extras.</p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(menu.teas ?? []).map((tea) => (
                <DrinkCard key={tea.id} product={tea} onOpen={() => openProduct(tea, "drink")} />
              ))}
            </div>
          </>
        ) : null}

        <h2 className="mt-12 font-display text-3xl font-semibold">Donuts</h2>
        <p className="mt-1 text-base text-coffee">
          Freshly made. Choose a topping, then a pack of 2, 4 or 6.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(menu.donuts ?? []).map((donut) => (
            <button
              key={donut.id}
              type="button"
              onClick={() => openProduct(donut, "donut")}
              className="tap flex min-h-36 items-center gap-4 rounded-3xl bg-foam p-5 text-left shadow-[0_10px_30px_rgba(42,24,16,0.08)] ring-1 ring-espresso/5"
            >
              <DonutIcon donut={donut} className="h-20 w-20 shrink-0" />
              <span>
                <span className="block font-display text-3xl font-semibold leading-tight">
                  {donut.name}
                </span>
                <span className="mt-1 block text-base text-coffee">{donut.description}</span>
                <span className="mt-3 inline-flex rounded-full bg-caramel/15 px-3 py-1 text-sm font-semibold text-mocha">
                  From {formatGbp(lowestPricePence(donut))}
                </span>
              </span>
            </button>
          ))}
        </div>
      </main>

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="tap fixed bottom-5 left-1/2 z-20 flex min-h-16 w-[min(92%,36rem)] -translate-x-1/2 items-center justify-between rounded-full bg-espresso px-7 text-foam shadow-2xl"
      >
        <span className="text-lg font-semibold">View order</span>
        <span className="text-lg">{itemCount} items · {formatGbp(totalPence)}</span>
      </button>

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

function DrinkCard({
  product,
  onOpen,
}: {
  product: MenuDrink;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="tap flex min-h-36 items-center gap-4 rounded-3xl bg-foam p-5 text-left shadow-[0_10px_30px_rgba(42,24,16,0.08)] ring-1 ring-espresso/5"
    >
      <CoffeeCup drink={product} className="h-20 w-20 shrink-0" />
      <span>
        <span className="block font-display text-3xl font-semibold leading-tight">
          {product.name}
        </span>
        <span className="mt-1 block text-base text-coffee">{product.description}</span>
        <span className="mt-3 inline-flex rounded-full bg-caramel/15 px-3 py-1 text-sm font-semibold text-mocha">
          From {formatGbp(lowestPricePence(product))}
        </span>
      </span>
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
  const milks = extras.filter((extra) => extra.group === "milk");
  const syrups = extras.filter((extra) => extra.group === "syrup");
  const others = extras.filter((extra) => extra.group !== "milk" && extra.group !== "syrup");
  const unitPrice = priceUnitPence(draft.product, draft.sizeId, draft.extraIds, menu.extras);
  const isDonut = draft.kind === "donut";
  const sizeLabel = isDonut ? "Pack" : "Size";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-espresso/45 p-3 sm:items-center">
      <button className="absolute inset-0" type="button" aria-label="Close" onClick={onClose} />
      <section className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-foam p-6 shadow-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-2">
        <div className="flex items-start gap-4">
          {isDonut ? (
            <DonutIcon donut={draft.product} className="h-16 w-16" />
          ) : (
            <CoffeeCup drink={draft.product} className="h-16 w-16" />
          )}
          <div className="flex-1">
            <h2 className="font-display text-4xl font-semibold">{draft.product.name}</h2>
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
                  hint={`+ ${formatGbp(milk.pricePence)}`}
                  selected={draft.extraIds.includes(milk.id)}
                  onClick={() => onExtra(milk)}
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
                  hint={`+ ${formatGbp(extra.pricePence)}`}
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
                      {line.kind === "donut" ? "Donuts · " : ""}
                      {line.product.name}
                      <span className="ml-2 text-lg font-normal text-coffee">{line.sizeName}</span>
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
