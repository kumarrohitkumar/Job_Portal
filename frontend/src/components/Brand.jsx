import { Link } from 'react-router-dom';

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md font-display text-xl font-extrabold tracking-tight" aria-label="JobConnect home">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path d="M10 9h12v3h-4.5v8.5a5 5 0 0 1-10 0V19h3v1.5a2 2 0 0 0 4 0V12H10z" className="fill-primary-foreground" />
        <circle cx="23" cy="22" r="3" className="fill-marigold" />
      </svg>
      <span>
        Job<span className="text-primary">Connect</span>
      </span>
    </Link>
  );
}
