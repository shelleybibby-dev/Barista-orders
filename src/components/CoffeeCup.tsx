import type { MenuDrink } from "@/lib/types";

export function KidCup({ drink, className = "" }: { drink: MenuDrink; className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="46" cy="82" rx="20" ry="4.5" fill="rgba(42,24,16,0.12)" />
      <path
        d="M26 46h40c1 10 0 20-5 27-2.6 3.4-8 5.2-15 5.2s-12.4-1.8-15-5.2c-5-7-6-17-5-27Z"
        fill={drink.accent}
      />
      <path
        d="M30 49h32c.5 8-.2 15-4.2 20-2 2.6-6.4 4-11.8 4s-9.8-1.4-11.8-4c-4-5-4.7-12-4.2-20Z"
        fill={drink.foam}
      />
      <circle cx="40" cy="60" r="2.1" fill="#6a3a48" />
      <circle cx="54" cy="60" r="2.1" fill="#6a3a48" />
      <path
        d="M41 66c2.4 2.4 7 2.4 10 0"
        fill="none"
        stroke="#6a3a48"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M66 50c8 1 11 7 6 12-2.6 2.6-6.4 3.2-9.2 2.4"
        fill="none"
        stroke={drink.accent}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
