// Rolled-up blueprint with a protruding ruler and an amber hi-vis tag.
// Shown in empty states where the user is being prompted to "start a project"
// (GC dashboard with zero projects, customer with zero jobs).
//
// Why a custom SVG over a lucide icon? Lucide icons are 24×24 line art
// tuned for UI chrome. An empty state needs something with weight and
// character — the contractor opens this page for the first time and the
// hero slot is prime real estate. A generic grey briefcase icon wastes it.

export function BlueprintIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background glow */}
      <defs>
        <radialGradient id="bp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bp-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="80" r="72" fill="url(#bp-glow)" />

      {/* Rolled blueprint body */}
      <g transform="translate(32 46)">
        {/* paper cylinder, shown end-on */}
        <rect x="0" y="0" width="96" height="68" rx="6" fill="url(#bp-paper)" stroke="#2563eb" strokeWidth="2" />
        {/* blueprint grid */}
        <g stroke="#2563eb" strokeWidth="0.8" opacity="0.35">
          <line x1="0" y1="12" x2="96" y2="12" />
          <line x1="0" y1="24" x2="96" y2="24" />
          <line x1="0" y1="36" x2="96" y2="36" />
          <line x1="0" y1="48" x2="96" y2="48" />
          <line x1="0" y1="60" x2="96" y2="60" />
          <line x1="16" y1="0" x2="16" y2="68" />
          <line x1="32" y1="0" x2="32" y2="68" />
          <line x1="48" y1="0" x2="48" y2="68" />
          <line x1="64" y1="0" x2="64" y2="68" />
          <line x1="80" y1="0" x2="80" y2="68" />
        </g>
        {/* floor plan strokes */}
        <path d="M 18 18 L 60 18 L 60 32 L 78 32 L 78 52 L 18 52 Z" fill="none" stroke="#1d4ed8" strokeWidth="2.2" strokeLinejoin="round" />
        <line x1="36" y1="18" x2="36" y2="32" stroke="#1d4ed8" strokeWidth="2.2" />
        <line x1="36" y1="32" x2="60" y2="32" stroke="#1d4ed8" strokeWidth="2.2" />
      </g>

      {/* Amber hi-vis tag — the signature element */}
      <g transform="translate(92 34) rotate(18)">
        <rect x="0" y="0" width="38" height="18" rx="3" fill="#f59e0b" />
        <rect x="3" y="3" width="32" height="12" rx="1.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.9" />
      </g>

      {/* Pencil */}
      <g transform="translate(96 112) rotate(-22)">
        <rect x="0" y="0" width="44" height="6" rx="1" fill="#fbbf24" />
        <polygon points="44,0 50,3 44,6" fill="#78350f" />
        <rect x="0" y="0" width="6" height="6" rx="1" fill="#ef4444" />
      </g>
    </svg>
  );
}
