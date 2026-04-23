// Hard hat with an amber brim stripe — the cleanest signifier of "on the
// job site." Shown for GC/project-side empty states (GC dashboard no
// projects, project detail no trades). The brim is where the amber signature
// lives, so it reads as FlowBoss-branded even at thumbnail size.

export function HardhatIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hh-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hh-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="90" r="70" fill="url(#hh-glow)" />

      {/* Hard hat — classic silhouette, amber shell */}
      <g transform="translate(22 44)">
        {/* dome */}
        <path
          d="M 20 52 Q 20 10 58 10 Q 96 10 96 52 Z"
          fill="url(#hh-shell)"
          stroke="#92400e"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* center ridge */}
        <path
          d="M 58 12 L 58 52"
          stroke="#92400e"
          strokeWidth="2"
          opacity="0.6"
        />
        {/* side vents */}
        <ellipse cx="34" cy="36" rx="2.5" ry="5" fill="#78350f" opacity="0.4" />
        <ellipse cx="82" cy="36" rx="2.5" ry="5" fill="#78350f" opacity="0.4" />
        {/* brim */}
        <path
          d="M 4 52 Q 58 62 112 52 L 112 58 Q 58 70 4 58 Z"
          fill="#b45309"
          stroke="#78350f"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Amber hi-vis stripe on brim — signature */}
        <rect x="36" y="54" width="44" height="3" fill="#fef3c7" />
        {/* small FB-style badge on dome */}
        <rect x="48" y="24" width="20" height="10" rx="2" fill="#ffffff" opacity="0.92" />
        <text
          x="58"
          y="32"
          textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="7"
          fontWeight="800"
          fill="#b45309"
        >
          FB
        </text>
      </g>
    </svg>
  );
}
