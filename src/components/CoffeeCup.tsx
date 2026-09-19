import type { MenuDrink } from "@/lib/types";

export function CoffeeCup({ drink, className = "" }: { drink: MenuDrink; className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="44" cy="78" rx="26" ry="6" fill="rgba(42,24,16,0.12)" />
      <path
        d="M18 30h52c1 18 0 34-8 46-3 5-10 8-18 8s-15-3-18-8c-8-12-9-28-8-46Z"
        fill={drink.accent}
      />
      <path
        d="M22 34h44c.6 14-.4 27-7 37-2.4 3.8-8 6-15 6s-12.6-2.2-15-6c-6.6-10-7.6-23-7-37Z"
        fill={drink.foam}
      />
      <path
        d="M28 40c6 2 10-2 16-1 7 1 12 5 20 3"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M70 38c12 2 16 14 8 22-4 4-10 5-14 4"
        fill="none"
        stroke={drink.accent}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M36 16c1 6-3 8-3 14"
        fill="none"
        stroke="rgba(42,24,16,0.35)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M46 14c2 7-2 10-1 16"
        fill="none"
        stroke="rgba(42,24,16,0.28)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
