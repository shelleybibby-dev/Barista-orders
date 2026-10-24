import type { OrderItemExtra } from "@/lib/types";

export function isDecafExtra(extra: Pick<OrderItemExtra, "id">): boolean {
  return extra.id === "decaf";
}

export function ticketExtras(extras: OrderItemExtra[]): {
  decaf: boolean;
  detail: OrderItemExtra[];
} {
  return {
    decaf: extras.some(isDecafExtra),
    detail: extras.filter((extra) => !isDecafExtra(extra)),
  };
}

export function ticketAriaLabel(item: {
  quantity: number;
  drinkName: string;
  sizeName: string;
  extras: OrderItemExtra[];
}): string {
  const base = `${item.quantity > 1 ? `${item.quantity}× ` : ""}${item.drinkName}${
    item.sizeName ? ` ${item.sizeName}` : ""
  }`;
  const { decaf, detail } = ticketExtras(item.extras);
  const notes = [decaf ? "Decaf" : "", ...detail.map((extra) => extra.name)].filter(Boolean);
  return notes.length > 0 ? `${base}, ${notes.join(", ")}` : base;
}
