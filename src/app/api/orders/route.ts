import { NextResponse } from "next/server";
import { OrderValidationError } from "@/lib/pricing";
import { getOrderStore } from "@/lib/orders";
import type { CreateOrderInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ orders: getOrderStore().list() });
}

export async function POST(request: Request) {
  let body: CreateOrderInput;

  try {
    body = (await request.json()) as CreateOrderInput;
  } catch {
    return NextResponse.json({ error: "Order could not be read." }, { status: 400 });
  }

  try {
    const order = getOrderStore().create(body);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Could not place the order." }, { status: 500 });
  }
}
