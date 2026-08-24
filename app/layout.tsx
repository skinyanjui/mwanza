import type { Metadata, Viewport } from "next";
import { FirebaseAuthProvider } from "./components/firebase-auth-provider";
import { BRAND_DESCRIPTION, BRAND_OG_DESCRIPTION, BRAND_TAGLINE, BRAND_TITLE } from "./lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://safi-laundry-kenya.bigafrica.chatgpt.site"),
  title: BRAND_TITLE,
  description: BRAND_DESCRIPTION,
  icons: {
    icon: "/mwenza-mark.png",
    shortcut: "/mwenza-mark.png",
  },
  openGraph: {
    title: BRAND_TITLE,
    description: BRAND_OG_DESCRIPTION,
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: `Mwenza Kenya — ${BRAND_TAGLINE}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_TITLE,
    description: BRAND_OG_DESCRIPTION,
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
      <body className="antialiased">
        <a className="skip-link" href="#content">Skip to content</a>
        <FirebaseAuthProvider>
          <div id="content" tabIndex={-1}>{children}</div>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
