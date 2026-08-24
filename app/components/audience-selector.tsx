"use client";

export type AudienceOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

export default function AudienceSelector<T extends string>({
  value,
  options,
  onChange,
  className,
  ariaLabel = "Choose customer type",
}: {
  value: T;
  options: AudienceOption<T>[];
  onChange: (value: T) => void;
  className: string;
  ariaLabel?: string;
}) {
  return <div className={className} aria-label={ariaLabel}>
    {options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} className={value === option.value ? "selected" : ""} onClick={() => onChange(option.value)}><b>{option.label}</b>{option.description && <small>{option.description}</small>}</button>)}
  </div>;
}
