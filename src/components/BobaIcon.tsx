import type { MenuProduct } from "@/lib/types";

export function BobaIcon({
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
      <ellipse cx="48" cy="86" rx="18" ry="4" fill="rgba(42,24,16,0.12)" />
      <path
        d="M30 28h36l-4 50c-.6 7-6 11-14 11s-13.4-4-14-11l-4-50Z"
        fill={drink.accent}
      />
      <path
        d="M33 32h30l-3.4 44c-.4 5-4.6 8-10.6 8s-10.2-3-10.6-8L33 32Z"
        fill="#fffaf4"
        opacity="0.22"
      />
      <path d="M28 26h40v8H28z" fill={drink.accent} />
      <rect x="32" y="22" width="32" height="6" rx="3" fill={drink.foam} />
      <path
        d="M52 14c1 10 1 22 0 48"
        fill="none"
        stroke="#6b3f2a"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="40" cy="68" r="3.4" fill={drink.foam} />
      <circle cx="48" cy="72" r="3.6" fill={drink.foam} />
      <circle cx="56" cy="68" r="3.3" fill={drink.foam} />
      <circle cx="44" cy="62" r="2.8" fill={drink.foam} />
      <circle cx="53" cy="62" r="2.7" fill={drink.foam} />
    </svg>
  );
}
