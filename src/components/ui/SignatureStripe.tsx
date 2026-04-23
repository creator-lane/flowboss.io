// FlowBoss signature visual element. Diagonal amber hi-vis stripe — the
// same visual language as safety tape on a jobsite. Used sparingly:
//  - behind empty-state illustrations (adds warmth, signals "action here")
//  - on the homepage hero (brand signature moment)
//  - optional accent on active / in-progress cards via `<SignatureStripe inline />`
//
// Kept deliberately quiet (0.12 opacity by default) so it reads as texture,
// not decoration. Increase `intensity` to bring it forward on the marketing
// hero where it should be a real focal point.
//
// Why SVG instead of CSS? A real diagonal gradient pattern needs to tile
// cleanly at any size. SVG + `<pattern>` gives us pixel-crisp stripes at
// every zoom level without Tailwind class explosion.

interface SignatureStripeProps {
  /** 'low' = texture (0.08), 'medium' = visible (0.16), 'high' = hero accent (0.28). */
  intensity?: 'low' | 'medium' | 'high';
  /** Stripe angle in degrees. Default 45 (classic hi-vis). */
  angle?: number;
  className?: string;
}

const INTENSITY_OPACITY = {
  low: 0.08,
  medium: 0.16,
  high: 0.28,
};

export function SignatureStripe({
  intensity = 'low',
  angle = 45,
  className = '',
}: SignatureStripeProps) {
  const opacity = INTENSITY_OPACITY[intensity];
  const id = `sig-stripe-${angle}-${intensity}`;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={id}
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${angle})`}
          >
            {/* Each repeating unit: 8px amber band, 16px gap. */}
            <rect
              x="0"
              y="0"
              width="8"
              height="24"
              fill="#f59e0b"
              opacity={opacity}
            />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
