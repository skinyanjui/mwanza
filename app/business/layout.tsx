import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mwenza for Business | Everyday operations, handled.",
  description: "Commercial cleaning, linen, workplace meals, facility maintenance, fleet washing and operational support for businesses across Nairobi.",
};

export default function BusinessLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
