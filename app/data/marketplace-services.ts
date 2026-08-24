export type Audience = "Residential" | "Business" | "Government & Institutions";

export const audienceOptions = [
  { value: "Residential", label: "Home" },
  { value: "Business", label: "Business" },
  { value: "Government & Institutions", label: "Government" },
] satisfies { value: Audience; label: string }[];

export const marketplaceServices = [
  { slug: "laundry", short: "Laundry", image: "/service-laundry.webp", businessImage: "/business-linen.webp", governmentImage: "/government-linen.webp", residentialTitle: "Laundry and garment care", residentialCopy: "Doorstep washing, ironing, dry cleaning and bedding care.", residentialPrice: "From KSh 180 / kg", businessTitle: "Linen and uniform service", businessCopy: "Scheduled linen, towels, uniforms and workwear collection.", businessPrice: "Volume pricing available", governmentTitle: "Institutional linen programs", governmentCopy: "Managed linen, uniforms and bedding for hospitals, schools and facilities.", governmentPrice: "Procurement pricing available" },
  { slug: "cleaning", short: "Cleaning", image: "/service-cleaning.webp", businessImage: "/business-cleaning.webp", governmentImage: "/government-cleaning.webp", residentialTitle: "Home cleaning", residentialCopy: "Standard, deep and move-out cleaning for every kind of home.", residentialPrice: "From KSh 1,800", businessTitle: "Commercial cleaning", businessCopy: "Recurring office, retail, common-area and turnover cleaning.", businessPrice: "Plans for one or many sites", governmentTitle: "Public facility cleaning", governmentCopy: "Scheduled cleaning for offices, schools, clinics and public spaces.", governmentPrice: "SLA-based plans available" },
  { slug: "cooking", short: "Cooking", image: "/service-cooking.webp", businessImage: "/business-cooking.webp", governmentImage: "/government-meals.webp", residentialTitle: "Cooking and meal prep", residentialCopy: "Family meals, weekly meal prep and private cook visits.", residentialPrice: "From KSh 2,000", businessTitle: "Workplace meals", businessCopy: "Staff meals, meeting menus and scheduled meal preparation.", businessPrice: "Tailored menu plans", governmentTitle: "Institutional meal support", governmentCopy: "Kitchen and meal support for schools, offices and public programs.", governmentPrice: "Program pricing available" },
  { slug: "fundi", short: "Fundi", image: "/service-fundi.webp", businessImage: "/business-fundi.webp", governmentImage: "/government-facilities.webp", residentialTitle: "Fundi and handyman", residentialCopy: "Plumbing, electrical, carpentry, mounting and everyday fixes.", residentialPrice: "From KSh 1,000", businessTitle: "Facility maintenance", businessCopy: "Planned fundi visits for routine facility maintenance.", businessPrice: "Scheduled maintenance plans", governmentTitle: "Facilities maintenance", governmentCopy: "Planned plumbing, electrical and carpentry support across facilities.", governmentPrice: "Contract-ready service plans" },
  { slug: "auto-care", short: "Auto care", image: "/service-auto.webp", businessImage: "/business-fleet.webp", governmentImage: "/government-fleet.webp", residentialTitle: "Mobile wash and detailing", residentialCopy: "Mobile washing, interior cleaning and detailing at your location.", residentialPrice: "From KSh 1,000", businessTitle: "Fleet wash and detailing", businessCopy: "On-site washing and detailing for company and dealership fleets.", businessPrice: "From KSh 900 / vehicle", governmentTitle: "Fleet washing and detailing", governmentCopy: "On-site care for county, agency and institutional vehicle fleets.", governmentPrice: "Fleet contract pricing" },
  { slug: "home-support", short: "Home support", image: "/service-support.webp", businessImage: "/business-support.webp", governmentImage: "/government-support.webp", residentialTitle: "Home and everyday support", residentialCopy: "Errands, home organization, shopping and event support.", residentialPrice: "From KSh 800", businessTitle: "Property and office support", businessCopy: "Restocking, errands, property turnovers and event setup.", businessPrice: "Flexible support plans", governmentTitle: "Institutional operations support", governmentCopy: "Restocking, setup and operational support for public facilities.", governmentPrice: "Managed support plans" },
  { slug: "pest-control", short: "Pest control", image: "/service-pest.webp", businessImage: "/business-pest.webp", governmentImage: "/government-pest.webp", residentialTitle: "Home pest control", residentialCopy: "Targeted treatment and prevention for common household pests.", residentialPrice: "From KSh 1,500", businessTitle: "Commercial pest management", businessCopy: "Scheduled prevention for offices, hospitality and shared spaces.", businessPrice: "Site plans available", governmentTitle: "Public-health pest control", governmentCopy: "Inspection, treatment and prevention for campuses and public buildings.", governmentPrice: "Compliance-led plans" },
  { slug: "outdoor-care", short: "Outdoor care", image: "/service-outdoor.webp", businessImage: "/business-grounds.webp", governmentImage: "/government-grounds.webp", residentialTitle: "Garden and outdoor care", residentialCopy: "Garden tidying, lawn care, pruning and outdoor cleanup.", residentialPrice: "From KSh 1,200", businessTitle: "Grounds and outdoor care", businessCopy: "Routine landscape upkeep for properties and workplaces.", businessPrice: "Recurring plans available", governmentTitle: "Grounds and compound care", governmentCopy: "Routine grounds maintenance for schools, offices and public compounds.", governmentPrice: "Multi-site plans available" },
] as const;

export type MarketplaceService = (typeof marketplaceServices)[number];
export type AudienceKey = "home" | "business" | "government";
export type ServiceSlug = MarketplaceService["slug"];

export function getAudienceKey(audience: Audience): AudienceKey {
  switch (audience) {
    case "Residential":
      return "home";
    case "Business":
      return "business";
    case "Government & Institutions":
      return "government";
    default: {
      const exhaustive: never = audience;
      throw new Error(`Unhandled audience: ${exhaustive}`);
    }
  }
}

export function getServicePresentation(service: MarketplaceService, audience: Audience) {
  const key = getAudienceKey(audience);
  switch (key) {
    case "business":
      return { title: service.businessTitle, copy: service.businessCopy, price: service.businessPrice, image: service.businessImage, key };
    case "government":
      return { title: service.governmentTitle, copy: service.governmentCopy, price: service.governmentPrice, image: service.governmentImage, key };
    case "home":
      return { title: service.residentialTitle, copy: service.residentialCopy, price: service.residentialPrice, image: service.image, key };
    default: {
      const exhaustive: never = key;
      throw new Error(`Unhandled audience key: ${exhaustive}`);
    }
  }
}

export function getBookingHref(slug: ServiceSlug, audience: Audience) {
  const key = getAudienceKey(audience);
  return key === "home" ? `/book?service=${slug}` : `/book?service=${slug}&audience=${key}`;
}

export function getBookingActionLabel(short: string, audience: Audience) {
  const key = getAudienceKey(audience);
  switch (key) {
    case "home":
      return `Book ${short}`;
    case "business":
    case "government":
      return `Request ${short}`;
    default: {
      const exhaustive: never = key;
      throw new Error(`Unhandled audience key: ${exhaustive}`);
    }
  }
}
