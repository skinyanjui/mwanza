"use client";

import AudienceSelector from "./audience-selector";
import ServiceIcon from "./service-icon";
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

    <div className="hero-booking-what">
      <small>What do you need?</small>
      <div className="hero-booking-services" role="radiogroup" aria-label="Choose a service">
        {marketplaceServices.map(service => {
          const isSelected = service.slug === selected.slug;
          return <button key={service.slug} type="button" role="radio" aria-checked={isSelected} className={isSelected ? "selected" : ""} onClick={() => onSelectService(service.slug)}>
            <ServiceIcon slug={service.slug}/>
            <span>{service.short}</span>
          </button>;
        })}
      </div>
    </div>

    <div className="hero-booking-bar">
      <div className="hero-booking-pick">
        <small>{audienceLabel} service</small>
        <b>{presentation.title}</b>
        <span>{presentation.price}</span>
      </div>
      <div className="hero-booking-where">
        <small>Where</small>
        <b>Nairobi</b>
        <span>Current service area</span>
      </div>
      <a className="hero-booking-action" href={bookingHref}>{actionLabel} →</a>
    </div>
  </div>;
}
