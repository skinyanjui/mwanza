"use client";

import { useEffect, useState } from "react";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { trapDialogFocus } from "../components/dialog-focus";
import { firebaseFetch } from "../lib/firebase-api";

const territories = [
  ["Nairobi East", "Embakasi · Donholm · Utawala", "Priority", "Urban launch"],
  ["Nairobi North", "Roysambu · Kasarani · Ruiru", "Priority", "Urban launch"],
  ["Kiambu", "Kiambu Town · Thindigua · Limuru", "Available", "County territory"],
  ["Nakuru", "Nakuru City and surrounding estates", "Available", "City territory"],
  ["Mombasa", "Mombasa Island · Nyali · Bamburi", "Available", "Coastal territory"],
  ["Kisumu", "Kisumu City and surrounding estates", "Available", "City territory"],
  ["Eldoret", "Eldoret City and surrounding estates", "Interest list", "Future territory"],
  ["Nanyuki", "Nanyuki and nearby hospitality corridor", "Interest list", "Special market"],
] as const;

const support = [
  ["Brand and launch", "Local launch plan, brand system and market materials."],
  ["Booking technology", "Customer booking, scheduling and service management tools."],
  ["Operating playbooks", "Recruiting, verification, training and quality standards."],
  ["Commercial sales", "Business service packages, proposals and account support."],
  ["Performance support", "Core reporting, coaching and territory growth planning."],
  ["Service innovation", "New service products and shared platform improvements."],
];

const initialForm = { name: "", contact: "", location: "", details: "" };

export default function FranchisePage() {
  const [territory, setTerritory] = useState("");
  const [form, setForm] = useState(initialForm);
  const [sent, setSent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!territory) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setTerritory(""); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [territory]);

  const openTerritory = (value: string) => {
    setTerritory(value);
    setSent("");
    setError("");
  };
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async () => {
    setSending(true);
    setError("");
    try {
      const response = await firebaseFetch("/api/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationType: "franchise", roleOrTerritory: territory, fullName: form.name, contact: form.contact, location: form.location, details: form.details }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not register your interest.");
      setSent(data.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not register your interest.");
    } finally {
      setSending(false);
    }
  };
  const ready = form.name.trim().length > 1 && form.contact.trim().length > 5 && form.location.trim().length > 1 && form.details.trim().length >= 20;

  return <main className="franchise-page">
    <SiteHeader />
    <section className="franchise-hero">
      <div><small>OWN A MWENZA TERRITORY</small><h1>Build the trusted service company your city needs.</h1><p>Operate a local Mwenza business with a proven brand, booking platform, service playbooks and ongoing support.</p><div><a href="#territories">Explore territories</a><a href="#model">See how it works</a></div></div>
      <aside><small>FRANCHISE PROFILE</small><h2>Built for hands-on local operators.</h2><ul><li>Local market leadership</li><li>Multi-service revenue</li><li>Residential and business customers</li><li>Technology and operating support</li></ul><button onClick={() => openTerritory("Best available territory")}>Start a conversation →</button></aside>
    </section>
    <section className="franchise-proof"><span><b>8</b> service categories</span><span><b>3</b> customer segments</span><span><b>1</b> trusted local operator</span><span><b>Kenya</b> expansion focus</span></section>
    <section className="franchise-model" id="model">
      <div className="franchise-title"><small>THE MWENZA MODEL</small><h2>A local business with a shared operating system.</h2><p>You lead the market. Mwenza provides the brand, customer experience, systems and standards.</p></div>
      <div className="franchise-model-grid">
        <article><span>01</span><h3>Launch your territory</h3><p>Recruit the first service teams, establish local partnerships and introduce Mwenza to your market.</p></article>
        <article><span>02</span><h3>Operate the standard</h3><p>Use Mwenza playbooks for onboarding, scheduling, quality, customer care and business accounts.</p></article>
        <article><span>03</span><h3>Grow across services</h3><p>Start with the strongest local categories and expand into all eight as demand develops.</p></article>
        <article><span>04</span><h3>Build recurring revenue</h3><p>Balance household bookings with recurring commercial cleaning, linen, fleet and support plans.</p></article>
      </div>
    </section>
    <section className="franchise-support"><div><small>WHAT MWENZA PROVIDES</small><h2>You operate locally. We build with you.</h2></div><div>{support.map((item) => <article key={item[0]}><b>{item[0]}</b><p>{item[1]}</p></article>)}</div></section>
    <section className="territories" id="territories">
      <div className="franchise-title"><small>AVAILABLE OPPORTUNITIES</small><h2>Find a market to build.</h2><p>Territories shown are expressions of current expansion interest and remain subject to assessment and approval.</p></div>
      <div className="territory-grid">{territories.map((item) => <article key={item[0]}><div><span className={item[2] === "Priority" ? "priority" : ""}>{item[2]}</span><small>{item[3]}</small></div><h3>{item[0]}</h3><p>{item[1]}</p><button onClick={() => openTerritory(item[0])}>Explore this territory →</button></article>)}</div>
    </section>
    <section className="franchise-fit"><div><small>THE RIGHT OPERATOR</small><h2>Commercially minded. Operationally present. Locally trusted.</h2></div><div><span>✓ Able to lead people and service quality</span><span>✓ Strong knowledge of the local market</span><span>✓ Committed to Mwenza customer standards</span><span>✓ Prepared to invest time and working capital</span><span>✓ Comfortable building residential and B2B sales</span><span>✓ Ready to operate—not only own—the business</span></div></section>
    <section className="franchise-cta"><small>BUILD YOUR MARKET</small><h2>Start the franchise conversation.</h2><p>Tell us where you want to operate and what you bring to the opportunity.</p><button onClick={() => openTerritory("New territory enquiry")}>Register your interest →</button></section>
    <SiteFooter />
    {territory && <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="franchise-dialog-title" onMouseDown={() => setTerritory("")}><div className="modal opportunity-modal" onKeyDown={trapDialogFocus} onMouseDown={(event) => event.stopPropagation()}><button className="close" aria-label="Close franchise enquiry" onClick={() => setTerritory("")}>×</button>{sent ? <div className="opportunity-success"><span>✓</span><small>INTEREST REGISTERED · {sent}</small><h2 id="franchise-dialog-title">Let’s explore the fit.</h2><p>Our expansion team will review your market and operator profile, then contact you about next steps.</p><button className="primary" onClick={() => { setTerritory(""); setForm(initialForm); }}>Done</button></div> : <><small>FRANCHISE ENQUIRY</small><h2 id="franchise-dialog-title">{territory}</h2><p className="modal-intro">This is an initial, non-binding expression of interest.</p><label>Full name<input autoFocus autoComplete="name" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Your name" /></label><label>Phone and email<input autoComplete="email" value={form.contact} onChange={(event) => update("contact", event.target.value)} placeholder="Your contact details" /></label><label>Current town<input autoComplete="address-level2" value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Where are you based?" /></label><label>Why Mwenza?<textarea value={form.details} onChange={(event) => update("details", event.target.value)} placeholder="Tell us about your operating, leadership or business experience" /></label>{error && <p className="provider-error">{error}</p>}<button className="primary" disabled={!ready || sending} onClick={submit}>{sending ? "Sending…" : "Register interest →"}</button></>}</div></div>}
  </main>;
}
