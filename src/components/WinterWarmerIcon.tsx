import type { MenuProduct } from "@/lib/types";

export function WinterWarmerIcon({
  drink,
  className = "",
}: {
  drink: MenuProduct;
  className?: string;
}) {
  const garnish = drink.id.includes("cherry")
    ? "cherry"
    : drink.id.includes("apple")
      ? "apple"
      : "mulled";

  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="46" cy="84" rx="22" ry="4.5" fill="rgba(42,24,16,0.12)" />
      <path
        d="M64 46c10 1 14 7 12 13-1.6 6-8 9-14 8"
        fill="none"
        stroke={drink.accent}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M24 40h40l-3 30c-.7 7-7 12-17 12s-16.3-5-17-12L24 40Z"
        fill="#fffaf4"
        stroke="#e4d2c0"
        strokeWidth="2"
      />
      <path d="M28 52h36l-2.2 18c-.5 5-5.2 8-15.8 8s-15.3-3-15.8-8L28 52Z" fill={drink.accent} />
      <ellipse cx="44" cy="51" rx="16" ry="4.2" fill={drink.foam} />
      <path
        d="M36 36c1-6 2-8 0-12"
        fill="none"
        stroke={drink.foam}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M48 34c1-7 3-9 1-14"
        fill="none"
        stroke={drink.accent}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.7"
      />
      {garnish === "cherry" ? (
        <>
          <path
            d="M40 30c4-8 12-8 14 0"
            fill="none"
            stroke="#6d2430"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="38" cy="32" r="6" fill={drink.accent} />
          <circle cx="50" cy="30" r="6.2" fill="#9a1d36" />
          <path d="M36 30c2 1 3 1 4-1" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
        </>
      ) : null}
      {garnish === "mulled" ? (
        <>
          <circle cx="46" cy="30" r="9" fill={drink.accent} />
          <circle cx="46" cy="30" r="6.5" fill="#fff3df" />
          <path d="M46 22v16M38 30h16M40.5 24.5l11 11M51.5 24.5l-11 11" stroke={drink.accent} strokeWidth="1.6" />
          <circle cx="46" cy="30" r="1.6" fill={drink.accent} />
        </>
      ) : null}
      {garnish === "apple" ? (
        <>
          <path d="M48 20c2 4 1 7-1 9" fill="none" stroke="#6a4a22" strokeWidth="2" strokeLinecap="round" />
          <path d="M48 24c6-2 10 2 8 6" fill="#7ea34a" />
          <circle cx="44" cy="32" r="9" fill={drink.accent} />
          <path d="M44 24c2 6 2 12 0 16" fill="none" stroke="#fff6d8" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}
