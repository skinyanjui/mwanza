"use client";
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import DocumentUpload from "../components/document-upload";
import { useFirebaseAuth } from "../components/firebase-auth-provider";
import SiteHeader from "../components/site-header";
import { firebaseFetch } from "../lib/firebase-api";
import { firebaseOperationsAction, watchOperationsData } from "../lib/firebase-data";

type Booking = { id: string; contactName: string; service: string; option: string; address: string; scheduledDay: string; scheduledTime: string; status: string; createdAt: string; assignedProviderId?: string; assignedProviderName?: string };
type Lead = { id: string; businessName: string; services: string; locationCount: number; contact: string; status: string };
type Application = { id: string; fullName: string; applicationType: string; roleOrTerritory: string; location: string; status: string; services?: string };
type Provider = { id: string; fullName: string; ownerEmail?: string; ownerUid?: string; location: string; services: string; status: string; acceptingWork: number; rating: number; completedJobs: number };
type Incident = { id: string; bookingId?: string; reporterType: string; location?: string; category: string; details: string; priority: string; status: string; assignedTo?: string; createdAt: string };

function serviceNames(value: string) {
  try { return JSON.parse(value).join(" · "); } catch { return value; }
}

export default function OperationsPage() {
  const firebase = useFirebaseAuth();
  const [tab, setTab] = useState("Dispatch");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [access, setAccess] = useState<"checking" | "granted" | "denied" | "error">("checking");
  const [working, setWorking] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const loadOperations = async (signal?: AbortSignal) => {
    const response = await firebaseFetch("/api/operations", { signal });
    if (response.status === 401 || response.status === 403) throw new Error("access-denied");
    if (!response.ok) throw new Error("service-unavailable");
    const data = await response.json();
    setBookings(data.bookings || []);
    setLeads(data.businessRequests || []);
    setApplications(data.applications || []);
    setProviders(data.providers || []);
    setIncidents(data.incidents || []);
    setConnected(true);
    setAccess("granted");
  };

  useEffect(() => {
    if (firebase.configured) {
      if (firebase.loading) return;
      if (!firebase.user || !firebase.profile?.roles.includes("operations")) {
        const deniedTimer = window.setTimeout(() => setAccess("denied"), 0);
        return () => window.clearTimeout(deniedTimer);
      }
      const grantedTimer = window.setTimeout(() => { setAccess("granted"); setConnected(true); }, 0);
      const controller = new AbortController();
      const stop = watchOperationsData((section, items) => {
        if (section === "bookings") setBookings(items.map((item) => ({
          ...item,
          contactName: String(item.contactName ?? item.name ?? "Customer"),
          service: String(item.service ?? "Mwenza service"),
          option: String(item.option ?? item.service ?? "Service request"),
          address: String(item.address ?? "Location pending"),
          scheduledDay: String(item.scheduledDay ?? item.day ?? "Schedule pending"),
          scheduledTime: String(item.scheduledTime ?? item.time ?? "Window pending"),
          status: String(item.status ?? "Confirmation pending"),
          createdAt: String(item.createdAt ?? new Date().toISOString()),
          assignedProviderId: item.assignedProviderId ? String(item.assignedProviderId) : item.assignedProviderUid ? String(item.assignedProviderUid) : undefined,
          assignedProviderName: item.assignedProviderName ? String(item.assignedProviderName) : undefined,
        })) as unknown as Booking[]);
        if (section === "organizations") setLeads(items.map((item) => ({ ...item, businessName: String(item.name ?? "Organization"), services: JSON.stringify(item.services ?? []), locationCount: Number(item.locationCount ?? 1), contact: String(item.contact ?? ""), status: String(item.status ?? "New lead") })) as unknown as Lead[]);
        if (section === "applications") setApplications(items.map((item) => ({ ...item, applicationType: "provider", roleOrTerritory: String(item.availability ?? "Service provider"), services: JSON.stringify(item.services ?? []) })) as unknown as Application[]);
        if (section === "providers") setProviders(items.map((item) => ({ ...item, services: JSON.stringify(item.services ?? []), acceptingWork: item.acceptingWork ? 1 : 0 })) as unknown as Provider[]);
      }, () => setAccess("error"));
      firebaseFetch("/api/incidents", { signal: controller.signal }).then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        setIncidents(data.incidents || []);
      }).catch(() => {});
      return () => { window.clearTimeout(grantedTimer); controller.abort(); stop(); };
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => loadOperations(controller.signal).catch((reason) => { if (reason instanceof DOMException && reason.name === "AbortError") return; setAccess(reason instanceof Error && reason.message === "access-denied" ? "denied" : "error"); }), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [firebase.configured, firebase.loading, firebase.profile, firebase.user]);

  const operationsPatch = async (body: Record<string, unknown>) => {
    if (firebase.configured) return firebaseOperationsAction(body);
    const response = await firebaseFetch("/api/operations", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not update operations.");
    return data;
  };

  const assign = async (booking: Booking, provider: Provider) => {
    setWorking(provider.id); setNotice("");
    try {
      const data = await operationsPatch({ action: "assign", bookingId: booking.id, providerId: provider.id });
      setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, assignedProviderId: provider.id, assignedProviderName: provider.fullName, status: data.status } : item));
      setSelected(null);
      setNotice(`${provider.fullName} assigned to ${booking.id}.`);
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Could not assign provider."); }
    finally { setWorking(""); }
  };

  const updateBooking = async (booking: Booking, status: string) => {
    setWorking(`${booking.id}-${status}`); setNotice("");
    try {
      await operationsPatch({ action: "booking-status", bookingId: booking.id, status });
      setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, status } : item));
      setSelected((current) => current?.id === booking.id ? { ...current, status } : current);
      setNotice(`${booking.id} moved to ${status.toLowerCase()}.`);
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Could not update booking."); }
    finally { setWorking(""); }
  };

  const approveProvider = async (application: Application) => {
    setWorking(application.id); setNotice("");
    try {
      const data = await operationsPatch({ action: "approve-provider", applicationId: application.id });
      setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status: data.ownerEmail ? "Approved" : "Approved · email required" } : item));
      if (!firebase.configured) await loadOperations();
      setNotice(data.ownerEmail ? `${application.fullName} is active and can receive work.` : `${application.fullName} is approved but needs an email to activate.`);
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Could not approve provider."); }
    finally { setWorking(""); }
  };

  const advanceLead = async (lead: Lead) => {
    const stages = ["New lead", "Site assessment", "Proposal sent", "Won"];
    const next = stages[Math.min(stages.indexOf(lead.status) + 1, stages.length - 1)] || "Site assessment";
    setWorking(lead.id); setNotice("");
    try { await operationsPatch({ action: "lead-status", requestId: lead.id, status: next }); setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: next } : item)); setNotice(`${lead.businessName} moved to ${next}.`); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Could not update lead."); }
    finally { setWorking(""); }
  };

  const resolveIncident = async (incident: Incident) => {
    setWorking(incident.id); setNotice("");
    try {
      const response = await firebaseFetch("/api/incidents", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: incident.id, status: "Resolved", assignedTo: "Mwenza Operations" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not resolve incident.");
      setIncidents((current) => current.map((item) => item.id === incident.id ? { ...item, status: "Resolved", assignedTo: "Mwenza Operations" } : item));
      setNotice(`${incident.id} marked resolved.`);
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Could not resolve incident."); }
    finally { setWorking(""); }
  };

  const shownBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bookings;
    return bookings.filter((item) => `${item.id} ${item.contactName} ${item.service} ${item.option} ${item.address} ${item.status}`.toLowerCase().includes(query));
  }, [bookings, search]);
  const openIncidents = incidents.filter((item) => !["Resolved", "Closed"].includes(item.status));
  const activeProviders = providers.filter((item) => item.status === "Active" && (item.ownerEmail || item.ownerUid));

  if (access !== "granted") return <main className="workspace-access-page"><SiteHeader /><section><img src="/mwenza-mark.png" alt="" /><small>{access === "checking" ? "VERIFYING ACCESS" : access === "denied" ? "RESTRICTED WORKSPACE" : "SERVICE UNAVAILABLE"}</small><h1>{access === "checking" ? "Opening Mwenza Operations…" : access === "denied" ? "Operations access required." : "Operations could not be reached."}</h1><p>{access === "checking" ? "Checking your administrator permissions." : access === "denied" ? "This workspace is limited to authorized Mwenza operations staff." : "The operations service did not respond. Your access status was not changed."}</p>{access === "denied" && <a href="/">Return to Mwenza →</a>}{access === "error" && <a href="/operations">Try again</a>}</section></main>;

  return <main className="ops-page">
    <SiteHeader />
    <div className="ops-topbar"><div><span className={connected ? "live" : ""} /><b>{connected ? "Live operations data" : "Operations workspace"}</b><small>Nairobi dispatch</small></div><div><label className="ops-search">⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bookings" /></label><button onClick={() => setTab("Incidents")}>Alerts <i>{openIncidents.length}</i></button><a href="/">Exit operations</a></div></div>
    <div className="ops-shell">
      <aside><a className="ops-brand" href="/operations"><img src="/mwenza-mark.png" alt="" /><span><b>Mwenza</b><small>Operations</small></span></a><nav>{["Dispatch", "Bookings", "Business leads", "Providers", "Incidents", "Finance"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}><span>{item}</span><i>{item === "Dispatch" ? bookings.filter((entry) => entry.status === "Confirmation pending" || entry.status === "Unassigned").length : item === "Business leads" ? leads.length : item === "Providers" ? applications.filter((entry) => entry.applicationType === "provider" && !entry.status.startsWith("Approved")).length : item === "Incidents" ? openIncidents.length : ""}</i></button>)}</nav><div className="ops-user"><span>SK</span><div><b>Mwenza admin</b><small>Administrator</small></div></div></aside>
      <section>
        <header><div><small>MWENZA CONTROL CENTRE</small><h1>{tab}</h1><p>{tab === "Dispatch" ? "Confirm, assign and monitor today’s service work." : "Review and manage operational records."}</p></div><div><button onClick={() => setTab("Incidents")}>Review incidents</button><a href="/book">Create booking →</a></div></header>
        {notice && <div className="ops-notice">{notice}</div>}
        {(tab === "Dispatch" || tab === "Bookings") && <><div className="ops-metrics"><article><small>BOOKINGS IN VIEW</small><b>{bookings.length}</b><span>{bookings.filter((item) => item.status === "Completed").length} completed</span></article><article><small>NEEDS ASSIGNMENT</small><b>{bookings.filter((item) => ["Unassigned", "Confirmation pending", "Confirmed"].includes(item.status) && !item.assignedProviderId).length}</b><span className="urgent">Action required</span></article><article><small>ACTIVE PROVIDERS</small><b>{activeProviders.length}</b><span>{providers.length} profiles</span></article><article><small>OPEN INCIDENTS</small><b>{openIncidents.length}</b><span className={openIncidents.length ? "urgent" : ""}>{openIncidents.length ? "Review queue" : "All clear"}</span></article></div><div className="ops-board-head"><div><button className="active">All work <span>{shownBookings.length}</span></button><button onClick={() => setSearch("Tomorrow")}>Tomorrow</button><button onClick={() => setSearch("Unassigned")}>Unassigned</button></div><select onChange={(event) => setSearch(event.target.value === "All services" ? "" : event.target.value)}><option>All services</option><option>Cleaning</option><option>Laundry</option><option>Auto care</option><option>Pest control</option><option>Outdoor care</option></select></div><div className="ops-booking-table"><header><span>Booking</span><span>Customer & location</span><span>Service</span><span>Arrival</span><span>Status</span><span /></header>{shownBookings.map((item) => <article key={item.id}><div><b>{item.id}</b><small>{new Date(item.createdAt).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div><div><b>{item.contactName}</b><small>{item.address}</small></div><div><b>{item.option}</b><small>{item.service}{item.assignedProviderName ? ` · ${item.assignedProviderName}` : ""}</small></div><div><b>{item.scheduledDay}</b><small>{item.scheduledTime}</small></div><strong className={["Unassigned", "Confirmation pending"].includes(item.status) ? "attention" : ""}>{item.status}</strong><button onClick={() => setSelected(item)}>Manage →</button></article>)}{!shownBookings.length && <div className="ops-empty"><b>No bookings match this view.</b><span>Create a booking or clear the current search.</span></div>}</div></>}
        {tab === "Business leads" && <div className="ops-pipeline"><div className="ops-pipeline-head"><h2>Business sales pipeline</h2><span>{leads.length} live enquiries</span></div><div className="ops-pipeline-grid">{["New lead", "Site assessment", "Proposal sent", "Won"].map((status) => <section key={status}><header><b>{status}</b><span>{leads.filter((item) => item.status === status).length}</span></header>{leads.filter((item) => item.status === status).map((item) => <article key={item.id}><small>{item.id}</small><h3>{item.businessName}</h3><p>{serviceNames(item.services)}</p><span>{item.locationCount} location{item.locationCount === 1 ? "" : "s"}</span><button disabled={working === item.id || status === "Won"} onClick={() => advanceLead(item)}>{status === "Won" ? "Account won ✓" : working === item.id ? "Updating…" : "Move forward →"}</button></article>)}</section>)}</div></div>}
        {tab === "Providers" && <><div className="ops-provider-summary"><span><small>ACTIVE PROVIDERS</small><b>{activeProviders.length}</b></span><span><small>AWAITING REVIEW</small><b>{applications.filter((item) => item.applicationType === "provider" && !item.status.startsWith("Approved")).length}</b></span><span><small>ACTIVATION NEEDED</small><b>{providers.filter((item) => item.status === "Activation needed").length}</b></span></div><div className="ops-provider-list"><header><span>Applicant</span><span>Application</span><span>Location</span><span>Status</span><span /></header>{applications.filter((item) => item.applicationType === "provider").map((item) => <article key={item.id}><div><b>{item.fullName}</b><small>{item.id}</small></div><div><b>{item.roleOrTerritory}</b><small>{item.services ? serviceNames(item.services) : item.applicationType}</small></div><b>{item.location}</b><strong>{item.status}</strong><button disabled={working === item.id || item.status.startsWith("Approved")} onClick={() => approveProvider(item)}>{working === item.id ? "Approving…" : item.status.startsWith("Approved") ? "Approved ✓" : "Approve →"}</button></article>)}{!applications.some((item) => item.applicationType === "provider") && <div className="ops-empty"><b>No provider applications yet.</b><span>New submissions from the provider page appear here.</span></div>}</div></>}
        {tab === "Incidents" && <div className="ops-incidents">{incidents.map((item) => <article className={item.priority === "High" ? "high" : ""} key={item.id}><span>{item.priority.toUpperCase()}</span><div><small>{item.id}{item.bookingId ? ` · ${item.bookingId}` : ""} · {item.reporterType.toUpperCase()}</small><h3>{item.category}</h3><p>{item.location || "Location not supplied"} · {item.status} · {item.details}</p></div><button disabled={working === item.id || ["Resolved", "Closed"].includes(item.status)} onClick={() => resolveIncident(item)}>{working === item.id ? "Updating…" : ["Resolved", "Closed"].includes(item.status) ? "Resolved ✓" : "Resolve →"}</button></article>)}{!incidents.length && <div><span>✓</span><h3>No incidents reported</h3><p>Customer, business and provider reports will enter this queue with a persistent status trail.</p></div>}<div><span>✓</span><h3>Safety escalation line</h3><p>For immediate danger, contact emergency services first, then activate the Mwenza safety protocol.</p><a href="tel:+254700000000">Call safety line</a></div></div>}
        {tab === "Finance" && <div className="ops-finance"><div><article><small>COMPLETED BOOKINGS</small><b>{bookings.filter((item) => item.status === "Completed").length}</b><span>Current data</span></article><article><small>ACTIVE WORK</small><b>{bookings.filter((item) => ["Assigned", "Provider assigned", "En route", "In progress"].includes(item.status)).length}</b><span>Provider-linked</span></article><article><small>BUSINESS ACCOUNTS WON</small><b>{leads.filter((item) => item.status === "Won").length}</b><span>Pipeline total</span></article></div><section><header><h2>Finance integration</h2><b>{firebase.configured?"Firebase secured":"Setup required"}</b></header><p><span>M-Pesa settlement</span><b>Not connected</b></p><p><span>Provider payouts</span><b>Not connected</b></p>{firebase.user&&leads[0]&&<DocumentUpload kind="invoice" uid={firebase.user.uid} entityId={leads[0].id} label={`Upload invoice for ${leads[0].businessName}`} accept=".pdf,image/*"/>}<a href="mailto:finance@mwenza.co.ke">Contact finance setup →</a></section></div>}
      </section>
    </div>
    {selected && <div className="ops-drawer"><button className="ops-drawer-close" onClick={() => setSelected(null)}>×</button><small>{selected.id}</small><h2>{selected.option}</h2><p>{selected.contactName} · {selected.address}</p><div><span><small>ARRIVAL</small><b>{selected.scheduledDay} · {selected.scheduledTime}</b></span><span><small>CURRENT STATUS</small><b>{selected.status}</b></span></div><h3>Booking state</h3><div className="ops-drawer-actions"><button disabled={working.startsWith(selected.id)} onClick={() => updateBooking(selected, "Confirmed")}>Confirm request</button><button disabled={working.startsWith(selected.id)} onClick={() => updateBooking(selected, "Unassigned")}>Return to queue</button><button disabled={working.startsWith(selected.id)} onClick={() => updateBooking(selected, "Completed")}>Mark complete</button></div><h3>Assign an active provider</h3>{activeProviders.map((provider) => <button key={provider.id} disabled={working === provider.id} onClick={() => assign(selected, provider)}><span>{provider.fullName} · {(provider.rating / 100).toFixed(1)} ★ · {provider.location}</span><b>{working === provider.id ? "Assigning…" : provider.acceptingWork ? "Available" : "Manual assign"}</b></button>)}{!activeProviders.length && <p className="ops-drawer-empty">Approve a provider with a verified email before assigning work.</p>}<footer><button onClick={() => setSelected(null)}>Close</button><a href={`mailto:?subject=${encodeURIComponent(`Mwenza booking ${selected.id}`)}`}>Contact customer</a></footer></div>}
  </main>;
}
