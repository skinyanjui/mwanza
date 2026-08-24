"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { trapDialogFocus } from "./dialog-focus";
import DocumentVault from "./document-vault";
import { useFirebaseAuth } from "./firebase-auth-provider";
import SiteHeader from "./site-header";
import { firebaseFetch } from "../lib/firebase-api";
import { listAccountOrganizations, watchOrganizationBookings, type AccountOrganization } from "../lib/firebase-data";

type Audience = "business" | "government";
type Incident = { id: string; location?: string; category: string; details: string; priority: string; status: string; createdAt: string };
type Visit = { id: string; site: string; service: string; time: string; team: string; status: string };

const experience = {
  business: {
    label: "BUSINESS WORKSPACE",
    name: "Karibu Stays",
    marketingHref: "/business",
    marketingLabel: "Mwenza for Business",
    setup: "business",
    bookAudience: "business",
    manager: "Business support",
    managerEmail: "business@mwenza.co.ke",
    reporterType: "business",
    demoLocations: 6,
    visits: [
      { id: "DEMO-1", site: "Westlands office", service: "Commercial cleaning", time: "Today · 6:00 PM", team: "Team Wanjiku", status: "Confirmed" },
      { id: "DEMO-2", site: "Kilimani apartments", service: "Linen & turnovers", time: "Tomorrow · 9:00 AM", team: "Team Amina", status: "Scheduled" },
      { id: "DEMO-3", site: "Industrial Area", service: "Fleet washing", time: "Friday · 5:30 PM", team: "Team Otieno", status: "Scheduled" },
    ],
  },
  government: {
    label: "GOVERNMENT & INSTITUTION WORKSPACE",
    name: "Nairobi County Facilities",
    marketingHref: "/government",
    marketingLabel: "Mwenza for Government",
    setup: "government",
    bookAudience: "government",
    manager: "Institutional support",
    managerEmail: "government@mwenza.co.ke",
    reporterType: "government",
    demoLocations: 8,
    visits: [
      { id: "DEMO-G1", site: "County headquarters", service: "Public facility cleaning", time: "Today · 5:30 PM", team: "Team Njeri", status: "Confirmed" },
      { id: "DEMO-G2", site: "Community health centre", service: "Grounds & pest prevention", time: "Tomorrow · 7:00 AM", team: "Team Kamau", status: "Scheduled" },
      { id: "DEMO-G3", site: "Public works fleet yard", service: "Fleet washing", time: "Friday · 6:00 PM", team: "Team Otieno", status: "Scheduled" },
    ],
  },
} satisfies Record<Audience, Record<string, unknown> & { visits: Visit[] }>;

function toVisit(item: Record<string, unknown>): Visit {
  return {
    id: String(item.id ?? "MWENZA"),
    site: String(item.address ?? "Service location"),
    service: String(item.option ?? item.service ?? "Mwenza service"),
    time: `${String(item.day ?? item.scheduledDay ?? "Scheduled")} · ${String(item.time ?? item.scheduledTime ?? "Window pending")}`,
    team: String(item.assignedProviderName ?? "Team pending"),
    status: String(item.status ?? "Confirmation pending"),
  };
}

