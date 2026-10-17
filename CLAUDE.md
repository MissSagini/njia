# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Njia is a mentoring platform plus a marketing website. It pairs Kenyan students with Kenyan mentors who studied at their dream UK or European university. The app is scaffolded with the design system, components and navigation; **every page is still a placeholder** and there is no back end yet. Design inputs:

- `product-spec/Njia Product Spec v2.md` is the **authoritative spec**. `product-spec/njia-product-spec.md` is the superseded v1, kept for history; don't build from it.
- `brand/brand-guide.md` holds the colour tokens, type scale, components, logo rules, voice and a pre-release checklist.
- `DESIGN.md` is the design system: tokens (front matter), component specs and states, layout, and do's and don'ts. Follow it for all UI work; it extends the brand guide.
- `tech-stack.md` is the chosen tool stack.
- `logos/` holds the SVGs: `njia-lockup.svg` (light), `njia-lockup-dark.svg` and `njia-app-icon.svg`. The brand guide also mentions `njia-wordmark.svg` / `njia-wordmark-dark.svg`, which are **not in the repo yet**.

- The visual source of truth is the Claude Design project "Njia" (claude.ai/design, project `bafb4c01-c3e2-4f42-b078-a0604a376ff8`): design-system tokens and React primitives under `_ds/njia-design-system-…/`, plus screen canvases and clickable prototypes (`Prototype *.dc.html`). Check a screen's canvas there before building it.

## Commands

- `npm run dev`: dev server at http://localhost:3000
- `npm run build`: production build; also runs the TypeScript check
- `npm run lint`: ESLint
- No test runner is set up yet.

This is **Next.js 16** with `cacheComponents` and `partialPrefetching` on (see `next.config.ts`). APIs differ from older Next.js: read the relevant guide in `node_modules/next/dist/docs/` before writing framework code. Under Cache Components, client hooks that read URL data (`useSearchParams`, `usePathname` on routes with unknown dynamic params) need a `Suspense` boundary or the build fails. `LayoutProps`/`PageProps` are generated global types, so run `npm run build` (or `next dev`) once if `tsc` can't find them.

## Code layout

- `src/app/globals.css` holds every design token in a Tailwind 4 `@theme`. Tailwind's default palette, radii, shadows and font sizes are **cleared**, so only brand tokens exist: colours like `bg-forest`, `text-ink-muted`, `border-line`, `bg-sunset-hover`; radii `rounded-sm|md|pill`; shadows `shadow-sm|md|lg|focus`; sizes `text-body`, `text-small`, `text-body-lg`; composite type styles `type-display`, `type-title`, `type-heading`, `type-label`; widths `max-w-site` (1200px) and `max-w-app` (1280px). Add new tokens there rather than using arbitrary values.
- Fonts load in `src/app/layout.tsx` via `next/font/google` and feed `--font-display|heading|body` (`font-display`, `font-heading`, `font-body`).
- `src/components/ui/` holds the design-system components ported from the Claude Design bundle: Button, Card, Badge, TextInput, Select, Checkbox, FormLayout/FormRow/FormGroup, ChoiceChip, Banner, EmptyState, Skeleton, Toast, Sheet, Avatar, Icon (bundled Lucide paths; add new icons to the map), Logo and PathMotif. Import from `@/components/ui`. Hover, focus and active states are CSS, not JS state.
- `src/components/navigation/`: `SiteHeader` and `SiteFooter` for the website; `AppShell` (`AppHeader` plus the mobile-only `AppTabBar`) for the platform. Desktop navigation starts at the `lg` breakpoint.
- `src/lib/navigation.ts` is the single list of nav links for the header, footer and tab bar.
- Routes use route groups: `(site)` (website: `/`, `/how-it-works`, `/mentors`, `/for-parents`, `/get-started`, `/log-in`), `(student)` (`/my-mentor`, `/sessions`, `/my-goals`) and `(mentor)` (`/students`). Each group's `layout.tsx` picks its shell. The student and mentor initials in those layouts are stand-ins until auth exists, and "Log out" just links home.
- `src/components/Placeholder.tsx` renders the temporary page bodies; delete each use as real screens are built.

## Stack

The full stack, with reasons and pre-build checks, is in `tech-stack.md`. In short:

