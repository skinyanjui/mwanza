/* eslint-disable @next/next/no-html-link-for-pages */

/** Book-first hero CTA for the dedicated Home shell. */
export default function HeroBooking() {
  return (
    <div className="hero-book-first" role="search" aria-label="Start a home service booking">
      <a className="hero-book-first-action" href="/book">Book a service →</a>
      <p>Nairobi homes · About 3 minutes</p>
    </div>
  );
}
