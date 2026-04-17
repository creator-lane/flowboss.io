/**
 * Route helpers — given a list of jobs with property addresses, build a
 * Google Maps multi-stop URL so the user gets Google's real routing +
 * ETAs for free.
 *
 * Why not build our own TSP solver?
 * - Google Maps already does it better than we can
 * - Free, no API key, no rate limits
 * - Users already trust Google's routing / know the UI
 * - Our job is to make the "click one button → driving directions" flow
 *   exist. Google is the routing engine.
 *
 * The generated URL opens a Google Maps trip with all stops; the user
 * can toggle "Optimize waypoints" inside Maps to re-order them for the
 * shortest drive.
 */

type JobLike = {
  property?: {
    street?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    postal_code?: string | null;
    postalCode?: string | null;
  } | null;
};

/**
 * Turn a job's property object into a single address string Google Maps
 * can geocode. Returns null if there's not enough info to route.
 */
export function formatFullAddress(job: JobLike): string | null {
  const p = job.property;
  if (!p) return null;
  const street = (p.street || p.address || '').trim();
  const city = (p.city || '').trim();
  const state = (p.state || '').trim();
  const zip = (p.zip || p.postal_code || p.postalCode || '').toString().trim();
  // Require at least street OR (city + state) to route meaningfully.
  if (!street && !(city && state)) return null;
  return [street, city, state, zip].filter(Boolean).join(', ');
}

/**
 * Google Maps caps multi-stop trips at 10 total stops (9 waypoints + 1
 * destination). Beyond this, Maps silently truncates or errors.
 */
export const MAX_ROUTE_STOPS = 10;

/**
 * Build a Google Maps URL that opens a multi-stop trip starting from the
 * user's current location, with every job in the given list as a waypoint.
 *
 * Returns `{ url, includedCount, truncatedCount }` — the URL plus how many
 * stops actually made it in vs. were dropped for exceeding Maps' cap, so
 * callers can show a "+N more (Maps limit)" hint. Returns null if fewer
 * than one job has a usable address.
 *
 * Uses Google's public maps.google.com/maps/dir/ path format, which doesn't
 * require an API key and lets Maps auto-geocode the string addresses.
 */
export function buildGoogleMapsRouteUrl(jobs: JobLike[]): {
  url: string;
  includedCount: number;
  truncatedCount: number;
} | null {
  const allStops = jobs
    .map((j) => formatFullAddress(j))
    .filter((a): a is string => Boolean(a));

  if (allStops.length === 0) return null;

  // Truncate to Maps' cap. Keep the first N in order — since the caller sorts
  // by scheduledStart, that means we prioritize the earlier stops.
  const stops = allStops.slice(0, MAX_ROUTE_STOPS);
  const truncatedCount = allStops.length - stops.length;

  // Origin = My Location (Google Maps picks up the browser's geolocation).
  // Destination = last stop. Waypoints = everything in between.
  const origin = 'My+Location';
  const destination = encodeURIComponent(stops[stops.length - 1]);
  const waypoints = stops
    .slice(0, -1)
    .map((s) => encodeURIComponent(s))
    .join('|');

  const params = new URLSearchParams({ api: '1', origin, destination });
  if (waypoints) params.set('waypoints', waypoints);
  params.set('travelmode', 'driving');

  return {
    url: `https://www.google.com/maps/dir/?${params.toString()}`,
    includedCount: stops.length,
    truncatedCount,
  };
}
