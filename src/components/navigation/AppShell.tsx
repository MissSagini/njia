import type { ReactNode } from "react";
import type { Role } from "@/lib/auth/roles";
import type { NavItem } from "@/lib/navigation";
import { AppHeader } from "./AppHeader";
import { AppTabBar } from "./AppTabBar";

type AppShellProps = {
  items: NavItem[];
  role: Role;
  initials: string;
  children: ReactNode;
};

/** Platform frame: header on top, bottom tabs on mobile, content padded to clear the tab bar. */
export function AppShell({ items, role, initials, children }: AppShellProps) {
  return (
    <>
      <AppHeader items={items} role={role} initials={initials} />
      <main className={items.length > 1 ? "flex-1 pb-28 lg:pb-0" : "flex-1"}>{children}</main>
      <AppTabBar items={items} />
    </>
  );
}
