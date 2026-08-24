import type { Metadata, Viewport } from "next";
import { FirebaseAuthProvider } from "./components/firebase-auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://safi-laundry-kenya.bigafrica.chatgpt.site"),
  title: "Mwenza Kenya | Life’s tasks, handled.",
  description: "Book and manage trusted services for homes, businesses, government agencies and institutions across Nairobi.",
  icons: {
    icon: "/mwenza-mark.png",
    shortcut: "/mwenza-mark.png",
  },
  openGraph: {
    title: "Mwenza Kenya | Your life, handled.",
    description: "Trusted services for homes, businesses, government agencies and institutions across Nairobi.",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Mwenza Kenya — Your life, handled." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mwenza Kenya | Your life, handled.",
    description: "Trusted services for homes, businesses, government agencies and institutions across Nairobi.",
    images: ["/og.jpg"],
  },
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
      <body className="antialiased"><FirebaseAuthProvider>{children}</FirebaseAuthProvider></body>
    </html>
  );
}
