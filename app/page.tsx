"use client";
/* eslint-disable @next/next/no-img-element */

import HeroBooking from "./components/hero-booking";
import MarketplaceServiceCard from "./components/marketplace-service-card";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";
import {
  getBookingHref,
  getServicePresentation,
  marketplaceServices as services,
} from "./data/marketplace-services";

const homeAudience = "Residential" as const;

export default function Home() {
  return <main className="marketplace-home" data-audience="home">
    <SiteHeader shell="home"/>

    <section className="marketplace-home-hero marketplace-home-hero-book-first" id="top">
      <div className="marketplace-hero-content marketplace-hero-content-book-first">
        <div className="marketplace-hero-copy">
          <div className="marketplace-eyebrow"><span/> Nairobi · Home services</div>
          <h1>Essential services, handled.</h1>
          <p>Laundry, cleaning, cooking and more — booked for your home in minutes.</p>
          <HeroBooking/>
        </div>
      </div>
    </section>

    <section className="marketplace-assurance" aria-label="Mwenza service promises">
      <span><b>Vetted providers</b><small>Identity and skill checks</small></span>
      <span><b>Clear before you confirm</b><small>Scope, timing and price</small></span>
      <span><b>Support through completion</b><small>Help when plans change</small></span>
    </section>

    <section className="services marketplace-services" id="services">
      <header className="marketplace-section-head">
        <div><small>HOME SERVICES IN NAIROBI</small><h2>Pick the help you need at home.</h2></div>
        <p>Choose a service to see options, or go straight to book.</p>
      </header>
      <div className="marketplace-service-grid">
        {services.map(service => {
          const item = getServicePresentation(service, homeAudience);
          return <MarketplaceServiceCard key={service.slug} title={item.title} description={item.copy} price={item.price} image={item.image} detailHref={`/services/${service.slug}/home`} actionHref={getBookingHref(service.slug, homeAudience)} actionLabel="Book"/>;
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

    <SiteFooter/>
  </main>;
}
