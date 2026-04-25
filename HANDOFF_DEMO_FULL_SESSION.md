# Handoff — `/demo/full` sandbox work

Written: 2026-04-25
From: Claude session opened in **wrong** worktree (`paperclip/.claude/worktrees/wonderful-murdock-97fbce`).
For: continuation in **Web v2** session opened against `~/flowboss/web/` directly.

> **Why this file exists.** Two consecutive Claude sessions edited `~/flowboss/web/` while running in a `paperclip/` worktree. The edits are real and on disk in `~/flowboss/web/` (uncommitted, on branch `main`). They are **not** in any worktree branch. This doc captures everything done so the next session can resume cleanly.

---

## 1. What `/demo/full` is

Public-facing live demo at `/demo/full/:persona/dashboard` for two personas:

- **`gc`** — Marcos at Riverside Construction (general contractor)
- **`sub`** — Carlos at Carlos Electric (subcontractor)

It mounts the **real** dashboard with a runtime-monkey-patched `api`/`supabase`. Reads return seeded fixtures; writes mostly fake-succeed in memory; a narrow set of "real outbound" mutations fires a paywall modal that links to `/signup`.

Goal per `feedback_demo_full_functionality.md`: feel like the real product. Paywall **only** at the conversion moments — real customer email, real money, real outbound invites.

---

## 2. Files on disk (uncommitted in `~/flowboss/web/`, branch `main`)

```
 M src/App.tsx                               (+26 lines)   — add /demo/full routes
 M src/components/gc/ZoneClusterDiagram.tsx  (this session — icons + low-zone layout)
 M src/components/layout/DashboardLayout.tsx (+18 lines)   — minor demo-mode handling
 M src/lib/auth.tsx                          (+2 lines)
?? src/demo/                                 (new dir, all new files):
     DemoPaywallContext.tsx
     DemoPicker.tsx
     DemoSandbox.tsx
     apiOverride.ts
     data/personas.ts
     data/seedResolver.ts
```

Verify with:
```
cd ~/flowboss/web && git status --short
```

---

## 3. Architecture

### 3.1 Route entry (`src/App.tsx`)
Routes added: `/demo/full` (picker) and `/demo/full/:persona/dashboard/*` (sandbox). Inside the sandbox, the standard `DashboardLayout` is used — every page from the real product renders unmodified.

### 3.2 Sandbox shell (`src/demo/DemoSandbox.tsx`)
- Fresh `QueryClient` with `staleTime: Infinity`, no auto-refetch.
- `DemoPaywallProvider` (modal context).
- `DemoModeBoundary` — calls `installDemoMode({persona, onPaywall})` on mount, `uninstallDemoMode()` on unmount. Has a 90s `setTimeout` that fires `triggerRef.current('upgrade')` once per tab (sessionStorage key `demo:upgradeNudgeFired`).
- `DemoAuthBridge` — provides a fake `AuthContext` with a fake `User`/`Session` anchored to `DEMO_USER_ID[persona]`. `signOut()` navigates to `/demo/full`.
- `DemoBanner` — sticky top "Live demo · {persona view}" with a "Try free" CTA to `/signup`.

### 3.3 Runtime override (`src/demo/apiOverride.ts`)
On install:
- Snapshots every method on `api` (and `api.qbo` / `api.quickbooks` nested namespaces) and replaces them.
- Patches `supabase.from(...)` to return a chainable empty-result Proxy (catches the small set of components that bypass `api.ts`).
- Patches `supabase.auth.getUser` and `supabase.auth.getSession` to return the fake session (so `useSubscriptionTier` and `RequireSubscription` pass).
- Patches `window.history.pushState` / `replaceState` to keep navigation in the demo subtree:
  - `/dashboard/*` → rewrite into `/demo/full/{persona}/dashboard/*`
  - `/checkout`, `/pricing` → fire paywall, stay on demo home
  - `/onboarding`, `/login` → silently redirect to demo home
  - `/signup` left alone (intentional out-path)
  - `/demo/full/*` and absolute external URLs let through

