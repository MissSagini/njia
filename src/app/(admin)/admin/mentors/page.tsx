import type { Metadata } from "next";
import { AdminPage, LoadError } from "@/components/admin/AdminPage";
import { AddMentorForm, ApproveButton } from "@/components/admin/MentorForms";
import { Panel } from "@/components/ui/Panel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { allMentors } from "@/lib/admin/data";
import { initialsFor, requireViewer } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Mentors" };

export default function AdminMentorsPage() {
  return (
    <AdminPage
      title="Mentors"
      intro="Students only see approved mentors. Approve someone once you've checked they studied there and are Kenyan."
      loading="Loading mentors"
    >
      <Mentors />
    </AdminPage>
  );
}

async function Mentors() {
  const viewer = await requireViewer(["admin"]);
  let mentors;
  try {
    mentors = await allMentors(viewer);
  } catch (error) {
    console.error("admin: mentors failed", (error as { code?: string }).code);
    return <LoadError what="The mentor list" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel title="All mentors">
        {mentors.length ? (
          <ul className="m-0 flex list-none flex-col p-0">
            {mentors.map((m) => (
              <li key={m.id} className="flex flex-col gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar initials={initialsFor(m.fullName, m.email)} size={44} tone={m.approved ? "forest" : "soft"} />
                  <div className="flex flex-col">
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      {m.fullName}
                      {m.approved ? null : <Badge variant="ochre">Waiting for approval</Badge>}
                    </span>
                    <span className="text-small text-ink-muted">
                      {m.university}, {m.course}, {m.yearOrStatus} · from {m.homeTown}, in {m.currentCity} · {m.studentCount}{" "}
                      {m.studentCount === 1 ? "student" : "students"}
                    </span>
                  </div>
                </div>
                <span className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Button variant="ghost" size="md" href={`/admin/mentors/${m.id}`}>
                    Edit
                  </Button>
                  <ApproveButton mentorId={m.id} approved={m.approved} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="users" title="No mentors yet.">
            Add your first mentor below.
          </EmptyState>
        )}
      </Panel>

      <Panel title="Add a mentor" description="This creates their login and emails them a link to choose a password.">
        <AddMentorForm />
      </Panel>
    </div>
  );
}
