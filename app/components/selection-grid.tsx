"use client";

export default function SelectionGrid({
  items,
  selected,
  onToggle,
  className,
}: {
  items: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
  className: string;
}) {
  return <div className={className}>{items.map(item => {
    const active = selected.includes(item);
    return <button key={item} type="button" aria-pressed={active} className={active ? "selected" : ""} onClick={() => onToggle(item)}><span>{active ? "✓" : "+"}</span>{item}</button>;
  })}</div>;
}
