"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import { isActive, type NavItem } from "@/lib/navigation";

/** White bottom tab bar for the platform on mobile. Hidden from lg up, where the header carries the links. */
export function AppTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex gap-1 border-t border-line bg-white px-2 pt-1.5 pb-[calc(10px+env(safe-area-inset-bottom))] lg:hidden"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-md text-[12px] leading-4 no-underline hover:no-underline focus-visible:-outline-offset-4",
              active ? "font-bold text-forest" : "font-medium text-ink-muted",
            )}
          >
            <span
              className={cx(
                "flex h-[30px] w-14 items-center justify-center rounded-pill transition-colors duration-200 ease-out",
                active ? "bg-forest-soft" : "bg-transparent",
              )}
            >
              {item.icon ? <Icon name={item.icon} size={22} /> : null}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
