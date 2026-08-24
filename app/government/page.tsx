"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import SectionHeading from "../components/section-heading";
import SelectionGrid from "../components/selection-grid";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { useFirebaseAuth } from "../components/firebase-auth-provider";
import { marketplaceServices } from "../data/marketplace-services";
import { firebaseFetch } from "../lib/firebase-api";
import { ensureOrganization } from "../lib/firebase-data";

const services = marketplaceServices.map(service => ({ name: service.governmentTitle, detail: service.governmentCopy, image: service.businessImage, slug: service.slug }));

const institutions = [
  ["National & county offices", "Recurring facility services with location-level reporting."],
  ["Schools & campuses", "Cleaning, grounds, meals, linen and maintenance support."],
  ["Healthcare facilities", "Defined routines, access controls and documented completion."],
  ["Public housing", "Common areas, turnovers, pest prevention and maintenance."],
  ["Agencies & authorities", "Multi-site support, fleet care and consolidated oversight."],
  ["NGOs & development programs", "Scalable field-office and program-site services."],
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
    <SiteHeader/>

    <section className="gov-hero">
      <div className="gov-hero-copy"><small>MWENZA FOR GOVERNMENT & INSTITUTIONS</small><h1>Essential services, procurement ready.</h1><p>Vetted teams, defined service levels and clear reporting for public facilities across Kenya.</p><div><a href="#procurement">Request a capability review →</a><a href="#public-services">View eligible services</a></div><dl><span><dt>Coverage</dt><dd>Single or multi-site</dd></span><span><dt>Delivery</dt><dd>SLA-led service</dd></span><span><dt>Reporting</dt><dd>One accountable view</dd></span></dl></div>
      <div className="gov-hero-image"><img src="/business-support.webp" alt="Mwenza service team prepared for institutional facility work"/><div><small>FACILITY PROGRAM</small><b>Scope · schedule · standards · reporting</b><span>Ready for review</span></div></div>
    </section>

    <section className="gov-proof" aria-label="Institutional service standards"><span><b>Vetted workforce</b><small>Identity and skills reviewed</small></span><span><b>Defined service levels</b><small>Scope and standards agreed</small></span><span><b>Documented delivery</b><small>Visits, issues and completion tracked</small></span><span><b>Consolidated oversight</b><small>One view across locations</small></span></section>

    <section className="gov-services" id="public-services"><SectionHeading eyebrow="EIGHT SERVICE CAPABILITIES" title="One partner across your facilities." description="Select a service to start an institutional request immediately."/><div>{services.map(service => <article key={service.name}><a href={`/book?service=${service.slug}&audience=government`}><img src={service.image} alt=""/><span><h3>{service.name}</h3><p>{service.detail}</p><b>Request service →</b></span></a></article>)}</div></section>

    <section className="gov-institutions"><SectionHeading eyebrow="BUILT FOR PUBLIC OPERATIONS" title="Structured around how institutions work."/><div>{institutions.map((institution, index) => <article key={institution[0]}><span>{String(index + 1).padStart(2, "0")}</span><h3>{institution[0]}</h3><p>{institution[1]}</p></article>)}</div></section>

    <section className="gov-delivery"><div><small>FROM REQUIREMENT TO DELIVERY</small><h2>A clear route to service.</h2><p>Start with a capability review. Mwenza then verifies each site, service standard, team requirement and reporting cadence before activation.</p><a href="#procurement">Start the review →</a></div><ol><li><span>1</span><div><b>Share the requirement</b><p>Services, locations, timing and procurement needs.</p></div></li><li><span>2</span><div><b>Validate scope and controls</b><p>Site review, workforce checks and delivery standards.</p></div></li><li><span>3</span><div><b>Approve the service plan</b><p>Clear pricing, responsibilities and reporting.</p></div></li><li><span>4</span><div><b>Activate and monitor</b><p>Scheduled teams, tracked completion and issue resolution.</p></div></li></ol></section>

    <section className="gov-request" id="procurement"><div className="gov-request-copy"><small>CAPABILITY & PROCUREMENT REQUEST</small><h2>Tell us what the institution needs.</h2><p>We’ll review the requirement and return the right capability, scope and next step.</p><ul><li>Multi-location and recurring programs</li><li>Site-specific service standards</li><li>Consolidated reporting and billing</li></ul></div><div className="gov-request-panel">{submitted ? <div className="gov-success"><span>✓</span><small>REQUEST RECEIVED</small><h3>Capability review started.</h3><p>A Mwenza institutional specialist will contact {organization} through {contact}.</p><button onClick={() => setSubmitted(false)}>Start another request</button></div> : <><label>Institution or agency<input value={organization} onChange={event => setOrganization(event.target.value)} placeholder="Organization name" autoComplete="organization"/></label><div className="gov-request-fields"><label>Entity type<select value={entityType} onChange={event => setEntityType(event.target.value)}><option>Government agency</option><option>County government</option><option>School or university</option><option>Healthcare institution</option><option>NGO or development program</option><option>Other institution</option></select></label><label>Locations<input type="number" min="1" value={locations} onChange={event => setLocations(event.target.value)} inputMode="numeric"/></label></div><label>Services needed</label><SelectionGrid items={services.map(service => service.name)} selected={selected} onToggle={toggle} className="gov-service-options"/><div className="gov-request-fields"><label>Service model<select value={frequency} onChange={event => setFrequency(event.target.value)}><option>One time</option><option>Recurring</option><option>Multi-year program</option><option>Not sure</option></select></label><label>Work email or phone<input value={contact} onChange={event => setContact(event.target.value)} placeholder="How should we reach you?"/></label></div><button className="gov-submit" disabled={!ready} onClick={submit}>{submitting ? "Sending request…" : "Request capability review →"}</button>{error && <small className="gov-error" role="alert">{error}</small>}</>}</div></section>

    <SiteFooter/>
  </main>;
}
