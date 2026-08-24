"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import SectionHeading from "../components/section-heading";
import SelectionGrid from "../components/selection-grid";
import SiteHeader from "../components/site-header";
import SiteFooter from "../components/site-footer";
import { useFirebaseAuth } from "../components/firebase-auth-provider";
import { marketplaceServices } from "../data/marketplace-services";
import { firebaseFetch } from "../lib/firebase-api";
import { ensureOrganization } from "../lib/firebase-data";

const services = marketplaceServices.map(service => ({ name: service.businessTitle, detail: service.businessCopy, image: service.businessImage }));

const industries = [
  ["Property managers", "Turnovers, grounds, pest prevention, repairs and inspections."],
  ["Hotels & Airbnbs", "Guest-ready linen, cleaning, pest prevention and fast resets."],
  ["Offices & retail", "Cleaning, meals, grounds and routine facilities support."],
  ["Salons & spas", "Towels, linen, deep cleaning and recurring pickup schedules."],
  ["Restaurants", "Aprons, kitchen cleaning, pest prevention and supply errands."],
  ["Fleets & dealerships", "On-site washing and detailing without vehicle downtime."],
];

export default function BusinessPage() {
  const firebase = useFirebaseAuth();
  const [selected, setSelected] = useState<string[]>(["Commercial cleaning"]);
  const [frequency, setFrequency] = useState("Weekly");
  const [submitted, setSubmittedState] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [locationCount, setLocationCount] = useState("1");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const toggle = (name: string) => setSelected(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name]);
  const requestReady = !submitting && selected.length > 0 && businessName.trim().length > 1 && Number(locationCount) > 0 && contact.trim().length > 5;
  const setSubmitted = async (next:boolean) => {
    if(!next){setSubmittedState(false);setRequestError("");return}
    if(!requestReady||submitting)return; setSubmitting(true); setRequestError("");
    try{if(firebase.configured&&!firebase.user){window.location.assign(`/account?setup=business&returnTo=${encodeURIComponent("/business#quote")}`);return}if(firebase.configured&&firebase.user)await ensureOrganization({ownerUid:firebase.user.uid,name:businessName,type:"business",services:selected,frequency,locationCount:Number(locationCount),contact});else{const response=await firebaseFetch("/api/business-requests",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({businessName,services:selected,frequency,locationCount:Number(locationCount),contact})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not save request")}setSubmittedState(true)}catch(reason){setRequestError(reason instanceof Error?reason.message:"Could not save request")}finally{setSubmitting(false)}
  };

  return <main className="biz-page">
    <SiteHeader/>

    <section className="biz-hero">
      <div className="biz-hero-copy"><div className="eyebrow"><i/> Mwenza /mwen-za/ · your operations companion</div><h1>Everyday operations, <em>handled.</em></h1><p>One accountable partner for cleaning, linen, meals, maintenance, pest prevention, grounds and fleet care.</p><div className="biz-hero-actions"><a href="#quote">Build your service plan →</a><a href="/business/dashboard?demo=1">Preview client workspace</a></div><div className="biz-proof"><span><b>One invoice</b><small>Across every service</small></span><span><b>Vetted teams</b><small>Identity verified</small></span><span><b>Flexible cover</b><small>One visit to managed</small></span></div></div>
      <div className="biz-hero-image"><img src="/business-cleaning.webp" alt="Mwenza commercial cleaning team in a Nairobi workplace"/><div className="biz-status"><span><i/> Service active</span><b>Westlands office</b><small>Cleaning · Mon, Wed & Fri</small><div><span>Next visit</span><strong>Tomorrow, 8:00 AM</strong></div></div></div>
    </section>

    <section className="biz-strip"><span>Built for recurring operations</span><b>Commercial cleaning</b><b>Linen logistics</b><b>Facility maintenance</b><b>Pest prevention</b><b>Grounds care</b><b>Fleet care</b><b>Workplace support</b></section>

    <section className="biz-services" id="services"><SectionHeading className="biz-section-head" eyebrow="ONE PARTNER. EIGHT CAPABILITIES." title="Services that keep work moving." description="Start with one service or combine several under a single Mwenza account."/><div className="biz-service-grid">{services.map((service,index) => <article key={service.name}><img src={service.image} alt=""/><span>{String(index+1).padStart(2,"0")}</span><div><h3>{service.name}</h3><p>{service.detail}</p><a href="#quote" onClick={() => setSelected([service.name])}>Add to your plan →</a></div></article>)}</div></section>

    <section className="biz-industries" id="industries"><SectionHeading className="biz-section-head left" eyebrow="MADE FOR THE WAY YOU OPERATE" title="Useful across industries." description="Mwenza adjusts staffing, timing, supplies and service standards to each location."/><div className="industry-grid">{industries.map((industry,index) => <article key={industry[0]}><span>{String(index+1).padStart(2,"0")}</span><h3>{industry[0]}</h3><p>{industry[1]}</p></article>)}</div></section>

    <section className="biz-how" id="how"><SectionHeading className="biz-section-head" eyebrow="FROM REQUEST TO ROUTINE" title="Simple to start. Easy to manage."/><div className="biz-how-grid"><article><span>1</span><h3>Tell us the scope</h3><p>Choose services, locations and the schedule you need.</p></article><article><span>2</span><h3>Walk through the site</h3><p>For larger jobs, we verify requirements before pricing.</p></article><article><span>3</span><h3>Approve one plan</h3><p>Review clear scope, service standards and total pricing.</p></article><article><span>4</span><h3>Track every visit</h3><p>See schedules, completed work, issues and invoices.</p></article></div></section>

    <section className="biz-government-bridge">
      <div><small>PUBLIC SECTOR SERVICES</small><h2>Government and institutions have a dedicated path.</h2><p>Procurement-ready plans for schools, healthcare facilities, county offices, public compounds and agency fleets.</p><a href="/government">Explore government & institutional services →</a></div>
      <img src="/business-support.webp" alt="Mwenza team supporting an institutional facility"/>
    </section>

    <section className="biz-plans" id="plans"><SectionHeading className="biz-section-head left" eyebrow="FLEXIBLE SERVICE MODELS" title="Use Mwenza your way."/><div className="biz-plan-grid"><article><span>ON DEMAND</span><h3>Extra help, when needed.</h3><p>Individual jobs with clear scope and confirmed pricing.</p><ul><li>No contract</li><li>Single location</li><li>Standard scheduling</li></ul><a href="#quote">Request service →</a></article><article className="popular"><span>ROUTINE · MOST POPULAR</span><h3>Your regular service calendar.</h3><p>Reserved weekly or monthly visits with consistent standards.</p><ul><li>Priority scheduling</li><li>Preferred teams</li><li>Consolidated billing</li></ul><a href="#quote">Build a routine →</a></article><article><span>MANAGED</span><h3>One plan across operations.</h3><p>Coordinated services for multiple locations, teams or fleets.</p><ul><li>Dedicated contact</li><li>Custom service levels</li><li>Monthly reporting</li></ul><a href="#quote">Talk to Mwenza →</a></article></div></section>

    <section className="biz-dashboard"><div><small>ONE VIEW OF EVERY SERVICE</small><h2>Know what’s done, what’s next and what it costs.</h2><p>A Mwenza account keeps locations, schedules, service notes and billing together.</p><ul><li>Upcoming and completed visits</li><li>Location-specific service instructions</li><li>Issue reporting and service history</li><li>One monthly invoice</li></ul></div><div className="dashboard-ui"><header><b>Good morning, Karibu Stays</b><span>August 2026</span></header><div className="dash-metrics"><span><small>Active locations</small><b>6</b></span><span><small>Visits this month</small><b>42</b></span><span><small>On-time</small><b>98%</b></span></div><h4>Upcoming</h4><article><i className="clean-dot"/><div><b>Westlands · Turnover clean</b><small>Today, 11:00 AM · Team A</small></div><strong>Confirmed</strong></article><article><i className="linen-dot"/><div><b>Kilimani · Linen delivery</b><small>Tomorrow, 8:30 AM · 46 kg</small></div><strong>Scheduled</strong></article><article><i className="fleet-dot"/><div><b>Industrial Area · Fleet wash</b><small>Friday, 6:00 PM · 12 vehicles</small></div><strong>Scheduled</strong></article></div></section>

    <section className="biz-quote" id="quote"><div className="biz-quote-copy"><small>BUILD YOUR MWENZA PLAN</small><h2>Tell us what your business needs.</h2><p>We’ll confirm the scope, recommend a schedule and return a clear quote. No commitment.</p><div><span>1</span> Select the services</div><div><span>2</span> Add your operation details</div><div><span>3</span> Receive a tailored plan</div></div><div className="quote-panel">{submitted ? <div className="biz-success"><span>✓</span><small>REQUEST RECEIVED</small><h3>Your Mwenza plan is next.</h3><p>A business specialist will contact {businessName} through {contact} to verify the details and prepare your quote.</p><button onClick={() => setSubmitted(false)}>Start another request</button></div> : <><div className="quote-step"><span>QUICK REQUEST</span><b>Choose all that apply</b></div><SelectionGrid items={services.map(service => service.name)} selected={selected} onToggle={toggle} className="quote-services"/><label>Service frequency</label><div className="quote-frequency">{["One time","Weekly","Monthly","Not sure"].map(item => <button key={item} type="button" aria-pressed={frequency === item} className={frequency === item ? "selected" : ""} onClick={() => setFrequency(item)}>{item}</button>)}</div><div className="quote-fields"><label>Business name<input required value={businessName} onChange={event => setBusinessName(event.target.value)} placeholder="Company or property" autoComplete="organization"/></label><label>Number of locations<input required min="1" value={locationCount} onChange={event => setLocationCount(event.target.value)} placeholder="e.g. 3" inputMode="numeric" type="number"/></label></div><label>Work email or phone<input required value={contact} onChange={event => setContact(event.target.value)} placeholder="How should we reach you?" autoComplete="email"/></label><button className="quote-submit" disabled={!requestReady} onClick={() => setSubmitted(true)}>Request my service plan <span>→</span></button><small className="quote-note" aria-live="polite">{requestReady ? "No payment required. We verify scope before quoting." : "Add your business name, locations and contact details to continue."}</small></>}</div></section>

    <section className="biz-faq"><SectionHeading className="biz-section-head left" eyebrow="COMMON QUESTIONS" title="Before we get started."/><div>{[["Can we combine services?","Yes. Cleaning, linen, fundi, fleet and support work can sit under one account and invoice."],["Do you supply equipment?","We can include standard supplies and equipment in your plan or follow your site requirements."],["Can Mwenza cover multiple locations?","Yes. Managed plans coordinate schedules, teams and reporting across multiple sites."],["Are providers vetted?","Mwenza verifies provider identity and assigns work based on the skills required for each service."]].map(item => <details key={item[0]}><summary>{item[0]}<span>+</span></summary><p>{item[1]}</p></details>)}</div></section>

    {requestError&&<div className="biz-request-error" role="alert">{requestError}</div>}
    <SiteFooter/>
  </main>;
}
