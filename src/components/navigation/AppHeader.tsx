"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/lib/auth/actions";
import type { Role } from "@/lib/auth/roles";
import { cx } from "@/lib/cx";
import { isActive, type NavItem } from "@/lib/navigation";

type AppHeaderProps = {
  items: NavItem[];
  role: Role;
  initials: string;
};

/**
 * Sticky Cream platform bar. Desktop (lg+) shows page links as pills, the active one in Forest-soft.
 * On mobile the links move to the bottom tab bar.
 */
export function AppHeader({ items, role, initials }: AppHeaderProps) {
  const pathname = usePathname();
  const roleLabel = role === "mentor" ? "Mentor" : role === "admin" ? "Admin" : null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream font-body">
      <div className="mx-auto flex h-[60px] max-w-app items-center justify-between px-5 lg:h-[72px] lg:px-10">
        <div className="flex items-center gap-10">
          <Link href={items[0]?.href ?? "/"} aria-label="Njia home" className="flex min-h-11 items-center rounded-sm">
            <span className="lg:hidden">
              <Logo width={88} priority />
            </span>
            <span className="hidden lg:block">
              <Logo width={112} priority />
            </span>
          </Link>
          <nav aria-label="Main" className="hidden gap-2 lg:flex">
            {items.map((n) => {
              const active = isActive(pathname, n.href, n.exact);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex min-h-11 items-center rounded-pill px-4 text-ink no-underline transition-colors duration-120 hover:no-underline",
                    active ? "bg-forest-soft font-bold" : "font-medium hover:bg-tint-hover",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {roleLabel ? <span className="text-small font-semibold text-forest">{roleLabel}</span> : null}
          <form action={signOut} className="m-0">
            <button
              type="submit"
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent px-2 font-body text-body font-semibold text-forest underline underline-offset-3 hover:decoration-2"
            >
              Log out
            </button>
          </form>
          <Avatar initials={initials} size={40} tone={roleLabel ? "forest" : "soft"} />
        </div>
      </div>
    </header>
  );
}
