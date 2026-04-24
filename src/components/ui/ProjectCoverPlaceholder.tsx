// Auto-generated cover art for projects without an uploaded photo.
//
// We don't want every project to look identical when the GC hasn't had time
// to grab a site photo yet — but we also can't render a generic "camera"
// icon on every card, because with 10+ projects the dashboard turns into
// a grid of grey boxes. This component hashes the project id to pick one
// of a dozen color gradients + overlay patterns, so each project gets a
// distinct-looking cover that stays stable across renders (same id →
// same art, always).
//
// Visual layers, back to front:
//   1. Brand-adjacent gradient (deterministic pick from a small palette).
//   2. Low-opacity SVG pattern (blueprint grid / dots / diagonal lines —
//      also deterministic per project).
//   3. Soft amber hi-vis stripe across the bottom — the signature motif
//      that ties the placeholder back to the rest of the design system.
//   4. Large project initials, centered.
//
// This is a *placeholder*, not a brand identity — the moment the GC
// uploads a real cover, ProjectCoverUpload swaps the <img> in its place.

interface ProjectCoverPlaceholderProps {
  /** Stable id — used to pick the gradient + pattern so renders are consistent. */
  projectId: string;
  /** Up to 2 letters drawn in the center. Falls back to "??" if empty. */
  projectName?: string;
  className?: string;
}

// Gradient palette. Intentionally skews blue/indigo/slate (matches the brand)
// with a couple warmer accents so every tenth project isn't jarring.
// `from` + `to` are tailwind-style hex values so we can render them inline
// as SVG linear-gradient stops without depending on the tailwind runtime.
const GRADIENTS: { from: string; to: string; accent: string }[] = [
  { from: '#1e3a8a', to: '#3b82f6', accent: '#60a5fa' }, // deep blue → sky
  { from: '#0f172a', to: '#334155', accent: '#94a3b8' }, // slate noir
  { from: '#1e40af', to: '#6366f1', accent: '#a5b4fc' }, // cobalt → indigo
  { from: '#0c4a6e', to: '#0891b2', accent: '#67e8f9' }, // deep cyan
  { from: '#064e3b', to: '#10b981', accent: '#6ee7b7' }, // forest → emerald
  { from: '#7c2d12', to: '#ea580c', accent: '#fdba74' }, // rust → orange
  { from: '#581c87', to: '#a855f7', accent: '#d8b4fe' }, // royal → violet
  { from: '#134e4a', to: '#14b8a6', accent: '#5eead4' }, // teal
  { from: '#312e81', to: '#4f46e5', accent: '#a5b4fc' }, // indigo night
  { from: '#1f2937', to: '#4b5563', accent: '#9ca3af' }, // steel grey
  { from: '#7f1d1d', to: '#dc2626', accent: '#fca5a5' }, // brick → red
  { from: '#365314', to: '#84cc16', accent: '#bef264' }, // olive → lime
];

type PatternKind = 'grid' | 'dots' | 'diagonals' | 'blueprint';
const PATTERNS: PatternKind[] = ['grid', 'dots', 'diagonals', 'blueprint'];

// djb2 hash — simple, fast, deterministic; we only need a number we can
// modulo against the palette size. Crypto-grade isn't needed.
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h = h | 0; // force 32-bit
  }
  return Math.abs(h);
}

function initials(name?: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Pattern({ kind, accent }: { kind: PatternKind; accent: string }) {
  switch (kind) {
    case 'grid':
      return (
        <>
          <defs>
            <pattern id={`p-grid-${accent.slice(1)}`} width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke={accent} strokeWidth="0.5" strokeOpacity="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#p-grid-${accent.slice(1)})`} />
        </>
      );
    case 'dots':
      return (
        <>
          <defs>
            <pattern id={`p-dots-${accent.slice(1)}`} width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill={accent} fillOpacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#p-dots-${accent.slice(1)})`} />
        </>
      );
    case 'diagonals':
      return (
        <>
          <defs>
            <pattern id={`p-diag-${accent.slice(1)}`} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="20" fill={accent} fillOpacity="0.18" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#p-diag-${accent.slice(1)})`} />
        </>
      );
    case 'blueprint':
      return (
        <>
          <defs>
            <pattern id={`p-bp-${accent.slice(1)}`} width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke={accent} strokeWidth="0.4" strokeOpacity="0.3" />
              <path d="M 8 0 L 8 32 M 16 0 L 16 32 M 24 0 L 24 32 M 0 8 L 32 8 M 0 16 L 32 16 M 0 24 L 32 24"
                    fill="none" stroke={accent} strokeWidth="0.25" strokeOpacity="0.18" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#p-bp-${accent.slice(1)})`} />
        </>
      );
  }
}

export function ProjectCoverPlaceholder({
  projectId,
  projectName,
  className = '',
}: ProjectCoverPlaceholderProps) {
  const h = hash(projectId || projectName || 'flowboss');
  const palette = GRADIENTS[h % GRADIENTS.length];
  const pattern = PATTERNS[(h >> 3) % PATTERNS.length];
  const gradId = `grad-${projectId.slice(-8) || 'x'}`;

  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={projectName ? `${projectName} cover` : 'Project cover'}
    >
      {/* Base gradient */}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.from} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#${gradId})`} />

      {/* Pattern overlay */}
      <Pattern kind={pattern} accent={palette.accent} />

      {/* Amber hi-vis signature band — anchors every placeholder back to the
          design system. Uses the same #f59e0b as SignatureStripe. */}
      <g>
        <rect x="0" y="168" width="400" height="8" fill="#f59e0b" fillOpacity="0.9" />
        <rect x="0" y="176" width="400" height="3" fill="#0f172a" fillOpacity="0.35" />
        {/* Short accent tick at left */}
        <rect x="24" y="162" width="48" height="4" rx="2" fill="#fef3c7" fillOpacity="0.9" />
      </g>

      {/* Project initials — centered, large, monospace-ish weight */}
      <text
        x="200"
        y="108"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif"
        fontSize="68"
        fontWeight="800"
        fill="#ffffff"
        fillOpacity="0.95"
        letterSpacing="2"
      >
        {initials(projectName)}
      </text>

      {/* Subtle shadow under initials for depth */}
      <text
        x="200"
        y="108"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif"
        fontSize="68"
        fontWeight="800"
        fill="#000000"
        fillOpacity="0.15"
        letterSpacing="2"
        transform="translate(2 2)"
        aria-hidden="true"
      >
        {initials(projectName)}
      </text>
    </svg>
  );
}