export default function OrganizationWorkspace({ audience }: { audience: Audience }) {
  const firebase = useFirebaseAuth();
  const config = experience[audience];
  const [tab, setTab] = useState("Overview");
  const [issue, setIssue] = useState(false);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Service quality");
  const [details, setDetails] = useState("");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [organizations, setOrganizations] = useState<AccountOrganization[] | null>(null);
  const [activeId, setActiveId] = useState("");
  const [visitData, setVisitData] = useState<{ organizationId: string; visits: Visit[] }>({ organizationId: "", visits: [] });
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
    if (!firebase.configured) {
      const timer = window.setTimeout(() => setOrganizations([]), 0);
      return () => window.clearTimeout(timer);
    }
    if (firebase.loading) return;
    if (!firebase.user) {
      const timer = window.setTimeout(() => setOrganizations([]), 0);
      return () => window.clearTimeout(timer);
    }
    let current = true;
    void listAccountOrganizations(firebase.user.uid, firebase.profile?.organizationIds).then((items) => {
      if (current) setOrganizations(items.filter((item) => item.type === audience));
    }).catch((reason) => {
      if (current) { setOrganizations([]); setMessage(reason instanceof Error ? reason.message : "Organization access could not be loaded."); }
    });
    return () => { current = false; };
  }, [audience, firebase.configured, firebase.loading, firebase.profile?.organizationIds, firebase.user]);

  const activeOrganization = useMemo(() => organizations?.find((item) => item.id === activeId) ?? organizations?.[0] ?? null, [activeId, organizations]);

  useEffect(() => {
    if (!activeOrganization || preview) return;
    return watchOrganizationBookings(activeOrganization.id, (items) => setVisitData({ organizationId: activeOrganization.id, visits: items.map(toVisit) }), (reason) => setMessage(reason.message));
  }, [activeOrganization, preview]);

  useEffect(() => {
    if (!preview && !activeOrganization) return;
    const controller = new AbortController();
    firebaseFetch("/api/incidents", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setIncidents(data.incidents || []);
    }).catch(() => {});
    return () => controller.abort();
  }, [activeOrganization, preview]);

  const liveVisits = activeOrganization && visitData.organizationId === activeOrganization.id ? visitData.visits : [];
  const displayVisits = preview ? config.visits : liveVisits;
  const organizationName = preview ? config.name : activeOrganization?.name ?? "Organization workspace";
  const locations = Array.from(new Set(displayVisits.map((item) => item.site)));
  const openVisits = displayVisits.filter((item) => !["Completed", "Cancelled"].includes(item.status));
  const completedVisits = displayVisits.filter((item) => item.status === "Completed");
  const openIssues = incidents.filter((item) => !["Resolved", "Closed"].includes(item.status));
  const canManageFiles = preview || activeOrganization?.membershipRole === "owner" || activeOrganization?.membershipRole === "manager";
  const effectiveLocation = locations.includes(location) ? location : locations[0] ?? organizationName;

  const reportIssue = async () => {
    setSending(true); setMessage("");
    try {
      const response = await firebaseFetch("/api/incidents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reporterType: config.reporterType, organizationId: activeOrganization?.id, location: effectiveLocation, category, details }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send the report.");
      const created: Incident = { id: data.id, location: effectiveLocation, category, details, priority: data.priority, status: data.status, createdAt: new Date().toISOString() };
      setIncidents((current) => [created, ...current]); setIssue(false); setDetails(""); setMessage(`Issue ${data.id} is now with Mwenza Operations.`); setTab("Issues");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Could not send the report."); }
    finally { setSending(false); }
  };

  if (preview === null || organizations === null || (firebase.configured && firebase.loading)) return <main className="workspace-access-page"><SiteHeader/><section><img src="/mwenza-mark.png" alt=""/><small>{config.label}</small><h1>Opening the workspace…</h1><p>Checking your organization and permissions.</p></section></main>;
  if (!preview && !activeOrganization) return <main className="workspace-access-page"><SiteHeader/><section><img src="/mwenza-mark.png" alt=""/><small>{config.label}</small><h1>Organization access is required.</h1><p>Sign in with an organization account, or explore the labelled demo workspace.</p><a href={`/account?setup=${config.setup}`}>Go to sign in</a><a className="provider-preview-link" href={`/${audience}/dashboard?demo=1`}>Preview the workspace</a></section></main>;

  return <main className="business-portal" data-workspace={audience}>
    <SiteHeader/>
    <div className="business-portal-bar"><a href={config.marketingHref}>← {config.marketingLabel}</a>{!preview && organizations.length > 1 ? <label className="organization-switcher"><span>Organization</span><select value={activeOrganization?.id} onChange={(event) => setActiveId(event.target.value)}>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <span>{organizationName} <i>{preview ? "Demo workspace" : `${activeOrganization?.membershipRole} access`}</i></span>}<a href="/account">Customer account →</a></div>
    <div className="business-portal-shell">
      <aside><small>WORKSPACE</small>{["Overview", "Schedule", "Locations", "Issues", "Invoices & files"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<span>→</span></button>)}<div><small>ACCOUNT SUPPORT</small><b>{config.manager}</b><a href={`mailto:${config.managerEmail}`}>Contact support →</a></div></aside>
      <section>
        <header><div><small>{tab.toUpperCase()}</small><h1>{tab === "Overview" ? `Good morning, ${organizationName}.` : tab}</h1><p>{tab === "Overview" ? "Services, locations, documents and issues in one accountable view." : "Manage this organization without leaving the workspace."}</p></div><div><button onClick={() => { setIssue(true); setMessage(""); }}>Report an issue</button><a href={`/book?audience=${config.bookAudience}`}>Request service →</a></div></header>
        {message && <div className={message.startsWith("Issue ") ? "portal-alert" : "book-submit-error"}><span>{message.startsWith("Issue ") ? "✓" : "!"}</span><div><b>{message}</b><p>{message.startsWith("Issue ") ? "Updates will appear in this workspace." : "Check your access and try again."}</p></div></div>}
        {(tab === "Overview" || tab === "Schedule") && <><div className="business-metric-grid"><article><small>MANAGED LOCATIONS</small><b>{preview ? config.demoLocations : activeOrganization?.locationCount ?? locations.length}</b><span>{preview ? "Demo service plan" : activeOrganization?.frequency ?? "Current organization"}</span></article><article><small>OPEN REQUESTS</small><b>{openVisits.length}</b><span>Awaiting or in service</span></article><article><small>COMPLETED</small><b>{completedVisits.length}</b><span>Recorded service visits</span></article><article><small>OPEN ISSUES</small><b>{openIssues.length}</b><span>{openIssues.length ? "Review required" : "All clear"}</span></article></div><div className="business-visit-head"><div><h2>{tab === "Schedule" ? "Service schedule" : "Upcoming visits"}</h2><p>Teams, locations and arrival windows.</p></div>{tab === "Overview" && <button onClick={() => setTab("Schedule")}>Full schedule →</button>}</div>{displayVisits.length ? <div className="business-visits">{displayVisits.map((visit, index) => <article key={visit.id}><span className="business-visit-mark">{String(index + 1).padStart(2, "0")}</span><div><small>LOCATION</small><b>{visit.site}</b></div><div><small>SERVICE</small><b>{visit.service}</b></div><div><small>ARRIVAL</small><b>{visit.time}</b></div><div><small>ASSIGNED TEAM</small><b>{visit.team}</b></div><strong>{visit.status}</strong></article>)}</div> : <div className="organization-empty"><span>01</span><h3>No service visits yet.</h3><p>Request the first service for this organization. It will appear here as soon as it is saved.</p><a href={`/book?audience=${config.bookAudience}`}>Request service →</a></div>}</>}
        {tab === "Locations" && (locations.length ? <div className="business-location-grid">{locations.map((name, index) => { const locationVisits = displayVisits.filter((visit) => visit.site === name); return <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><h3>{name}</h3><p>{Array.from(new Set(locationVisits.map((visit) => visit.service))).join(" · ")}</p><b>{locationVisits.length} recorded visit{locationVisits.length === 1 ? "" : "s"}</b></article>; })}</div> : <div className="organization-empty"><span>⌖</span><h3>No service locations yet.</h3><p>Locations are created automatically from organization bookings.</p><a href={`/book?audience=${config.bookAudience}`}>Add through a booking →</a></div>)}
        {tab === "Issues" && <div className="business-issues">{incidents.length ? incidents.map((item) => <article className={item.priority === "High" ? "high" : ""} key={item.id}><span>{item.priority}</span><div><small>{item.id} · {item.location || organizationName}</small><h3>{item.category}</h3><p>{item.details}</p></div><strong>{item.status}</strong></article>) : <div><span>✓</span><h3>No open service issues</h3><p>Missed items, access problems and service concerns will appear here with their resolution status.</p><button onClick={() => setIssue(true)}>Report an issue</button></div>}</div>}
        {tab === "Invoices & files" && (preview ? <div className="business-invoices"><header><span>August 2026</span><b>KSh 84,200</b><strong>Demo</strong><button onClick={() => window.print()}>Print sample</button></header>{[["Commercial cleaning", "KSh 42,000"], ["Linen & turnovers", "KSh 25,400"], ["Fleet washing", "KSh 16,800"]].map((item) => <div key={item[0]}><span>{item[0]}</span><b>{item[1]}</b></div>)}<footer><span>Payment terms</span><b>Net 30 · M-Pesa or bank transfer</b></footer></div> : firebase.user && activeOrganization ? <div className="organization-documents"><DocumentVault kind="invoice" uid={firebase.user.uid} entityId={activeOrganization.id} title="Invoices" description="Invoices issued by Mwenza Operations appear here." allowUpload={false}/><DocumentVault kind="procurement" uid={firebase.user.uid} entityId={activeOrganization.id} title={audience === "government" ? "Procurement files" : "Purchase orders & files"} description={canManageFiles ? "Share approved documents with Mwenza Operations." : "Files shared by your organization managers."} uploadLabel={canManageFiles ? "Upload a purchase order or procurement document" : undefined} accept="image/*,.pdf,.doc,.docx" allowUpload={canManageFiles}/></div> : null)}
      </section>
    </div>
    {issue && <div className="portal-modal" role="dialog" aria-modal="true" aria-labelledby="organization-issue-title"><div onKeyDown={trapDialogFocus}><button autoFocus aria-label="Close issue form" className="portal-modal-close" onClick={() => setIssue(false)}>×</button><small>REPORT AN ISSUE</small><h3 id="organization-issue-title">What needs attention?</h3><p>Mwenza Operations will receive this report with your organization details.</p><label>Location<select value={effectiveLocation} onChange={(event) => setLocation(event.target.value)}>{locations.length ? locations.map((item) => <option key={item}>{item}</option>) : <option>{organizationName}</option>}</select></label><label>Issue type<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Service quality</option><option>Missed service</option><option>Access problem</option><option>Property damage</option><option>Safety concern</option><option>Billing question</option></select></label><label>What happened?<textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Describe what happened and the outcome you need."/></label>{message && !message.startsWith("Issue ") && <p className="provider-error">{message}</p>}<button className="portal-modal-primary" disabled={details.trim().length < 10 || sending} onClick={reportIssue}>{sending ? "Sending…" : "Send to operations →"}</button></div></div>}
  </main>;
}
