import { z } from "zod";

/** A call link: empty (null), or a Google Meet or Zoom https link. */
export const meetLinkSchema = z
  .string()
  .trim()
  .transform((s) => s || null)
  .refine((s) => s === null || /^https:\/\/(meet\.google\.com|([a-z0-9-]+\.)?zoom\.us)\//i.test(s), "Paste a Google Meet or Zoom link, starting with https://.");

/** A link to a student's work: empty (null), or any https link, such as a Google Doc or OneDrive file. */
export const workLinkSchema = z
  .string()
  .trim()
  .max(2000, "That link is too long. Copy the share link instead.")
  .transform((s) => s || null)
  .refine((s) => s === null || /^https:\/\/[^\s]+\.[^\s]+$/i.test(s), "Paste a link that starts with https://, like a Google Doc's share link.");
