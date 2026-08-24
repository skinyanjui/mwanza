/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getService, serviceData } from "../service-data";
import SiteHeader from "../../components/site-header";
import SiteFooter from "../../components/site-footer";

export function generateStaticParams() {
  return serviceData.map(service => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  const title = `${service.name} in Nairobi | Mwenza`;
  return {
    title,
    description: service.description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title,
      description: service.description,
      images: [{ url: service.image, alt: `${service.name} from Mwenza Kenya` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: service.description,
      images: [service.image],
    },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const current = service!;
  const related = serviceData.filter(item => item.slug !== current.slug).slice(0, 3);
  const bookingHref = `/book?service=${current.slug}`;
  const businessHref = `/book?service=${current.slug}&audience=business`;

  return <main className="detail-page marketplace-detail" style={{ "--detail-accent": current.accent } as CSSProperties}>
    <SiteHeader/>

    <section className="detail-marketplace-head">
      <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/#services">Services</a><span>/</span><b>{current.short}</b>
      </nav>
      <div className="detail-title-row">
        <div>
          <small>MWENZA {current.short.toUpperCase()} · NAIROBI</small>
          <h1>{current.name}</h1>
          <p>{current.headline}</p>
        </div>
        <div className="detail-trust-row" aria-label="Service assurances">
          <span><b>Vetted</b><small>service professionals</small></span>
          <span><b>Clear</b><small>scope before arrival</small></span>
          <span><b>Supported</b><small>by Mwenza</small></span>
        </div>
      </div>

      <div className="detail-marketplace-grid">
        <figure className="detail-marketplace-image">
          <img src={current.image} alt={`${current.name} professional from Mwenza Kenya`}/>
          <figcaption>Available for homes and businesses across Nairobi</figcaption>
        </figure>
        <aside className="detail-booking-card" aria-label={`Book ${current.name}`}>
          <small>STARTING FROM</small>
          <div className="detail-booking-price"><strong>{current.starting}</strong><span>Scope confirmed first</span></div>
          <p>{current.description}</p>
          <div className="detail-booking-facts">
            <span><small>Service area</small><b>Nairobi</b></span>
            <span><small>Scheduling</small><b>Flexible windows</b></span>
          </div>
          <a className="detail-booking-primary" href={bookingHref}>Check availability</a>
          <a className="detail-booking-secondary" href={businessHref}>Book for a business</a>
          <small className="detail-booking-note">No payment is taken until your scope, professional and final price are confirmed.</small>
          <div className="detail-booking-standard"><b>The Mwenza standard</b><span>Identity-verified professionals</span><span>Arrival and completion updates</span><span>Support if plans change</span></div>
        </aside>
      </div>
    </section>

    <section className="detail-options" id="options">
      <header className="detail-section-heading">
        <div><small>POPULAR OPTIONS</small><h2>Choose the service that fits.</h2></div>
        <p>Starting prices help you compare. We confirm the exact scope and total before the booking is final.</p>
      </header>
      <div className="detail-option-grid">
        {current.options.map((option, index) => <article key={option.name}>
          <span className="detail-option-number">{String(index + 1).padStart(2, "0")}</span>
          <h3>{option.name}</h3>
          <p>{option.description}</p>
          <div><span><small>From</small><b>{option.price.replace("From ", "")}</b></span><span><small>Typical timing</small><b>{option.duration}</b></span></div>
          <a href={`${bookingHref}&option=${index}`}>Choose this option</a>
        </article>)}
      </div>
    </section>

    <section className="detail-audiences detail-audiences-marketplace">
      <div>
        <small>FOR YOUR HOME</small><h2>Help that fits everyday life.</h2>
        <div>{current.residential.map(item => <span key={item}>{item}</span>)}</div>
        <a href={bookingHref}>Book for your home</a>
      </div>
      <div id="business-use">
        <small>FOR YOUR BUSINESS</small><h2>Built around your operation.</h2>
        <div>{current.business.map(item => <span key={item}>{item}</span>)}</div>
        <a href={businessHref}>Request business service</a>
      </div>
    </section>

    <section className="detail-standard" id="included">
      <div className="detail-section-heading detail-standard-head">
        <div><small>WHAT TO EXPECT</small><h2>Clear from request to completion.</h2></div>
        <p>Your booking keeps the scope, timing and service updates together, so everyone knows what happens next.</p>
      </div>
      <div className="detail-standard-grid">
        <div className="detail-included-list"><h3>Included with every booking</h3>{current.included.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></div>)}</div>
        <div className="detail-prep-card"><small>BEFORE YOUR APPOINTMENT</small><h3>A little preparation goes a long way.</h3>{current.preparation.map(item => <p key={item}>{item}</p>)}<a href={bookingHref}>Start your request</a></div>
      </div>
    </section>

    <section className="detail-steps detail-steps-marketplace">
      <div className="detail-section-heading"><div><small>HOW IT WORKS</small><h2>Four simple steps.</h2></div></div>
      <div>{[
        ["01", "Choose your service", "Select an option and describe what you need."],
        ["02", "Set the place and time", "Add the address and a convenient arrival window."],
        ["03", "Confirm every detail", "Review scope, professional and final price first."],
        ["04", "Track completion", "Receive updates and keep your service record together."],
      ].map(step => <article key={step[0]}><span>{step[0]}</span><h3>{step[1]}</h3><p>{step[2]}</p></article>)}</div>
    </section>

    <section className="detail-faq detail-faq-marketplace" id="faq">
      <div><small>COMMON QUESTIONS</small><h2>Good to know.</h2><p>Still deciding? Start a request and Mwenza will confirm the service details before anything is final.</p></div>
      <div>{current.faqs.map(item => <details key={item[0]}><summary>{item[0]}<span>+</span></summary><p>{item[1]}</p></details>)}</div>
    </section>

    <section className="detail-related">
      <header className="detail-section-heading"><div><small>MORE FROM MWENZA</small><h2>You may also need.</h2></div><a href="/#services">View all eight services</a></header>
      <div>{related.map(item => <a key={item.slug} href={`/services/${item.slug}`} className="detail-related-card"><img src={item.image} alt=""/><span><small>{item.short}</small><b>{item.name}</b><em>{item.starting}</em></span></a>)}</div>
    </section>

    <section className="detail-next detail-next-marketplace"><small>READY WHEN YOU ARE</small><h2>Let’s get {current.short.toLowerCase()} handled.</h2><p>Tell us what you need, choose a time and review every detail before you confirm.</p><div><a href={bookingHref}>Book this service</a><a href={businessHref}>Book for a business</a></div></section>

    <SiteFooter/>
    <div className="detail-mobile-bar"><span><small>From</small><b>{current.starting}</b></span><a href={bookingHref}>Check availability</a></div>
  </main>;
}
