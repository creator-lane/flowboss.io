# flowboss.io

Marketing and utility website for FlowBoss — field service management for contractors.

**Live:** https://flowboss.io
**Deployed via:** Vercel (auto-deploys on push to `master`)

## Tech Stack

- Vite 6 + React 18 + TypeScript
- React Router v6 (SPA)
- Tailwind CSS 3

## Routes

| Path | Page | Purpose |
|------|------|---------|
| `/` | HomePage | Marketing landing page |
| `/privacy` | PrivacyPolicy | Privacy policy |
| `/terms` | TermsOfService | Terms of service |
| `/eula` | EULA | End-user license agreement |
| `/support` | Support | Support contact info |
| `/delete-account` | DeleteAccount | Account deletion request |
| `/analytics` | AnalyticsTaxonomy | Analytics event taxonomy |
| `/stripe-connect` | StripeConnect | Stripe Connect onboarding redirect handler |

## Integrations

### AppsFlyer Smart Banner
Added in `index.html` `<head>`. Shows a mobile web-to-app install banner on all pages.
- **Web key:** `ac9f9168-bed4-4c10-bf79-60486930f9e6`
- Banner design and behavior configured in the [AppsFlyer dashboard](https://hq1.appsflyer.com/) under Smart Banners
- Purpose: attribute mobile web → app installs for paid UA campaigns targeting competitor search terms

### Stripe Connect Return
`/stripe-connect` is the `return_url` and `refresh_url` for Stripe Connect Express onboarding.
- `?success=true` → green confirmation screen, auto-redirects to `flowboss://stripe-return`
- `?refresh=true` → yellow "finish setup" screen
- Deep link `flowboss://stripe-return` is handled by the mobile app

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

## Deployment

Vercel auto-deploys on push to `master`.

**Vercel config** (`vercel.json`):
- Build: `npm run build`
- Output: `dist/`
- Framework: Vite
- SPA rewrite: all routes → `/index.html`

## Repo History

This repo was extracted from the FlowBoss monorepo (`apps/web`). The following dead code from the monorepo was intentionally excluded:
- `src/components/` — app UI components (customers, dashboard, invoices, jobs, schedule, settings) that were never routed
- `src/lib/api.ts` — app API client with dev auth bypass, not used by any website page
- `@flowboss/shared`, `@clerk/clerk-react`, `@tanstack/react-query` — monorepo dependencies not imported by any website page
- `dist/` — stale build artifacts
