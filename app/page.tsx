"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import AudienceSelector from "./components/audience-selector";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";
import { audienceOptions, marketplaceServices as services, type Audience, type MarketplaceService } from "./data/marketplace-services";

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
          <div className="marketplace-eyebrow"><span/> Trusted help across Nairobi</div>
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
        {services.map(service => <ServiceCard key={service.slug} service={service} audience={audience}/>) }
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
        <img src="/business-support.webp" alt="Mwenza team supporting a large institution"/>
        <div><small>GOVERNMENT & INSTITUTIONS</small><h2>Service built around public duty.</h2><p>Vetted teams, defined service levels and consolidated reporting across facilities.</p><span>Explore institutional services →</span></div>
      </a>
    </section>

    <SiteFooter/>
  </main>;
}

function ServiceCard({ service, audience }: { service: MarketplaceService; audience: Audience }) {
  const isBusiness = audience === "Business";
  const isGovernment = audience === "Government & Institutions";
  const title = isGovernment ? service.governmentTitle : isBusiness ? service.businessTitle : service.residentialTitle;
  const copy = isGovernment ? service.governmentCopy : isBusiness ? service.businessCopy : service.residentialCopy;
  const price = isGovernment ? service.governmentPrice : isBusiness ? service.businessPrice : service.residentialPrice;
  const image = isBusiness || isGovernment ? service.businessImage : service.image;
  const bookingHref = `/book?service=${service.slug}${isGovernment ? "&audience=government" : isBusiness ? "&audience=business" : ""}`;

  return <article className="marketplace-service-card">
    <a className="marketplace-service-image" href={`/services/${service.slug}`} aria-label={`View ${title}`}><img src={image} alt={`${title} from Mwenza`}/></a>
    <div className="marketplace-service-body">
      <h3><a href={`/services/${service.slug}`}>{title}</a></h3>
      <p>{copy}</p>
      <div className="marketplace-service-bottom"><b>{price}</b><a href={bookingHref}>{isBusiness || isGovernment ? "Request" : "Book"}</a></div>
    </div>
  </article>;
}
