/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */
export default function SiteFooter() {
  return <footer className="site-footer" id="footer">
    <section className="footer-cta"><div><small>READY WHEN YOU ARE</small><h2>What can we handle for you?</h2><p>Choose a service or build a managed plan.</p></div><div><a href="/book">Book a service →</a><a href="/business">Business</a><a href="/government">Government</a></div></section>
    <div className="footer-main">
      <div className="footer-brand"><a className="brand" href="/"><img src="/mwenza-mark.png" alt=""/>mwenza</a><small>ESSENTIAL SERVICES, HANDLED</small><p>One trusted partner for the work that keeps homes, businesses and public institutions moving.</p><span className="footer-area">Nairobi, Kenya · Expanding soon</span></div>
      <div className="footer-group"><b>Home services</b><a href="/services/laundry">Laundry</a><a href="/services/cleaning">Cleaning</a><a href="/services/cooking">Cooking</a><a href="/services/pest-control">Pest control</a></div>
      <div className="footer-group"><b>More services</b><a href="/services/fundi">Fundi & handyman</a><a href="/services/auto-care">Mobile auto care</a><a href="/services/home-support">Home support</a><a href="/services/outdoor-care">Garden & outdoor care</a></div>
      <div className="footer-group"><b>Managed plans</b><a href="/business">Mwenza for Business</a><a href="/government">Government & institutions</a><a href="/provider">Become a provider</a><a href="/jobs">Explore team jobs</a></div>
      <div className="footer-group"><b>Support & legal</b><a href="/account">Your account</a><a href="/book">Manage a booking</a><a href="/legal">Legal center</a><a href="/legal/privacy">Privacy</a><a href="/legal/terms">Terms</a></div>
    </div>
    <div className="footer-bottom"><span>© 2026 Mwenza Kenya</span><div><a href="/legal/privacy">Privacy</a><a href="/legal/terms">Terms</a><a href="/legal/accessibility">Accessibility</a></div><span>Built for everyday life in Kenya.</span></div>
  </footer>;
}
