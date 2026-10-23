# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Njia is a mentoring platform plus a marketing website. It pairs Kenyan students with Kenyan mentors who studied at their dream UK or European university. The app has the design system, the four website pages, the database schema, login (email and password), Get started (goals form plus free call booking), Sessions with booking (students book from mentors' free times; mentors add notes, call links and tasks, and manage free times), My mentor (profile, WhatsApp/email, next session, balance) and My goals (edit course, exams, universities, parent; mentors see goals on the student's page). Admin is built: overview, students (with pairing and call notes), free call times, mentors (add, approve) and a read-only payments ledger. **Payments are the last thing to build**; until then payment cards say "We'll email you how to pay". Design inputs:

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
- `npm run db:generate`: create a migration in `drizzle/` from `src/db/schema.ts` (`-- --custom --name x` for hand-written SQL)
- `npm run db:migrate`: apply migrations to the Supabase database in `DATABASE_URL`
- `npm run user:create -- --email a@b.com --name "Name" --role admin|mentor|student`: create a login and email a link to choose a password (use for the first admin)
- `npm run google:connect`: sign in to Google once and save the Calendar refresh token to `.env.local` (needs `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` first)
- `npm run demo:seed` creates a demo admin, mentor and paired student (example.com emails, password `DEMO_PASSWORD` in `.env.local`) with a past session and free times; `-- --remove` deletes them
- No test runner is set up yet.

Settings live in `.env.local` (copy `.env.example`; never commit it). Without it the public website still runs, but signed-in areas redirect to log in.

This is **Next.js 16** with `cacheComponents` and `partialPrefetching` on (see `next.config.ts`). APIs differ from older Next.js: read the relevant guide in `node_modules/next/dist/docs/` before writing framework code. Under Cache Components, client hooks that read URL data (`useSearchParams`, `usePathname` on routes with unknown dynamic params) need a `Suspense` boundary or the build fails. `LayoutProps`/`PageProps` are generated global types, so run `npm run build` (or `next dev`) once if `tsc` can't find them.

## Code layout

