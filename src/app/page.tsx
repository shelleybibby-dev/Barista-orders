import Link from "next/link";
import { getMenu } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const menu = getMenu();

  return (
    <div className="min-h-dvh bg-cream text-espresso">
      <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-mocha">
          Dual iPad café setup
        </p>
        <h1 className="mt-4 font-display text-6xl font-semibold tracking-tight">
          {menu.cafeName}
        </h1>
        <p className="mt-4 max-w-2xl text-2xl text-coffee">{menu.tagline}</p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Link
            href="/customer"
            className="tap rounded-[2rem] bg-foam p-8 shadow-xl ring-1 ring-espresso/10"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-caramel">Customer iPad</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">Order kiosk</h2>
            <p className="mt-3 text-lg text-coffee">
              Portrait-friendly menu. Customers pick a drink, add extras, and send it to the bar.
            </p>
            <span className="mt-8 inline-flex min-h-14 items-center rounded-full bg-espresso px-6 text-lg font-semibold text-foam">
              Open customer view
            </span>
          </Link>

          <Link
            href="/barista"
            className="tap rounded-[2rem] bg-espresso p-8 text-foam shadow-xl"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-caramel">Barista iPad</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">Live queue</h2>
            <p className="mt-3 text-lg text-foam/75">
              Tickets arrive as they’re placed. Mark ready, then done — no refresh needed.
            </p>
            <span className="mt-8 inline-flex min-h-14 items-center rounded-full bg-caramel px-6 text-lg font-semibold text-espresso">
              Open barista view
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
