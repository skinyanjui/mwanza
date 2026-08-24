"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import SiteHeader from "../../components/site-header";
import { trapDialogFocus } from "../../components/dialog-focus";

const visits = [
  { site: "Westlands office", service: "Commercial cleaning", time: "Today · 6:00 PM", team: "Team Wanjiku", status: "Confirmed" },
  { site: "Kilimani apartments", service: "Linen & turnovers", time: "Tomorrow · 9:00 AM", team: "Team Amina", status: "Scheduled" },
  { site: "Industrial Area", service: "Fleet washing", time: "Friday · 5:30 PM", team: "Team Otieno", status: "Scheduled" },
];

type Incident = { id: string; location?: string; category: string; details: string; priority: string; status: string; createdAt: string };
type Visit = { site: string; service: string; time: string; team: string; status: string };

export default function BusinessDashboard() {
  const [tab, setTab] = useState("Overview");
  const [issue, setIssue] = useState(false);
  const [location, setLocation] = useState("Westlands office");
  const [category, setCategory] = useState("Service quality");
  const [details, setDetails] = useState("");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [accountVisits, setAccountVisits] = useState<Visit[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreview(new URLSearchParams(window.location.search).get("demo") === "1"), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!issue) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setIssue(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [issue]);

  useEffect(() => {
    if (!preview) return;
    const controller = new AbortController();
    fetch("/api/incidents", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setIncidents(data.incidents || []);
    }).catch(() => {});
    fetch("/api/bookings", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      const businessBookings = (data.bookings || []).filter((item: { customerType?: string }) => item.customerType === "Business");
      setAccountVisits(businessBookings.map((item: { address: string; option: string; scheduledDay: string; scheduledTime: string; assignedProviderName?: string; status: string }) => ({ site: item.address, service: item.option, time: `${item.scheduledDay} · ${item.scheduledTime}`, team: item.assignedProviderName || "Team pending", status: item.status })));
    }).catch(() => {});
    return () => controller.abort();
  }, [preview]);

  const reportIssue = async () => {
    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/incidents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reporterType: "business", location, category, details }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send the report.");
      const created: Incident = { id: data.id, location, category, details, priority: data.priority, status: data.status, createdAt: new Date().toISOString() };
      setIncidents((current) => [created, ...current]);
      setIssue(false);
      setDetails("");
      setMessage(`Issue ${data.id} is now with Mwenza Operations.`);
      setTab("Issues");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not send the report.");
    } finally {
      setSending(false);
    }
  };
  const displayVisits = accountVisits.length ? accountVisits : visits;

  if (preview === null) return <main className="workspace-access-page"><SiteHeader/><section><img src="/mwenza-mark.png" alt=""/><small>BUSINESS WORKSPACE</small><h1>Opening the workspace…</h1><p>Checking the selected workspace mode.</p></section></main>;
  if (!preview) return <main className="workspace-access-page"><SiteHeader/><section><img src="/mwenza-mark.png" alt=""/><small>BUSINESS WORKSPACE</small><h1>Client access is required.</h1><p>Live business authentication is not connected yet. Sign in when your account is ready, or explore the clearly labelled demo workspace.</p><a href="/account">Go to sign in</a><a className="provider-preview-link" href="/business/dashboard?demo=1">Preview the workspace</a></section></main>;

  return <main className="business-portal">
    <SiteHeader />
    <div className="business-portal-bar"><a href="/business">← Mwenza for Business</a><span>Karibu Stays <i>Demo workspace</i></span><a href="/account">Customer account →</a></div>
    <div className="business-portal-shell">
      <aside><small>WORKSPACE</small>{["Overview", "Schedule", "Locations", "Issues", "Invoices"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<span>→</span></button>)}<div><small>ACCOUNT MANAGER</small><b>Lucy W.</b><a href="mailto:business@mwenza.co.ke">Contact Lucy →</a></div></aside>
      <section>
        <header><div><small>{tab.toUpperCase()}</small><h1>{tab === "Overview" ? "Good morning, Karibu Stays." : tab}</h1><p>{tab === "Overview" ? "Here’s what Mwenza is handling across your operation." : "Manage your business services in one place."}</p></div><div><button onClick={() => { setIssue(true); setMessage(""); }}>Report an issue</button><a href="/book?audience=business">Request service →</a></div></header>
        {message && <div className={message.startsWith("Issue ") ? "portal-alert" : "book-submit-error"}><span>{message.startsWith("Issue ") ? "✓" : "!"}</span><div><b>{message}</b><p>{message.startsWith("Issue ") ? "Updates will appear in this workspace." : "Check your details and try again."}</p></div></div>}
        {(tab === "Overview" || tab === "Schedule") && <><div className="business-metric-grid"><article><small>ACTIVE LOCATIONS</small><b>{accountVisits.length ? new Set(accountVisits.map((item) => item.site)).size : 6}</b><span>Across Nairobi</span></article><article><small>UPCOMING VISITS</small><b>{displayVisits.length}</b><span>{accountVisits.length ? "Live account schedule" : "Managed plan preview"}</span></article><article><small>ON-TIME RATE</small><b>98%</b><span className="positive">Service target 95%</span></article><article><small>NEXT INVOICE</small><b>KSh 84,200</b><span>Due 1 September</span></article></div><div className="business-visit-head"><div><h2>Upcoming visits</h2><p>Teams, locations and arrival windows.</p></div><button onClick={() => setTab("Schedule")}>Full schedule →</button></div><div className="business-visits">{displayVisits.map((visit, index) => <article key={`${visit.site}-${index}`}><span className={`business-visit-mark mark-${index}`}>{String(index + 1).padStart(2, "0")}</span><div><small>LOCATION</small><b>{visit.site}</b></div><div><small>SERVICE</small><b>{visit.service}</b></div><div><small>ARRIVAL</small><b>{visit.time}</b></div><div><small>ASSIGNED TEAM</small><b>{visit.team}</b></div><strong>{visit.status}</strong></article>)}</div></>}
        {tab === "Locations" && <div className="business-location-grid">{["Westlands office", "Kilimani apartments", "Industrial Area fleet yard", "Karen guest house", "Parklands retail", "Lavington residence"].map((name, index) => <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><h3>{name}</h3><p>{index % 2 ? "Cleaning · Linen" : "Cleaning · Facilities"}</p><b>{index < 3 ? "Service this week" : "Service next week"}</b></article>)}</div>}
        {tab === "Issues" && <div className="business-issues">{incidents.length ? incidents.map((item) => <article className={item.priority === "High" ? "high" : ""} key={item.id}><span>{item.priority}</span><div><small>{item.id} · {item.location || "Business account"}</small><h3>{item.category}</h3><p>{item.details}</p></div><strong>{item.status}</strong></article>) : <div><span>✓</span><h3>No open service issues</h3><p>When you report a missed item, damaged item or access problem, resolution progress appears here.</p><button onClick={() => setIssue(true)}>Report an issue</button></div>}</div>}
        {tab === "Invoices" && <div className="business-invoices"><header><span>August 2026</span><b>KSh 84,200</b><strong>Open</strong><button onClick={() => window.print()}>Print invoice</button></header>{[["Commercial cleaning", "KSh 42,000"], ["Linen & turnovers", "KSh 25,400"], ["Fleet washing", "KSh 16,800"]].map((item) => <div key={item[0]}><span>{item[0]}</span><b>{item[1]}</b></div>)}<footer><span>Payment terms</span><b>Net 30 · M-Pesa or bank transfer</b></footer></div>}
      </section>
    </div>
    {issue && <div className="portal-modal" role="dialog" aria-modal="true" aria-labelledby="business-issue-title"><div onKeyDown={trapDialogFocus}><button autoFocus aria-label="Close issue form" className="portal-modal-close" onClick={() => setIssue(false)}>×</button><small>REPORT AN ISSUE</small><h3 id="business-issue-title">What needs attention?</h3><p>Your account manager and operations team will both receive this report.</p><label>Location<select value={location} onChange={(event) => setLocation(event.target.value)}><option>Westlands office</option><option>Kilimani apartments</option><option>Industrial Area</option></select></label><label>Issue type<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Service quality</option><option>Missed service</option><option>Access problem</option><option>Property damage</option><option>Safety concern</option><option>Billing question</option></select></label><label>What happened?<textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Describe what happened and what outcome you need." /></label>{message && !message.startsWith("Issue ") && <p className="provider-error">{message}</p>}<button className="portal-modal-primary" disabled={details.trim().length < 10 || sending} onClick={reportIssue}>{sending ? "Sending…" : "Send to operations →"}</button></div></div>}
  </main>;
}
