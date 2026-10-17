"use client";

import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { FieldHelp, FieldLabel, fieldBoxClasses } from "./Field";
import { Icon } from "./Icon";

type Option = string | { value: string; label: string; disabled?: boolean };

type SelectProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  options: Option[];
  placeholder?: string;
  className?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">;

export function Select({ label, hint, error, optional, options, placeholder, className, id, disabled, value, defaultValue, ...rest }: SelectProps) {
  const autoId = useId();
  const fid = id ?? autoId;
  const helpId = `${fid}-help`;
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const empty = value !== undefined ? value === "" || value == null : defaultValue == null || defaultValue === "";

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label ? (
        <FieldLabel htmlFor={fid} optional={optional}>
          {label}
        </FieldLabel>
      ) : null}
      <div className={cx("relative", fieldBoxClasses({ error: !!error, disabled }))}>
        <select
          {...rest}
          id={fid}
          value={value}
          defaultValue={value !== undefined ? undefined : (defaultValue ?? "")}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? helpId : undefined}
          className={cx(
            "h-12 w-full appearance-none border-0 bg-transparent pr-11 pl-3.5 font-body text-[16px] outline-none",
            disabled ? "cursor-not-allowed text-ink-muted" : "cursor-pointer",
            !disabled && (empty && placeholder ? "text-ink-muted" : "text-ink"),
          )}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {opts.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={20}
          color={disabled ? "var(--color-ink-muted)" : "var(--color-forest)"}
          className="pointer-events-none absolute top-3.5 right-3.5"
        />
      </div>
      <FieldHelp id={helpId} error={error} hint={hint} />
    </div>
  );
}