- `src/app/globals.css` holds every design token in a Tailwind 4 `@theme`. Tailwind's default palette, radii, shadows and font sizes are **cleared**, so only brand tokens exist: colours like `bg-forest`, `text-ink-muted`, `border-line`, `bg-sunset-hover`; radii `rounded-sm|md|pill`; shadows `shadow-sm|md|lg|focus`; sizes `text-body`, `text-small`, `text-body-lg`; composite type styles `type-display`, `type-title`, `type-heading`, `type-label`; widths `max-w-site` (1200px) and `max-w-app` (1280px). Add new tokens there rather than using arbitrary values.
- Fonts load in `src/app/layout.tsx` via `next/font/google` and feed `--font-display|heading|body` (`font-display`, `font-heading`, `font-body`).
- `src/components/ui/` holds the design-system components ported from the Claude Design bundle: Button, Card, Badge, TextInput, Select, Checkbox, FormLayout/FormRow/FormGroup, ChoiceChip, Banner, EmptyState, Skeleton, Toast, Sheet, Avatar, Icon (bundled Lucide paths; add new icons to the map), Logo and PathMotif. Import from `@/components/ui`. Hover, focus and active states are CSS, not JS state.
- `src/components/navigation/`: `SiteHeader` and `SiteFooter` for the website; `AppShell` (`AppHeader` plus the mobile-only `AppTabBar`) for the platform. Desktop navigation starts at the `lg` breakpoint.
- `src/lib/navigation.ts` is the single list of nav links for the header, footer and tab bar.
- Routes use route groups: `(site)` (website: `/`, `/how-it-works`, `/mentors`, `/for-parents`, `/get-started`), `(auth)` (`/log-in`, `/auth/confirm`, `/mfa`, minimal header), `(student)` (`/my-mentor`, `/sessions`, `/my-goals`), `(mentor)` (`/students`, `/students/[studentId]`, `/free-times`) and `(admin)` (`/admin`, `/admin/students[/studentId]`, `/admin/calls`, `/admin/mentors`, `/admin/payments`). Each group's `layout.tsx` picks its shell.
- **Database:** tables in `src/db/schema.ts` (Drizzle). Read rules (RLS policies), helper functions in the `private` schema, the profile trigger, grants and append-only log triggers are hand-written SQL in `drizzle/0001_security_and_seed.sql`; new tables need the same treatment (enable RLS, add a SELECT policy, and keep the `authenticated` role select-only).
- **Get started** (`src/app/(site)/get-started/`) is public. Its Server Action creates the student's login (no password), student, enrolment, first charge and, on the free-call path, the consultation. Only the free-call path emails the set-password link; apply-now gets it after payment. The goals Zod schema and phone normaliser live in `src/lib/goals.ts` for reuse on My goals. Prices come from the `packages` table (one active row), never from code.
- **Google Calendar** (`src/lib/google/calendar.ts`) creates events with Meet links and emails invites, signed in as one Google account by refresh token. It is **not connected yet** (the owner is sticking to free tools), so Meet links are added by hand. Without the `GOOGLE_*` settings, bookings still work, no invite is sent and the confirmation copy says so. Invites run in `after()` so they never hold up the response.
- **Sessions** (`src/lib/sessions/`: `data.ts` loaders, `actions.ts` Server Actions; UI in `src/components/sessions/SessionsView.tsx`) is one view in two modes: students at `/sessions` (book, tick tasks) and mentors at `/students/[studentId]` (notes, call link, tasks, switch student). One upcoming session at a time, up to the enrolment's weeks; `sessions.availability_id` is unique, so a free time can't be double-booked. Pass the loader's `now` to the client rather than calling `Date.now()` in render.
- Student data loaders live in `src/lib/students/` (`my-mentor.ts`, `goals.ts`). The balance is always charges minus succeeded payments, computed on read. `UniversityPicker` (`src/components/goals/`) is shared by Get started and My goals; `editGoalsSchema` in `src/lib/goals.ts` holds the fields a student may change later.
- **Admin** loaders and actions are in `src/lib/admin/` (`data.ts`, `actions.ts`; constants in `options.ts`, since a `"use server"` file may only export async functions); UI pieces in `src/components/admin/`. Reads run as the admin through `asUser`; opening a student is access-logged. Adding a mentor creates their login and sends the set-password email.
- If `requireViewer()` finds no account for a valid session (for example, a deleted user), it redirects to `/auth/sign-out`, which clears the session; redirecting straight to `/log-in` would loop with the proxy.
- **Two database paths** (`src/db/index.ts`): `asUser(claims, tx => …)` runs queries as the signed-in user so RLS applies, and is the default for every read. `adminDb()` bypasses RLS and is only for writes or system jobs after server code has checked permission. The browser never queries the database.
- **Auth:** `src/proxy.ts` refreshes the Supabase session and does a fast role redirect per area (`src/lib/auth/roles.ts`). The real check is `requireViewer()` in `src/lib/auth/dal.ts`, called by `SignedInShell` in each signed-in route group's layout and by every Server Action. The role comes from `profiles.role` (DB), mirrored in the JWT's `app_metadata.role`, which only the secret key can set. Accounts are never self-created: Supabase sign-ups are off and accounts are made by the server (secret key).
- Login is **email and password** (`/log-in`; no magic links, no 2FA, by the owner's decision). Email links are used only to choose a first password or reset a forgotten one: `/forgot-password` → email → `/auth/confirm` (needs a button press, so email scanners can't use the link up) → `/set-password`. Passwords are at least 10 characters (`MIN_PASSWORD_LENGTH`). Login errors never reveal whether an email has an account.
- Pages that read the session must sit inside `<Suspense>` (Cache Components). `createClient()` in `src/lib/supabase/server.ts` awaits `cookies()` and `connection()` first so session checks never run during prerendering.
- Don't run `npm run build` while `npm run dev` is running: they share `.next/` and the dev server ends up serving stale code. Stop dev, delete `.next`, restart.
- `src/components/Placeholder.tsx` renders the temporary page bodies; delete each use as real screens are built.

## Stack

The full stack, with reasons and pre-build checks, is in `tech-stack.md`. In short:

- **Next.js (App Router) + TypeScript**, one codebase. The website pages (Home, How it works, Mentors, For parents) are static or ISR. The app screens (Goals and booking, Payment, Log in, My mentor, Sessions, My goals) sit behind auth.
- **Tailwind 4** with the brand tokens, and our own components in `src/components/ui` (ported from the Claude Design system, not shadcn/ui). Validate forms with **React Hook Form + Zod**.
- **Back end is Next.js server code** (server actions, API routes). The browser never writes to the database directly; every write goes through server code that checks permissions.
- **Supabase** (Postgres, Auth, Row Level Security) in an EU region on the Pro plan. Schema and migrations are defined in **Drizzle**. RLS is a second lock behind the server checks, so keep it on every table.
- **Inngest** runs event-driven workflows (next week's setup, pairing countdown, weekly report, future instalment reminders). Put automatic follow-on steps there, not in request handlers.
- Login is via Supabase Auth with **email and password**. No 2FA. Send Supabase's emails (password set/reset) through Resend SMTP.
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
