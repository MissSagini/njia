import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LogInPage() {
  return (
    // The form reads ?next= and notices from the URL, which happens at request time
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
