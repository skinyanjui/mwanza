"use client";

import type { ReactNode } from "react";
import SelectionGrid from "./selection-grid";

export function QuickRequestPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`quick-request-panel ${className}`.trim()}>{children}</div>;
}

export function QuickRequestHeader({ title = "Choose all that apply" }: { title?: string }) {
  return <header className="quick-request-header"><span>QUICK REQUEST</span><b>{title}</b></header>;
}

export function QuickRequestServices({ items, selected, onToggle }: { items: readonly string[]; selected: string[]; onToggle: (item: string) => void }) {
  return <SelectionGrid items={items} selected={selected} onToggle={onToggle} className="quick-request-services"/>;
}

export function QuickRequestField({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`quick-request-field ${className}`.trim()}><span>{label}</span>{children}</label>;
}

export function QuickRequestRow({ children }: { children: ReactNode }) {
  return <div className="quick-request-row">{children}</div>;
}

export function QuickRequestChoices({ items, value, onChange }: { items: readonly string[]; value: string; onChange: (value: string) => void }) {
  return <div className="quick-request-choices">{items.map(item => <button key={item} type="button" aria-pressed={value === item} className={value === item ? "selected" : ""} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

export function QuickRequestSubmit({ ready, submitting, label, readyNote, incompleteNote, error, onSubmit }: { ready: boolean; submitting: boolean; label: string; readyNote: string; incompleteNote: string; error?: string; onSubmit: () => void }) {
  return <><button className="quick-request-submit" disabled={!ready} onClick={onSubmit}>{submitting ? "Sending request…" : label}<span>→</span></button><small className="quick-request-note" aria-live="polite">{ready ? readyNote : incompleteNote}</small>{error && <small className="quick-request-error" role="alert">{error}</small>}</>;
}

export function QuickRequestSuccess({ eyebrow = "REQUEST RECEIVED", title, description, onReset }: { eyebrow?: string; title: string; description: string; onReset: () => void }) {
  return <div className="quick-request-success"><span>✓</span><small>{eyebrow}</small><h3>{title}</h3><p>{description}</p><button onClick={onReset}>Start another request</button></div>;
}

