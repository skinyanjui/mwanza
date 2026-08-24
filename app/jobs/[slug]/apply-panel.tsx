"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useState } from "react";

export default function ApplyPanel({ title }: { title: string }) {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [workLink, setWorkLink] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const ready = name.trim().length > 1 && contact.trim().length > 5 && location.trim().length > 1 && experience.trim().length > 19;
  const submit=async()=>{if(!ready||sending)return;setSending(true);setError("");try{const details=workLink.trim()?`${experience}\n\nWork sample or CV: ${workLink.trim()}`:experience;const response=await fetch("/api/applications",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({applicationType:"job",roleOrTerritory:title,fullName:name,contact,location,details})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not submit application");setApplicationId(data.id);setSent(true)}catch(reason){setError(reason instanceof Error?reason.message:"Could not submit application")}finally{setSending(false)}};

  if (sent) return <aside className="job-apply-panel" aria-live="polite">
    <div className="job-apply-success">
      <span>✓</span>
      <small>APPLICATION RECEIVED · {applicationId}</small>
      <h2>Thank you, {name.split(" ")[0]}.</h2>
      <p>We’ll review your application for {title} and contact you through {contact} if your experience matches the role.</p>
      <a href="/jobs">Explore other roles</a>
    </div>
  </aside>;

  return <aside className="job-apply-panel">
    <small>APPLY FOR THIS ROLE</small>
    <h2>Interested in joining Mwenza?</h2>
    <p>Tell us how to reach you and why this work suits you.</p>
    <label>Full name<input required value={name} onChange={event => setName(event.target.value)} placeholder="Your name" autoComplete="name"/></label>
    <label>Phone or email<input required value={contact} onChange={event => setContact(event.target.value)} placeholder="Your contact details" autoComplete="email"/></label>
    <label>Current location<input required value={location} onChange={event => setLocation(event.target.value)} placeholder="Town or neighborhood" autoComplete="address-level2"/></label>
    <label>CV, portfolio or work-sample link <span>Optional</span><input type="url" value={workLink} onChange={event => setWorkLink(event.target.value)} placeholder="https://" autoComplete="url"/></label>
    <label>Relevant experience<textarea required value={experience} onChange={event => setExperience(event.target.value)} placeholder={`Why are you a strong fit for ${title}?`}/></label>
    <button disabled={!ready||sending} onClick={submit}>{sending?"Submitting…":"Submit application →"}</button>
    <em aria-live="polite">{error|| (ready ? "Your application is ready to submit." : "Complete every field and add at least 20 characters about your experience.")}</em>
  </aside>;
}
