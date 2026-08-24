"use client";
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import AudienceSelector from "../components/audience-selector";

const catalog = {
  laundry: { name: "Laundry", image: "/service-laundry.webp", businessImage: "/business-linen.webp", options: [["Wash & fold",180,"per kg"],["Wash & iron",260,"per kg"],["Dry cleaning",450,"starting"],["Duvets & bedding",650,"starting"]] },
  cleaning: { name: "Cleaning", image: "/service-cleaning.webp", businessImage: "/business-cleaning.webp", options: [["Standard clean",1800,"starting"],["Deep clean",3500,"starting"],["Move-in / out",4500,"starting"],["Sofa & carpet",1500,"starting"]] },
  cooking: { name: "Cooking", image: "/service-cooking.webp", businessImage: "/business-cooking.webp", options: [["Meal preparation",2500,"starting"],["Weekly meal prep",4500,"starting"],["Private cook",3500,"starting"],["Kitchen support",2000,"starting"]] },
  fundi: { name: "Fundi", image: "/service-fundi.webp", businessImage: "/business-fundi.webp", options: [["Plumbing",1200,"starting"],["Electrical",1500,"starting"],["Carpentry",1800,"starting"],["General handyman",1000,"starting"]] },
  "auto-care": { name: "Auto care", image: "/service-auto.webp", businessImage: "/business-fleet.webp", options: [["Exterior wash",1000,"starting"],["Interior clean",1500,"starting"],["Full detailing",4500,"starting"],["Fleet washing",900,"per vehicle"]] },
  "home-support": { name: "Home support", image: "/service-support.webp", businessImage: "/business-support.webp", options: [["Errand runner",800,"starting"],["Home organization",1800,"starting"],["Airbnb turnover",2500,"starting"],["Event support",3000,"starting"]] },
  "pest-control": { name: "Pest control", image: "/service-pest.webp", businessImage: "/business-pest.webp", options: [["Home inspection",1000,"starting"],["Targeted treatment",2500,"starting"],["Kitchen prevention",1800,"starting"],["Recurring protection",2000,"per visit"]] },
  "outdoor-care": { name: "Outdoor care", image: "/service-outdoor.webp", businessImage: "/business-grounds.webp", options: [["Garden tidy-up",1200,"starting"],["Lawn mow & edge",1500,"starting"],["Pruning & shaping",1800,"starting"],["Outdoor cleanup",1500,"starting"]] },
} as const;

type ServiceKey = keyof typeof catalog;
type CustomerType = "Home" | "Business" | "Government & Institution";
const serviceKeys = Object.keys(catalog) as ServiceKey[];
const customerOptions = [
  { value: "Home", label: "Home", description: "Household services" },
  { value: "Business", label: "Business", description: "Locations, teams and fleets" },
  { value: "Government & Institution", label: "Government & institutions", description: "Facilities and public operations" },
] satisfies { value: CustomerType; label: string; description: string }[];

