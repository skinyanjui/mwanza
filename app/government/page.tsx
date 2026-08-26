"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import SectionHeading from "../components/section-heading";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import GovernmentSectorCard from "../components/government-sector-card";
import MarketplaceServiceCard from "../components/marketplace-service-card";
import { QuickRequestChoices, QuickRequestField, QuickRequestHeader, QuickRequestPanel, QuickRequestRow, QuickRequestServices, QuickRequestSubmit, QuickRequestSuccess } from "../components/quick-request";
import { useFirebaseAuth } from "../components/firebase-auth-provider";
import { marketplaceServices } from "../data/marketplace-services";
import { firebaseFetch } from "../lib/firebase-api";
import { ensureOrganization } from "../lib/firebase-data";

const services = marketplaceServices.map(service => ({ name: service.governmentTitle, detail: service.governmentCopy, price: service.governmentPrice, image: service.governmentImage, slug: service.slug }));

const institutions = [
  ["National & county offices", "Recurring facility services with location-level reporting.", "/government-sector-offices.webp"],
  ["Schools & campuses", "Cleaning, grounds, meals, linen and maintenance support.", "/government-sector-schools.webp"],
  ["Healthcare facilities", "Defined routines, access controls and documented completion.", "/government-sector-healthcare.webp"],
  ["Public housing", "Common areas, turnovers, pest prevention and maintenance.", "/government-sector-housing.webp"],
  ["Agencies & authorities", "Multi-site support, fleet care and consolidated oversight.", "/government-sector-agencies.webp"],
  ["NGOs & development programs", "Scalable field-office and program-site services.", "/government-sector-ngos.webp"],
];

