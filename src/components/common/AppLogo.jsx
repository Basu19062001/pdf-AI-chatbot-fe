export function AppLogo({ className = '', label = 'PDF Atlas' }) {
  const classes = ['app-logo', className].filter(Boolean).join(' ');

  return (
    <span className={classes} aria-label={label} role="img">
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="atlasLogoFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0b15d" />
            <stop offset="100%" stopColor="#1e6673" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="14" fill="url(#atlasLogoFill)" />
        <path
          d="M15 14.5h12.2a5.8 5.8 0 0 1 5.8 5.8v13.2H20.8A5.8 5.8 0 0 0 15 39.3V14.5Z"
          fill="rgba(255,255,255,0.96)"
        />
        <path
          d="M19.8 18.2h8.8M19.8 22.8h8.8M19.8 27.4h6.4"
          stroke="#1e6673"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.78"
        />
        <path
          d="M33 33.5H20.8A5.8 5.8 0 0 0 15 39.3h12.2a5.8 5.8 0 0 1 5.8-5.8Z"
          fill="rgba(255,255,255,0.82)"
        />
      </svg>
    </span>
  );
}
