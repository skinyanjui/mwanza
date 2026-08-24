import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://safi-laundry-kenya.bigafrica.chatgpt.site"),
  title: "Mwenza Kenya | Life’s tasks, handled.",
  description: "Book eight trusted service categories across Nairobi: laundry, cleaning, cooking, fundis, mobile car care, home support, pest control and outdoor care.",
  icons: {
    icon: "/mwenza-mark.png",
    shortcut: "/mwenza-mark.png",
  },
  openGraph: {
    title: "Mwenza Kenya | Your life, handled.",
    description: "Trusted everyday services for homes and businesses across Nairobi.",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Mwenza Kenya — Your life, handled." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mwenza Kenya | Your life, handled.",
    description: "Trusted everyday services for homes and businesses across Nairobi.",
    images: ["/og.jpg"],
  },
  other: { "codex-preview": "development" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#135e43",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
