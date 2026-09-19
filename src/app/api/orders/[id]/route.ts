import { NextResponse } from "next/server";
import { OrderNotFoundError, getOrderStore } from "@/lib/orders";
import { OrderValidationError } from "@/lib/pricing";
import type { OrderStatus, WorkerAction } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["queued", "ready", "completed"];
const WORKER_ACTIONS: WorkerAction[] = ["join", "leave"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let body: {
    status?: string;
    worker?: { action?: string; name?: string };
  };

  try {
    body = (await request.json()) as {
      status?: string;
      worker?: { action?: string; name?: string };
    };
  } catch {
    return NextResponse.json({ error: "Update could not be read." }, { status: 400 });
  }

  const hasStatus = Boolean(body.status);
  const hasWorker = Boolean(body.worker);

  if (!hasStatus && !hasWorker) {
    return NextResponse.json(
      { error: "Choose a valid order status or staff action." },
      { status: 400 },
    );
  }

  if (hasStatus && !STATUSES.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: "Choose a valid order status." }, { status: 400 });
  }

  if (hasWorker) {
    if (!body.worker?.action || !WORKER_ACTIONS.includes(body.worker.action as WorkerAction)) {
      return NextResponse.json({ error: "Choose Join or Leave." }, { status: 400 });
    }
  }

  try {
    const store = getOrderStore();
    let order = null;
    if (hasWorker) {
      order = store.updateWorkers(
        id,
        body.worker!.action as WorkerAction,
        body.worker!.name ?? "",
      );
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
