import type { MenuProduct } from "@/lib/types";

export function DonutIcon({ donut, className = "" }: { donut: MenuProduct; className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="48" cy="80" rx="28" ry="6" fill="rgba(42,24,16,0.12)" />
      <circle cx="48" cy="46" r="30" fill={donut.accent} />
      <circle cx="48" cy="46" r="24" fill={donut.foam} />
      <circle cx="48" cy="46" r="10" fill="#f4eadc" />
      <path
        d="M24 40c8 6 14-2 22 1 8 3 12 8 22 4 6-2 10-1 14 3"
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="38" cy="34" r="3" fill={donut.accent} opacity="0.85" />
      <circle cx="58" cy="38" r="2.5" fill={donut.accent} opacity="0.7" />
      <circle cx="52" cy="58" r="2.2" fill={donut.accent} opacity="0.75" />
    </svg>
  );
}
