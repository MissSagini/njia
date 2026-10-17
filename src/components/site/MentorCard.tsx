import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";

type MentorCardProps = {
  initials: string;
  name: string;
  study: string;
  from?: string;
  bio?: string;
};

/** Forest-soft mentor card: avatar, name, university line, where they're from and a short bio. */
export function MentorCard({ initials, name, study, from, bio }: MentorCardProps) {
  return (
    <Card tone="tint" className="h-full">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar initials={initials} size={64} />
        <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1">
          <div className="type-heading text-ink">{name}</div>
          <div className="text-body font-semibold text-forest">{study}</div>
          {from ? <div className="text-small text-ink-muted">{from}</div> : null}
        </div>
      </div>
      {bio ? <p className="m-0 mt-4 text-body text-pretty text-ink">{bio}</p> : null}
    </Card>
  );
}
