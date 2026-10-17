import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type Tone = 'dark' | 'light' | 'ghost';

const TONE: Record<Tone, string> = {
  dark: 'pill pill-dark',
  light: 'pill pill-light',
  ghost: 'pill pill-ghost',
};

interface BaseProps {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

function Inner({ children, dot }: { children: ReactNode; dot?: boolean }) {
  return (
    <>
      <span>{children}</span>
      {dot ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" /> : null}
    </>
  );
}

export function PillLink({
  to,
  href,
  tone = 'light',
  dot,
  className = '',
  children,
}: BaseProps & { to?: string; href?: string }) {
  const cls = `${TONE[tone]} ${className}`;

  if (href) {
    return (
      <a className={cls} href={href}>
        <Inner dot={dot}>{children}</Inner>
      </a>
    );
  }

  return (
    <Link className={cls} to={to ?? '/'}>
      <Inner dot={dot}>{children}</Inner>
    </Link>
  );
}

export function PillButton({
  onClick,
  tone = 'light',
  dot,
  className = '',
  children,
  ariaLabel,
  ariaExpanded,
}: BaseProps & {
  onClick: () => void;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${TONE[tone]} ${className}`}
    >
      <Inner dot={dot}>{children}</Inner>
    </button>
  );
}
