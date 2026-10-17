# Njia Tech Stack

**Based on:** `product-spec/Njia Product Spec v2.md`
**Version:** 1.1

---

## 1. Overview

| Layer | Pick |
|---|---|
| Front end | **Next.js + TypeScript + Tailwind**, with our own components ported from the Claude Design system |
| Back end | **Next.js server code** (server actions and API routes) for app logic, plus **Inngest** for automatic, event-driven steps |
| Database | **PostgreSQL on Supabase** (EU region, Pro plan), schema and migrations in code with **Drizzle** |
| Authentication | **Supabase Auth**: email link for students, plus required 2FA for mentors and admins |

One Next.js codebase serves both the marketing website and the logged-in platform. M-Pesa payments go directly through Safaricom Daraja, and card payments go through Paystack. Booking is built into the app, Google Calendar creates the Meet links, and Resend sends every email.

The stack is designed for three needs beyond the v2 spec: **instalments and deposits**, **week-by-week progress that triggers the next step**, and **strong protection for minors' data**.

---

## 2. Stack

| Layer | Tool | What it does for Njia |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Website pages (Home, How it works, Mentors, For parents) are pre-rendered for SEO and speed. App screens (Goals and booking, Payment, Log in, My mentor, Sessions, My goals) sit behind login. The Mentors page caches approved mentors, so newly approved ones appear without a redeploy. |
| Styling | **Tailwind CSS** | Brand tokens (colours, type scale, radius, spacing) from `brand/brand-guide.md`. |
| Components | **Own components** (`src/components/ui`) | Ported from the Njia design system in Claude Design: buttons, form fields, cards, chips, banners, sheets, toasts, navigation. |
| Fonts | **`next/font`** (Google Fonts) | Literata 600, Fraunces 600 and DM Sans 400/500/600/700. |
| Forms | **React Hook Form + Zod** | Goals and My goals forms (up to 5 dream universities, optional school). The same Zod schemas validate in the browser and on the server. |
| Screen states | Next.js `loading.tsx` / `error.tsx` + Skeleton, EmptyState and Banner components | Loading, empty, error and success states on every app screen. |
| Back end | **Next.js server actions and API routes** | All reads and writes of private data, permission checks, payment webhooks. The browser never writes to the database directly. |
| Database | **Supabase Postgres** (EU region, **Pro plan**) | Relational data with strict transactions, which money records need. Pro adds daily backups, point-in-time restore and no project pausing. |
| Schema & migrations | **Drizzle ORM** | Tables defined in TypeScript, versioned migrations, typed queries. |
| Workflows | **Inngest** | Event-driven steps with retries and a log of every run (see section 4). |
| Auth | **Supabase Auth** (email link + 6-digit code fallback) | Passwordless login for students. The code fallback covers school email systems that scan links and use them up. |
| 2FA | **Supabase Auth MFA** (authenticator app) | Required for mentors and admins, who can see many students' data. |
| Access control | **Server checks + Supabase Row Level Security** | Two locks: server code checks every request, and the database's row-level rules apply even if the server code has a bug. Students see only their own data, mentors only their paired students, and admins everything. |
| M-Pesa | **Safaricom Daraja API (STK Push), direct** | Sends the payment prompt to the student's or **parent's** phone. The callback's receipt number fills `M-Pesa reference`. Merchant fees are capped, unlike an aggregator's percentage fee. |
| Cards | **Paystack** (hosted checkout) | Visa and Mastercard in KES with 3-D Secure. Card details never touch Njia's servers. |
| Booking | **Built in-app** on `Mentor availability` | Students book the free call and their next session from available times. A database transaction plus a unique constraint prevents double-booking. |
| Meet links & invites | **Google Calendar API** (Google Workspace) | Creates each event and its Google Meet link (stored on `Sessions`). Invites the parent to the free call. |
| Email | **Resend + React Email** | Weekly parent report, booking and payment confirmations, reminders, and login emails (as Supabase's SMTP provider). |
| Mentor contact | `wa.me` and `mailto:` links | WhatsApp or email from the My mentor screen. No chat API needed. |
| Dates | **date-fns-tz** | Store times in UTC. Show students East Africa Time and mentors their own local time (UK or Europe). |
| Phone numbers | **libphonenumber-js** | Converts numbers like `07xx…` into the `2547…` format Daraja needs. |
| Admin | `/admin` pages in the same app | Consultation calls, pairing queue, mentor approval, payments and balances. |
| Hosting | **Vercel** | Deploys and a preview URL for every change. Secrets kept in Vercel environment variables. |
| Errors | **Sentry** | Error tracking for the app, webhooks and workflows. Personal data scrubbed from error reports. |
| Analytics | **PostHog** | Funnel: goals → free call or apply now → paid → paired. No personal data sent. |

---

## 3. Payments: built for deposits and instalments

Payments are tracked like an accountant's ledger, not as "paid yes/no" on the student.

| Table | Holds |
|---|---|
| **Enrolments** | Student, package, agreed price, start date. The price lives here, not in code. |
| **Charges** | Each amount owed and its due date. Today: one charge of KSh 250,000. Later: a deposit plus instalments, as more rows. |
| **Payments** | Each real M-Pesa or card transaction, linked to the charge it pays. |

- **Balance owed** = charges minus successful payments. It is always calculated, never stored as an editable number.
- Amounts are stored as whole numbers (shillings), never decimals.
- Adding deposits or instalments later needs new payment plans, not database changes.
- This also handles the M-Pesa limit now: a charge can be paid in more than one transaction.

---

## 4. Progress tracking and automatic next steps

| Table | Holds |
|---|---|
| **Programme weeks** | The 12 weeks, each linked to a stage: choosing a course, personal statement, application submitted, offers, visa, accommodation, arrival. |
| **Student weeks** | Each student's week: session, mentor's notes, tasks and status. |
| **Activity log** | A permanent record of every event ("task done", "notes added", "stage moved to Visa"). Entries are only added, never edited or deleted. This is the history of each student's journey. |

Inngest turns events into actions:

| When | Then |
|---|---|
| A week's tasks are done or the mentor submits notes | Set up the next week and notify the mentor |
| A payment is received | Start the 2-day pairing countdown; alert the admin if it runs out |
| Every Sunday evening (EAT) | Send each parent the weekly report |
| An instalment is due in 3 days (future) | Send a payment reminder |

---

## 5. Data protection

Students are often under 18, so this is a core requirement.

- **No direct database writes from the browser.** Every change goes through server code that checks identity and permissions. Row Level Security is a second lock behind it.
- **Least privilege.** The database master key is only used on the server, never sent to the browser.
- **2FA required for mentors and admins**, with shorter login sessions for admins.
- **Access log** recording who viewed or changed each student's record.
- **No card data stored.** Paystack's hosted checkout handles cards. Every payment notification is verified as genuinely coming from Safaricom or Paystack.
- **Encryption.** Data is encrypted at rest by default. Add field-level encryption for the most sensitive fields (for example parent phone numbers) if needed.
- **Backups.** Daily backups and point-in-time restore on Supabase Pro.
- **No personal data in logs, error reports or analytics.**
- **Kenya Data Protection Act 2019.** Parental consent checkbox on the Goals form, a privacy policy, a data retention rule, signed data-protection agreements with every provider, and a check on ODPC registration. Hosting in the EU is allowed with safeguards; confirm with a local data-protection advisor.

---

## 6. Before building

1. **M-Pesa limits.** KSh 250,000 is at or near M-Pesa's per-transaction limit, and the payer needs that balance in their wallet. Confirm current per-transaction, daily and wallet limits with Safaricom. The charges-and-payments design allows a charge to be paid in parts.
2. **Daraja go-live.** Needs a registered business, a Paybill or Till number, and Safaricom production approval. Start this alongside development.
3. **Card limits.** Many Kenyan cards have limits below KSh 250,000. Show a clear error and offer M-Pesa as the alternative.
4. **Apply-now checkout.** The student and enrolment records are created when Goals is submitted. Payment attaches to the charge, and the login link is sent once payment succeeds.
5. **Data protection paperwork.** Privacy policy, consent wording, retention rule and provider agreements, ideally reviewed by a local advisor before launch.

---

## 7. Other tools considered

| Tool | Why not (for now) |
|---|---|
| Firebase | Its database doesn't suit money records, and it's hard to keep the access rules secure. |
| Clerk or Auth0 | Good login products, but another company handling minors' data. Supabase Auth covers the needs. |
| Separate Django, Laravel or Express back end | More to run and maintain with no gain yet. Next.js server code plus Supabase can also serve a mobile app later. |
| Prisma | Works too. Drizzle is lighter and fits Supabase better. |

---

## 8. Running costs at launch

| Item | Cost |
|---|---|
| Supabase Pro | About $25 per month |
| Google Workspace | About $7 per user per month |
| Vercel, Resend, Inngest, Sentry, PostHog | Free tiers cover launch |
| M-Pesa (Daraja) | Merchant fee per transaction, capped (confirm current tariff) |
| Paystack (cards) | Percentage per transaction (confirm current Kenya rate) |

Confirm all fees and limits with the providers before launch.
