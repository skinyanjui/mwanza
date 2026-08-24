export type Service = {
  slug: string;
  name: string;
  short: string;
  headline: string;
  description: string;
  image: string;
  businessImage: string;
  starting: string;
  accent: string;
  residential: string[];
  business: string[];
  included: string[];
  options: {
    name: string;
    description: string;
    price: string;
    duration: string;
  }[];
  preparation: string[];
  faqs: [string, string][];
};

export const serviceData: Service[] = [
  {
    slug: "laundry",
    name: "Laundry & garment care",
    short: "Laundry",
    headline: "Fresh, folded and back where it belongs.",
    description: "Doorstep laundry for clothing, bedding, delicates, uniforms and recurring linen.",
    image: "/service-laundry.webp",
    businessImage: "/business-linen.webp",
    starting: "KSh 180 / kg",
    accent: "#d9efe0",
    residential: ["Wash, dry and fold", "Wash and iron", "Dry cleaning", "Duvets and bedding"],
    business: ["Hotel and Airbnb linen", "Salon and spa towels", "Uniforms and workwear", "Scheduled bulk pickup"],
    included: ["Colour and fabric sorting", "Preference-based washing", "Neat folding or hanging", "Pickup and return tracking"],
    options: [
      { name: "Wash and fold", description: "Everyday clothing, washed, dried and neatly folded.", price: "KSh 180 / kg", duration: "1–2 day return" },
      { name: "Wash and iron", description: "Cleaned, pressed and returned ready to wear.", price: "KSh 260 / kg", duration: "1–2 day return" },
      { name: "Dry cleaning", description: "Careful handling for suits, dresses and delicate pieces.", price: "From KSh 450", duration: "2–4 day return" },
      { name: "Duvets and bedding", description: "Deep cleaning for bulky bedding and household linen.", price: "From KSh 650", duration: "1–3 day return" },
    ],
    preparation: ["Separate any delicate or stained items", "Add fragrance and ironing preferences", "Have the bag ready at your pickup window"],
    faqs: [["How is my order priced?", "Wash-and-fold orders are weighed. Specialty garments and bedding are priced by item."], ["Can I set washing preferences?", "Yes. Add detergent, fragrance, temperature and handling preferences before confirming."], ["Do you serve businesses?", "Yes. Mwenza can schedule recurring linen, towel and uniform pickup for one or multiple locations."]],
  },
  {
    slug: "cleaning",
    name: "Home & commercial cleaning",
    short: "Cleaning",
    headline: "A space that feels ready again.",
    description: "Cleaning for homes, offices, shops, shared spaces, guest turnovers and move-outs.",
    image: "/service-cleaning.webp",
    businessImage: "/business-cleaning.webp",
    starting: "KSh 1,800",
    accent: "#f2e7cf",
    residential: ["Standard home cleaning", "Deep cleaning", "Move-in and move-out", "Sofa and carpet care"],
    business: ["Office and retail cleaning", "Airbnb turnovers", "Common-area cleaning", "Post-project resets"],
    included: ["Confirmed task checklist", "Arrival and completion updates", "Room-by-room instructions", "Issue reporting before departure"],
    options: [
      { name: "Standard clean", description: "A reliable reset for routinely maintained homes and spaces.", price: "From KSh 1,800", duration: "2–4 hours" },
      { name: "Deep clean", description: "Detailed top-to-bottom care for kitchens, bathrooms and living areas.", price: "From KSh 3,500", duration: "4–8 hours" },
      { name: "Move-in or move-out", description: "An empty-space clean before keys change hands.", price: "From KSh 4,500", duration: "4–8 hours" },
      { name: "Sofa and carpet care", description: "Focused fabric and floor treatment for a fresher space.", price: "From KSh 1,500", duration: "2–5 hours" },
    ],
    preparation: ["Share the rooms and areas to cover", "Tell us whether supplies are available", "Secure valuables and arrange access"],
    faqs: [["Do cleaners bring supplies?", "Standard supplies can be included, or the professional can use products supplied at your location."], ["How long does cleaning take?", "Timing depends on size, condition and scope. Mwenza confirms the expected duration before the visit."], ["Can I book a recurring cleaner?", "Yes. Weekly, biweekly and custom business schedules can be arranged."]],
  },
  {
    slug: "cooking",
    name: "Cooking & meal preparation",
    short: "Cooking",
    headline: "Good food, prepared in your kitchen.",
    description: "Cooking support for family meals, weekly prep, workplace meals, meetings and small events.",
    image: "/service-cooking.webp",
    businessImage: "/business-cooking.webp",
    starting: "KSh 2,000",
    accent: "#dfecee",
    residential: ["Single-meal preparation", "Weekly family meal prep", "Private cook visits", "Kitchen prep and tidy-up"],
    business: ["Staff meal preparation", "Meeting meals", "Managed weekly menus", "Event kitchen support"],
    included: ["Menu and portion confirmation", "Dietary preference notes", "Ingredient plan before arrival", "Clean cooking area at completion"],
    options: [
      { name: "Family meal preparation", description: "A fresh meal cooked in your kitchen for family or guests.", price: "From KSh 2,500", duration: "2–4 hours" },
      { name: "Weekly meal prep", description: "Several planned dishes prepared during one efficient visit.", price: "From KSh 4,500", duration: "4–6 hours" },
      { name: "Private cook visit", description: "A tailored menu for a special meal or small gathering.", price: "From KSh 3,500", duration: "3–5 hours" },
      { name: "Kitchen support", description: "Ingredient prep, cooking assistance and a tidy finish.", price: "From KSh 2,000", duration: "2–4 hours" },
    ],
    preparation: ["Share your menu, portions and dietary needs", "Choose whether you or the cook will source ingredients", "Confirm kitchen access and available equipment"],
    faqs: [["Who buys the ingredients?", "You may provide ingredients or request an ingredient-shopping add-on before the visit."], ["Can I request Kenyan dishes?", "Yes. Choose preferred dishes and cuisine style when describing your booking."], ["Can businesses set a weekly menu?", "Yes. Routine plans can include menu rotation, portions, timing and consolidated billing."]],
  },
  {
    slug: "fundi",
    name: "Fundi & handyman services",
    short: "Fundi",
    headline: "The right fundi for the job.",
    description: "Skilled plumbing, electrical, carpentry, mounting, assembly and routine repairs.",
    image: "/service-fundi.webp",
    businessImage: "/business-fundi.webp",
    starting: "KSh 1,000",
    accent: "#f3dfca",
    residential: ["Plumbing fixes", "Electrical work", "Carpentry repairs", "Mounting and assembly"],
    business: ["Preventive maintenance visits", "Routine facility repairs", "Multi-location task lists", "Turnover maintenance"],
    included: ["Skill-matched professional", "Scope confirmation", "Materials approval before purchase", "Completion notes and photos"],
    options: [
      { name: "Plumbing", description: "Help with leaks, taps, fittings and routine plumbing faults.", price: "From KSh 1,200", duration: "1–3 hours" },
      { name: "Electrical", description: "Sockets, lights, switches and non-emergency electrical work.", price: "From KSh 1,500", duration: "1–3 hours" },
      { name: "Carpentry", description: "Doors, shelving, fittings and everyday wood repairs.", price: "From KSh 1,800", duration: "Scope based" },
      { name: "General handyman", description: "Mounting, assembly and a practical list of small fixes.", price: "From KSh 1,000", duration: "1–4 hours" },
    ],
    preparation: ["Describe the task and share useful measurements", "Upload photos during booking when possible", "Approve any materials before they are purchased"],
    faqs: [["Are materials included?", "Labour and materials are shown separately. No material purchase is made without your approval."], ["Can Mwenza handle urgent repairs?", "Availability varies by location and trade. Mwenza will show the earliest suitable appointment."], ["Can a business submit several tasks?", "Yes. Combine routine tasks by location or arrange scheduled preventive-maintenance visits."]],
  },
  {
    slug: "auto-care",
    name: "Mobile washing & detailing",
    short: "Auto care",
    headline: "A cleaner vehicle, without the trip.",
    description: "Mobile washing, interior care and detailing for homes, offices, dealerships and fleets.",
    image: "/service-auto.webp",
    businessImage: "/business-fleet.webp",
    starting: "KSh 1,000",
    accent: "#dce5e0",
    residential: ["Exterior hand wash", "Interior vacuum and wipe-down", "Full vehicle detailing", "Multi-car appointments"],
    business: ["Scheduled fleet washing", "Company vehicle detailing", "Dealership preparation", "On-site group service"],
    included: ["Vehicle-size confirmation", "Wash and detail checklist", "Water and access requirements", "Completion inspection"],
    options: [
      { name: "Exterior hand wash", description: "Body, windows, wheels and a careful hand dry at your location.", price: "From KSh 1,000", duration: "45–75 minutes" },
      { name: "Interior clean", description: "Vacuuming, surfaces, mats and interior glass.", price: "From KSh 1,500", duration: "1–2 hours" },
      { name: "Full detailing", description: "A deeper interior and exterior finish for your vehicle.", price: "From KSh 4,500", duration: "3–5 hours" },
      { name: "Fleet washing", description: "Scheduled on-site care for several business vehicles.", price: "From KSh 900 / vehicle", duration: "Plan based" },
    ],
    preparation: ["Confirm the vehicle type and number of vehicles", "Reserve an accessible parking space", "Confirm water and power access before arrival"],
    faqs: [["Does Mwenza repair vehicles?", "No. Mwenza Auto Care is strictly limited to washing and detailing services."], ["What access is required?", "The service provider confirms water, power and parking requirements before arrival."], ["Can several vehicles be booked together?", "Yes. Homes and businesses can request multi-vehicle or recurring fleet appointments."]],
  },
  {
    slug: "home-support",
    name: "Home & operations support",
    short: "Home support",
    headline: "The small tasks that keep life moving.",
    description: "Errands, organization, turnovers, restocking and event setup for homes and businesses.",
    image: "/service-support.webp",
    businessImage: "/business-support.webp",
    starting: "KSh 800",
    accent: "#e9e1ef",
    residential: ["Errand running", "Home organization", "Shopping and pickup", "Event setup and tidy-up"],
    business: ["Office restocking", "Property turnovers", "Operational errands", "Event support"],
    included: ["Clear task and spending limits", "Receipt capture for purchases", "Progress updates", "Completion confirmation"],
    options: [
      { name: "Errand runner", description: "Shopping, collection and delivery within an agreed route and budget.", price: "From KSh 800", duration: "1–3 hours" },
      { name: "Home organization", description: "Practical help arranging wardrobes, pantries and shared spaces.", price: "From KSh 1,800", duration: "2–5 hours" },
      { name: "Property turnover", description: "A coordinated reset for short-stay homes between guests.", price: "From KSh 2,500", duration: "2–5 hours" },
      { name: "Event support", description: "Setup, guest-area support and tidy-up for small occasions.", price: "From KSh 3,000", duration: "3–6 hours" },
    ],
    preparation: ["List each task and the preferred completion order", "Set purchase limits for any errands", "Share access details and a reliable contact"],
    faqs: [["Can a runner make purchases for me?", "Yes, when agreed in advance. Purchase limits and receipt requirements are confirmed before the task."], ["What can home organization cover?", "Common requests include wardrobes, pantries, kitchens, storage areas and moving-day organization."], ["Can businesses use recurring support?", "Yes. Mwenza can schedule restocking, turnovers and recurring operational errands."]],
  },
  {
    slug: "pest-control",
    name: "Pest control & prevention",
    short: "Pest control",
    headline: "Quiet protection for the spaces you use.",
    description: "Inspection, targeted treatment and prevention for homes, offices, hospitality and shared spaces.",
    image: "/service-pest.webp",
    businessImage: "/business-pest.webp",
    starting: "KSh 1,500",
    accent: "#e4efdf",
    residential: ["Home pest inspection", "Targeted treatment", "Kitchen and pantry prevention", "Recurring protection"],
    business: ["Office and retail prevention", "Hospitality pest plans", "Multi-site monitoring", "Scheduled follow-up"],
    included: ["Qualified service matching", "Treatment and safety plan", "Preparation instructions", "Follow-up guidance"],
    options: [
      { name: "Home inspection", description: "Assess pest signs, affected areas and the right next step.", price: "From KSh 1,000", duration: "45–90 minutes" },
      { name: "Targeted treatment", description: "Focused treatment for common household pest activity.", price: "From KSh 2,500", duration: "1–3 hours" },
      { name: "Kitchen prevention", description: "Inspection and prevention around kitchens, pantries and food storage.", price: "From KSh 1,800", duration: "1–2 hours" },
      { name: "Recurring protection", description: "Planned monitoring and treatment for homes or business locations.", price: "From KSh 2,000 / visit", duration: "Plan based" },
    ],
    preparation: ["Mention children, pets and product sensitivities", "Clear access to affected areas before arrival", "Follow the provider's confirmed safety instructions"],
    faqs: [["Which pests can be covered?", "Common household and commercial pests can be assessed. The provider confirms the appropriate scope after reviewing the signs and affected areas."], ["Is treatment safe around children and pets?", "Share every household or workplace sensitivity before booking. Preparation and re-entry guidance depends on the selected treatment."], ["Can businesses schedule prevention?", "Yes. Mwenza can arrange recurring inspections and prevention plans for one or several locations."]],
  },
  {
    slug: "outdoor-care",
    name: "Garden & outdoor care",
    short: "Outdoor care",
    headline: "Outdoor spaces, ready to enjoy.",
    description: "Garden tidying, lawn care, pruning and outdoor cleanup for homes, properties and workplaces.",
    image: "/service-outdoor.webp",
    businessImage: "/business-grounds.webp",
    starting: "KSh 1,200",
    accent: "#dcead7",
    residential: ["Garden tidy-up", "Lawn mowing and edging", "Pruning and shaping", "Seasonal outdoor cleanup"],
    business: ["Grounds maintenance", "Common-area landscaping", "Hospitality grounds care", "Scheduled outdoor cleanup"],
    included: ["Confirmed outdoor task plan", "Tools and access confirmation", "Green-waste tidy-up", "Completion update"],
    options: [
      { name: "Garden tidy-up", description: "Weeding, light trimming and a practical reset for smaller gardens.", price: "From KSh 1,200", duration: "1–3 hours" },
      { name: "Lawn mow and edge", description: "Lawn mowing with clean edges around paths and planted areas.", price: "From KSh 1,500", duration: "1–3 hours" },
      { name: "Pruning and shaping", description: "Careful shaping for hedges, shrubs and manageable garden plants.", price: "From KSh 1,800", duration: "2–4 hours" },
      { name: "Outdoor cleanup", description: "Leaf, path and general outdoor cleanup for homes or properties.", price: "From KSh 1,500", duration: "2–4 hours" },
    ],
    preparation: ["Share the approximate garden or grounds size", "List priority areas and any plants to avoid", "Confirm gate, water and green-waste access"],
    faqs: [["Do I need to provide tools?", "Tell Mwenza what is available. The provider confirms any required tools before the visit."], ["Can green waste be removed?", "Light tidy-up is included. Larger removal needs are confirmed and priced before the visit."], ["Can businesses book routine grounds care?", "Yes. Offices, properties and hospitality locations can arrange a recurring schedule and shared service standards."]],
  },
];

export function getService(slug: string) {
  return serviceData.find(service => service.slug === slug);
}
