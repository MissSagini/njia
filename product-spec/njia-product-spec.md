# Product name
**Njia** (Swahili for "path"). This is a placeholder, so swap it for your own.

# One line description
Kenyan students get paired with Kenyan mentors who studied at their dream UK or European university, for guidance from application to settling in.

# Primary user
**Cynthia, 17, Nairobi.** She is finishing A-levels at Nairobi International School and dreams of Oxford, Cambridge, LSE or UCL. She has no one to ask about choosing a course, writing essays, applying, or preparing to move abroad.

# User types and what each can do
| User | Can do |
|---|---|
| **Student** | Fill in goals, book a free consultation call, pay, see her mentor, see sessions, tick off tasks |
| **Mentor** | See their paired students, write session notes, add weekly tasks |
| **Admin (you)** | Run consultation calls, pair students with mentors, add and approve mentors, see payments |
| **Parent** (no login) | Receives a regular progress report by email |

# Core action
Cynthia fills in her goals and books a free consultation call. After the call she pays and is paired with a mentor who guides her through applying and moving abroad.

# Screens
1. **Goals and booking.** Shows a short form (universities, course, exam type, what she needs help with, parent's email) and available call times. She can submit her goals and book the free call.
2. **My mentor.** Shows her mentor's profile (name, university, course, bio) and the payment option (M-Pesa or card). She can pay and contact her mentor.
3. **Sessions.** Shows upcoming and past sessions, each with the mentor's notes and a checklist of tasks for the week. She can book the next session and tick off tasks. Mentors use this same screen to add notes and tasks.

# Data
| Table | Fields | Used by |
|---|---|---|
| **Students** | name, email, phone, school, exam type, dream universities, course interest, help needed, parent name, parent email | Written on Goals; read by admin and mentor |
| **Mentors** | name, email, university, course, year finished or still studying, current city, bio, approved (yes/no) | Added by admin; read on My mentor |
| **Consultations** | student, date and time, paired mentor | Written on Goals; updated by admin |
| **Payments** | student, amount, method (M-Pesa or card), status, date | Written on My mentor; read by admin |
| **Sessions** | student, mentor, date, mentor's notes | Read and written on Sessions |
| **Tasks** | session, description, done (yes/no) | Read and written on Sessions; summed up in parent report |

# Out of scope (for now)
Parent logins, in-app video calls (use Zoom or Google Meet links), in-app chat, file uploads, task deadlines and reminders, mentors running consultations, ratings and reviews, US universities.

# Brand notes
It should feel like advice from an older Kenyan sibling who's already made the journey. Mentors share Cynthia's background and went to her dream school. The support doesn't stop at the offer letter: it continues with accommodation, bank accounts, SIM cards, transport and finding community after she arrives.

---

**Still to decide:** whether payment is one package or per session, and how often parents get the progress report (weekly or monthly).
