"use client";

import { useEffect, useRef, useState } from "react";
import type { Order } from "@/lib/types";

export type QueueLink = "live" | "updating" | "offline";

const POLL_INTERVAL_MS = 2500;
const STREAM_RETRY_MS = 15000;

export function useOrderStream() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [link, setLink] = useState<QueueLink>("updating");
  const seenRef = useRef<Set<string>>(new Set());
  const [newOrderIds, setNewOrderIds] = useState<string[]>([]);

  useEffect(() => {
    let stopped = false;
    let source: EventSource | null = null;
    let connection = 0;
    let streamOpen = false;
    let sawList = false;
    let listVersion = 0;
    let pollTimer = 0;
    let retryTimer = 0;

    const publish = (next: Order[]) => {
      listVersion += 1;
      const previous = seenRef.current;
      const incoming = next
        .filter((order) => order.status === "queued")
        .map((order) => order.id)
        .filter((id) => previous.size > 0 && !previous.has(id));

      seenRef.current = new Set(next.map((order) => order.id));
      setOrders(next);
      if (incoming.length > 0) setNewOrderIds(incoming);
    };

    const showLink = () => {
      if (!sawList) {
        setLink("updating");
        return;
      }
      setLink(streamOpen ? "live" : "offline");
    };

    const pollOnce = async () => {
      if (stopped) return;
      const started = listVersion;
      try {
        const response = await fetch(`/api/orders?t=${Date.now()}`, {
          cache: "no-store",
          headers: { Accept: "application/json", "Cache-Control": "no-cache" },
        });
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as { orders?: Order[] };
        if (stopped) return;
        sawList = true;
        if (listVersion === started) publish(payload.orders ?? []);
        showLink();
      } catch {
        if (!stopped) showLink();
      }
    };

    const scheduleStreamRetry = () => {
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => {
        if (!stopped && !streamOpen) connect();
      }, STREAM_RETRY_MS);
    };

    const connect = () => {
      if (stopped) return;
      if (typeof EventSource === "undefined") {
        streamOpen = false;
        showLink();
        scheduleStreamRetry();
        return;
      }

      const id = ++connection;
      window.clearTimeout(retryTimer);
      try {
        source?.close();
      } catch {
        // Ignore a stream that is already closed.
      }

      let current: EventSource;
      try {
        current = new EventSource("/api/orders/stream");
      } catch {
        source = null;
        streamOpen = false;
        showLink();
        scheduleStreamRetry();
        return;
      }
      source = current;

      current.onopen = () => {
        if (stopped || id !== connection) return;
        streamOpen = true;
        showLink();
      };

      current.onerror = () => {
        if (stopped || id !== connection) return;
        streamOpen = false;
        try {
          current.close();
        } catch {
          // Already closed.
        }
        if (source === current) source = null;
        showLink();
        scheduleStreamRetry();
      };

      current.onmessage = (event) => {
        if (stopped || id !== connection) return;
        try {
          const payload = JSON.parse(event.data) as { orders?: Order[] };
          streamOpen = true;
          publish(payload.orders ?? []);
          showLink();
        } catch {
          // Keep the tickets already on screen. The poll loop still refreshes them.
        }
      };
    };

    const onWake = () => {
      if (stopped || document.visibilityState === "hidden") return;
      void pollOnce();
      if (!source) connect();
    };

    void pollOnce();
    pollTimer = window.setInterval(() => {
      void pollOnce();
    }, POLL_INTERVAL_MS);
    connect();
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("pageshow", onWake);
    window.addEventListener("focus", onWake);

    return () => {
      stopped = true;
      connection += 1;
      streamOpen = false;
      window.clearTimeout(retryTimer);
      window.clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("pageshow", onWake);
      window.removeEventListener("focus", onWake);
      try {
        source?.close();
      } catch {
        // Ignore a stream that is already closed.
      }
      source = null;
    };
  }, []);

  return { orders, link, newOrderIds };
}
