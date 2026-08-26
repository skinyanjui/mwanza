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
  return <main className="marketplace-home marketplace-home-listing" data-audience="home">
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

    <section className="home-catalog" id="services">
      <header className="home-catalog-head">
        <h2>Services near you</h2>
        <p>Browse options, or start booking in a few minutes.</p>
      </header>
      <div className="home-catalog-grid">
        {services.map(service => {
          const item = getServicePresentation(service, homeAudience);
          return <MarketplaceServiceCard key={service.slug} variant="listing" title={item.title} description={item.copy} price={item.price} image={item.image} detailHref={`/services/${service.slug}/home`} actionHref={getBookingHref(service.slug, homeAudience)} actionLabel="Book"/>;
        })}
      </div>
    </section>

    <section className="home-how" id="how">
      <h2>How booking works</h2>
      <ol>
        <li><b>Choose a service</b><span>Pick what you need and an option that fits.</span></li>
        <li><b>Add place and time</b><span>Share the address and a convenient window.</span></li>
        <li><b>Confirm and track</b><span>Review details, then follow the visit through.</span></li>
      </ol>
    </section>

    <SiteFooter/>
  </main>;
}
