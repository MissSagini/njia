"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { FieldHelp } from "@/components/ui/Field";
import { FormGroup } from "@/components/ui/FormLayout";
import { TextInput } from "@/components/ui/TextInput";
import { MAX_UNIVERSITIES, UNIVERSITY_SUGGESTIONS } from "@/lib/goals";

/** Up to 5 dream universities: suggestion chips plus any other UK or European one. Sent as repeated "dreamUniversities" fields. */
export function UniversityPicker({ initial, error }: { initial?: string; error?: string }) {
  const [chosen, setChosen] = useState<string[]>(() => (initial ? initial.split("\n").filter(Boolean) : []));
  const [draft, setDraft] = useState("");
  const [limitHit, setLimitHit] = useState(false);
  const options = useMemo(() => [...new Set([...UNIVERSITY_SUGGESTIONS, ...chosen])], [chosen]);
  const full = chosen.length >= MAX_UNIVERSITIES;

  function toggle(name: string) {
    setChosen((list) => {
      if (list.includes(name)) return list.filter((c) => c !== name);
      return list.length >= MAX_UNIVERSITIES ? list : [...list, name];
    });
    setLimitHit(!chosen.includes(name) && full);
  }

  function addDraft() {
    const name = draft.trim().replace(/\s+/g, " ");
    if (!name) return;
    const match = options.find((o) => o.toLowerCase() === name.toLowerCase());
    if (match && chosen.includes(match)) return setDraft("");
    if (full) return setLimitHit(true);
    setChosen((list) => (list.length >= MAX_UNIVERSITIES ? list : [...list, match ?? name]));
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addDraft();
    }
  }

  return (
    <FormGroup
      legend="Dream universities"
      hint={`Choose up to ${MAX_UNIVERSITIES}. ${chosen.length} of ${MAX_UNIVERSITIES} chosen.`}
      className="gap-2"
    >
      {chosen.map((c) => (
        <input key={c} type="hidden" name="dreamUniversities" value={c} />
      ))}
      <div className="grid grid-cols-2 gap-2 pt-1 outline-none sm:grid-cols-3" data-error={error ? "true" : undefined} tabIndex={error ? -1 : undefined}>
        {options.map((o) => (
          <ChoiceChip key={o} label={o} selected={chosen.includes(o)} onPick={() => toggle(o)} />
        ))}
      </div>
      <div className="flex items-end gap-2">
        <TextInput
          label="Another university"
          optional
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="For example, University of Bristol"
          className="flex-1"
          maxLength={80}
        />
        <Button size="md" variant="outline" onClick={addDraft} className="mb-0">
          Add
        </Button>
      </div>
      <FieldHelp
        id="universities-help"
        error={limitHit ? `You've chosen ${MAX_UNIVERSITIES}. Remove one to add another.` : error}
      />
    </FormGroup>
  );
}
