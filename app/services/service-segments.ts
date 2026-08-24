import { marketplaceServices } from "../data/marketplace-services";
import type { Service } from "./service-data";

export const serviceSegments = ["home", "business", "government"] as const;
export type ServiceSegment = (typeof serviceSegments)[number];

export function isServiceSegment(value: string): value is ServiceSegment {
  return serviceSegments.includes(value as ServiceSegment);
}

export function getSegmentPresentation(service: Service, segment: ServiceSegment) {
  const listing = marketplaceServices.find(item => item.slug === service.slug);
  if (!listing) throw new Error(`Missing marketplace listing for ${service.slug}`);

  if (segment === "business") return {
    label: "MWENZA FOR BUSINESS",
    shortLabel: "Business",
    title: listing.businessTitle,
    headline: `${listing.businessTitle}, coordinated around your operation.`,
    description: listing.businessCopy,
    image: service.businessImage,
    price: listing.businessPrice,
    capabilities: service.business,
    accent: "#f3e9dd",
    dark: "#4d3020",
    bookingHref: `/book?service=${service.slug}&audience=business`,
    actionLabel: "Request business service",
    returnHref: "/business#services",
    returnLabel: "All business services",
    coverage: "One or many sites",
    scheduling: "On demand or recurring",
    capabilityLabel: "BUSINESS CAPABILITIES",
    capabilityTitle: "Built around your operation.",
    capabilityDescription: "Choose the work you need now, then add locations, frequency and service standards during the request.",
    planNote: "Scope and plan pricing are confirmed before activation.",
  } as const;

  if (segment === "government") return {
    label: "GOVERNMENT & INSTITUTIONS",
    shortLabel: "Government",
    title: listing.governmentTitle,
    headline: `${listing.governmentTitle} with clear standards and reporting.`,
    description: listing.governmentCopy,
    image: service.governmentImage,
    price: listing.governmentPrice,
    capabilities: service.government,
    accent: "#e4eef1",
    dark: "#143b47",
    bookingHref: `/book?service=${service.slug}&audience=government`,
    actionLabel: "Request institutional service",
    returnHref: "/government#public-services",
    returnLabel: "All institutional services",
    coverage: "Single or multi-site",
    scheduling: "SLA-led delivery",
    capabilityLabel: "INSTITUTIONAL CAPABILITIES",
    capabilityTitle: "Structured for public facilities.",
    capabilityDescription: "Review the eligible scope, then add sites, procurement needs and required reporting during the request.",
    planNote: "Capability, controls and procurement requirements are reviewed before activation.",
  } as const;

  return {
    label: "MWENZA FOR HOME",
    shortLabel: "Home",
    title: listing.residentialTitle,
    headline: service.headline,
    description: listing.residentialCopy,
    image: service.image,
    price: listing.residentialPrice,
    capabilities: service.residential,
    accent: service.accent,
    dark: "#11291e",
    bookingHref: `/book?service=${service.slug}`,
    actionLabel: "Book this service",
    returnHref: "/#services",
    returnLabel: "All home services",
    coverage: "Across Nairobi",
    scheduling: "Flexible windows",
    capabilityLabel: "HOME SERVICE OPTIONS",
    capabilityTitle: "Choose what fits your home.",
    capabilityDescription: "Select the closest option, then confirm the exact scope, timing and final price before the booking is final.",
    planNote: "No payment is taken until the scope, professional and final price are confirmed.",
  } as const;
}

