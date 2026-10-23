/**
 * Demo data for trying the signed-in screens locally: an admin, one mentor and one paired
 * student, a past session with notes and tasks, and some free times. Uses
 * example.com emails, so nothing is ever sent. The shared password is saved to
 * .env.local as DEMO_PASSWORD (generated on first run, never printed).
 *
 *   npm run demo:seed            create (or reset) the demo accounts
 *   npm run demo:seed -- --remove   delete them and everything linked to them
 */
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const MENTOR_EMAIL = "demo-mentor@example.com";
const STUDENT_EMAIL = "demo-student@example.com";
const ADMIN_EMAIL = "demo-admin@example.com";

const { values } = parseArgs({ options: { remove: { type: "boolean", default: false } } });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret || !process.env.DATABASE_URL) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and DATABASE_URL in .env.local first.");
  process.exit(1);
}
const supabase = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function remove() {
  const rows = await sql<{ id: string }[]>`select id from profiles where email in (${MENTOR_EMAIL}, ${STUDENT_EMAIL}, ${ADMIN_EMAIL})`;
  // Sessions point at the mentor and their free times without cascading, so clear them first
  await sql`delete from sessions where mentor_id in (select id from mentors where email = ${MENTOR_EMAIL})`;
  await sql`delete from mentor_availability where mentor_id in (select id from mentors where email = ${MENTOR_EMAIL})`;
  await sql`delete from enrolments where mentor_id in (select id from mentors where email = ${MENTOR_EMAIL})`;
  for (const { id } of rows) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw new Error(`Couldn't delete a demo login: ${error.message}`);
  }
  return rows.length;
}

async function createLogin(email: string, role: string, fullName: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`Couldn't create ${email}: ${error.message}`);
  return data.user.id;
}

try {
  const removed = await remove();
  if (values.remove) {
    console.log(removed ? "Removed the demo accounts and their data." : "No demo accounts to remove.");
  } else {
    let password = process.env.DEMO_PASSWORD;
    if (!password) {
      password = randomBytes(12).toString("base64url");
      appendFileSync(".env.local", `\n# Password for the demo accounts (npm run demo:seed)\nDEMO_PASSWORD=${password}\n`);
    }

    const mentorProfile = await createLogin(MENTOR_EMAIL, "mentor", "Wanjiru Kamau", password);
    const studentProfile = await createLogin(STUDENT_EMAIL, "student", "Amani Otieno", password);
    await createLogin(ADMIN_EMAIL, "admin", "Demo Admin", password);

    const [mentor] = await sql`
      insert into mentors (profile_id, full_name, email, university, course, year_or_status, current_city, home_town, bio, whatsapp, time_zone, approved)
      values (${mentorProfile}, 'Wanjiru Kamau', ${MENTOR_EMAIL}, 'LSE', 'Economics', '2023', 'London', 'Nyeri',
              'I moved from Nyeri to London for LSE and remember how much I had to work out alone.', '+447700900123', 'Europe/London', true)
      returning id`;
    const [student] = await sql`
      insert into students (profile_id, full_name, email, phone, school, exam_type, course_interest, dream_universities, help_needed, parent_name, parent_email, start_path, parental_consent_at)
      values (${studentProfile}, 'Amani Otieno', ${STUDENT_EMAIL}, '+254712000111', 'Demo School', 'A-levels', 'Economics',
              ${["LSE", "UCL", "Warwick"]}, 'Personal statement and choosing between LSE and UCL.', 'Demo Parent', 'demo-parent@example.com', 'apply_now', now())
      returning id`;
    const [pkg] = await sql`select name, price_kes, weeks from packages where active`;
    const [enrolment] = await sql`
      insert into enrolments (student_id, package_name, price_kes, weeks, status, mentor_id, paired_at, starts_on)
      values (${student.id}, ${pkg.name}, ${pkg.price_kes}, ${pkg.weeks}, 'active', ${mentor.id}, now() - interval '8 days', current_date - 8)
      returning id`;
    await sql`insert into charges (enrolment_id, description, amount_kes, due_on) values (${enrolment.id}, ${pkg.name}, ${pkg.price_kes}, current_date - 8)`;

    // A session held last week, with notes and this week's tasks
    const lastWeek = new Date(Date.now() - 6 * 86_400_000);
    lastWeek.setUTCHours(16, 0, 0, 0);
    const [slot] = await sql`
      insert into mentor_availability (mentor_id, starts_at, ends_at)
      values (${mentor.id}, ${lastWeek}, ${new Date(lastWeek.getTime() + 3_600_000)}) returning id`;
    const [session] = await sql`
      insert into sessions (enrolment_id, mentor_id, week_number, availability_id, starts_at, status, meet_link, mentor_notes)
      values (${enrolment.id}, ${mentor.id}, 1, ${slot.id}, ${lastWeek}, 'held', 'https://meet.google.com/abc-defg-hij',
              'We talked through why Economics, and your shortlist. LSE and UCL both fit; Warwick is a strong third. Next: start your personal statement.')
      returning id`;
    await sql`
      insert into tasks (session_id, description, position, done, done_at) values
        (${session.id}, 'Read the LSE and UCL Economics course pages', 0, true, now()),
        (${session.id}, 'Write three reasons you want to study Economics', 1, false, null),
        (${session.id}, 'Draft the first paragraph of your personal statement', 2, false, null)`;

    // Free times over the next two weeks, 5 pm and 6 pm London time
    const times = [];
    for (let d = 2; d <= 14; d += 2)
      for (const hour of [17, 18]) {
        const start = new Date(Date.now() + d * 86_400_000);
        start.setUTCHours(hour, 0, 0, 0);
        times.push({ mentor_id: mentor.id, starts_at: start, ends_at: new Date(start.getTime() + 3_600_000) });
      }
    await sql`insert into mentor_availability ${sql(times)} on conflict do nothing`;

    console.log(`Created the demo admin (${ADMIN_EMAIL}), mentor (${MENTOR_EMAIL}) and student (${STUDENT_EMAIL}).`);
    console.log("Log in at /log-in with either email and the DEMO_PASSWORD in .env.local.");
  }
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
