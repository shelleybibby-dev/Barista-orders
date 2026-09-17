import { getOrderEvents } from "@/lib/events";
import { getOrderStore } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export function GET(request: Request) {
  const encoder = new TextEncoder();
  const events = getOrderEvents();
  let cleanup: (() => void) | undefined;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
          cleanup?.();
        }
      };

      const send = () => {
        const payload = JSON.stringify({
          type: "orders",
          orders: getOrderStore().list(),
        });
        safeEnqueue(`data: ${payload}\n\n`);
      };

      safeEnqueue("retry: 2000\n\n");
      send();
      events.on("change", send);

      const heartbeat = setInterval(() => {
        safeEnqueue(`: ping ${Date.now()}\n\n`);
      }, 10000);

      cleanup = () => {
        clearInterval(heartbeat);
        events.off("change", send);
      };

      request.signal.addEventListener("abort", () => {
        closed = true;
        cleanup?.();
        try {
          controller.close();
        } catch {
          // Stream already closed.
        }
      });
    },
    cancel() {
      closed = true;
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
}
