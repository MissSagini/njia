import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { AdminPage, LoadError, Panel } from "@/components/admin/AdminPage";
import { EditMentorForm } from "@/components/admin/MentorForms";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { asUser, schema } from "@/db";
import { requireViewer } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Edit mentor" };

export default function EditMentorPage({ params }: PageProps<"/admin/mentors/[mentorId]">) {
  return (
    <AdminPage loading="Loading the mentor">
      <Mentor params={params} />
    </AdminPage>
  );
}

async function Mentor({ params }: Pick<PageProps<"/admin/mentors/[mentorId]">, "params">) {
  const { mentorId } = await params;
  const viewer = await requireViewer(["admin"]);
  let mentor;
  try {
    mentor = /^[0-9a-f-]{36}$/i.test(mentorId)
      ? await asUser(viewer.claims, (tx) => tx.query.mentors.findFirst({ where: eq(schema.mentors.id, mentorId) }))
      : undefined;
  } catch (error) {
    console.error("admin: mentor failed", (error as { code?: string }).code);
    return <LoadError what="This mentor" />;
  }
  if (!mentor) {
    return (
      <EmptyState icon="users" title="We couldn't find this mentor." action={<Link href="/admin/mentors">Back to mentors</Link>}>
        They may have been removed.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/mentors" className="inline-flex min-h-11 items-center gap-1 self-start rounded-sm">
        <Icon name="chevron-left" size={18} />
        All mentors
      </Link>
      <h1 className="m-0 type-title">{mentor.fullName}</h1>
      <Panel title="Profile" description="Students see this on My mentor. Changing the email changes their login email too.">
        <EditMentorForm
          mentor={{
            id: mentor.id,
            fullName: mentor.fullName,
            email: mentor.email,
            university: mentor.university,
            course: mentor.course,
            yearOrStatus: mentor.yearOrStatus,
            currentCity: mentor.currentCity,
            homeTown: mentor.homeTown,
            bio: mentor.bio,
            whatsapp: mentor.whatsapp ?? "",
            timeZone: mentor.timeZone,
          }}
        />
      </Panel>
    </div>
  );
}
