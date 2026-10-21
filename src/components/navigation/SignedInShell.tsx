import { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireViewer } from "@/lib/auth/dal";
import type { Role } from "@/lib/auth/roles";
import type { NavItem } from "@/lib/navigation";
import { AppShell } from "./AppShell";

type Props = { roles: readonly Role[]; items: NavItem[]; children: ReactNode };

/**
 * Checks the session on the server before rendering a signed-in area.
 * Wrapped in Suspense because reading the session happens at request time.
 */
export function SignedInShell(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-app px-5 py-8 lg:px-10 lg:py-12">
          <Skeleton label="Loading" />
        </div>
      }
    >
      <Gate {...props} />
    </Suspense>
  );
}

async function Gate({ roles, items, children }: Props) {
  const viewer = await requireViewer(roles);
  return (
    <AppShell items={items} role={viewer.role} initials={viewer.initials}>
      {children}
    </AppShell>
  );
}
