/** Times are stored in UTC. Students see them in East Africa Time. */
export const EAT = "Africa/Nairobi";

const dayFormat = new Intl.DateTimeFormat("en-GB", { timeZone: EAT, weekday: "short", day: "numeric", month: "short" });
const longDayFormat = new Intl.DateTimeFormat("en-GB", { timeZone: EAT, weekday: "long", day: "numeric", month: "long" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: EAT, hour: "numeric", minute: "2-digit", hour12: true });
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: EAT, year: "numeric", month: "2-digit", day: "2-digit" });

/** "Tue 28 Oct" */
export const formatDayEat = (d: Date | string) => dayFormat.format(new Date(d));
/** "Tuesday 28 October" */
export const formatLongDayEat = (d: Date | string) => longDayFormat.format(new Date(d));
/** "4:00 pm" */
export const formatTimeEat = (d: Date | string) => timeFormat.format(new Date(d));
/** "2026-10-28", for grouping times by their EAT date */
export const dayKeyEat = (d: Date | string) => dayKeyFormat.format(new Date(d));
