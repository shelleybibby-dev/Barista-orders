import type { MenuDrink } from "@/lib/types";

export function IcedCoffeeCup({ drink, className = "" }: { drink: MenuDrink; className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="48" cy="88" rx="18" ry="3.5" fill="rgba(42,24,16,0.12)" />
      <path d="M30 24h36l-5 56c-.6 5-6 8-13 8s-12.4-3-13-8L30 24Z" fill="#f7fcff" />
      <path d="M33 46h30l-3 32c-.4 3.4-4.4 5.4-12 5.4s-11.6-2-12-5.4L33 46Z" fill={drink.accent} />
      <path d="M34 34h28l-1.5 12H35.5L34 34Z" fill={drink.foam} opacity="0.95" />
      <path d="M34 28h6v40" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.55" />
      <rect x="38" y="38" width="10" height="10" rx="1.5" transform="rotate(16 43 43)" fill="#f4fbff" stroke="#b9d0dc" />
      <rect x="50" y="42" width="9" height="9" rx="1.5" transform="rotate(-12 54.5 46.5)" fill="#f4fbff" stroke="#b9d0dc" />
      <ellipse cx="48" cy="24" rx="18" ry="6" fill="#e7e2d8" />
      <ellipse cx="48" cy="22" rx="14" ry="3.4" fill="#f6f3ec" />
      <path d="M58 8c8 6 8 14 2 20" fill="none" stroke="#d7dee4" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}
