/* eslint-disable @next/next/no-html-link-for-pages */
import BrandMark from "./brand-mark";
import { BRAND_TAGLINE } from "../lib/brand";

export default function SiteFooter() {
  return <footer className="site-footer" id="footer">
    <section className="footer-cta"><div><small>READY WHEN YOU ARE</small><h2>What can we handle for you?</h2><p>Book a home service in a few minutes.</p></div><div><a href="/book">Book a service →</a><a href="/#services">Browse services</a></div></section>
    <div className="footer-main">
      <div className="footer-brand"><BrandMark/><small>{BRAND_TAGLINE.toUpperCase()}</small><p>Trusted help for Kenyan homes — laundry, cleaning, cooking, repairs and more.</p><span className="footer-area">Nairobi, Kenya · Expanding soon</span></div>
      <div className="footer-group"><b>Home services</b><a href="/services/laundry/home">Laundry</a><a href="/services/cleaning/home">Cleaning</a><a href="/services/cooking/home">Cooking</a><a href="/services/pest-control/home">Pest control</a></div>
      <div className="footer-group"><b>More services</b><a href="/services/fundi/home">Fundi & handyman</a><a href="/services/auto-care/home">Mobile auto care</a><a href="/services/home-support/home">Home support</a><a href="/services/outdoor-care/home">Garden & outdoor care</a></div>
      <div className="footer-group"><b>Also from Mwenza</b><a href="/business">Business plans</a><a href="/government">Government & institutions</a><a href="/provider">Become a provider</a><a href="/franchise">Own a territory</a></div>
      <div className="footer-group"><b>Support & legal</b><a href="/account">Your account</a><a href="/book">Book a service</a><a href="/jobs">Explore team jobs</a><a href="/legal">Legal center</a></div>
    </div>
    <div className="footer-bottom"><span>© 2026 Mwenza Kenya</span><div><a href="/legal/privacy">Privacy</a><a href="/legal/terms">Terms</a><a href="/legal/accessibility">Accessibility</a></div><span>Built for everyday life in Kenya.</span></div>
  </footer>;
}