For each method on `api`:
1. If `isReadMethod(name)` → call `resolveSeedRead(name, args, persona)` and return wrapped in `Promise.resolve`.
2. If `isPaywallMethod(name, args)` → call `onPaywall(paywallCopyKeyFor(name, args))` and return `new Promise(() => {})` (never-resolving — consumers' `try/catch` never fires; the modal is the sole signal; navigating away unmounts the page).
3. Otherwise → `resolveSeedWrite(name, args, persona)` (in-memory mutation against the seed).

Nested namespaces (`api.qbo.*`, `api.quickbooks.*`) follow the same logic; if both bare name and dotted name match `isPaywallMethod`, the bare name is preferred so paywall copy keys off it.

### 3.4 Seed + write resolver (`src/demo/data/seedResolver.ts`)
- `resolveSeedRead(method, args, persona)` — switch over read methods, returns `{ data: ... }` envelope. Default: empty array.
- `resolveSeedWrite(method, args, persona)` — switch over mutations, in-memory mutates the seed (e.g., `seed.jobs.unshift(record)`), returns `{ data: record }`. Default: returns `{ data: { id: nextId(), ...args[0] } }`.
- `READ_METHOD_PATTERNS` = `[/^get/, /^list/, /^check/, /^fetch/, /^search/]`.
- **`PAYWALL_METHODS`** (current set):
  ```ts
  'sendInvoiceEmail', 'sendInviteEmail',
  'inviteTeamMember', 'inviteSubToTrade',
  'sendInvoiceViaQB', 'qbo.sendInvoiceViaQB', 'quickbooks.sendInvoiceViaQB',
  'createPaymentLink', 'processPayment', 'chargeCard',
  ```
- **`isPaywallMethod(name, args?)`** — checks `PAYWALL_METHODS` first, then a **content-based** rule: if `name === 'updateGCTrade'` and `args[1].notes` starts with `Placeholder:` or `Invited:`, it paywalls. (See §5 below.)
- **`paywallCopyKeyFor(name, args?)`** — returns the copy key for the paywall modal. For the `updateGCTrade` placeholder/invited path, returns `'inviteSubToTrade'` so the right copy shows.

### 3.5 Paywall modal (`src/demo/DemoPaywallContext.tsx`)
React context exposing `trigger(method)`, `close()`, and rendering the modal when `state.open`. `PAYWALL_COPY` map keyed by method name with `{ title, body }`. Default copy if not catalogued. Modal CTA `<Link to="/signup">`.

Current copy entries:
`createJob`, `updateJob`, `createInvoice`, `sendInvoiceEmail`, `createPaymentLink`, `createCustomer`, `createGCProject`, `addGCTrade`, `sendInviteEmail`, `createContractor`, `createExpense`, `createPricebookItem`, `updateSettings`, `inviteTeamMember`, `inviteSubToTrade`, `sendInvoiceViaQB`, `upgrade`.

### 3.6 Persona data (`src/demo/data/personas.ts`)
Two personas: `gc` and `sub`. Each persona has:
- `profile`, `organization`
- `jobs[]`, `customers[]`, `invoices[]`, `expenses[]`, `pricebook[]`, `contractors[]`
- `gcProjects[]` (with `zones[]` + flat `trades[]`, each trade having `zoneId`, `tasks[]`, materials, labor)
- `gcSubDirectory[]`, `gcProjectMessages` map
- `invitedProjects[]`

`customer()` helper emits both legacy and current-shape fields (`firstName`/`first_name`, etc.) and a `property: { address, city, state, zip }` object so jobs can populate Service Area Analysis (which keys off zip).

`job()` helper auto-emits `property` from the customer, and sets `contractor_id: null`.

Date scheme: dates are stored as ISO strings keyed off **today** via `daysFromNow()` / `daysAgo()` helpers, so the demo is always "live" relative to current date.

### 3.7 Demo picker (`src/demo/DemoPicker.tsx`)
Landing page at `/demo/full` that lets visitors choose `gc` or `sub`. Persona switcher button in the banner navigates back here.

---

## 4. Work completed in the prior session (per the summary at the top of this chat)

### 4.1 Paywall scope expansion
Added to `PAYWALL_METHODS`:
- `inviteTeamMember`, `inviteSubToTrade`
- `sendInvoiceViaQB`, `qbo.sendInvoiceViaQB`, `quickbooks.sendInvoiceViaQB`
- `createPaymentLink`, `processPayment`, `chargeCard`

Added matching `PAYWALL_COPY` entries: `inviteTeamMember`, `inviteSubToTrade`, `sendInvoiceViaQB`.

Fixed `apiOverride.ts` nested-namespace dispatch to prefer the bare sub-method name (so `api.quickbooks.sendInvoiceViaQB` triggers the `sendInvoiceViaQB` copy, not the generic default).

PDF/Share-link paywalls were planned but **dropped** — those api methods don't actually exist in `lib/api.ts`. Pivoted to real outbound methods.

### 4.2 Project depth + cover imagery
GC's 5 projects rewritten with:
- Real Unsplash cover URLs (verified 200): `photo-1556909114-f6e7ad7d3136` (kitchen), `photo-1568605114967-8130f3a36994` (modern home), `photo-1552321554-5fefe8c9ef14` (bathroom), `photo-1564013799919-ab600027ffc6` (estate), `photo-1518780664697-55e3ad937233` (ADU).
- Bumped budgets: `$128.5k / $95k / $48.5k / $185k / $310k` (total **$767k**).
- Trade counts: `10 / 8 / 8 / 10 / 13` = **49 trades** total. Each with realistic task lists, sub assignments, materials budgets, and `startDaysFromNow`/`endDaysFromNow`.

### 4.3 Customer addresses (zip codes)
All 14 GC customers and all 10 Sub customers got proper zip codes (`94110`, `94114`, `94612`, `78746`, etc.) so Service Area Analysis renders.

### 4.4 Historical jobs / invoices for the 12-month chart
Added 12 historical jobs (`h21`–`h32`) for 200–360 days ago, plus 12 matching paid invoices (`INV-0974` through `INV-1010` range). This populates the Financials 12-month revenue chart and the trailing data on Insights.

### 4.5 Misc bug fixes during prior session
- Edit string-not-found on proj-1 trades: fixed by re-reading and editing project-by-project.
- Syntax error `invoke_inv_25,` typo when adding INV-1005: fixed.
- Generic copy on QB nested call: fixed via the bare-name preference in apiOverride.

---

## 5. Work completed **this** session

### 5.1 ZoneClusterDiagram production fix (`src/components/gc/ZoneClusterDiagram.tsx`)
**User request**: "when you have a hub with only two things (or an odd number), you need to space them out evenly, it looks odd stacked to the left. Also you have no icons for these project types ... make note of this for main production as well."

Changes:
- Added explicit `ZONE_EMOJI` / `ZONE_COLORS` entries: `Living Area`, `Site / Exterior`, `Yard`, `Landscaping`, `Dining`, `ADU`, `ADU Shell`, `Roof`, `Roofing`.
- Added **regex pattern fallback** so combo zone names like "Kitchenette + Bath", "Primary Suite", "Kitchen + Bath" resolve to a sensible icon/color instead of the default pushpin/slate. New helpers: `resolveZoneIcon(name)`, `resolveZoneColor(name)` — call sites updated.
- **Layout fix** for low zone counts: when `zoneCount === 1`, wrap in `mt-6 mx-auto max-w-md`. When `zoneCount === 2`, wrap in `mt-6 mx-auto max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4`. 3+ zones use the original `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4`.

Verified live in preview on 4 projects:
- proj-1 Mitchell (Kitchen 🍳 + Dining 🍽️) — 2 zones, centered, 2-col grid
- proj-2 Rodriguez (Living Area 🛋️ + Kitchenette + Bath 🍳) — 2 zones, centered, 2-col grid
- proj-3 Chen (Master Bath 🚿) — 1 zone, max-w-md centered
- proj-5 Foster (ADU Shell 🏡 + Kitchen + Bath 🍳) — 2 zones, centered, 2-col grid

This is a **production-touching change** — it benefits both the demo and the real product.

### 5.2 Invite-Sub paywall completeness
**User request**: "you dont have 'invite sub' on there ... or invite plumber, etc ... in the right hand tab"

Context: `InviteSubModal` (the right-side panel "Invite Sub" / "Invite [trade]" button opens it) has three actions:
- **Send Email** → `api.sendInviteEmail` (was already paywalled).
- **Add Placeholder** → `api.updateGCTrade(tradeId, { notes: "Placeholder: Acme Plumbing" })` — was silently fake-succeeding.
- **Copy Link** → `navigator.clipboard.writeText(...)` only, no api call.

Solution: extended `isPaywallMethod` to accept `args` and detect `updateGCTrade` calls where `args[1].notes` starts with `Placeholder:` or `Invited:`. Added `paywallCopyKeyFor(name, args?)` so those calls route to the `inviteSubToTrade` copy entry.

Updated `apiOverride.ts` to pass `args` through to `isPaywallMethod` and use `paywallCopyKeyFor` for the modal trigger.

Verified live: `api.updateGCTrade('any-id', { notes: 'Placeholder: Acme Plumbing' })` → modal shows "Invite your subs" / "Sign up to send sub invites — they get a free dashboard, you stay in control." Plain edits (`{ notes: 'Just regular notes' }`) still fake-succeed cleanly.

Copy Link is intentionally not paywalled (low conversion intent — user is just exploring).

---

## 6. Open / unresolved at the time this chat was abandoned

### 6.1 "still nothing in revenue vs expenses in the financial"
User reported this and we started debugging just before realizing the wrong-chat issue. Findings so far:

- `getInsightsData` returns 30 paid invoices and 44 expenses for the GC persona.
- 4 paid invoices and 9 expenses fall into the current month (April 2026, the default `period: 'month'`).
- The bar chart **does** render with non-zero data (verified): `Wk 1 $0/$215`, `Wk 2 $2,740/$243`, `Wk 3 $22,450/$4,298`, `Wk 4 $8,920/$560`, `Wk 5 $0/$0`.
- Screenshot showed bars rendering as small visible pixels at the bottom of the card. They are present but visually faint because Wk 3's `$22,450` revenue dwarfs the others, and the per-bar minimum is only `2%` of max.

Likely root cause: the chart **is** drawing, but the visual treatment makes weeks 1, 2, 4 look empty against Wk 3. Possible fixes (your call):
- Boost the min-bar height when value > 0 from `2%` → `~6%`.
- Switch the period default to `year` for the demo (more bars filled because the seed has 12 months of history).
- Add a subtle baseline grid line so empty/near-empty bars look intentional.

This is a **UI-treatment** issue in `src/pages/dashboard/FinancialsPage.tsx` — the data pipeline is fine.

### 6.2 Other "complete sections of finance and insights with no data" (older user feedback)
Was being investigated at the previous context cutoff. Verify these specific surfaces in the next session:
- Insights page: top-of-funnel charts, customer acquisition, recurring vs new
- Financials: outstanding aging, expense category breakdown, cash flow

Most of these key off `insights.invoices` / `insights.expenses` / `insights.jobs` which **are** populated. If still empty, likely missing fields (e.g., `category` on expenses, `paid_at` vs `created_at` mismatch).

### 6.3 Production ZoneClusterDiagram fix is now in `~/flowboss/web/` uncommitted on `main`
The user explicitly asked this fix to land in main production. Currently sitting alongside the demo work in the same uncommitted dirty tree. Should probably split into its own commit when committing.

---

## 7. How to verify in browser

Vite dev server: `cd ~/flowboss/web && pnpm dev` (or whatever script).

URLs:
- `http://localhost:5173/demo/full` — picker
- `http://localhost:5173/demo/full/gc/dashboard/home` — GC home
- `http://localhost:5173/demo/full/gc/dashboard/projects/demo-proj-2` — Rodriguez (2 zones, validates icon + layout fix)
- `http://localhost:5173/demo/full/gc/dashboard/financials` — the chart in question
- `http://localhost:5173/demo/full/sub/dashboard/home` — Sub home

Direct paywall test from devtools console:
```js
const m = await import('/src/lib/api.ts');
m.api.updateGCTrade('any', { notes: 'Placeholder: Test' }); // should fire modal
m.api.updateGCTrade('any', { notes: 'something else' });    // should NOT fire
```

---

## 8. Why this got mis-routed

The Claude session was opened with cwd = a paperclip worktree (`paperclip/.claude/worktrees/wonderful-murdock-97fbce`). The previous session resumed from that same cwd. But all the actual work targeted `~/flowboss/web/` directly via absolute paths.

Result:
- The branch `claude/wonderful-murdock-97fbce` in **paperclip** has no FlowBoss changes.
- All changes are uncommitted in `~/flowboss/web/` on branch `main`.
- The Vite dev server hot-reloads them anyway (it serves from `~/flowboss/web/` regardless of where Claude was invoked).

**For the Web v2 session**: open Claude in `~/flowboss/web/` directly. The changes will be visible immediately as `git status` dirty files. Pick up from §6.

---

## 9. Memory entries already updated (auto-memory)

These persist across sessions and are **already** loaded:
- `feedback_demo_full_functionality.md` — `/demo/full` must feel like real product; mutations fake-succeed; paywall only at conversion moments.
- `handoff_web_mobile_parity.md` — web vs mobile parity plan.
- `project_flowboss.md` — top-level project memory.
- `project_flowboss_open_tasks.md` — Geoff's personal todo list.

The Web v2 session will see all of these.
