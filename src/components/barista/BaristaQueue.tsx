"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLockup } from "@/components/CoffeeBeansLogo";
import { useOrderStream } from "@/hooks/useOrderStream";
import { formatGbp } from "@/lib/money";
import { ticketAriaLabel, ticketExtras } from "@/lib/ticket-display";
import { formatClock, formatRelative } from "@/lib/time";
import type { Order, OrderStatus } from "@/lib/types";

export function BaristaQueue({ cafeName }: { cafeName: string }) {
  const { orders, connected, error, newOrderIds } = useOrderStream();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [now, setNow] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const immediate = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!soundOn || newOrderIds.length === 0) return;
    const context = audioRef.current;
    if (!context) return;
    if (context.state === "suspended") {
      void context.resume().then(() => playChime(audioRef.current));
      return;
    }
    playChime(context);
  }, [newOrderIds, soundOn]);

  useEffect(() => {
    if (!soundOn) return;
    const resume = () => {
      if (document.visibilityState === "visible") void audioRef.current?.resume();
    };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, [soundOn]);

  const queued = useMemo(
    () => orders.filter((order) => order.status === "queued"),
    [orders],
  );
  const ready = useMemo(
    () => orders.filter((order) => order.status === "ready"),
    [orders],
  );
  const completed = useMemo(
    () => orders.filter((order) => order.status === "completed"),
    [orders],
  );

  async function enableSound() {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const context = audioRef.current ?? new AudioCtx();
    audioRef.current = context;
    await context.resume();
    setSoundOn(true);
    playChime(context);
  }

  async function setStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function setItemMade(orderId: string, itemId: string, made: boolean) {
    setBusyItemId(itemId);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, made }),
      });
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <div className="min-h-dvh bg-espresso text-foam">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-espresso/95 px-5 py-4 backdrop-blur safe-top">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLockup
              name={cafeName}
              subtitle="Barista queue"
              variant="dark"
              size="md"
              subtitleAs="h1"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                connected ? "bg-leaf/20 text-leaf-soft" : "bg-white/10 text-foam/70"
              }`}
            >
              {connected ? "Live" : "Reconnecting"}
            </span>
            {!soundOn ? (
              <button
                type="button"
                onClick={enableSound}
                className="tap min-h-12 rounded-full bg-caramel px-5 font-semibold text-espresso"
              >
                Enable new-order chime
              </button>
            ) : (
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm">Chime on</span>
            )}
          </div>
        </div>
        {error ? <p className="mx-auto mt-3 max-w-7xl text-caramel">{error}</p> : null}
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle
            title="On the bar"
            count={queued.length}
            hint="Oldest first"
          />
          {queued.length === 0 ? (
            <EmptyState message="No orders waiting. New tickets will appear here as soon as they’re placed." />
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {queued.map((order) => (
                <OrderTicket
                  key={order.id}
                  order={order}
                  now={now}
                  isNew={newOrderIds.includes(order.id)}
                  busy={busyId === order.id}
                  busyItemId={busyItemId}
                  onReady={() => setStatus(order.id, "ready")}
                  onDone={() => setStatus(order.id, "completed")}
                  onToggleItem={(itemId, made) => setItemMade(order.id, itemId, made)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-8">
          <section>
            <SectionTitle title="Ready for collection" count={ready.length} />
            {ready.length === 0 ? (
              <EmptyState message="Nothing waiting to be collected." compact />
            ) : (
              <div className="mt-4 grid gap-4">
                {ready.map((order) => (
                  <OrderTicket
                    key={order.id}
                    order={order}
                    now={now}
                    busy={busyId === order.id}
                    busyItemId={busyItemId}
                    ready
                    onDone={() => setStatus(order.id, "completed")}
                    onUndo={() => setStatus(order.id, "queued")}
                    onToggleItem={(itemId, made) => setItemMade(order.id, itemId, made)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle title="Recently completed" count={completed.length} />
            {completed.length === 0 ? (
              <EmptyState message="Completed tickets stay here briefly." compact />
            ) : (
              <div className="mt-4 grid gap-3 opacity-80">
                {completed.map((order) => (
                  <OrderTicket
                    key={order.id}
                    order={order}
                    now={now}
                    compact
                    onUndo={() => setStatus(order.id, "ready")}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({
  title,
  count,
  hint,
}: {
  title: string;
  count: number;
  hint?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-3xl font-semibold">{title}</h2>
        {hint ? <p className="text-foam/60">{hint}</p> : null}
      </div>
      <span className="rounded-full bg-white/10 px-3 py-1 text-lg">{count}</span>
    </div>
  );
}

function EmptyState({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <p
      className={`mt-4 rounded-3xl border border-dashed border-white/15 text-foam/70 ${
        compact ? "px-5 py-6 text-lg" : "px-6 py-16 text-center text-xl"
      }`}
    >
      {message}
    </p>
  );
}

function OrderTicket({
  order,
  now,
  isNew = false,
  ready = false,
  compact = false,
  busy = false,
  busyItemId = null,
  onReady,
  onDone,
  onUndo,
  onToggleItem,
}: {
  order: Order;
  now: number;
  isNew?: boolean;
  ready?: boolean;
  compact?: boolean;
  busy?: boolean;
  busyItemId?: string | null;
  onReady?: () => void;
  onDone?: () => void;
  onUndo?: () => void;
  onToggleItem?: (itemId: string, made: boolean) => void;
}) {
  const allMade = order.items.length > 0 && order.items.every((item) => item.made);
  return (
    <article
      className={`rounded-[1.6rem] bg-foam p-5 text-espresso shadow-xl ${
        isNew ? "ticket-new ring-4 ring-caramel" : ""
      } ${ready ? "ring-2 ring-leaf" : ""} ${compact ? "opacity-90" : ""}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-4xl font-semibold leading-none">#{order.ticketNumber}</p>
          <p className="mt-2 text-2xl font-semibold">
            {order.customerName || "Walk-up"}
          </p>
        </div>
        <div className="text-right text-coffee">
          <p className="text-xl font-semibold">{formatClock(order.createdAt)}</p>
          <p className="text-sm">{now ? formatRelative(order.createdAt, now) : " "}</p>
        </div>
      </header>

      <ul className="mt-4 space-y-2">
        {order.items.map((item) => {
          const made = Boolean(item.made);
          const { decaf, serve, detail } = ticketExtras(item.extras);
          const label = ticketAriaLabel(item);
          const content = (
            <>
              <span
                aria-hidden
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-lg font-bold ${
                  made
                    ? "border-leaf bg-leaf text-white"
                    : "border-espresso/30 bg-foam text-transparent"
                }`}
              >
                ✓
              </span>
              <span className="min-w-0 flex-1 text-left">
                {item.kind === "donut" ? (
                  <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-mocha">
                    Donuts
                  </span>
                ) : item.kind === "special" ? (
                  <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-mocha">
                    Special
                  </span>
                ) : item.kind === "boba" ? (
                  <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-mocha">
                    Boba
                  </span>
                ) : item.kind === "cold-drink" ? (
                  <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-mocha">
                    Cold drink
                  </span>
                ) : null}
                {serve ? (
                  <span className="mb-1 mr-2 inline-block rounded-full bg-espresso px-3 py-1 text-sm font-bold uppercase tracking-[0.18em] text-foam">
                    {serve}
                  </span>
                ) : null}
                {decaf ? (
                  <span className="mb-1 inline-block rounded-full bg-espresso px-3 py-1 text-sm font-bold uppercase tracking-[0.18em] text-foam">
                    Decaf
                  </span>
                ) : null}
                <span className={`block text-xl font-semibold ${made ? "line-through" : ""}`}>
                  {item.quantity > 1 ? `${item.quantity}× ` : ""}
                  {item.drinkName}
                  {item.sizeName ? (
                    <span className="ml-2 font-normal text-coffee">{item.sizeName}</span>
                  ) : null}
                </span>
                {detail.length > 0 ? (
                  <span className={`block text-base text-coffee ${made ? "line-through" : ""}`}>
                    {detail.map((extra) => extra.name).join(" · ")}
                  </span>
                ) : null}
              </span>
            </>
          );

          if (onToggleItem) {
            return (
              <li key={item.id} className="border-t border-espresso/10 pt-2">
                <button
                  type="button"
                  aria-pressed={made}
                  aria-label={made ? `Mark ${label} as not made` : `Mark ${label} as made`}
                  disabled={busyItemId === item.id}
                  onClick={() => onToggleItem(item.id, !made)}
                  className={`tap flex min-h-16 w-full items-start gap-3 rounded-2xl px-2 py-2 text-left disabled:opacity-50 ${
                    made ? "bg-leaf/10 text-coffee" : "bg-cream/70 text-espresso"
                  }`}
                >
                  {content}
                </button>
              </li>
            );
          }

          return (
            <li key={item.id} className="flex items-start gap-3 border-t border-espresso/10 pt-3">
              {content}
            </li>
          );
        })}
      </ul>

      {onToggleItem && allMade ? (
        <p className="mt-3 text-base font-semibold text-leaf">
          {ready ? "All items made." : "All items made — you can mark ready."}
        </p>
      ) : null}

      <p className="mt-4 text-right text-xl font-semibold">{formatGbp(order.totalPence)}</p>

      {!compact ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {onReady ? (
            <button
              type="button"
              disabled={busy}
              onClick={onReady}
              className={`tap min-h-16 rounded-2xl text-xl font-semibold text-white disabled:opacity-50 ${
                allMade ? "bg-leaf ring-4 ring-leaf/30" : "bg-leaf"
              }`}
            >
              Mark ready
            </button>
          ) : null}
          {onDone ? (
            <button
              type="button"
              disabled={busy}
              onClick={onDone}
              className={`tap min-h-16 rounded-2xl text-xl font-semibold disabled:opacity-50 ${
                onReady ? "bg-espresso text-foam" : "col-span-2 bg-leaf text-white"
              }`}
            >
              Done
            </button>
          ) : null}
          {onUndo && ready ? (
            <button
              type="button"
              disabled={busy}
              onClick={onUndo}
              className="tap col-span-2 min-h-12 rounded-2xl bg-cream text-lg font-semibold"
            >
              Back to queue
            </button>
          ) : null}
        </div>
      ) : onUndo ? (
        <button
          type="button"
          onClick={onUndo}
          className="tap mt-3 min-h-12 w-full rounded-2xl bg-cream text-lg font-semibold"
        >
          Restore
        </button>
      ) : null}
    </article>
  );
}

function playChime(context: AudioContext | null) {
  if (!context) return;
  const now = context.currentTime;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;
  const master = context.createGain();
  master.gain.value = 1;
  limiter.connect(master);
  master.connect(context.destination);

  // Two full-scale notes. The second starts as the first finishes so the peaks do not add.
  const notes = [
    { offset: 0, frequency: 880, duration: 0.55 },
    { offset: 0.52, frequency: 1175, duration: 0.62 },
  ];
  for (const note of notes) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + note.offset;
    const end = start + note.duration;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(note.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(1, start + 0.015);
    gain.gain.setValueAtTime(1, start + note.duration * 0.62);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(limiter);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }
}
