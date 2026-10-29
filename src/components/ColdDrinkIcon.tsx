import type { MenuProduct } from "@/lib/types";

export function ColdDrinkIcon({
  drink,
  className = "",
}: {
  drink: MenuProduct;
  className?: string;
}) {
  const bottle = drink.description === "Bottle";
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="48" cy="90" rx="18" ry="3" fill="rgba(42,24,16,0.14)" />
      {bottle ? <Bottle drink={drink} /> : <Can drink={drink} />}
    </svg>
  );
}

function Can({ drink }: { drink: MenuProduct }) {
  return (
    <>
      <path d="M28 36h40v40c0 7-9 12-20 12s-20-5-20-12V36Z" fill={drink.accent} />
      <path d="M32 42v26" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <rect x="28" y="48" width="40" height="16" fill={drink.foam} />
      <ellipse cx="48" cy="36" rx="20" ry="7" fill="#c5cad1" />
      <ellipse cx="48" cy="34" rx="15" ry="4.5" fill="#f4f6f8" />
      <ellipse cx="48" cy="34" rx="6" ry="2.3" fill="none" stroke="#6f7680" strokeWidth="1.7" />
      <path d="M48 31.5v-4" fill="none" stroke="#6f7680" strokeWidth="1.7" strokeLinecap="round" />
    </>
  );
}

function Bottle({ drink }: { drink: MenuProduct }) {
  if (drink.id.startsWith("fruit-shoot")) {
    return (
      <>
        <rect x="44" y="18" width="8" height="6" rx="2" fill={drink.accent} />
        <path d="M40 24h16v6H40z" fill={drink.foam} />
        <path
          d="M40 30h16l4 8c8 2 10 8 10 14v22c0 8-8 12-18 12s-18-4-18-12V52c0-6 2-12 10-14l4-8Z"
          fill={drink.accent}
        />
        <path d="M36 52h24v10H36z" fill="#fff" opacity="0.28" />
        <path d="M34 46c1.4 12 1.4 22 0 34" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.4" />
      </>
    );
  }

  return (
    <>
      <rect x="41" y="8" width="14" height="9" rx="1.5" fill={drink.foam} />
      <path d="M44 17h8v12l-2 2h-4l-2-2V17Z" fill="#eef8fc" stroke="#7aa4be" strokeWidth="1.4" />
      <path
        d="M46 31c-12 4-16 12-16 20v22c0 8 7 11 18 11s18-3 18-11V51c0-8-4-16-16-20Z"
        fill={drink.accent}
        stroke="#7aa4be"
        strokeWidth="1.6"
      />
      <path d="M36 58h24c.4 6 .4 12 0 18H36c-.4-6-.4-12 0-18Z" fill="#fff" opacity="0.55" />
      <path d="M34 42c1.2 14 1.2 26 0 40" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.7" />
    </>
  );
}
