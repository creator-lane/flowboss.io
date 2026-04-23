// Clipboard with a half-filled customer list and an amber hi-vis clip. Used
// for empty states on people-oriented pages (Customers, Contractors, Team).
// The half-filled look implies "you're one entry away from the list starting
// to work for you" — more inviting than a fully-blank clipboard.

export function ClipboardIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="cb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="72" fill="url(#cb-glow)" />

      {/* Clipboard body */}
      <g transform="translate(38 30)">
        <rect x="0" y="8" width="84" height="108" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
        {/* Amber clip — signature */}
        <rect x="24" y="0" width="36" height="18" rx="3" fill="#f59e0b" />
        <rect x="30" y="6" width="24" height="8" rx="1.5" fill="#b45309" />

        {/* List rows */}
        <g transform="translate(10 30)">
          {/* Row 1 — filled */}
          <circle cx="6" cy="6" r="4" fill="#16a34a" />
          <rect x="16" y="3" width="48" height="3" rx="1.5" fill="#0f172a" opacity="0.8" />
          <rect x="16" y="9" width="32" height="2" rx="1" fill="#94a3b8" />

          {/* Row 2 — filled */}
          <circle cx="6" cy="24" r="4" fill="#16a34a" />
          <rect x="16" y="21" width="44" height="3" rx="1.5" fill="#0f172a" opacity="0.8" />
          <rect x="16" y="27" width="28" height="2" rx="1" fill="#94a3b8" />

          {/* Row 3 — empty, ready for next */}
          <circle cx="6" cy="42" r="4" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2 2" />
          <rect x="16" y="39" width="40" height="3" rx="1.5" fill="#e2e8f0" />
          <rect x="16" y="45" width="24" height="2" rx="1" fill="#e2e8f0" />

          {/* Row 4 — empty */}
          <circle cx="6" cy="60" r="4" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2 2" />
          <rect x="16" y="57" width="36" height="3" rx="1.5" fill="#e2e8f0" />
        </g>
      </g>
    </svg>
  );
}
