"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import HeroBooking from "./components/hero-booking";
import MarketplaceServiceCard from "./components/marketplace-service-card";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";
import {
  getAudienceKey,
  getBookingHref,
  getServicePresentation,
  marketplaceServices as services,
  type Audience,
  type ServiceSlug,
} from "./data/marketplace-services";
import { AUDIENCE_LABELS } from "./lib/brand";

const catalogHeadlines = {
  home: { title: "Pick the help you need at home.", description: "Every listing below matches the audience chosen in the booking card." },
  business: { title: "Keep every location running.", description: "Request a managed plan, or start with a single business service." },
  government: { title: "Service built around public duty.", description: "Review institutional capabilities, then start a procurement-ready request." },
} as const;

export default function Home() {
  const [audience, setAudience] = useState<Audience>("Residential");
  const [selectedSlug, setSelectedSlug] = useState<ServiceSlug>("laundry");
  const audienceKey = getAudienceKey(audience);
  const audienceLabel = AUDIENCE_LABELS[audienceKey];
  const catalogCopy = catalogHeadlines[audienceKey];

  return <main className="marketplace-home" data-audience={audienceKey}>
    <SiteHeader/>

    <section className="marketplace-home-hero" id="top">
      <div className="marketplace-hero-content">
        <div className="marketplace-hero-copy">
          <div className="marketplace-eyebrow"><span/> Nairobi · Home, business and government</div>
          <h1>Essential services, handled.</h1>
          <p>Choose who it’s for, pick a service, then continue into a clear booking.</p>
        </div>
        <HeroBooking audience={audience} selectedSlug={selectedSlug} onAudienceChange={setAudience} onSelectService={setSelectedSlug}/>
      </div>
    </section>

    <section className="marketplace-assurance" aria-label="Mwenza service promises">
      <span><b>Vetted providers</b><small>Identity and skill checks</small></span>
      <span><b>Clear before you confirm</b><small>Scope, timing and price</small></span>
      <span><b>Support through completion</b><small>Help when plans change</small></span>
    </section>

    <section className="services marketplace-services" id="services">
      <header className="marketplace-section-head">
        <div><small>{audienceLabel.toUpperCase()} SERVICES IN NAIROBI</small><h2>{catalogCopy.title}</h2></div>
        <p>{catalogCopy.description}</p>
      </header>
      <div className="marketplace-service-grid">
        {services.map(service => {
          const item = getServicePresentation(service, audience);
          return <MarketplaceServiceCard key={service.slug} title={item.title} description={item.copy} price={item.price} image={item.image} detailHref={`/services/${service.slug}/${item.key}`} actionHref={getBookingHref(service.slug, audience)} actionLabel={item.key === "home" ? "Book" : "Request"}/>;
        })}
      </div>
    </section>

    <section className="marketplace-how" id="how">
      <header className="marketplace-section-head"><div><small>SIMPLE FROM START TO FINISH</small><h2>Book help without the back-and-forth.</h2></div><p>Keep the scope, timing and updates together from booking to completion.</p></header>
      <div className="marketplace-step-grid">{[
        ["01", "Choose what you need", "Select a service and tell us the basics."],
        ["02", "Pick a place and time", "Choose where and when the work happens."],
        ["03", "Confirm and track", "Review the details and follow progress."],
      ].map(step => <article key={step[0]}><span>{step[0]}</span><h3>{step[1]}</h3><p>{step[2]}</p></article>)}</div>
    </section>

    <section className="marketplace-segments" id="business" aria-label="Managed service plans">
      <a className="marketplace-segment-card business-segment" href="/business">
        <img src="/business-cleaning.webp" alt="Mwenza team supporting a Nairobi workplace"/>
        <div><small>MWENZA FOR BUSINESS</small><h2>Keep every location running.</h2><p>One account for recurring cleaning, linen, maintenance, meals, grounds and fleet care.</p><span>Build a business plan →</span></div>
      </a>
      <a className="marketplace-segment-card government-segment" href="/government">
        <img src="/government-hero.webp" alt="Mwenza team supporting a Kenyan public institution"/>
        <div><small>GOVERNMENT & INSTITUTIONS</small><h2>Service built around public duty.</h2><p>Vetted teams, defined service levels and consolidated reporting across facilities.</p><span>Explore institutional services →</span></div>
      </a>
    </section>

    <SiteFooter/>
  </main>;
}
