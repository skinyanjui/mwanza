import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Government | Mwenza Kenya",
  description: "Procurement-ready cleaning, linen, facilities, grounds, pest management, fleet washing and operational support for public institutions in Kenya.",
};

export default function GovernmentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
