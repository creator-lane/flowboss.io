import { next } from '@vercel/edge';

const ALLOWED_COUNTRIES = new Set([
  // United States
  'US',
  // EU member states (27)
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // UK (included since commonly grouped with EU)
  'GB',
]);

export default function middleware(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') || '';

  // Allow requests with no country (local dev, bots, Vercel internal)
  if (!country) return next();

  // Allow whitelisted countries
  if (ALLOWED_COUNTRIES.has(country)) return next();

  // Block everything else
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowBoss - Not Available</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
    .card { text-align: center; max-width: 420px; padding: 3rem 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #6b7280; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>FlowBoss is not available in your region</h1>
    <p>FlowBoss is currently available in the United States and European Union. We're working on expanding to more regions.</p>
  </div>
</body>
</html>`,
    {
      status: 451,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

export const config = {
  matcher: ['/((?!api|_vercel|favicon.ico|robots.txt|sitemap.xml|screenshots).*)'],
};
