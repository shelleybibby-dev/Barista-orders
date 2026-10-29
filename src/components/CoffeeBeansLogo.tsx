export function CoffeeBeansLogo({
  className = "h-16 w-16",
  title = "Coffee Beans",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={title}
    >
      <circle cx="60" cy="60" r="58" fill="#6e1a27" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="#8b2a38" strokeWidth="2.5" />

      <g transform="translate(42 60) rotate(-32)">
        <ellipse rx="17" ry="30" fill="#24140e" />
        <path
          d="M0 -22 C -6 -8 6 8 0 22"
          fill="none"
          stroke="#d9c4b0"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(78 60) rotate(32)">
        <ellipse rx="17" ry="30" fill="#2c1810" />
        <path
          d="M0 -22 C -6 -8 6 8 0 22"
          fill="none"
          stroke="#c4a484"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      <path
        d="M16 58c2.4-4.2 8.4-4.2 10.8 0 2.2 3.8-2.2 8-5.4 10.4-3.2-2.4-7.6-6.6-5.4-10.4Z"
        fill="#f4eadc"
      />
      <path
        d="M104 58c-2.4-4.2-8.4-4.2-10.8 0-2.2 3.8 2.2 8 5.4 10.4 3.2-2.4 7.6-6.6 5.4-10.4Z"
        fill="#f4eadc"
      />
    </svg>
  );
}

export function BrandLockup({
  name,
  subtitle,
  variant = "light",
  size = "md",
  nameAs: NameTag = "p",
  subtitleAs: SubTag = "p",
}: {
  name: string;
  subtitle?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  nameAs?: "h1" | "p";
  subtitleAs?: "h1" | "p";
}) {
  const logoClass =
    size === "lg" ? "h-24 w-24 sm:h-28 sm:w-28" : size === "sm" ? "h-12 w-12" : "h-16 w-16";
  const titleClass =
    size === "lg"
      ? "font-display text-5xl font-semibold tracking-tight sm:text-6xl"
      : size === "sm"
        ? "font-display text-2xl font-semibold tracking-tight"
        : "font-display text-3xl font-semibold tracking-tight";
  const nameColor = variant === "dark" ? "text-foam" : "text-espresso";
  const subColor = variant === "dark" ? "text-foam/70" : "text-coffee";

  return (
    <div className={`flex items-center gap-4 ${size === "lg" ? "flex-col text-center sm:flex-row sm:text-left" : ""}`}>
      <CoffeeBeansLogo className={`shrink-0 ${logoClass}`} title={name} />
      <div>
        {size === "sm" ? (
          <NameTag className="text-sm font-semibold uppercase tracking-[0.3em] text-caramel">{name}</NameTag>
        ) : (
          <NameTag className={`${titleClass} ${nameColor}`}>{name}</NameTag>
        )}
        {subtitle ? <SubTag className={`text-base ${subColor} ${SubTag === "h1" ? "font-display text-3xl font-semibold text-foam" : ""}`}>{subtitle}</SubTag> : null}
      </div>
    </div>
  );
}
