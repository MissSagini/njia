import { z } from "zod";

/** A call link: empty (null), or a Google Meet or Zoom https link. */
export const meetLinkSchema = z
  .string()
  .trim()
  .transform((s) => s || null)
  .refine((s) => s === null || /^https:\/\/(meet\.google\.com|([a-z0-9-]+\.)?zoom\.us)\//i.test(s), "Paste a Google Meet or Zoom link, starting with https://.");
