"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";

type Audience = "Residential" | "Business";

const services = [
  {
    slug: "laundry",
    short: "Laundry",
    image: "/service-laundry.webp",
    businessImage: "/business-linen.webp",
    residentialTitle: "Laundry and garment care",
    residentialCopy: "Doorstep washing, ironing, dry cleaning and bedding care.",
    residentialPrice: "From KSh 180 / kg",
    businessTitle: "Linen and uniform service",
    businessCopy: "Scheduled linen, towels, uniforms and workwear collection.",
    businessPrice: "Volume pricing available",
  },
  {
    slug: "cleaning",
    short: "Cleaning",
    image: "/service-cleaning.webp",
    businessImage: "/business-cleaning.webp",
    residentialTitle: "Home cleaning",
    residentialCopy: "Standard, deep and move-out cleaning for every kind of home.",
    residentialPrice: "From KSh 1,800",
    businessTitle: "Commercial cleaning",
    businessCopy: "Recurring office, retail, common-area and turnover cleaning.",
    businessPrice: "Plans for one or many sites",
  },
  {
    slug: "cooking",
    short: "Cooking",
    image: "/service-cooking.webp",
    businessImage: "/business-cooking.webp",
    residentialTitle: "Cooking and meal prep",
    residentialCopy: "Family meals, weekly meal prep and private cook visits.",
    residentialPrice: "From KSh 2,000",
    businessTitle: "Workplace meals",
    businessCopy: "Staff meals, meeting menus and scheduled meal preparation.",
    businessPrice: "Tailored menu plans",
  },
  {
    slug: "fundi",
    short: "Fundi",
    image: "/service-fundi.webp",
    businessImage: "/business-fundi.webp",
    residentialTitle: "Fundi and handyman",
    residentialCopy: "Plumbing, electrical, carpentry, mounting and everyday fixes.",
    residentialPrice: "From KSh 1,000",
    businessTitle: "Facility maintenance",
    businessCopy: "Planned fundi visits for routine facility maintenance.",
    businessPrice: "Scheduled maintenance plans",
  },
  {
    slug: "auto-care",
    short: "Auto care",
    image: "/service-auto.webp",
    businessImage: "/business-fleet.webp",
    residentialTitle: "Mobile wash and detailing",
    residentialCopy: "Mobile washing, interior cleaning and detailing at your location.",
    residentialPrice: "From KSh 1,000",
    businessTitle: "Fleet wash and detailing",
    businessCopy: "On-site washing and detailing for company and dealership fleets.",
    businessPrice: "From KSh 900 / vehicle",
  },
  {
    slug: "home-support",
    short: "Home support",
    image: "/service-support.webp",
    businessImage: "/business-support.webp",
    residentialTitle: "Home and everyday support",
    residentialCopy: "Errands, home organization, shopping and event support.",
    residentialPrice: "From KSh 800",
    businessTitle: "Property and office support",
    businessCopy: "Restocking, errands, property turnovers and event setup.",
    businessPrice: "Flexible support plans",
  },
  {
    slug: "pest-control",
    short: "Pest control",
    image: "/service-pest.webp",
    businessImage: "/business-pest.webp",
    residentialTitle: "Home pest control",
    residentialCopy: "Targeted treatment and prevention for common household pests.",
    residentialPrice: "From KSh 1,500",
    businessTitle: "Commercial pest management",
    businessCopy: "Scheduled prevention for offices, hospitality and shared spaces.",
    businessPrice: "Site plans available",
  },
  {
    slug: "outdoor-care",
    short: "Outdoor care",
    image: "/service-outdoor.webp",
    businessImage: "/business-grounds.webp",
    residentialTitle: "Garden and outdoor care",
    residentialCopy: "Garden tidying, lawn care, pruning and outdoor cleanup.",
    residentialPrice: "From KSh 1,200",
    businessTitle: "Grounds and outdoor care",
    businessCopy: "Routine landscape upkeep for properties and workplaces.",
    businessPrice: "Recurring plans available",
  },
] as const;

export default function Home() {
  const [audience, setAudience] = useState<Audience>("Residential");
  const [selectedSlug, setSelectedSlug] = useState<(typeof services)[number]["slug"]>("laundry");
  const selected = useMemo(() => services.find(service => service.slug === selectedSlug) ?? services[0], [selectedSlug]);
  const bookingHref = `/book?service=${selected.slug}${audience === "Business" ? "&audience=business" : ""}`;

  return <main className="marketplace-home">
    <SiteHeader/>

    <section className="marketplace-home-hero" id="top">
      <div className="marketplace-hero-content">
        <div className="marketplace-hero-copy">
          <div className="marketplace-eyebrow"><span/> Trusted help across Nairobi</div>
          <h1>Get the right help, without the hassle.</h1>
          <p>Laundry, cleaning, cooking, fundis, car care, pest control and outdoor support—booked in one place.</p>
        </div>

        <div className="marketplace-search-card" aria-label="Start a service booking">
          <div className="marketplace-audience-tabs" aria-label="Choose who the service is for">
            {(["Residential", "Business"] as Audience[]).map(value => <button key={value} aria-pressed={audience === value} className={audience === value ? "selected" : ""} onClick={() => setAudience(value)}>{value === "Residential" ? "For my home" : "For my business"}</button>)}
          </div>
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
      <div className="audience-toggle marketplace-toggle" aria-label="Choose customer type"><button aria-pressed={audience === "Residential"} className={audience === "Residential" ? "selected" : ""} onClick={() => setAudience("Residential")}>Residential</button><button aria-pressed={audience === "Business"} className={audience === "Business" ? "selected" : ""} onClick={() => setAudience("Business")}>Business</button></div>
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

    <section className="marketplace-business" id="business">
      <div className="marketplace-business-image"><img src="/business-cleaning.webp" alt="Mwenza professional providing workplace cleaning"/><div><small>MANAGED SERVICE</small><b>Every location, visible in one place.</b></div></div>
      <div className="marketplace-business-copy"><small>MWENZA FOR BUSINESS</small><h2>Every task. One accountable partner.</h2><p>Cleaning, linen, meals, maintenance, pest prevention, grounds care and fleet washing—managed through one relationship.</p><a href="/business">Explore Mwenza for Business</a></div>
    </section>

    <SiteFooter/>
  </main>;
}

function ServiceCard({ service, audience }: { service: (typeof services)[number]; audience: Audience }) {
  const isBusiness = audience === "Business";
  const title = isBusiness ? service.businessTitle : service.residentialTitle;
  const copy = isBusiness ? service.businessCopy : service.residentialCopy;
  const price = isBusiness ? service.businessPrice : service.residentialPrice;
  const image = isBusiness ? service.businessImage : service.image;
  const bookingHref = `/book?service=${service.slug}${isBusiness ? "&audience=business" : ""}`;

  return <article className="marketplace-service-card">
    <a className="marketplace-service-image" href={`/services/${service.slug}`} aria-label={`View ${title}`}><img src={image} alt={`${title} from Mwenza`}/></a>
    <div className="marketplace-service-body">
      <h3><a href={`/services/${service.slug}`}>{title}</a></h3>
      <p>{copy}</p>
      <div className="marketplace-service-bottom"><b>{price}</b><a href={bookingHref}>{isBusiness ? "Request" : "Book"}</a></div>
    </div>
  </article>;
}
