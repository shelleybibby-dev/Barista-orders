"use client";

import { useEffect, useRef, useState } from "react";
import type { Order } from "@/lib/types";

export function useOrderStream() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const [newOrderIds, setNewOrderIds] = useState<string[]>([]);

  useEffect(() => {
    let stopped = false;
    let source: EventSource | null = null;
    let retryTimer: number | undefined;

    const connect = () => {
      if (stopped) return;

      source = new EventSource("/api/orders/stream");

      source.onopen = () => {
        setConnected(true);
        setError(null);
      };

      source.onerror = () => {
        setConnected(false);
        setError("Live connection lost — retrying…");
        source?.close();
        source = null;
        if (!stopped) {
          retryTimer = window.setTimeout(connect, 2000);
        }
      };

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { orders?: Order[] };
          const next = payload.orders ?? [];
          const previous = seenRef.current;
          const incoming = next
            .filter((order) => order.status === "queued")
            .map((order) => order.id)
            .filter((id) => previous.size > 0 && !previous.has(id));

          seenRef.current = new Set(next.map((order) => order.id));
          setOrders(next);
          if (incoming.length > 0) {
            setNewOrderIds(incoming);
          }
        } catch {
          setError("Could not read the live queue.");
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      source?.close();
    };
  }, []);

  return { orders, connected, error, newOrderIds };
}
