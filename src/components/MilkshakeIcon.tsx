import type { MenuProduct } from "@/lib/types";

export function MilkshakeIcon({
  shake,
  className = "",
}: {
  shake: MenuProduct;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="46" cy="82" rx="22" ry="5" fill="rgba(42,24,16,0.12)" />
      <path
        d="M28 38h36l-5 38c-1 8-8 12-13 12s-12-4-13-12l-5-38Z"
        fill={shake.accent}
      />
      <path
        d="M32 40h28l-4 34c-.7 6-6 9-10 9s-9.3-3-10-9l-4-34Z"
        fill={shake.foam}
        opacity="0.35"
      />
      <path
        d="M30 36c4-10 12-14 16-8 3 5 8 1 12-3 3 8 1 14-4 16-5 2-10-1-14 2-3 2-8 1-10-7Z"
        fill={shake.foam}
      />
      <path
        d="M58 18c1 16 0 28-2 40"
        fill="none"
        stroke="#7a4630"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M56 16c6 1 8 5 6 9"
        fill="none"
        stroke="#7a4630"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
