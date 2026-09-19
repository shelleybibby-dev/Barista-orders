"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { BrandLockup } from "@/components/CoffeeBeansLogo";
import { useOrderStream } from "@/hooks/useOrderStream";
import { formatGbp } from "@/lib/money";
import { formatClock, formatRelative } from "@/lib/time";
import type { Order, OrderStatus } from "@/lib/types";

const STAFF_STORAGE_KEY = "coffee-beans-staff";

export function BaristaQueue({
  cafeName,
  staff,
}: {
  cafeName: string;
  staff: string[];
}) {
  const { orders, connected, error, newOrderIds } = useOrderStream();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [now, setNow] = useState(0);
  const me = useStaffIdentity(staff);
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
    playChime(audioRef.current);
  }, [newOrderIds, soundOn]);

  function chooseStaff(name: string) {
    writeStaffIdentity(name);
  }

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

  async function setWorker(id: string, action: "join" | "leave") {
    if (!me) return;
    setBusyId(id);
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worker: { action, name: me } }),
      });
    } finally {
      setBusyId(null);
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
            <StaffPicker staff={staff} me={me} onChoose={chooseStaff} />
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
                  me={me}
                  onReady={() => setStatus(order.id, "ready")}
                  onDone={() => setStatus(order.id, "completed")}
                  onJoin={() => setWorker(order.id, "join")}
                  onLeave={() => setWorker(order.id, "leave")}
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
                    me={me}
                    ready
                    onDone={() => setStatus(order.id, "completed")}
                    onUndo={() => setStatus(order.id, "queued")}
                    onJoin={() => setWorker(order.id, "join")}
                    onLeave={() => setWorker(order.id, "leave")}
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

function StaffPicker({
  staff,
  me,
  onChoose,
}: {
  staff: string[];
  me: string;
  onChoose: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-foam/70">I am …</span>
      {staff.map((name) => {
        const selected = me === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChoose(name)}
            aria-pressed={selected}
            className={`tap min-h-12 rounded-full px-4 font-semibold ${
              selected ? "bg-caramel text-espresso" : "bg-white/10 text-foam"
            }`}
          >
            {name}
          </button>
        );
      })}
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
  me = "",
  onReady,
  onDone,
  onUndo,
  onJoin,
  onLeave,
}: {
  order: Order;
  now: number;
  isNew?: boolean;
  ready?: boolean;
  compact?: boolean;
  busy?: boolean;
  me?: string;
  onReady?: () => void;
  onDone?: () => void;
  onUndo?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
}) {
  const workers = order.workers ?? [];
  const joined = Boolean(me) && workers.includes(me);
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

      <ul className="mt-4 space-y-3">
        {order.items.map((item) => (
          <li key={item.id} className="border-t border-espresso/10 pt-3">
            {item.kind === "donut" ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mocha">Donuts</p>
            ) : item.kind === "boba" ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mocha">Boba</p>
            ) : null}
            <p className="text-xl font-semibold">
              {item.quantity > 1 ? `${item.quantity}× ` : ""}
              {item.drinkName}
              {item.sizeName ? (
                <span className="ml-2 font-normal text-coffee">{item.sizeName}</span>
              ) : null}
            </p>
            {item.extras.length > 0 ? (
              <p className="text-base text-coffee">
                {item.extras.map((extra) => extra.name).join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-right text-xl font-semibold">{formatGbp(order.totalPence)}</p>

      {!compact && onJoin && onLeave ? (
        <div className="mt-4 rounded-2xl bg-cream/80 px-4 py-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-mocha">
            Who’s working this
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {workers.length === 0 ? (
              <span className="text-base text-coffee">Nobody yet</span>
            ) : (
              workers.map((name) => (
                <span
                  key={name}
                  className={`rounded-full px-3 py-1 text-base font-semibold ${
                    name === me ? "bg-caramel text-espresso" : "bg-foam text-espresso"
                  }`}
                >
                  {name}
                </span>
              ))
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy || !me || joined}
              onClick={onJoin}
              className="tap min-h-12 rounded-2xl bg-caramel text-lg font-semibold text-espresso disabled:opacity-50"
            >
              Join
            </button>
            <button
              type="button"
              disabled={busy || !me || !joined}
              onClick={onLeave}
              className="tap min-h-12 rounded-2xl bg-foam text-lg font-semibold text-espresso disabled:opacity-50"
            >
              Leave
            </button>
          </div>
          {!me ? (
            <p className="mt-2 text-sm text-coffee">Choose your name above to join.</p>
          ) : null}
        </div>
      ) : null}

      {!compact ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {onReady ? (
            <button
              type="button"
              disabled={busy}
              onClick={onReady}
              className="tap min-h-16 rounded-2xl bg-leaf text-xl font-semibold text-white disabled:opacity-50"
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

const STAFF_CHANGE_EVENT = "coffee-beans-staff-change";

function subscribeStaffIdentity(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STAFF_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STAFF_CHANGE_EVENT, onChange);
  };
}

function readStaffIdentity(staff: string[]) {
  const saved = window.localStorage.getItem(STAFF_STORAGE_KEY) ?? "";
  return staff.includes(saved) ? saved : "";
}

function writeStaffIdentity(name: string) {
  window.localStorage.setItem(STAFF_STORAGE_KEY, name);
  window.dispatchEvent(new Event(STAFF_CHANGE_EVENT));
}

function useStaffIdentity(staff: string[]) {
  return useSyncExternalStore(
    subscribeStaffIdentity,
    () => readStaffIdentity(staff),
    () => "",
  );
}

function playChime(context: AudioContext | null) {
  if (!context) return;
  const now = context.currentTime;
  [0, 0.16].forEach((offset, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = index === 0 ? 880 : 1175;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.08, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.2);
  });
}
