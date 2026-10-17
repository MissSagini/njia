"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { FieldHelp, FieldLabel, fieldBoxClasses } from "./Field";
import { Icon, type IconName } from "./Icon";

type Shared = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  /** Text shown before the value, like "+254". */
  prefix?: string;
  iconLeft?: IconName;
  className?: string;
};

type TextInputProps =
  | (Shared & { multiline?: false } & Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "className">)
  | (Shared & { multiline: true } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "prefix" | "className">);

export function TextInput(props: TextInputProps) {
  const { label, hint, error, optional, prefix, iconLeft, className, multiline, ...fieldProps } = props;
  const { id, disabled } = fieldProps;
  const autoId = useId();
  const fid = id ?? autoId;
  const helpId = `${fid}-help`;

  const fieldClasses = cx(
    "min-w-0 flex-1 border-0 bg-transparent font-body text-[16px] leading-6 outline-none",
    disabled ? "text-ink-muted" : "text-ink",
  );
  const aria = {
    id: fid,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error || hint ? helpId : undefined,
  };

  const field = multiline ? (
    <textarea
      rows={4}
      {...(fieldProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      {...aria}
      className={cx(fieldClasses, "resize-y")}
    />
  ) : (
    <input type="text" {...(fieldProps as InputHTMLAttributes<HTMLInputElement>)} {...aria} className={cx(fieldClasses, "py-3")} />
  );

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label ? (
        <FieldLabel htmlFor={fid} optional={optional}>
          {label}
        </FieldLabel>
      ) : null}
      <div
        className={cx(
          "flex min-h-12 gap-2.5 px-3.5",
          multiline ? "items-stretch py-3" : "items-center",
          fieldBoxClasses({ error: !!error, disabled }),
        )}
      >
        {iconLeft ? <Icon name={iconLeft} size={18} color="var(--color-ink-muted)" /> : null}
        {prefix ? <span className="border-r border-line pr-2.5 text-[16px] text-ink-muted">{prefix}</span> : null}
        {field}
      </div>
      <FieldHelp id={helpId} error={error} hint={hint} />
    </div>
  );
}
