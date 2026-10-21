import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getViewer } from "@/lib/auth/dal";
import { SetPasswordForm } from "./SetPasswordForm";

export const metadata: Metadata = { title: "Choose your password" };

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SignedInOnly />
    </Suspense>
  );
}

/** Reached from an invite or reset link, which signs the person in first. */
async function SignedInOnly() {
  if (!(await getViewer())) redirect("/log-in?error=link");
  return <SetPasswordForm />;
}
