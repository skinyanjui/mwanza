/* eslint-disable @next/next/no-html-link-for-pages */
import BrandMark from "./brand-mark";
import { BRAND_TAGLINE } from "../lib/brand";

type Shell = "home" | "business" | "government";

const footerByShell = {
  home: {
    eyebrow: "READY WHEN YOU ARE",
    title: "What can we handle for you?",
    description: "Book a home service in a few minutes.",
    primaryHref: "/book",
    primaryLabel: "Book a service →",
    secondaryHref: "/#services",
    secondaryLabel: "Browse services",
    brandCopy: "Trusted help for Kenyan homes — laundry, cleaning, cooking, repairs and more.",
    bookHref: "/book",
    bookLabel: "Book a service",
  },
  business: {
    eyebrow: "READY FOR YOUR WORKPLACES",
    title: "Build a managed service plan.",
    description: "Request coverage for locations, teams and recurring operations.",
    primaryHref: "/book?audience=business",
    primaryLabel: "Request a plan →",
    secondaryHref: "/business#services",
    secondaryLabel: "Browse business services",
    brandCopy: "Managed facility services for Kenyan workplaces — one partner across locations.",
    bookHref: "/book?audience=business",
    bookLabel: "Request a plan",
  },
  government: {
    eyebrow: "READY FOR YOUR FACILITIES",
    title: "Start an institutional request.",
    description: "Share requirements for facilities, schedules and service standards.",
    primaryHref: "/book?audience=government",
    primaryLabel: "Request service →",
    secondaryHref: "/government#public-services",
    secondaryLabel: "Browse institutional services",
    brandCopy: "Procurement-ready facility services for government and public institutions.",
    bookHref: "/book?audience=government",
    bookLabel: "Request service",
  },
} as const;

export default function SiteFooter({ shell = "home" }: { shell?: Shell }) {
  const copy = footerByShell[shell];

  return <footer className="site-footer" id="footer" data-shell={shell}>
    <section className="footer-cta"><div><small>{copy.eyebrow}</small><h2>{copy.title}</h2><p>{copy.description}</p></div><div><a href={copy.primaryHref}>{copy.primaryLabel}</a><a href={copy.secondaryHref}>{copy.secondaryLabel}</a></div></section>
    <div className="footer-main">
      <div className="footer-brand"><BrandMark/><small>{BRAND_TAGLINE.toUpperCase()}</small><p>{copy.brandCopy}</p><span className="footer-area">Nairobi, Kenya · Expanding soon</span></div>
      <div className="footer-group"><b>Home services</b><a href="/services/laundry/home">Laundry</a><a href="/services/cleaning/home">Cleaning</a><a href="/services/cooking/home">Cooking</a><a href="/services/pest-control/home">Pest control</a></div>
      <div className="footer-group"><b>More services</b><a href="/services/fundi/home">Fundi & handyman</a><a href="/services/auto-care/home">Mobile auto care</a><a href="/services/home-support/home">Home support</a><a href="/services/outdoor-care/home">Garden & outdoor care</a></div>
      <div className="footer-group"><b>Also from Mwenza</b><a href="/business">Business plans</a><a href="/government">Government & institutions</a><a href="/provider">Become a provider</a><a href="/franchise">Own a territory</a></div>
      <div className="footer-group"><b>Support & legal</b><a href="/account">Your account</a><a href={copy.bookHref}>{copy.bookLabel}</a><a href="/jobs">Explore team jobs</a><a href="/legal">Legal center</a></div>
    </div>
    <div className="footer-bottom"><span>© 2026 Mwenza Kenya</span><div><a href="/legal/privacy">Privacy</a><a href="/legal/terms">Terms</a><a href="/legal/accessibility">Accessibility</a></div><span>Built for everyday life in Kenya.</span></div>
  </footer>;
}
