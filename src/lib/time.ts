/**
 * Times are stored in UTC. Students see them in East Africa Time; mentors see
 * them in their own zone (mentors.time_zone), since they're often in Europe.
 */
export const EAT = "Africa/Nairobi";

const formats = new Map<string, Intl.DateTimeFormat>();
function fmt(timeZone: string, options: Intl.DateTimeFormatOptions, locale = "en-GB") {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.DateTimeFormat(locale, { timeZone, ...options })));
  return f;
}

/** "Tue 28 Oct" */
export const formatDay = (d: Date | string, tz: string) => fmt(tz, { weekday: "short", day: "numeric", month: "short" }).format(new Date(d));
/** "Tuesday 28 October" */
export const formatLongDay = (d: Date | string, tz: string) => fmt(tz, { weekday: "long", day: "numeric", month: "long" }).format(new Date(d));
/** "4:00 pm" */
export const formatTime = (d: Date | string, tz: string) => fmt(tz, { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(d));
/** "2026-10-28": the date in that zone, for grouping and comparing days */
export const dayKey = (d: Date | string, tz: string) => fmt(tz, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA").format(new Date(d));
/** "2026-10": the month in that zone */
export const monthKey = (d: Date | string, tz: string) => dayKey(d, tz).slice(0, 7);
/** "October 2026" */
export const formatMonth = (d: Date | string, tz: string) => fmt(tz, { month: "long", year: "numeric" }).format(new Date(d));
/** "EAT", "GMT", "BST", "CET". Browsers and Node word some zones differently, so tidy the common ones. */
export function zoneLabel(d: Date | string, tz: string) {
  if (tz === EAT) return "EAT";
  const label = fmt(tz, { timeZoneName: "short" }).formatToParts(new Date(d)).find((p) => p.type === "timeZoneName")?.value ?? tz;
  return label === "GMT+0" || label === "UTC" ? "GMT" : label;
}

export const formatDayEat = (d: Date | string) => formatDay(d, EAT);
export const formatLongDayEat = (d: Date | string) => formatLongDay(d, EAT);
export const formatTimeEat = (d: Date | string) => formatTime(d, EAT);
export const dayKeyEat = (d: Date | string) => dayKey(d, EAT);

/** Minutes the zone is ahead of UTC at that instant. */
function offsetMinutes(at: number, tz: string) {
  const parts = Object.fromEntries(
    fmt(tz, { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" }, "en-US")
      .formatToParts(new Date(at))
      .map((p) => [p.type, Number(p.value)]),
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((asUtc - Math.floor(at / 1000) * 1000) / 60_000);
}

/** The UTC instant for a wall-clock date and time ("2026-10-28", "16:30") in a zone. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes settle the offset, including across daylight-saving changes
  let utc = wall - offsetMinutes(wall, tz) * 60_000;
  utc = wall - offsetMinutes(utc, tz) * 60_000;
  return new Date(utc);
}

/** Whether the string is a time zone this runtime knows. */
export function isTimeZone(tz: string) {
  try {
    fmt(tz, {});
    return true;
  } catch {
    return false;
  }
}