- **Next.js (App Router) + TypeScript**, one codebase. The website pages (Home, How it works, Mentors, For parents) are static or ISR. The app screens (Goals and booking, Payment, Log in, My mentor, Sessions, My goals) sit behind auth.
- **Tailwind 4** with the brand tokens, and our own components in `src/components/ui` (ported from the Claude Design system, not shadcn/ui). Validate forms with **React Hook Form + Zod**.
- **Back end is Next.js server code** (server actions, API routes). The browser never writes to the database directly; every write goes through server code that checks permissions.
- **Supabase** (Postgres, Auth, Row Level Security) in an EU region on the Pro plan. Schema and migrations are defined in **Drizzle**. RLS is a second lock behind the server checks, so keep it on every table.
- **Inngest** runs event-driven workflows (next week's setup, pairing countdown, weekly report, future instalment reminders). Put automatic follow-on steps there, not in request handlers.
- Login is via Supabase Auth by **email link** (passwordless), with a 6-digit email code as fallback for school mail scanners. Mentors and admins must also use **2FA**. Send Supabase's emails through Resend SMTP.
- **Payments:** M-Pesa through **Safaricom Daraja STK Push, direct**. The prompt can go to the parent's phone, and the callback's receipt number fills `M-Pesa reference`. Cards (Visa/Mastercard) go through **Paystack**. Both write to the same `Payments` table via webhooks.
- **Booking is built in-app** on the `Mentor availability` table. Use a transaction plus a unique constraint so a slot can't be double-booked; this is the spec's "call time that was just booked" error state. **Google Calendar API** creates the event and its Meet link (stored on `Sessions`) and invites the parent to the free call.
- **Resend + React Email** for the weekly parent report and confirmations. **Vercel Cron** for the weekly report and a daily check for paid-but-unpaired students.
- Hosting on **Vercel**, with **Sentry** and **PostHog**.

## Domain rules that span the whole app

- **Roles:** Student and Mentor log in. Admin runs consultations, pairs students, approves mentors and sees payments. Parent has **no login** and only receives email (the weekly report, the free-call invite and the M-Pesa prompt). Access rules belong in RLS policies, not only in the UI.
- **Two start paths,** stored as `Students.start path`. On the free-call path the student books a free 30-minute call, then pays and is paired. On the apply-now path she pays immediately and is paired **within 2 days**. A student record exists before payment and before any login.
- **Payments are a ledger:** Enrolments (agreed price) → Charges (amount and due date) → Payments (real transactions). Today it's one KSh 250,000 charge for 12 weeks; deposits and instalments will be added later as more charges. Never hard-code the price, never store a paid flag or an editable balance (always compute charges minus successful payments), and store amounts as whole shillings.
- **Progress:** 12 programme weeks, each linked to a stage (course choice → personal statement → application → offers → visa → accommodation → arrival). Each event also goes into an append-only activity log; never update or delete log rows.
- **Data protection:** users are often minors. Every read or write of student data must check the caller's role. Record who viewed or changed student records. Keep personal data out of logs, Sentry and PostHog. Verify the signature or source of every Daraja and Paystack callback. Never store card details.
- **Mentor contact** uses `wa.me` and `mailto:` links. In-app chat, video, file uploads, parent logins, ratings, task deadlines/reminders and US universities are **out of scope**.
- **Times:** store them in UTC. Show them to students in East Africa Time and to mentors in their own local zone, since mentors are often in the UK or Europe.
- **Every app screen** needs loading, empty, error and success states. The spec gives example copy for each; reuse it.
- The Sessions screen is shared. Mentors add notes and tasks there and switch between their students. Students tick off tasks and book the next session from the mentor's free times.

## Brand constraints for any UI or copy

- Page background is Cream `#FBF6EE`, never white. Cards are White with a 1px Line `#E6DCCB` border and `radius-md` (12px). Forest `#1F4D3A` leads.
- **Sunset `#C8551B` appears once per screen**, usually as the single primary button. Its labels use DM Sans 700 at 19px or larger for contrast. Ochre is for decoration only, and never as text on light backgrounds. No gradients.
- Fonts: **Literata 600 for one hero headline per page**, Fraunces 600 for all other headings, DM Sans for everything else.
- The website header's call to action is Forest (secondary) so Sunset stays free for each page's hero button. Primary `Button` is always the large size.
- Sentence case everywhere; headlines end with a full stop.
- Use the logo SVGs exactly as supplied and never retype "Njia". Below 80px wide, use the app icon.
- Voice: a kind older sibling. "You" means the student and "we" means Njia. No emoji, and at most one exclamation mark per screen. Never use: *guaranteed, elite, easy, hack, agent*.
- Check work against the checklist in section 8 of the brand guide before calling UI done.
