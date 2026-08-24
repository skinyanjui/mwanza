"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import AudienceSelector from "./components/audience-selector";
import MarketplaceServiceCard from "./components/marketplace-service-card";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";
import { audienceOptions, marketplaceServices as services, type Audience } from "./data/marketplace-services";

export default function Home() {
  const [audience, setAudience] = useState<Audience>("Residential");
  const [selectedSlug, setSelectedSlug] = useState<(typeof services)[number]["slug"]>("laundry");
  const selected = useMemo(() => services.find(service => service.slug === selectedSlug) ?? services[0], [selectedSlug]);
  const audienceQuery = audience === "Business" ? "business" : audience === "Government & Institutions" ? "government" : "";
  const bookingHref = `/book?service=${selected.slug}${audienceQuery ? `&audience=${audienceQuery}` : ""}`;

  return <main className="marketplace-home" data-audience={audienceQuery || "home"}>
    <SiteHeader/>

    <section className="marketplace-home-hero" id="top">
      <div className="marketplace-hero-content">
        <div className="marketplace-hero-copy">
          <div className="marketplace-eyebrow"><span/> Nairobi · Home, business and government</div>
          <h1>Essential services, handled.</h1>
          <p>Trusted support for homes, workplaces and public institutions—booked and managed in one place.</p>
        </div>

        <div className="marketplace-search-card" aria-label="Start a service booking">
          <AudienceSelector value={audience} options={audienceOptions} onChange={setAudience} className="marketplace-audience-tabs" ariaLabel="Choose who the service is for"/>
          <div className="marketplace-search-row marketplace-search-simple">
            <label><small>What do you need?</small><select aria-label="Choose service" value={selectedSlug} onChange={event => setSelectedSlug(event.target.value as typeof selectedSlug)}>{services.map(service => <option key={service.slug} value={service.slug}>{service.short}</option>)}</select></label>
            <a className="marketplace-search-action" href={bookingHref}>Continue →</a>
          </div>
        </div>
      </div>
    </section>

    <section className="marketplace-assurance" aria-label="Mwenza service promises">
      <span><b>Vetted providers</b><small>Identity and skill checks</small></span>
      <span><b>Clear before you confirm</b><small>Scope, timing and price</small></span>
      <span><b>Support through completion</b><small>Help when plans change</small></span>
    </section>

    <section className="services marketplace-services" id="services">
      <AudienceSelector value={audience} options={audienceOptions} onChange={setAudience} className="audience-toggle marketplace-toggle"/>
      <div className="marketplace-service-grid">
        {services.map(service => {
          const isBusiness = audience === "Business";
          const isGovernment = audience === "Government & Institutions";
          const segment = isGovernment ? "government" : isBusiness ? "business" : "home";
          const title = isGovernment ? service.governmentTitle : isBusiness ? service.businessTitle : service.residentialTitle;
          const copy = isGovernment ? service.governmentCopy : isBusiness ? service.businessCopy : service.residentialCopy;
          const price = isGovernment ? service.governmentPrice : isBusiness ? service.businessPrice : service.residentialPrice;
          const image = isGovernment ? service.governmentImage : isBusiness ? service.businessImage : service.image;
          return <MarketplaceServiceCard key={service.slug} title={title} description={copy} price={price} image={image} detailHref={`/services/${service.slug}/${segment}`} actionHref={`/book?service=${service.slug}${isGovernment ? "&audience=government" : isBusiness ? "&audience=business" : ""}`} actionLabel={isBusiness || isGovernment ? "Request" : "Book"}/>;
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
