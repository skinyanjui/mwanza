"use client";
/* eslint-disable @next/next/no-img-element */

import AudienceSelector from "./audience-selector";
import {
  audienceOptions,
  getAudienceKey,
  getBookingActionLabel,
  getBookingHref,
  getServicePresentation,
  marketplaceServices,
  type Audience,
  type ServiceSlug,
} from "../data/marketplace-services";
import { AUDIENCE_LABELS } from "../lib/brand";

export default function HeroBooking({
  audience,
  selectedSlug,
  onAudienceChange,
  onSelectService,
}: {
  audience: Audience;
  selectedSlug: ServiceSlug;
  onAudienceChange: (audience: Audience) => void;
  onSelectService: (slug: ServiceSlug) => void;
}) {
  const selected = marketplaceServices.find(service => service.slug === selectedSlug) ?? marketplaceServices[0];
  const presentation = getServicePresentation(selected, audience);
  const audienceKey = getAudienceKey(audience);
  const audienceLabel = AUDIENCE_LABELS[audienceKey];
  const actionLabel = getBookingActionLabel(selected.short, audience);
  const bookingHref = getBookingHref(selected.slug, audience);

  return <div className="hero-booking" role="search" aria-label="Start a service booking">
    <AudienceSelector value={audience} options={audienceOptions} onChange={onAudienceChange} className="hero-booking-audience" ariaLabel="Choose who the service is for"/>

    <div className="hero-booking-bar">
      <div className="hero-booking-pick">
        <small>What</small>
        <b>{presentation.title}</b>
        <span>{presentation.price}</span>
      </div>
      <div className="hero-booking-where">
        <small>Where</small>
        <b>Nairobi</b>
        <span>Current service area</span>
      </div>
      <a className="hero-booking-action" href={bookingHref}>
        <strong>{actionLabel}</strong>
        <small>{audienceLabel} · {presentation.price}</small>
      </a>
    </div>

    <div className="hero-booking-what">
      <small>Browse {audienceLabel.toLowerCase()} services</small>
      <div className="hero-booking-services" role="radiogroup" aria-label="Choose a service">
        {marketplaceServices.map(service => {
          const item = getServicePresentation(service, audience);
          const isSelected = service.slug === selected.slug;
          return <button key={service.slug} type="button" role="radio" aria-checked={isSelected} className={isSelected ? "selected" : ""} onClick={() => onSelectService(service.slug)}>
            <img src={item.image} alt=""/>
            <span>{service.short}</span>
          </button>;
        })}
      </div>
    </div>
  </div>;
}
