export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  sections: LegalSection[];
};

const legalReferences = {
  dataProtection: "https://new.kenyalaw.org/akn/ke/act/2019/24/eng@2022-12-31",
  consumerProtection: "https://new.kenyalaw.org/akn/ke/act/2012/46/eng@2022-12-31",
  procurement: "https://new.kenyalaw.org/akn/ke/act/2015/33/eng@2022-12-31",
  workplaceSafety: "https://new.kenyalaw.org/akn/ke/act/2007/15/eng@2022-12-31",
};

export const legalDocuments: LegalDocument[] = [
  {
    slug: "privacy",
    title: "Privacy & data protection notice",
    shortTitle: "Privacy",
    summary: "How Mwenza collects, uses, shares and protects personal information across customer, provider, employment and institutional services.",
    sections: [
      { heading: "Information we collect", bullets: ["Account and contact details, including name, phone number and email.", "Booking details, service location, access instructions, service preferences and communications.", "Business, institution, provider or job-application details you submit.", "Technical information needed to secure sessions, remember drafts and operate the service."] },
      { heading: "How we use information", bullets: ["Create, quote, schedule and support service requests.", "Match work with appropriate providers and coordinate arrival, completion and issue resolution.", "Operate accounts, prevent misuse, meet legal obligations and improve service quality.", "Send transactional updates and requested communications. Marketing messages require an appropriate permission or lawful basis."] },
      { heading: "When information is shared", paragraphs: ["Mwenza shares only the information reasonably needed to deliver or support a service. This may include assigned providers, payment and communication partners, hosting providers, professional advisers and public authorities when legally required."], bullets: ["Providers receive the location, scope, timing and contact information needed for the assigned work.", "Mwenza does not sell personal information.", "A business or institution account may allow authorized administrators to view activity for their locations."] },
      { heading: "Storage, security and retention", paragraphs: ["We use administrative and technical safeguards appropriate to the information and retain records only for operational, contractual, safety, tax, dispute and legal needs. No online system can guarantee absolute security."] },
      { heading: "Your choices and rights", paragraphs: [`Subject to Kenya's Data Protection Act, 2019, you may request access, correction, deletion, restriction or objection where applicable. Read the official Act at ${legalReferences.dataProtection}.`], bullets: ["Email privacy@mwenza.co.ke with your request and enough information to verify it.", "You may clear local booking drafts through your browser or overwrite them with a new draft.", "You may complain to Kenya's Office of the Data Protection Commissioner where applicable."] },
      { heading: "Contact", paragraphs: ["Privacy questions: privacy@mwenza.co.ke. General support: hello@mwenza.co.ke."] },
    ],
  },
  {
    slug: "terms",
    title: "Customer terms of service",
    shortTitle: "Customer terms",
    summary: "The rules that apply when customers request, confirm, receive or manage a Mwenza service.",
    sections: [
      { heading: "Using Mwenza", paragraphs: ["Mwenza provides a platform and service-management layer for household, commercial and institutional work. Depending on the service, work may be delivered by Mwenza personnel or a vetted independent provider. The confirmed booking identifies the service scope, timing and price."] },
      { heading: "Quotes, bookings and payment", bullets: ["Displayed prices are starting estimates unless expressly confirmed as fixed.", "Large, multi-site or unusual work may require a site review and written quote.", "You authorize payment only after reviewing the final booking terms shown to you.", "Invoices and payment terms for managed accounts are governed by the written service plan."] },
      { heading: "Customer responsibilities", bullets: ["Provide accurate scope, location, access, safety and contact information.", "Secure valuables and disclose hazards, sensitivities, pets, restricted areas and special handling needs.", "Do not ask a provider to perform unsafe, illegal, emergency or out-of-scope work.", "Review materials or added charges before approval."] },
      { heading: "Changes, cancellation and refunds", paragraphs: ["Change and cancellation options depend on timing, committed supplies, travel and work already performed. Any applicable fee or refund is shown or explained before it is applied. Contact support promptly when plans change."] },
      { heading: "Service issues", paragraphs: ["Report missing, damaged or incomplete work promptly with relevant details. Mwenza may inspect, arrange re-performance, offer a reasonable credit or take another appropriate step after reviewing the circumstances."] },
      { heading: "Limits and governing law", paragraphs: [`Nothing in these terms excludes rights that cannot lawfully be excluded. Kenya's Consumer Protection Act, 2012 is available at ${legalReferences.consumerProtection}. To the extent permitted by law, Mwenza is not responsible for indirect or unforeseeable loss. These terms are governed by the laws of Kenya.`] },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie & browser storage notice",
    shortTitle: "Cookies",
    summary: "A plain-language explanation of the essential session and browser storage used by the Mwenza website.",
    sections: [
      { heading: "What the site stores", bullets: ["Essential sign-in and security information when account access is used.", "Booking drafts and recent booking information in browser storage so a user can resume or track activity on that device.", "Basic service preferences needed to complete a requested action."] },
      { heading: "Why it is used", paragraphs: ["This storage keeps the site secure, remembers progress and provides account or booking functions. Mwenza does not use browser storage to sell personal information."] },
      { heading: "Your control", paragraphs: ["You can clear cookies and local storage in your browser settings. Clearing them may sign you out, remove saved drafts or reset preferences. Essential technology cannot always be disabled while using a protected feature."] },
      { heading: "Changes", paragraphs: ["If Mwenza adds optional analytics or advertising technology, this notice and any required consent controls will be updated before that use begins."] },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility statement",
    shortTitle: "Accessibility",
    summary: "Mwenza's commitment to making service discovery, booking and account access usable for more people.",
    sections: [
      { heading: "Our commitment", paragraphs: ["Mwenza aims to provide a website that works across phones, tablets and desktop screens and supports keyboard, screen-reader and zoom use where practical."] },
      { heading: "Current measures", bullets: ["Semantic headings, labels and descriptive links.", "Keyboard-accessible navigation and form controls.", "Visible focus and selected states.", "Responsive layouts, text wrapping and reduced horizontal overflow.", "Alternative text for meaningful photography and empty alternatives for decorative images."] },
      { heading: "Known limits", paragraphs: ["Accessibility is an ongoing process. Third-party sign-in, payment or communication experiences may have their own accessibility behavior. We continue to test core booking and account journeys as the product changes."] },
      { heading: "Request help or report a barrier", paragraphs: ["Email accessibility@mwenza.co.ke with the page, task and difficulty you encountered. You may also request a reasonable alternative way to complete a booking."] },
    ],
  },
  {
    slug: "provider-terms",
    title: "Service provider terms",
    shortTitle: "Provider terms",
    summary: "Baseline expectations for professionals who apply for, accept or perform service work through Mwenza.",
    sections: [
      { heading: "Eligibility and verification", bullets: ["Provide truthful identity, contact, skill, credential and service-area information.", "Maintain licenses, permits or certifications required for the accepted work.", "Complete any role-appropriate checks and keep details current."] },
      { heading: "Accepting and completing work", bullets: ["Accept only work you are qualified, equipped and available to complete.", "Review the scope, access, timing and compensation before acceptance.", "Follow confirmed checklists, safety instructions and customer-property standards.", "Document arrival, completion, issues, approved materials and out-of-scope conditions."] },
      { heading: "Conduct, privacy and safety", paragraphs: ["Providers must act professionally, protect customer information, avoid discrimination or harassment, and immediately report safety or safeguarding concerns. Customer data may be used only for the assigned work."] },
      { heading: "Payment and status", paragraphs: ["Provider rates, deductions, payment timing and worker classification are governed by the specific provider agreement and applicable law. Nothing on the public website replaces that written agreement."] },
      { heading: "Suspension or removal", paragraphs: ["Mwenza may pause access while investigating identity, safety, fraud, quality, privacy or conduct concerns and may remove access where the provider agreement or law allows."] },
    ],
  },
  {
    slug: "institutional-terms",
    title: "Government & institutional terms",
    shortTitle: "Institutional terms",
    summary: "The commercial and procurement principles that apply to capability reviews, public-sector requests and institutional service plans.",
    sections: [
      { heading: "Capability requests are not contracts", paragraphs: ["A website request, capability statement, site visit or preliminary quote does not create a binding procurement commitment. Service begins only under an approved purchase order, framework, contract or other authorized written instrument."] },
      { heading: "Procurement integrity", paragraphs: [`Public entities remain responsible for their lawful procurement process. Mwenza will provide requested qualification and pricing information and will not ask an official to bypass applicable requirements. Kenya's Public Procurement and Asset Disposal Act, 2015 is available at ${legalReferences.procurement}.`], bullets: ["No undisclosed inducements, conflicts or side agreements.", "Tender, contract and purchase-order terms control over inconsistent website language.", "Confidential procurement material is handled only for the authorized purpose."] },
      { heading: "Scope, service levels and changes", paragraphs: ["Each institutional engagement should define locations, tasks, staffing, supplies, access controls, reporting, issue response, acceptance criteria and change authority. Added work requires approval through the agreed change process."] },
      { heading: "Safety, safeguarding and access", paragraphs: [`Mwenza and the institution will coordinate site induction, restricted areas, incident reporting and worker safety obligations. Kenya's Occupational Safety and Health Act, 2007 is available at ${legalReferences.workplaceSafety}.`] },
      { heading: "Records, invoices and audit", paragraphs: ["The written agreement governs records, completion evidence, taxes, invoice support, audit rights, data processing, insurance requirements, confidentiality and retention."] },
    ],
  },
  {
    slug: "safety",
    title: "Safety & service standards",
    shortTitle: "Safety standards",
    summary: "The baseline controls that help customers, providers, workers and facilities prepare for safer service delivery.",
    sections: [
      { heading: "Before every visit", bullets: ["Share hazards, access limits, children, pets, allergies, product sensitivities and restricted areas.", "Confirm the service scope, required equipment and who may approve changes.", "Keep emergency, illegal or specialist-regulated work outside a routine booking."] },
      { heading: "Service-specific limits", bullets: ["Auto care covers washing and detailing only; Mwenza does not offer vehicle repairs.", "Fundi work is limited to the verified trade and agreed non-emergency scope.", "Pest treatment requires preparation, product and re-entry instructions appropriate to the site.", "Meal support requires disclosure of allergies and dietary needs; cross-contact risk cannot be eliminated in every kitchen."] },
      { heading: "Stop-work authority", paragraphs: ["Customers and providers should stop work when conditions are unsafe, materially different from the booking or require credentials, equipment or authority not available. Mwenza will review the scope and next step."] },
      { heading: "Incidents and urgent situations", paragraphs: ["Report service incidents to Mwenza as soon as practical. For fire, medical emergencies, crime or immediate danger, contact the appropriate emergency service first; Mwenza is not an emergency response service."] },
      { heading: "Workplace standards", paragraphs: [`Institutional service plans may add induction, PPE, safeguarding, first-aid, access and reporting controls. Kenya's Occupational Safety and Health Act, 2007 is available at ${legalReferences.workplaceSafety}.`] },
    ],
  },
];

export function getLegalDocument(slug: string) {
  return legalDocuments.find(document => document.slug === slug);
}
