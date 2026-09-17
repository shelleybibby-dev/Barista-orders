import { getOrderEvents } from "@/lib/events";
import { getOrderStore } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const encoder = new TextEncoder();
  const events = getOrderEvents();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const payload = JSON.stringify({
          type: "orders",
          orders: getOrderStore().list(),
        });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      send();
      events.on("change", send);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      cleanup = () => {
        clearInterval(heartbeat);
        events.off("change", send);
      };

      request.signal.addEventListener("abort", () => {
        cleanup?.();
        try {
          controller.close();
        } catch {
          // Stream already closed.
        }
      });
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
