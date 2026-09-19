import { NextResponse } from "next/server";
import { OrderNotFoundError, getOrderStore } from "@/lib/orders";
import { OrderValidationError } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["queued", "ready", "completed"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let body: { status?: string; itemId?: string; made?: boolean };

  try {
    body = (await request.json()) as { status?: string; itemId?: string; made?: boolean };
  } catch {
    return NextResponse.json({ error: "Update could not be read." }, { status: 400 });
  }

  const hasStatus = Boolean(body.status);
  const hasItem = typeof body.itemId === "string" && body.itemId.length > 0;

  if (!hasStatus && !hasItem) {
    return NextResponse.json(
      { error: "Choose a valid order status or item." },
      { status: 400 },
    );
  }

  if (hasStatus && !STATUSES.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: "Choose a valid order status." }, { status: 400 });
  }

  if (hasItem && typeof body.made !== "boolean") {
    return NextResponse.json({ error: "Say whether the item is made." }, { status: 400 });
  }

  try {
    const store = getOrderStore();
    let order = null;
    if (hasItem) {
      order = store.updateItemMade(id, body.itemId!, body.made as boolean);
    }
    if (hasStatus) {
      order = store.updateStatus(id, body.status as OrderStatus);
    }
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }
}
