"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import type { Mentee } from "@/lib/sessions/data";

/** Mentors switch between their students without going back to the list. */
export function StudentSwitcher({ students, current }: { students: Mentee[]; current: string }) {
  const router = useRouter();
  return (
    <Select
      label="Switch student"
      options={students.map((s) => ({ value: s.studentId, label: s.fullName }))}
      value={current}
      onChange={(e) => router.push(`/students/${e.target.value}`)}
      className="sm:w-64"
    />
  );
}
