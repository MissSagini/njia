import type { IconName } from "@/components/ui/Icon";

export type NavItem = { label: string; href: string; icon?: IconName };

/** Website header links (spec v2: How it works, Mentors, For parents). */
export const siteLinks: NavItem[] = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Mentors", href: "/mentors" },
  { label: "For parents", href: "/for-parents" },
];

export const siteCta = { label: "Apply now", href: "/get-started?path=apply" };
export const logInHref = "/log-in";

export const footerColumns: { title: string; links: NavItem[] }[] = [
  {
    title: "Njia",
    links: [
      { label: "Home", href: "/" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Mentors", href: "/mentors" },
      { label: "For parents", href: "/for-parents" },
    ],
  },
  {
    title: "Students",
    links: [
      { label: "Book your free call", href: "/get-started?path=call" },
      { label: "Apply now", href: "/get-started?path=apply" },
      { label: "Log in", href: "/log-in" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "hello@njia.co.ke", href: "mailto:hello@njia.co.ke" },
      { label: "WhatsApp +254 712 345 678", href: "https://wa.me/254712345678" },
    ],
  },
];

/** Platform navigation: desktop header pills and mobile bottom tabs. */
export const studentAppLinks: NavItem[] = [
  { label: "My mentor", href: "/my-mentor", icon: "user" },
  { label: "Sessions", href: "/sessions", icon: "calendar" },
  { label: "My goals", href: "/my-goals", icon: "compass" },
];

export const mentorAppLinks: NavItem[] = [
  { label: "My students", href: "/students", icon: "users" },
];

/** Active when on the link's path or a page beneath it. Query strings are ignored. */
export function isActive(pathname: string, href: string) {
  const path = href.split("?")[0];
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(path + "/");
}
