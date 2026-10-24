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
      <ellipse cx="48" cy="88" rx="16" ry="3.5" fill="rgba(42,24,16,0.12)" />
      {bottle ? <Bottle drink={drink} /> : <Can drink={drink} />}
    </svg>
  );
}

function Can({ drink }: { drink: MenuProduct }) {
  return (
    <>
      <path
        d="M30 32c0-7 8-11 18-11s18 4 18 11v44c0 7-8 12-18 12s-18-5-18-12V32Z"
        fill={drink.accent}
      />
      <path d="M34 38c2 16 2 28 0 42" fill="none" stroke="#fff" strokeWidth="3" opacity="0.28" />
      <rect x="30" y="46" width="36" height="14" fill={drink.foam} />
      <ellipse cx="48" cy="32" rx="18" ry="7" fill="#d5d8de" />
      <ellipse cx="48" cy="30" rx="11" ry="3.6" fill="#f7f8fa" />
      <rect x="45" y="26" width="10" height="3" rx="1.2" fill="#9aa0a8" />
    </>
  );
}

function Bottle({ drink }: { drink: MenuProduct }) {
  const sports = drink.id === "fruit-shoot";
  if (sports) {
    return (
      <>
        <rect x="42" y="16" width="12" height="7" rx="2" fill={drink.foam} />
        <rect x="46" y="12" width="4" height="6" rx="2" fill="#2c6b34" />
        <path d="M40 23h16l2 8h8c4 0 8 4 8 10v27c0 8-8 12-20 12s-20-4-20-12V41c0-6 4-10 8-10h8l2-8Z" fill={drink.accent} />
        <path d="M38 44h20v8H38z" fill="#fff" opacity="0.28" />
        <path d="M36 40c1.5 14 1.5 24 0 36" fill="none" stroke="#fff" strokeWidth="3" opacity="0.35" />
      </>
    );
  }

  return (
    <>
      <rect x="40" y="12" width="16" height="10" rx="2" fill={drink.foam} />
      <path d="M42 22h12l3 10c8 3 13 10 13 18v22c0 8-7 12-16 12s-16-4-16-12V50c0-8 5-15 13-18l3-10Z" fill={drink.accent} />
      <path d="M40 48h16c1 8 1 16 0 24H40c-1-8-1-16 0-24Z" fill="#fff" opacity="0.45" />
      <path d="M38 36c1.4 16 1.4 28 0 42" fill="none" stroke="#fff" strokeWidth="3" opacity="0.55" />
    </>
  );
}
