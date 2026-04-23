// Invoice with a dollar stamp and an amber "PAID" tear-off tag. Shown on
// empty invoice/financial lists. The tear-off tag is the amber signature
// and doubles as a visual metaphor for "get paid" — the entire reason
// contractors sent the invoice in the first place.

export function InvoiceIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="inv-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#16a34a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="72" fill="url(#inv-glow)" />

      {/* Paper */}
      <g transform="translate(34 26)">
        <rect x="0" y="0" width="76" height="108" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
        {/* Header band */}
        <rect x="0" y="0" width="76" height="14" rx="4" fill="#0f172a" />
        <rect x="0" y="10" width="76" height="4" fill="#0f172a" />
        <text
          x="8"
          y="10"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="7"
          fontWeight="800"
          fill="#ffffff"
          letterSpacing="0.5"
        >
          INVOICE
        </text>

        {/* Line items */}
        <g transform="translate(8 24)">
          <rect x="0" y="0" width="44" height="3" rx="1.5" fill="#0f172a" opacity="0.7" />
          <rect x="48" y="0" width="12" height="3" rx="1.5" fill="#0f172a" opacity="0.5" />

          <rect x="0" y="10" width="36" height="3" rx="1.5" fill="#0f172a" opacity="0.7" />
          <rect x="48" y="10" width="12" height="3" rx="1.5" fill="#0f172a" opacity="0.5" />

          <rect x="0" y="20" width="48" height="3" rx="1.5" fill="#0f172a" opacity="0.7" />
          <rect x="48" y="20" width="12" height="3" rx="1.5" fill="#0f172a" opacity="0.5" />

          {/* Divider */}
          <line x1="0" y1="32" x2="60" y2="32" stroke="#cbd5e1" strokeWidth="1" />

          {/* Total */}
          <rect x="0" y="38" width="20" height="4" rx="1.5" fill="#0f172a" />
          <rect x="40" y="37" width="20" height="6" rx="1.5" fill="#16a34a" />
        </g>
      </g>

      {/* Amber "PAID" tear-off tag — signature */}
      <g transform="translate(92 88) rotate(-14)">
        <path d="M 0 0 L 42 0 L 50 10 L 42 20 L 0 20 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="42" cy="10" r="2" fill="#ffffff" />
        <text
          x="20"
          y="14"
          textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="9"
          fontWeight="900"
          fill="#ffffff"
          letterSpacing="1"
        >
          PAID
        </text>
      </g>
    </svg>
  );
}
