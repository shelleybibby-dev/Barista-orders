import { clampQuantity } from "@/lib/money";
import { findProduct } from "@/lib/menu-helpers";
import type { Menu, MenuDrink, MenuExtra, OrderItem, OrderItemInput } from "@/lib/types";

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

function resolveExtras(
  drink: MenuDrink,
  extraIds: string[],
  extras: MenuExtra[],
): MenuExtra[] {
  const allowed = new Set(drink.extras);
  const extrasById = new Map(extras.map((extra) => [extra.id, extra]));
  const selected: MenuExtra[] = [];
  const usedGroups = new Set<string>();

  for (const extraId of uniqueIds(extraIds)) {
    if (!allowed.has(extraId)) {
      throw new OrderValidationError(
        `${extraId} is not available on ${drink.name}.`,
      );
    }

    const extra = extrasById.get(extraId);
    if (!extra) {
      throw new OrderValidationError(`Unknown extra: ${extraId}.`);
    }

    if (usedGroups.has(extra.group)) {
      throw new OrderValidationError(
        `Choose only one option from ${extra.group}.`,
      );
    }

    usedGroups.add(extra.group);
    selected.push(extra);
  }

  return selected;
}

export function priceUnitPence(
  drink: MenuDrink,
  sizeId: string,
  extraIds: string[],
  extras: MenuExtra[],
): number {
  const size = drink.sizes.find((item) => item.id === sizeId);
  if (!size) {
    throw new OrderValidationError(`Unknown size for ${drink.name}.`);
  }

  const selected = resolveExtras(drink, extraIds, extras);
  return (
    size.pricePence + selected.reduce((sum, extra) => sum + extra.pricePence, 0)
  );
}

export function buildOrderItem(
  menu: Menu,
  input: OrderItemInput,
  itemId: string,
): OrderItem {
  const match = findProduct(menu, input.drinkId);
  if (!match) {
    throw new OrderValidationError("Unknown item.");
  }

  const { product, kind } = match;
  const size = product.sizes.find((item) => item.id === input.sizeId);
  if (!size) {
    throw new OrderValidationError(`Unknown size for ${product.name}.`);
  }

  const quantity = clampQuantity(input.quantity);
  const extras = resolveExtras(product, input.extraIds ?? [], menu.extras);
  const unitPricePence = size.pricePence + extras.reduce((sum, extra) => sum + extra.pricePence, 0);

  return {
    id: itemId,
    kind,
    drinkId: product.id,
    drinkName: product.name,
    sizeId: size.id,
    sizeName: size.name,
    extras: extras.map((extra) => ({
      id: extra.id,
      name: extra.name,
      pricePence: extra.pricePence,
    })),
    quantity,
    unitPricePence,
    lineTotalPence: unitPricePence * quantity,
    made: false,
  };
}

export function cartKey(input: Pick<OrderItemInput, "drinkId" | "sizeId" | "extraIds">): string {
  const extras = [...(input.extraIds ?? [])].sort().join(",");
  return `${input.drinkId}|${input.sizeId}|${extras}`;
}

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  queued: ["ready", "completed"],
  ready: ["queued", "completed"],
  completed: ["ready"],
};

export function canTransition(from: string, to: string): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
