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
      <ellipse cx="44" cy="84" rx="20" ry="4.5" fill="rgba(42,24,16,0.12)" />
      <path
        d="M26 40h36c1 4 2 10 1 22-.8 10-3 16-7 18-3 1.6-8 2.4-12 2.4s-9-.8-12-2.4c-4-2-6.2-8-7-18-1-12 0-18 1-22Z"
        fill={shake.accent}
      />
      <path
        d="M29 42h30c.8 4 1.4 9 .6 20-.6 8-2.4 13-5.6 14.6-2.4 1.2-6.4 1.8-9.8 1.8s-7.4-.6-9.8-1.8c-3.2-1.6-5-6.6-5.6-14.6-.8-11-.2-16 .6-20Z"
        fill="#fffaf4"
        opacity="0.22"
      />
      <path
        d="M24 38h40v6H24z"
        fill={shake.accent}
      />
      <path
        d="M28 24c6-10 16-10 16-2 0 5 8 4 12-2 4 10 1 16-6 18-6 2-10-1-14 2-4 3-10 0-8-16Z"
        fill={shake.foam}
      />
      <circle cx="36" cy="22" r="5" fill={shake.foam} />
      <circle cx="48" cy="18" r="6" fill={shake.foam} />
      <circle cx="58" cy="24" r="4.5" fill={shake.foam} />
      <path
        d="M56 14c2 18 1 32-1 48"
        fill="none"
        stroke="#6b3f2a"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
