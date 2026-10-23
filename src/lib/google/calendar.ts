import "server-only";
import { googleEnv } from "@/lib/env";

/**
 * Google Calendar through its REST API, signed in as one Google account with a
 * stored refresh token. Creates events with a Meet link and emails the invites.
 */

const API = "https://www.googleapis.com/calendar/v3";

let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(env: NonNullable<ReturnType<typeof googleEnv>>) {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cached.token;
}

type CalendarEvent = { id: string; hangoutLink?: string; conferenceData?: { createRequest?: { status?: { statusCode?: string } } } };

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const env = googleEnv();
  if (!env) throw new Error("Google Calendar isn't connected");
  const res = await fetch(`${API}/calendars/${encodeURIComponent(env.GOOGLE_CALENDAR_ID)}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken(env)}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) throw new Error(`Google Calendar request failed (${res.status})`);
  return (await res.json()) as T;
}

export const calendarConnected = () => googleEnv() !== null;

/**
 * Creates an event with a Google Meet link and emails an invite to each attendee.
 * `requestId` makes retries safe: Google creates one Meet per request ID.
 */
export async function createMeetEvent(input: {
  requestId: string;
  summary: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  attendees: string[];
}): Promise<{ eventId: string; meetLink: string | null }> {
  let event = await call<CalendarEvent>("/events?conferenceDataVersion=1&sendUpdates=all", {
    method: "POST",
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startsAt.toISOString() },
      end: { dateTime: input.endsAt.toISOString() },
      attendees: [...new Set(input.attendees)].map((email) => ({ email })),
      guestsCanSeeOtherGuests: true,
      conferenceData: { createRequest: { requestId: input.requestId, conferenceSolutionKey: { type: "hangoutsMeet" } } },
    }),
  });

  // Google sometimes adds the Meet link a moment after creating the event
  for (let i = 0; i < 3 && !event.hangoutLink && event.conferenceData?.createRequest?.status?.statusCode === "pending"; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    event = await call<CalendarEvent>(`/events/${event.id}`);
  }

  return { eventId: event.id, meetLink: event.hangoutLink ?? null };
}