export default function GovernmentPage() {
  const firebase = useFirebaseAuth();
  const [selected, setSelected] = useState<string[]>(["Public facility cleaning"]);
  const [organization, setOrganization] = useState("");
  const [entityType, setEntityType] = useState("Government agency");
  const [locations, setLocations] = useState("1");
  const [contact, setContact] = useState("");
  const [frequency, setFrequency] = useState("Recurring");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const ready = selected.length > 0 && organization.trim().length > 1 && Number(locations) > 0 && contact.trim().length > 5 && !submitting;

  const toggle = (name: string) => setSelected(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name]);
  const submit = async () => {
    if (!ready) return;
    setSubmitting(true); setError("");
    try {
      if (firebase.configured && !firebase.user) { window.location.assign(`/account?setup=government&returnTo=${encodeURIComponent("/government#procurement")}`); return; }
      if (firebase.configured && firebase.user) await ensureOrganization({ ownerUid: firebase.user.uid, name: organization, type: "government", services: selected, frequency, locationCount: Number(locations), contact });
      else {
        const response = await firebaseFetch("/api/business-requests", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ businessName: `${organization} · ${entityType}`, services: selected, frequency, locationCount: Number(locations), contact }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not save request");
      }
      setSubmitted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save request");
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="gov-page">
    <SiteHeader shell="government"/>

    <section className="gov-hero">
      <div className="gov-hero-copy"><small>MWENZA FOR GOVERNMENT & INSTITUTIONS</small><h1>Essential services, procurement ready.</h1><p>Vetted teams, defined service levels and clear reporting for public facilities across Kenya.</p><div><a href="#procurement">Request a capability review →</a><a href="/government/dashboard?demo=1">Preview institutional workspace</a></div><dl><span><dt>Coverage</dt><dd>Single or multi-site</dd></span><span><dt>Delivery</dt><dd>SLA-led service</dd></span><span><dt>Reporting</dt><dd>One accountable view</dd></span></dl></div>
      <div className="gov-hero-image"><img src="/government-hero.webp" alt="Mwenza institutional facilities team at a Kenyan public campus"/><div><small>FACILITY PROGRAM</small><b>Scope · schedule · standards · reporting</b><span>Ready for review</span></div></div>
    </section>

    <section className="gov-proof" aria-label="Institutional service standards"><span><i>01</i><b>Vetted workforce</b><small>Identity and skills reviewed</small></span><span><i>02</i><b>Defined service levels</b><small>Scope and standards agreed</small></span><span><i>03</i><b>Documented delivery</b><small>Visits, issues and completion tracked</small></span><span><i>04</i><b>Consolidated oversight</b><small>One view across locations</small></span></section>

    <section className="gov-services" id="public-services"><SectionHeading eyebrow="EIGHT SERVICE CAPABILITIES" title="One partner across your facilities." description="Select a service to review the details or start an institutional request."/><div className="marketplace-service-grid gov-service-grid">{services.map(service => <MarketplaceServiceCard key={service.name} title={service.name} description={service.detail} price={service.price} image={service.image} detailHref={`/services/${service.slug}/government`} actionHref={`/book?service=${service.slug}&audience=government`} actionLabel="Request"/>)}</div></section>

    <section className="gov-institutions"><SectionHeading eyebrow="BUILT FOR PUBLIC OPERATIONS" title="Structured around how institutions work."/><div className="gov-sector-grid">{institutions.map((institution, index) => <GovernmentSectorCard key={institution[0]} index={index} title={institution[0]} description={institution[1]} image={institution[2]}/>)}</div></section>

    <section className="gov-delivery"><div><small>FROM REQUIREMENT TO DELIVERY</small><h2>A clear route to service.</h2><p>Start with a capability review. Mwenza then verifies each site, service standard, team requirement and reporting cadence before activation.</p><a href="#procurement">Start the review →</a></div><ol><li><span>1</span><div><b>Share the requirement</b><p>Services, locations, timing and procurement needs.</p></div></li><li><span>2</span><div><b>Validate scope and controls</b><p>Site review, workforce checks and delivery standards.</p></div></li><li><span>3</span><div><b>Approve the service plan</b><p>Clear pricing, responsibilities and reporting.</p></div></li><li><span>4</span><div><b>Activate and monitor</b><p>Scheduled teams, tracked completion and issue resolution.</p></div></li></ol></section>

    <section className="gov-request" id="procurement">
      <div className="gov-request-copy"><small>CAPABILITY & PROCUREMENT REQUEST</small><h2>Tell us what the institution needs.</h2><p>We’ll review the requirement and return the right capability, scope and next step.</p><ul><li>Multi-location and recurring programs</li><li>Site-specific service standards</li><li>Consolidated reporting and billing</li></ul></div>
      <QuickRequestPanel className="government">{submitted ? <QuickRequestSuccess title="Capability review started." description={`A Mwenza institutional specialist will contact ${organization} through ${contact}.`} onReset={() => setSubmitted(false)}/> : <>
        <QuickRequestHeader/>
        <QuickRequestServices items={services.map(service => service.name)} selected={selected} onToggle={toggle}/>
        <QuickRequestRow>
          <QuickRequestField label="Institution or agency"><input value={organization} onChange={event => setOrganization(event.target.value)} placeholder="Organization name" autoComplete="organization"/></QuickRequestField>
          <QuickRequestField label="Entity type"><select value={entityType} onChange={event => setEntityType(event.target.value)}><option>Government agency</option><option>County government</option><option>School or university</option><option>Healthcare institution</option><option>NGO or development program</option><option>Other institution</option></select></QuickRequestField>
        </QuickRequestRow>
        <QuickRequestField label="Service model"><QuickRequestChoices items={["One time", "Recurring", "Multi-year program", "Not sure"]} value={frequency} onChange={setFrequency}/></QuickRequestField>
        <QuickRequestRow>
          <QuickRequestField label="Locations"><input type="number" min="1" value={locations} onChange={event => setLocations(event.target.value)} inputMode="numeric"/></QuickRequestField>
          <QuickRequestField label="Work email or phone"><input value={contact} onChange={event => setContact(event.target.value)} placeholder="How should we reach you?"/></QuickRequestField>
        </QuickRequestRow>
        <QuickRequestSubmit ready={ready} submitting={submitting} label="Request capability review" readyNote="No payment required. We review scope and procurement needs first." incompleteNote="Add the institution, locations and contact details to continue." error={error} onSubmit={() => void submit()}/>
      </>}</QuickRequestPanel>
    </section>

    <SiteFooter/>
  </main>;
}
