import type { Menu, MenuDrink, MenuExtra, ProductKind } from "@/lib/types";

export function findDrink(menu: Menu, drinkId: string): MenuDrink | undefined {
  return (
    menu.drinks.find((drink) => drink.id === drinkId) ??
    (menu.teas ?? []).find((tea) => tea.id === drinkId)
  );
}

export function findProduct(
  menu: Menu,
  productId: string,
): { product: MenuDrink; kind: ProductKind } | undefined {
  const drink = findDrink(menu, productId);
  if (drink) return { product: drink, kind: "drink" };

  const milkshake = (menu.milkshakes ?? []).find((item) => item.id === productId);
  if (milkshake) return { product: milkshake, kind: "milkshake" };

  const donut = (menu.donuts ?? []).find((item) => item.id === productId);
  if (donut) return { product: donut, kind: "donut" };

  return undefined;
}

export function findExtra(menu: Menu, extraId: string): MenuExtra | undefined {
  return menu.extras.find((extra) => extra.id === extraId);
}

export function extrasForDrink(menu: Menu, drink: MenuDrink): MenuExtra[] {
  const allowed = new Set(drink.extras);
  return menu.extras.filter((extra) => allowed.has(extra.id));
}

export function extraChoiceLabel(extra: MenuExtra): string {
  if (extra.group === "syrup" && extra.name.endsWith(" syrup")) {
    return extra.name.slice(0, -" syrup".length);
  }
  return extra.name;
}

export function productCardName(product: MenuDrink): string {
  if (product.name.endsWith(" milkshake")) {
    return product.name.slice(0, -" milkshake".length);
  }
  return product.name;
}

export function defaultExtraIds(menu: Menu, product: MenuDrink): string[] {
  const creams = extrasForDrink(menu, product).filter((extra) => extra.group === "cream");
  if (creams.some((extra) => extra.id === "no-cream")) {
    return ["no-cream"];
  }
  return [];
}

export function lowestPricePence(drink: MenuDrink): number {
  return Math.min(...drink.sizes.map((size) => size.pricePence));
}

export function defaultSizeId(product: MenuDrink, kind: ProductKind): string {
  if (kind === "donut") {
    return product.sizes.find((size) => size.id === "pack-2")?.id ?? product.sizes[0].id;
  }
  return product.sizes.find((size) => size.id === "regular")?.id ?? product.sizes[0].id;
}
