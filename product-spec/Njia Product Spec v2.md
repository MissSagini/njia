# Product name
**Njia** (Swahili for "path"). This is a placeholder, so swap it for your own.

# One line description
Kenyan students get paired with Kenyan mentors who studied at their dream UK or European university, for guidance from application to settling in.

# Primary user
**Cynthia, 17, Nairobi.** She is finishing A-levels at Nairobi International School and dreams of Oxford, Cambridge, LSE or UCL. She has no one to ask about choosing a course, writing essays, applying, or preparing to move abroad.

# User types and what each can do
| User | Can do |
|---|---|
| **Student** | Fill in goals, book a free consultation call **or apply and pay straight away**, log in with an email link, see her mentor, see sessions, book the next session, tick off tasks, **view and edit her goals** |
| **Mentor** | Log in with an email link, see their paired students, write session notes, add weekly tasks |
| **Admin (you)** | Run consultation calls, pair students with mentors, add and approve mentors, see payments |
| **Parent** (no login) | Receives a **weekly** progress report by email. Welcome to join the free call. Can receive the M-Pesa payment prompt on their phone |

# Core action
Cynthia fills in her goals and chooses one of two ways to start:
- **Free call first.** She books a free 30-minute consultation call. After the call she pays and is paired with a mentor.
- **Apply now.** If she already knows what she needs, she skips the call, pays straight away and is paired with a mentor within 2 days.

Either way, her mentor then guides her through applying and moving abroad with weekly sessions and tasks.

# Pricing
**KSh 250,000**, one package covering **12 weeks** of mentorship. It includes a mentor, weekly sessions on Google Meet with notes, a short task list each week and a weekly progress report for the parent. The first call is free. Payment is by M-Pesa or card (Visa or Mastercard). A parent can pay on either path, including apply now: the M-Pesa prompt can go to the parent's phone.

# Screens

## Website
1. **Home.** Hero ("Someone from home who's already been there."), how it works in 4 steps, three mentor profiles, help after arrival (accommodation, bank account, SIM card, getting around, finding community), a sample parent report, and "Two ways to start" (Book your free call or Apply now). Header has How it works, Mentors, For parents, Log in and Apply now.
2. **How it works.** The 4 steps in detail, what a typical week looks like (session, notes, tasks, parent report) and the price.
3. **Mentors.** Mentor profiles (name, university, course, year, where they're from, a first-person line), a filter by university, and how mentors are chosen (studied there, Kenyan, approved by the team).
4. **For parents.** A sample weekly report, what parents can expect, and common questions (cost, how to pay, no account needed, who the mentors are).

## App
1. **Goals and booking.** Shows a choice of how to start (free call first or apply now) and a short form: full name, email, phone, school (optional), exam type, course, dream universities (up to 5), what she needs help with, parent's name and parent's email. On the free-call path it also shows available call times (East Africa Time). She can submit her goals and book the free call, or continue to payment.
2. **Payment** (apply-now path). Shows the price and what it includes, and the payment option (M-Pesa or card). She can pay, then sees what happens next.
3. **Log in.** Email field. Njia sends a login link by email (no password). Used by students and mentors.
4. **My mentor.** Shows her mentor's profile (name, university, course, bio) and the payment option (M-Pesa or card) if she hasn't paid yet. She can pay and contact her mentor (WhatsApp or email). Before pairing it shows "Finding your mentor".
5. **Sessions.** Shows upcoming and past sessions, each with the mentor's notes and a checklist of tasks for the week, plus progress for the month. She can book the next session from her mentor's free times and tick off tasks. Mentors use this same screen to add notes and tasks, and switch between their students.
6. **My goals.** Shows the goals she submitted. She can edit her course, exams, dream universities and parent's details. Her mentor sees changes straight away.

## States for every screen
Each app screen has the states that apply: loading, empty (for example "Finding your mentor" or "Your first session is coming up"), error (for example a failed M-Pesa payment, a call time that was just booked, or sessions that didn't load) and success (for example "You're booked!" or "Payment received").

# Data
| Table | Fields | Used by |
|---|---|---|
| **Students** | name, email, phone, school, exam type, dream universities, course interest, help needed, parent name, parent email, **start path (free call or apply now)** | Written on Goals; edited on My goals; read by admin and mentor |
| **Mentors** | name, email, university, course, year finished or still studying, current city, **home town**, bio, **WhatsApp number**, approved (yes/no) | Added by admin; read on My mentor and the Mentors page |
| **Consultations** | student, date and time, paired mentor | Written on Goals (free-call path only); updated by admin |
| **Payments** | student, amount (KSh 250,000), method (M-Pesa or card), **M-Pesa phone number**, **M-Pesa reference**, status, date | Written on Payment or My mentor; read by admin |
| **Sessions** | student, mentor, date, mentor's notes, **Google Meet link** | Read and written on Sessions |
| **Tasks** | session, description, done (yes/no) | Read and written on Sessions; summed up in the weekly parent report |
| **Mentor availability** | mentor, date and time | Read on Sessions when booking the next session |

# Out of scope (for now)
Parent logins, in-app video calls (use Zoom or Google Meet links), in-app chat, file uploads, task deadlines and reminders, mentors running consultations, ratings and reviews, US universities.

# Brand notes
It should feel like advice from an older Kenyan sibling who's already made the journey. Mentors share Cynthia's background and went to her dream school. The support doesn't stop at the offer letter: it continues with accommodation, bank accounts, SIM cards, transport and finding community after she arrives.

---

# Changes from the first version
- **Decided:** payment is one package at KSh 250,000, and parents get the progress report weekly.
- **Added an "Apply now" path** next to the free call, for students who don't need guidance first. Added the Payment screen for it.
- **Added a website:** Home, How it works, Mentors and For parents.
- **Added Log in** with an email link, and **My goals** (view and edit goals), so the "My goals" tab has a screen.
- **Sessions:** booking the next session now picks from the mentor's free times. Monthly task progress is shown. Mentors switch between students on this screen.
- **My mentor:** contact is by WhatsApp or email. Shows "Finding your mentor" before pairing.
- **Goals form:** added full name, phone, school (optional) and parent's name, matching the Students table.
- **Decided:** the package covers 12 weeks, and parents can pay the M-Pesa prompt on either path.
- **Data:** new fields for start path, mentor home town and WhatsApp, M-Pesa phone and reference, Google Meet link, and a new Mentor availability table.

**Still to decide:** nothing open right now.
