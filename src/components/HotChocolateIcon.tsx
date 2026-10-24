import type { MenuProduct } from "@/lib/types";

const MUG = "#4e2c1c";
const MUG_LIGHT = "#6b3e28";
const COCOA = "#3a2016";

export function HotChocolateIcon({
  drink,
  className = "",
}: {
  drink: MenuProduct;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="46" cy="84" rx="26" ry="5" fill="rgba(42,24,16,0.12)" />
      <path
        d="M66 48c13 1 17 8 15 15-2 8-10 12-18 10"
        fill="none"
        stroke={MUG}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M18 42h52c1 0 2 1.4 2 3.2V64c0 12-10.4 20-28 20S16 76 16 64V45.2c0-1.8 1-3.2 2-3.2Z"
        fill={MUG}
      />
      <path
        d="M24 48c1.2 12 .6 22-.4 28"
        fill="none"
        stroke="rgba(255,248,240,0.28)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <ellipse cx="44" cy="42" rx="26" ry="7.5" fill={MUG_LIGHT} />
      <ellipse cx="44" cy="42" rx="19" ry="4.6" fill={COCOA} />
      <path
        d="M26 42c1-7 8-12 15-8 3-8 13-10 17-2 7-1 13 5 10 11-8 3-18 5-26 4-6 1-12 0-16-5Z"
        fill={drink.foam}
      />
      <circle cx="34" cy="32" r="7.5" fill={drink.foam} />
      <circle cx="47" cy="27" r="8.5" fill={drink.foam} />
      <circle cx="58" cy="34" r="6.5" fill={drink.foam} />
      <path
        d="M36 33c4-4 9-1 11 3 2 3 7 3 9-1"
        fill="none"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M32 28c7 5 11-3 18 1 6 3 9 7 16 4"
        fill="none"
        stroke={drink.accent}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M50 34c1.2 7 2.4 10 1 16"
        fill="none"
        stroke={drink.accent}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="40" cy="30" r="2.1" fill={drink.accent} />
      <circle cx="56" cy="33" r="1.8" fill={drink.accent} />
    </svg>
  );
}
