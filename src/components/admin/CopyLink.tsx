"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

/** Copies a link (like a family's payment link) to send by WhatsApp or email. */
export function CopyLink({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {copied ? <Toast onDismiss={() => setCopied(false)}>Link copied</Toast> : null}
      <Button
        variant="outline"
        size="md"
        iconLeft="external-link"
        className="self-start"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            setFailed(true);
          }
        }}
      >
        {label}
      </Button>
      {failed ? <span className="text-small break-all text-ink-muted">{url}</span> : null}
    </div>
  );
}
