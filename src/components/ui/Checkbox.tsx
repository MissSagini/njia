"use client";

import { useId, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

type CheckboxProps = {
  label?: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
  /** Weekly tasks strike through and mute the label once ticked. */
  strikeWhenChecked?: boolean;
  id?: string;
  name?: string;
  value?: string;
  className?: string;
};

export function Checkbox({
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  disabled,
  error,
  strikeWhenChecked,
  id,
  name,
  value,
  className,
}: CheckboxProps) {
  const autoId = useId();
  const fid = id ?? autoId;
  const [inner, setInner] = useState(!!defaultChecked);
  const on = checked ?? inner;

  return (
    <label
      htmlFor={fid}
      className={cx("group flex min-h-11 items-start gap-3 py-2.5", disabled ? "cursor-not-allowed" : "cursor-pointer", className)}
    >
      <input
        id={fid}
        type="checkbox"
        name={name}
        value={value}
        checked={on}
        disabled={disabled}
        onChange={() => {
          if (checked === undefined) setInner(!on);
          onChange?.(!on);
        }}
        className="peer sr-only"
      />
      <span
        className={cx(
          "mt-0.5 flex size-5 flex-none items-center justify-center rounded-sm border-2 transition-colors duration-120",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest",
          disabled ? "border-line" : error ? "border-sunset" : "border-forest",
          on
            ? disabled
              ? "bg-line"
              : "bg-forest"
            : disabled
              ? "bg-cream"
              : "bg-white group-hover:bg-forest-soft",
        )}
      >
        {on ? <Icon name="check" size={14} strokeWidth={3} color={disabled ? "var(--color-ink-muted)" : "var(--color-white)"} /> : null}
      </span>
      {label || description ? (
        <span className="flex flex-col gap-0.5">
          {label ? (
            <span
              className={cx(
                "text-[16px] leading-6",
                disabled || (on && strikeWhenChecked) ? "text-ink-muted" : "text-ink",
                on && strikeWhenChecked && "line-through",
              )}
            >
              {label}
            </span>
          ) : null}
          {description ? <span className="text-small text-ink-muted">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
