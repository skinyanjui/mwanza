import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal center | Mwenza Kenya",
  description: "Mwenza customer, provider, privacy, accessibility, safety and institutional service policies.",
};

export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
