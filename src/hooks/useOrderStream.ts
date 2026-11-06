"use client";

import { useEffect, useRef, useState } from "react";
import type { Order } from "@/lib/types";

export type QueueLink = "live" | "updating" | "offline";

const OPEN_TIMEOUT_MS = 3000;
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
    let live = false;
    let polling = false;
    let openTimer = 0;
    let pollTimer = 0;
    let retryTimer = 0;

    const publish = (next: Order[]) => {
      const previous = seenRef.current;
      const incoming = next
        .filter((order) => order.status === "queued")
        .map((order) => order.id)
        .filter((id) => previous.size > 0 && !previous.has(id));

      seenRef.current = new Set(next.map((order) => order.id));
      setOrders(next);
      if (incoming.length > 0) setNewOrderIds(incoming);
    };

    const pollOnce = async () => {
      if (stopped || live) return;
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as { orders?: Order[] };
        if (stopped || live) return;
        publish(payload.orders ?? []);
        setLink("offline");
      } catch {
        if (stopped || live) return;
        setLink((current) => (current === "live" ? current : "offline"));
      }
    };

    const ensurePolling = () => {
      if (stopped || polling) return;
      polling = true;
      void pollOnce();
      pollTimer = window.setInterval(() => void pollOnce(), POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      polling = false;
      window.clearInterval(pollTimer);
      pollTimer = 0;
    };

    const scheduleStreamRetry = () => {
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => {
        if (!stopped && !live) connect();
      }, STREAM_RETRY_MS);
    };

    const connect = () => {
      if (stopped) return;
      const id = ++connection;
      window.clearTimeout(openTimer);
      window.clearTimeout(retryTimer);
      source?.close();

      const current = new EventSource("/api/orders/stream");
      source = current;

      openTimer = window.setTimeout(() => {
        if (stopped || live || id !== connection) return;
        current.close();
        if (source === current) source = null;
        setLink((currentLink) => (currentLink === "offline" ? currentLink : "updating"));
        ensurePolling();
        scheduleStreamRetry();
      }, OPEN_TIMEOUT_MS);

      current.onopen = () => {
        if (stopped || id !== connection) return;
        live = true;
        window.clearTimeout(openTimer);
        window.clearTimeout(retryTimer);
        stopPolling();
        setLink("live");
      };

      current.onerror = () => {
        if (stopped || id !== connection) return;
        live = false;
        window.clearTimeout(openTimer);
        current.close();
        if (source === current) source = null;
        setLink((currentLink) => (currentLink === "offline" ? currentLink : "updating"));
        ensurePolling();
        scheduleStreamRetry();
      };

      current.onmessage = (event) => {
        if (stopped || id !== connection) return;
        try {
          const payload = JSON.parse(event.data) as { orders?: Order[] };
          if (!live) {
            live = true;
            window.clearTimeout(openTimer);
            window.clearTimeout(retryTimer);
            stopPolling();
            setLink("live");
          }
          publish(payload.orders ?? []);
        } catch {
          if (!live) {
            setLink((currentLink) => (currentLink === "offline" ? currentLink : "updating"));
            ensurePolling();
          }
        }
      };
    };

    const onVisible = () => {
      if (stopped || document.visibilityState !== "visible" || live) return;
      void pollOnce();
      if (!source) connect();
    };

    connect();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      connection += 1;
      live = false;
      window.clearTimeout(openTimer);
      window.clearTimeout(retryTimer);
      window.clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", onVisible);
      source?.close();
      source = null;
    };
  }, []);

  return { orders, link, newOrderIds };
}
