import fs from "node:fs";
import path from "node:path";
import type { Menu } from "@/lib/types";

const MENU_PATH = path.join(process.cwd(), "data", "menu.json");

export function getMenu(): Menu {
  const raw = fs.readFileSync(MENU_PATH, "utf8");
  const menu = JSON.parse(raw) as Menu;

  if (!menu?.cafeName || !Array.isArray(menu.drinks) || !Array.isArray(menu.extras)) {
    throw new Error("Menu config is missing cafeName, drinks or extras.");
  }

  menu.donuts = Array.isArray(menu.donuts) ? menu.donuts : [];
  return menu;
}
