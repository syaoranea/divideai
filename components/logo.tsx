interface LogoProps {
  size?: number;
  className?: string;
}

/** Casinha com um coração dentro — cores seguem o tema atual */
export function LogoIcon({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      className={className}
      aria-hidden="true"
    >
      <rect width="256" height="256" rx="56" className="fill-brand-600" />
      <path
        d="M128 52 L208 118 V200 a8 8 0 0 1 -8 8 H56 a8 8 0 0 1 -8 -8 V118 Z"
        className="fill-brand-50"
      />
      <path
        d="M128 186 C100 166 86 152 86 134 a20 20 0 0 1 42 -8 a20 20 0 0 1 42 8 C170 152 156 166 128 186 Z"
        className="fill-brand-500"
      />
    </svg>
  );
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={size} />
      <span className="text-xl font-extrabold tracking-tight text-brand-800">Casa Cheia</span>
    </span>
  );
}