export default function BookPage() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<ServiceKey>("laundry");
  const [option, setOption] = useState(0);
  const [quantity, setQuantity] = useState(5);
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [day, setDay] = useState(1);
  const [time, setTime] = useState("10 AM–12 PM");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [payment, setPayment] = useState("M-Pesa");
  const [complete, setComplete] = useState(false);
  const [customerType, setCustomerType] = useState<CustomerType>("Home");
  const [company, setCompany] = useState("");
  const [frequency, setFrequency] = useState("One time");
  const [locations, setLocations] = useState(1);
  const [scope, setScope] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const timer=window.setTimeout(()=>{const params = new URLSearchParams(window.location.search);
      const requested = params.get("service") as ServiceKey | null;
      if (requested && serviceKeys.includes(requested)) setService(requested);
      const requestedOption = Number(params.get("option"));
      if (Number.isInteger(requestedOption) && requestedOption >= 0 && requestedOption < 4) setOption(requestedOption);
      if (params.get("audience") === "business") setCustomerType("Business");
      if (params.get("audience") === "government") setCustomerType("Government & Institution");
      const draft = window.localStorage.getItem("mwenza_booking_draft");
      if (draft && !params.get("service")) {
        try {
          const saved = JSON.parse(draft);
          if (saved.service && serviceKeys.includes(saved.service)) setService(saved.service);
          if (saved.customerType === "Home" || saved.customerType === "Business" || saved.customerType === "Government & Institution") setCustomerType(saved.customerType);
          setOption(Number(saved.option) || 0); setQuantity(Number(saved.quantity) || 5); setAddress(saved.address || ""); setInstructions(saved.instructions || ""); setScope(saved.scope || ""); setCompany(saved.company || ""); setFrequency(saved.frequency || "One time"); setLocations(Number(saved.locations) || 1);
        } catch { window.localStorage.removeItem("mwenza_booking_draft"); }
      }},0); return()=>window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer=window.setTimeout(()=>{if (customerType !== "Home" && payment === "Cash") setPayment("M-Pesa");
      if (customerType === "Home" && payment === "Invoice") setPayment("M-Pesa");},0); return()=>window.clearTimeout(timer);
  }, [customerType, payment]);

  const current = catalog[service];
  const managedAudience = customerType !== "Home";
  const isGovernment = customerType === "Government & Institution";
  const entityLabel = isGovernment ? "Institution or agency" : "Business";
  const currentImage = managedAudience ? current.businessImage : current.image;
  const selected = current.options[option];
  const total = Number(selected[1]) * (service === "laundry" && option < 2 ? quantity : service === "auto-care" && option === 3 ? quantity : 1);
  const dates = useMemo(() => [0,1,2].map(offset => { const date = new Date(); date.setDate(date.getDate()+offset); return { label: offset===0?"Today":offset===1?"Tomorrow":date.toLocaleDateString("en-KE",{weekday:"long"}), date: date.toLocaleDateString("en-KE",{day:"numeric",month:"short"}) }; }), []);
  const canContinue = step === 1 || (step === 2 && address.trim() && (!managedAudience || company.trim())) || step === 3 || (step === 4 && name.trim() && contact.trim() && (!managedAudience || company.trim()));
  const draft = { service, option, quantity, address, instructions, scope, company, frequency, locations, customerType };
  const saveDraft = () => window.localStorage.setItem("mwenza_booking_draft", JSON.stringify(draft));
  const submitBooking = async () => {
    setSubmitting(true); setSubmitError("");
    const payload = { customerType, company, service: current.name, option: selected[0], address, instructions, scope, frequency, locations, day: dates[day].label, date: dates[day].date, time, name, contact, payment, total };
    try {
      const response = await fetch("/api/bookings", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(payload) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not save booking");
      const booking = { id: result.id, ...payload, status: result.status, createdAt: new Date().toISOString() };
      const existing = JSON.parse(window.localStorage.getItem("mwenza_bookings") || "[]");
      window.localStorage.setItem("mwenza_bookings", JSON.stringify([booking, ...existing.filter((item:{id?:string})=>item.id!==result.id)].slice(0, 12)));
      window.localStorage.removeItem("mwenza_booking_draft"); setBookingId(result.id); setComplete(true);
    } catch (reason) { setSubmitError(reason instanceof Error ? reason.message : "We could not save your request."); }
    finally { setSubmitting(false); }
  };
  const next = () => step < 4 ? setStep(step+1) : submitBooking();

  if (complete) return <main className="booking-page" data-audience={isGovernment ? "government" : customerType === "Business" ? "business" : "home"}><header className="book-nav"><a className="brand" href="/"><span>M</span>mwenza</a><span>{customerType} booking request</span></header><section className="booking-success"><div className="success-mark">✓</div><small>{customerType.toUpperCase()} REQUEST RECEIVED · {bookingId}</small><h1>You’re all set, {name.split(" ")[0]}.</h1><p>We’ll confirm {managedAudience ? `${company}’s service plan` : "your Mwenza professional"}, final scope and price through {contact}.</p><div className="success-card"><span><small>Service</small><b>{selected[0]}</b></span><span><small>When</small><b>{dates[day].label}, {time}</b></span><span><small>Location</small><b>{address}</b></span><span><small>{managedAudience ? "Frequency" : "Estimated from"}</small><b>{managedAudience ? frequency : `KSh ${total.toLocaleString()}`}</b></span></div><div className="booking-next"><i/><span><b>Request received</b><small>Scope and availability confirmation is next.</small></span><i/><span><b>Professional assigned</b><small>You’ll receive their details before arrival.</small></span></div><div className="success-actions"><a href="/account?view=bookings">Track this booking</a><button onClick={() => {setComplete(false);setStep(1)}}>Book another service</button></div></section></main>;

  const stepNames = ["Service","Location","Schedule","Review"];

  return <main className="booking-page" data-audience={isGovernment ? "government" : customerType === "Business" ? "business" : "home"}>
    <header className="book-nav"><a className="brand" href="/"><span>M</span>mwenza</a><span>{step} of 4 · {stepNames[step-1]}</span><a href="/" onClick={saveDraft}>Save & exit</a></header>
    <div className="book-progress"><i style={{width:`${step*25}%`}}/></div>
    <div className={`book-shell ${step===1?"book-shell-focus":""}`}>
      <aside className="book-steps"><small>YOUR BOOKING</small>{[[1,"Service"],[2,"Location"],[3,"Schedule"],[4,"Review"]].map(item => <button key={item[0]} disabled={step<Number(item[0])} aria-current={step===item[0]?"step":undefined} className={step===item[0]?"active":step>Number(item[0])?"done":""} onClick={() => step>Number(item[0]) && setStep(Number(item[0]))}><span>{step>Number(item[0])?"✓":item[0]}</span><b>{item[1]}</b></button>)}<p>About 3 minutes.</p></aside>
      <section className="book-main">
        {step===1 && <><div className="book-heading"><h1>What do you need help with?</h1><p>Choose who the service is for, then select what you need.</p></div><AudienceSelector value={customerType} options={customerOptions} onChange={setCustomerType} className="booking-audience"/><div className="book-categories">{serviceKeys.map(key => <button key={key} aria-pressed={service===key} className={service===key?"selected":""} onClick={() => {setService(key);setOption(0);setScope("")}}><img src={managedAudience?catalog[key].businessImage:catalog[key].image} alt={`${customerType} ${catalog[key].name}`}/><span>{catalog[key].name}</span></button>)}</div><h2 className="book-label">Choose an option</h2><div className="book-options">{current.options.map((item,index) => <button key={item[0]} aria-pressed={option===index} className={option===index?"selected":""} onClick={() => setOption(index)}><span><b>{item[0]}</b><small>{managedAudience?(isGovernment?"Procurement quote":"Volume quote"):`From KSh ${Number(item[1]).toLocaleString()} · ${item[2]}`}</small></span><i>{option===index?"✓":""}</i></button>)}</div>{((service==="laundry"&&option<2)||(service==="auto-care"&&option===3))&&<div className="book-quantity"><span><b>{service==="laundry"?"Estimated weight":"Number of vehicles"}</b><small>Used for your estimate</small></span><div><button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1,quantity-1))}>−</button><b>{quantity} {service==="laundry"?"kg":"vehicles"}</b><button aria-label="Increase quantity" onClick={() => setQuantity(quantity+1)}>+</button></div></div>}<details className="book-optional"><summary>Add job details <span>Optional</span></summary><label className="book-field book-scope">{service==="cleaning"?"Space and rooms":service==="cooking"?"People and dietary needs":service==="fundi"?"What needs attention?":service==="auto-care"?"Vehicle type and condition":service==="laundry"?"Fabric or care preferences":service==="pest-control"?"Pest signs and affected areas":service==="outdoor-care"?"Grounds size and tasks":"Support checklist"}<textarea value={scope} onChange={event=>setScope(event.target.value)} placeholder={service==="cleaning"?"e.g. 3 buildings, daily high-traffic cleaning":service==="cooking"?"e.g. lunch for 80, dietary requirements":service==="fundi"?"Describe the issue, measurements or materials":service==="auto-care"?"e.g. 12 vehicles at one compound":service==="laundry"?"Volumes, care standards and pickup schedule":service==="pest-control"?"Affected buildings, pest signs and compliance needs":service==="outdoor-care"?"Compound size, mowing, pruning and waste handling":"Items, access, reporting and timing"}/></label></details></>}
        {step===2 && <><div className="book-heading"><h1>{managedAudience?"Where will service happen?":"Where should we come?"}</h1><p>{managedAudience?"Add the main location. We’ll confirm any others during scope review.":"Enter the service address."}</p></div>{managedAudience&&<label className="book-field">{entityLabel} name<input autoFocus value={company} onChange={event=>setCompany(event.target.value)} placeholder={isGovernment?"Ministry, county, school or institution":"Company or property"}/></label>}<label className="book-field">{managedAudience?"Main service location":"Service address"}<input autoFocus={!managedAudience} value={address} onChange={event=>setAddress(event.target.value)} placeholder="Estate, street, building or landmark"/></label><div className="address-help"><button onClick={()=>setAddress("Westlands, Nairobi")}>Westlands</button><button onClick={()=>setAddress("Kilimani, Nairobi")}>Kilimani</button><button onClick={()=>setAddress("Karen, Nairobi")}>Karen</button></div><details className="book-optional"><summary>Add access notes <span>Optional</span></summary><label className="book-field">Access and job details<textarea value={instructions} onChange={event=>setInstructions(event.target.value)} placeholder={managedAudience?"Site size, operating hours, access rules or reporting requirements":"Gate instructions, parking, stairs or anything else we should know"}/></label></details><p className="book-privacy">Your full address is only shared with the assigned professional.</p></>}
        {step===3 && <><div className="book-heading"><h1>When works for you?</h1><p>{managedAudience?"Set the service frequency, sites and preferred arrival window.":"Choose a day and arrival window."}</p></div>{managedAudience&&<div className="business-booking-controls business-schedule-controls"><label>Frequency<select value={frequency} onChange={event=>setFrequency(event.target.value)}><option>One time</option><option>Weekly</option><option>Twice weekly</option><option>Monthly</option><option>Custom schedule</option></select></label><div><span><b>Locations</b><small>Number of sites</small></span><div><button aria-label="Remove a location" onClick={()=>setLocations(Math.max(1,locations-1))}>−</button><b>{locations}</b><button aria-label="Add a location" onClick={()=>setLocations(locations+1)}>+</button></div></div></div>}<h2 className="book-label">Day</h2><div className="book-days">{dates.map((item,index)=><button key={item.label} aria-pressed={day===index} className={day===index?"selected":""} onClick={()=>setDay(index)}><b>{item.label}</b><small>{item.date}</small></button>)}</div><h2 className="book-label">Arrival window</h2><div className="book-times">{["8–10 AM","10 AM–12 PM","12–2 PM","2–4 PM","4–6 PM"].map(value=><button key={value} aria-pressed={time===value} className={time===value?"selected":""} onClick={()=>setTime(value)}><span>{value}</span>{time===value&&<b>Selected</b>}</button>)}</div></>}
        {step===4 && <><div className="book-heading"><h1>Review your request.</h1><p>{managedAudience?"We’ll confirm scope, service levels and final pricing.":"Nothing is charged until the final details are confirmed."}</p></div><div className="review-box">{managedAudience&&<div><span>{entityLabel}</span><b>{company}</b><button onClick={()=>setStep(2)}>Edit</button></div>}<div><span>Service</span><b>{selected[0]} · {customerType}</b><button onClick={()=>setStep(1)}>Edit</button></div><div><span>Location</span><b>{address}{managedAudience&&locations>1?` + ${locations-1} more`:""}</b><button onClick={()=>setStep(2)}>Edit</button></div><div><span>Schedule</span><b>{dates[day].label}, {time}{managedAudience?` · ${frequency}`:""}</b><button onClick={()=>setStep(3)}>Edit</button></div></div><div className="contact-grid"><label className="book-field">{managedAudience?"Contact person":"Your name"}<input autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="Full name"/></label><label className="book-field">Phone or email<input autoComplete="email" inputMode="email" value={contact} onChange={event=>setContact(event.target.value)} placeholder="07… or name@email.com"/></label></div><h2 className="book-label">Payment preference</h2><div className="payment-options">{(managedAudience?["M-Pesa","Card","Invoice"]:["M-Pesa","Card","Cash"]).map(value=><button key={value} aria-pressed={payment===value} className={payment===value?"selected":""} onClick={()=>setPayment(value)}><span>{value==="M-Pesa"?"M":value==="Card"?"▭":value==="Invoice"?"30d":"KSh"}</span><b>{value}</b><i>{payment===value?"✓":""}</i></button>)}</div></>}
        {submitError&&<p className="book-submit-error" role="alert">{submitError}</p>}
      </section>
      {step>1&&<aside className="book-summary"><div className="summary-image"><img src={currentImage} alt={`${customerType} ${current.name}`}/><span>{customerType} · {current.name}</span></div><div className="summary-lines"><span><small>Service</small><b>{selected[0]}</b></span>{managedAudience&&<span><small>Frequency</small><b>{frequency}</b></span>}<span><small>Location</small><b>{address||"Add address"}</b></span><span><small>When</small><b>{step>2?`${dates[day].label}, ${time}`:"Choose a time"}</b></span></div>{instructions&&<p className="summary-note">“{instructions}”</p>}<div className="summary-total"><span><small>{managedAudience?"Pricing":"Estimated from"}</small><b>{managedAudience?"Custom quote":`KSh ${total.toLocaleString()}`}</b></span><p>Confirmed before service.</p></div></aside>}
    </div>
    <footer className="book-footer"><button onClick={()=>step>1?setStep(step-1):history.back()}>{step>1?"← Back":"Cancel"}</button><div><span>{managedAudience?(isGovernment?"Procurement pricing":"Business pricing"):"Estimated from"} <b>{managedAudience?"Custom quote":`KSh ${total.toLocaleString()}`}</b></span><button disabled={!canContinue||submitting} onClick={next}>{submitting?"Saving request…":step===4?"Request booking →":"Continue →"}</button></div></footer>
  </main>;
}
