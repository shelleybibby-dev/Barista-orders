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
  let body: { status?: string };

  try {
    body = (await request.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Update could not be read." }, { status: 400 });
  }

  if (!body.status || !STATUSES.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: "Choose a valid order status." }, { status: 400 });
  }

  try {
    const order = getOrderStore().updateStatus(id, body.status as OrderStatus);
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
