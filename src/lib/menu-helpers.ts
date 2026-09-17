import type { Menu, MenuDrink, MenuExtra } from "@/lib/types";

export function findDrink(menu: Menu, drinkId: string): MenuDrink | undefined {
  return menu.drinks.find((drink) => drink.id === drinkId);
}

export function findExtra(menu: Menu, extraId: string): MenuExtra | undefined {
  return menu.extras.find((extra) => extra.id === extraId);
}

export function extrasForDrink(menu: Menu, drink: MenuDrink): MenuExtra[] {
  const allowed = new Set(drink.extras);
  return menu.extras.filter((extra) => allowed.has(extra.id));
}

export function lowestPricePence(drink: MenuDrink): number {
  return Math.min(...drink.sizes.map((size) => size.pricePence));
}

export function defaultSizeId(drink: MenuDrink): string {
  return drink.sizes.find((size) => size.id === "regular")?.id ?? drink.sizes[0].id;
}
