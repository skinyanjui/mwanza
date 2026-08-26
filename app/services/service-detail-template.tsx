/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import Link from "next/link";
import MarketplaceServiceCard from "../components/marketplace-service-card";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { serviceData, type Service } from "./service-data";
import { getSegmentPresentation, serviceSegments, type ServiceSegment } from "./service-segments";

function optionHref(bookingHref: string, index: number) {
  return `${bookingHref}${bookingHref.includes("?") ? "&" : "?"}option=${index}`;
}

function HomeListingDetail({ service }: { service: Service }) {
  const presentation = getSegmentPresentation(service, "home");
  const related = serviceData.filter(item => item.slug !== service.slug).slice(0, 3);

  return (
    <main className="detail-page detail-listing" data-segment="home" style={{ "--detail-accent": presentation.accent, "--detail-dark": presentation.dark } as CSSProperties}>
      <SiteHeader shell="home" />

      <section className="listing-photo" aria-label={`${presentation.title} photo`}>
        <img src={presentation.image} alt={`${presentation.title} delivered by Mwenza professionals`} />
      </section>

      <div className="listing-shell">
        <div className="listing-main">
          <nav className="listing-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">·</span>
            <Link href="/#services">Services</Link>
            <span aria-hidden="true">·</span>
            <span>{service.short}</span>
          </nav>

          <header className="listing-title">
            <h1>{presentation.title}</h1>
            <p>{presentation.headline}</p>
            <ul className="listing-meta" aria-label="Service facts">
              <li>Nairobi</li>
              <li>{presentation.scheduling}</li>
              <li>Vetted professionals</li>
            </ul>
          </header>

          <hr className="listing-rule" />

          <section className="listing-about" aria-labelledby="listing-about-heading">
            <h2 id="listing-about-heading">About this service</h2>
            <p>{presentation.description}</p>
            <ul className="listing-highlights">
              {service.included.slice(0, 4).map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <hr className="listing-rule" />

          <section className="listing-options" id="options" aria-labelledby="listing-options-heading">
            <div className="listing-section-head">
              <h2 id="listing-options-heading">Choose an option</h2>
              <p>Pick what fits, then continue into booking. Final scope and price are confirmed before anything is charged.</p>
            </div>
            <div className="listing-option-list" role="list">
              {service.options.map((option, index) => (
                <a key={option.name} className="listing-option" role="listitem" href={optionHref(presentation.bookingHref, index)}>
                  <span className="listing-option-copy">
                    <b>{option.name}</b>
                    <small>{option.description}</small>
                  </span>
                  <span className="listing-option-meta">
                    <strong>{option.price}</strong>
                    <em>{option.duration}</em>
                  </span>
                  <span className="listing-option-go" aria-hidden="true">Book</span>
                </a>
              ))}
            </div>
          </section>

          <hr className="listing-rule" />

          <section className="listing-prep" aria-labelledby="listing-prep-heading">
            <h2 id="listing-prep-heading">What to prepare</h2>
            <ol>
              {service.preparation.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>

          <hr className="listing-rule" />

          <section className="listing-faq" id="faq" aria-labelledby="listing-faq-heading">
            <h2 id="listing-faq-heading">Good to know</h2>
            <div className="listing-faq-list">
              {service.faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <aside className="listing-reserve" aria-label={`Book ${presentation.title}`}>
          <div className="listing-reserve-card">
            <div className="listing-reserve-price">
              <strong>{presentation.price}</strong>
              <span>Scope confirmed first</span>
            </div>
            <p>{presentation.planNote}</p>
            <a className="listing-reserve-primary" href={presentation.bookingHref}>{presentation.actionLabel}</a>
            <a className="listing-reserve-secondary" href="/#services">Browse all services</a>
            <ul className="listing-reserve-points">
              <li>Identity-verified professionals</li>
              <li>Clear arrival window</li>
              <li>Support if plans change</li>
            </ul>
          </div>
        </aside>
      </div>

      <section className="listing-related" aria-labelledby="listing-related-heading">
        <div className="listing-related-head">
          <h2 id="listing-related-heading">More home services</h2>
          <a href="/#services">View all</a>
        </div>
        <div className="listing-related-grid">
          {related.map(item => {
            const itemPresentation = getSegmentPresentation(item, "home");
            return (
              <a key={item.slug} className="listing-related-card" href={`/services/${item.slug}/home`}>
                <img src={itemPresentation.image} alt="" />
                <span>
                  <b>{itemPresentation.title}</b>
                  <small>{itemPresentation.price}</small>
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <SiteFooter />
      <div className="detail-mobile-bar listing-mobile-bar">
        <span>
          <small>From</small>
          <b>{presentation.price}</b>
        </span>
        <a href={presentation.bookingHref}>{presentation.actionLabel}</a>
      </div>
    </main>
  );
}

export default function ServiceDetailTemplate({ service, segment }: { service: Service; segment: ServiceSegment }) {
  if (segment === "home") {
    return <HomeListingDetail service={service} />;
  }

  const current = service;
  const presentation = getSegmentPresentation(current, segment);
  const related = serviceData.filter(item => item.slug !== current.slug).slice(0, 3);
  const capabilityCards = presentation.capabilities.map(name => ({
    name,
    description: segment === "government"
      ? "Define the site scope, service standard and completion record during capability review."
      : "Add this capability to a one-off, recurring or multi-location Mwenza plan.",
    price: presentation.price,
    timing: segment === "government" ? "SLA based" : "Schedule based",
  }));
  const steps = segment === "business" ? [
    ["01", "Share the operation", "Add locations, timing and the capabilities you need."],
    ["02", "Verify the scope", "Mwenza confirms access, staffing and service standards."],
    ["03", "Approve one plan", "Review the schedule, responsibilities and plan pricing."],
    ["04", "Manage every visit", "Track work, issues and billing in one workspace."],
  ] : [
    ["01", "Share the requirement", "Add facilities, timing and procurement needs."],
    ["02", "Validate controls", "Confirm access, workforce and service-level requirements."],
    ["03", "Approve the program", "Review scope, responsibilities, pricing and reporting."],
    ["04", "Monitor delivery", "Track visits, completion records and issue resolution."],
  ];
  const headerShell = segment === "business" ? "business" : "government";

  return <main className="detail-page marketplace-detail" data-segment={segment} style={{ "--detail-accent": presentation.accent, "--detail-dark": presentation.dark } as CSSProperties}>
    <SiteHeader shell={headerShell}/>

    <section className="detail-marketplace-head">
      <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><a href={presentation.returnHref}>{presentation.shortLabel} services</a><span>/</span><b>{current.short}</b>
      </nav>
      <nav className="detail-segment-tabs" aria-label="Choose service segment">
        {serviceSegments.map(item => <a key={item} className={item === segment ? "active" : ""} aria-current={item === segment ? "page" : undefined} href={`/services/${current.slug}/${item}`}>{item === "home" ? "Home" : item === "business" ? "Business" : "Government"}</a>)}
      </nav>
      <div className="detail-title-row">
        <div>
          <small>{presentation.label} · NAIROBI</small>
          <h1>{presentation.title}</h1>
          <p>{presentation.headline}</p>
        </div>
        <div className="detail-trust-row" aria-label="Service assurances">
          <span><b>Vetted</b><small>service professionals</small></span>
          <span><b>Defined</b><small>scope and standards</small></span>
          <span><b>Supported</b><small>through completion</small></span>
        </div>
      </div>

      <div className="detail-marketplace-grid">
        <figure className="detail-marketplace-image">
          <img src={presentation.image} alt={`${presentation.title} delivered by Mwenza professionals`}/>
          <figcaption>{presentation.shortLabel} service · Available across Nairobi</figcaption>
        </figure>
        <aside className="detail-booking-card" aria-label={`Request ${presentation.title}`}>
          <small>SERVICE PRICING</small>
          <div className="detail-booking-price"><strong>{presentation.price}</strong><span>Confirmed after review</span></div>
          <p>{presentation.description}</p>
          <div className="detail-booking-facts">
            <span><small>Coverage</small><b>{presentation.coverage}</b></span>
            <span><small>Delivery</small><b>{presentation.scheduling}</b></span>
          </div>
          <a className="detail-booking-primary" href={presentation.bookingHref}>{presentation.actionLabel}</a>
          <a className="detail-booking-secondary" href={presentation.returnHref}>{presentation.returnLabel}</a>
          <small className="detail-booking-note">{presentation.planNote}</small>
          <div className="detail-booking-standard"><b>The Mwenza standard</b><span>Identity-verified professionals</span><span>Clear arrival and completion records</span><span>Support when plans change</span></div>
        </aside>
      </div>
    </section>

    <section className="detail-options" id="options">
      <header className="detail-section-heading">
        <div><small>{presentation.capabilityLabel}</small><h2>{presentation.capabilityTitle}</h2></div>
        <p>{presentation.capabilityDescription}</p>
      </header>
      <div className="detail-option-grid">
        {capabilityCards.map((option, index) => <article key={option.name}>
          <small>CAPABILITY</small>
          <h3>{option.name}</h3>
          <p>{option.description}</p>
          <div><span><small>Pricing</small><b>{option.price}</b></span><span><small>Timing</small><b>{option.timing}</b></span></div>
          <a href={optionHref(presentation.bookingHref, index)}>Add to request</a>
        </article>)}
      </div>
    </section>

    <section className="detail-standard" id="included">
      <div className="detail-section-heading detail-standard-head">
        <div><small>WHAT TO EXPECT</small><h2>Clear from request to completion.</h2></div>
        <p>Your request keeps the scope, timing and service updates together, so every party knows what happens next.</p>
      </div>
      <div className="detail-standard-grid">
        <div className="detail-included-list"><h3>Included with every Mwenza service</h3>{current.included.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></div>)}</div>
        <div className="detail-prep-card"><small>BEFORE SERVICE BEGINS</small><h3>Prepare the right details once.</h3>{current.preparation.map(item => <p key={item}>{item}</p>)}<a href={presentation.bookingHref}>Start your request</a></div>
      </div>
    </section>

    <section className="detail-steps detail-steps-marketplace">
      <div className="detail-section-heading"><div><small>HOW IT WORKS</small><h2>Four clear steps.</h2></div></div>
      <div>{steps.map(step => <article key={step[0]}><span>{step[0]}</span><h3>{step[1]}</h3><p>{step[2]}</p></article>)}</div>
    </section>

    <section className="detail-faq detail-faq-marketplace" id="faq">
      <div><small>COMMON QUESTIONS</small><h2>Good to know.</h2><p>Start a request and Mwenza will confirm the service details before anything is final.</p></div>
      <div>{current.faqs.map(item => <details key={item[0]}><summary>{item[0]}<span>+</span></summary><p>{item[1]}</p></details>)}</div>
    </section>

    <section className="detail-related">
      <header className="detail-section-heading"><div><small>MORE {presentation.shortLabel.toUpperCase()} SERVICES</small><h2>You may also need.</h2></div><a href={presentation.returnHref}>{presentation.returnLabel}</a></header>
      <div>{related.map(item => {
        const itemPresentation = getSegmentPresentation(item, segment);
        return <MarketplaceServiceCard key={item.slug} title={itemPresentation.title} description={itemPresentation.description} price={itemPresentation.price} image={itemPresentation.image} detailHref={`/services/${item.slug}/${segment}`} actionHref={itemPresentation.bookingHref} actionLabel="Request"/>;
      })}</div>
    </section>

    <section className="detail-next detail-next-marketplace"><small>READY WHEN YOU ARE</small><h2>Let’s get {current.short.toLowerCase()} handled.</h2><p>{presentation.description}</p><div><a href={presentation.bookingHref}>{presentation.actionLabel}</a><a href={presentation.returnHref}>{presentation.returnLabel}</a></div></section>

    <SiteFooter/>
    <div className="detail-mobile-bar"><span><small>Pricing</small><b>{presentation.price}</b></span><a href={presentation.bookingHref}>{presentation.actionLabel}</a></div>
  </main>;
}
