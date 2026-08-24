"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import SiteHeader from "../../components/site-header";

type Provider = { id: string; fullName: string; location: string; services: string; status: string; acceptingWork: number; rating: number; completedJobs: number };
type Work = { id: string; service: string; option: string; address?: string; area?: string; scheduledDay: string; scheduledDate?: string; scheduledTime: string; total?: number; scope?: string; instructions?: string; contactName?: string; contact?: string; customerType?: string; status: string };

const demoProfile: Provider = { id: "PR-DEMO", fullName: "Amina W.", location: "Kilimani", services: JSON.stringify(["Cleaning", "Laundry & linen"]), status: "Active", acceptingWork: 1, rating: 490, completedJobs: 38 };
const demoAssigned: Work[] = [{ id: "MW-4798", service: "Cleaning", option: "Standard home cleaning", address: "Kilimani, Nairobi", scheduledDay: "Today", scheduledTime: "10:00 AM–12:00 PM", total: 1650, scope: "3 bedrooms · 2 bathrooms · Supplies requested", contactName: "Demo customer", contact: "Contact appears on live assignments", status: "Assigned" }];
const demoAvailable: Work[] = [
  { id: "MW-4821", service: "Cleaning", option: "Standard home cleaning", area: "Kilimani", scheduledDay: "Today", scheduledTime: "2:00–4:00 PM", total: 1450, scope: "2 bedrooms · 2 bathrooms · Supplies on site", status: "Unassigned" },
  { id: "MW-4835", service: "Laundry", option: "Laundry pickup & fold", area: "Lavington", scheduledDay: "Tomorrow", scheduledTime: "9:00–11:00 AM", total: 1120, scope: "Estimated 6 kg · Pickup and return", status: "Unassigned" },
];

function parseServices(value: string) {
  try { return JSON.parse(value).join(" · "); } catch { return value; }
}

export default function ProviderWorkspace() {
  const [tab, setTab] = useState("Today");
  const [profile, setProfile] = useState<Provider | null | undefined>(undefined);
  const [assigned, setAssigned] = useState<Work[]>([]);
  const [available, setAvailable] = useState<Work[]>([]);
  const [demo, setDemo] = useState(false);
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const preview = new URLSearchParams(window.location.search).get("demo") === "1";
    const timer = window.setTimeout(() => setDemo(preview), 0);
    fetch("/api/provider-work", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Sign in to access provider work.");
      const data = await response.json();
      if (!data.profile && preview) {
        setProfile(demoProfile); setAssigned(demoAssigned); setAvailable(demoAvailable); return;
      }
      setProfile(data.profile);
      setAssigned(data.assignedJobs || []);
      setAvailable(data.availableJobs || []);
    }).catch((reason) => {
      if (preview) { setProfile(demoProfile); setAssigned(demoAssigned); setAvailable(demoAvailable); }
      else { setProfile(null); setMessage(reason instanceof Error ? reason.message : "Could not open provider work."); }
    });
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, []);

  const patchWork = async (body: Record<string, unknown>) => {
    if (demo) return { demo: true };
    const response = await fetch("/api/provider-work", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not update work.");
    return data;
  };

  const toggleAvailability = async () => {
    if (!profile) return;
    const next = !profile.acceptingWork;
    setWorking("availability"); setMessage("");
    try { await patchWork({ action: "availability", acceptingWork: next }); setProfile({ ...profile, acceptingWork: next ? 1 : 0 }); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Could not update availability."); }
    finally { setWorking(""); }
  };

  const acceptJob = async (job: Work) => {
    setWorking(job.id); setMessage("");
    try {
      const data = await patchWork({ action: "accept", bookingId: job.id });
      setAvailable((current) => current.filter((item) => item.id !== job.id));
      setAssigned((current) => [{ ...job, ...(data.booking || {}), address: data.booking?.address || job.area, status: "Provider assigned" }, ...current]);
      setMessage(`${job.id} is now in your schedule.`);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Could not accept the job."); }
    finally { setWorking(""); }
  };

  const advanceJob = async (job: Work) => {
    const action = ["Assigned", "Provider assigned"].includes(job.status) ? "travel" : job.status === "En route" ? "arrive" : job.status === "Arrived" ? "start" : "complete";
    const nextStatus = action === "travel" ? "En route" : action === "arrive" ? "Arrived" : action === "start" ? "In progress" : "Completed";
    setWorking(job.id); setMessage("");
    try { await patchWork({ action, bookingId: job.id }); setAssigned((current) => current.map((item) => item.id === job.id ? { ...item, status: nextStatus } : item)); setMessage(`${job.id} updated to ${nextStatus.toLowerCase()}.`); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Could not update the job."); }
    finally { setWorking(""); }
  };

  if (profile === undefined) return <main className="workspace-access-page"><SiteHeader /><section><img src="/mwenza-mark.png" alt="" /><small>PROVIDER WORKSPACE</small><h1>Loading your work…</h1><p>Checking your provider profile and assignments.</p></section></main>;
  if (!profile) return <main className="workspace-access-page"><SiteHeader /><section><img src="/mwenza-mark.png" alt="" /><small>PROVIDER WORKSPACE</small><h1>Your provider profile is not active yet.</h1><p>{message || "Apply first, then Mwenza Operations will review and activate your account."}</p><a href="/provider#apply">Start or review your application →</a><a className="provider-preview-link" href="/provider/workspace?demo=1">Preview the workspace</a></section></main>;

  const nextJob = assigned.find((item) => !["Completed", "Cancelled"].includes(item.status));
  const score = (profile.rating / 100).toFixed(1);
  const accepting = Boolean(profile.acceptingWork);
  return <main className="provider-workspace">
    <SiteHeader />
    <div className="provider-workspace-bar"><a href="/provider">← Provider home</a><span><i className={accepting ? "online" : ""} /> {accepting ? "Available for work" : "Not accepting work"}</span><button disabled={working === "availability"} onClick={toggleAvailability}>{working === "availability" ? "Updating…" : accepting ? "Go unavailable" : "Go available"}</button></div>
    <div className="provider-workspace-shell">
      <aside><div><span>{profile.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><b>{profile.fullName}</b><small>{parseServices(profile.services)}</small></div><nav>{["Today", "Available jobs", "Schedule", "Earnings", "Quality", "Support"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<span>→</span></button>)}</nav><a href="/account">Switch to customer account</a></aside>
      <section>
        <header><div><small>PROVIDER WORKSPACE{demo ? " · PREVIEW" : ""}</small><h1>{tab === "Today" ? `Good morning, ${profile.fullName.split(" ")[0]}.` : tab}</h1><p>{tab === "Today" ? "Your assigned work and suitable nearby opportunities are ready." : "Manage your Mwenza provider activity."}</p></div><div className="provider-score"><span><small>RATING</small><b>{score}</b></span><span><small>COMPLETED</small><b>{profile.completedJobs}</b></span></div></header>
        {message && <div className="provider-work-message">{message}</div>}
        {(tab === "Today" || tab === "Schedule") && <>{nextJob ? <article className="provider-next-job"><div><small>NEXT JOB · {nextJob.status.toUpperCase()}</small><h2>{nextJob.option}</h2><p>{nextJob.address || nextJob.area} · {nextJob.scheduledDay}, {nextJob.scheduledTime}</p></div><strong>{nextJob.id}</strong><div className="provider-next-grid"><span><small>CUSTOMER</small><b>{nextJob.contactName || "Customer details unavailable"}</b><p>{nextJob.contact || "Ask support if access details are missing"}</p></span><span><small>SCOPE</small><b>{nextJob.scope || "Review service instructions"}</b><p>{nextJob.instructions || "No extra notes"}</p></span><span><small>ESTIMATED PAY</small><b>{nextJob.total ? `KSh ${nextJob.total.toLocaleString()}` : "Quote pending"}</b><p>Payout follows completion review</p></span></div><footer><button onClick={() => setTab("Support")}>Message support</button>{!["Completed", "Cancelled"].includes(nextJob.status) && <button className="primary-action" disabled={working === nextJob.id} onClick={() => advanceJob(nextJob)}>{working === nextJob.id ? "Updating…" : ["Assigned", "Provider assigned"].includes(nextJob.status) ? "Start travel →" : nextJob.status === "En route" ? "Mark arrived →" : nextJob.status === "Arrived" ? "Start service →" : "Mark complete →"}</button>}</footer></article> : <div className="provider-no-work"><small>SCHEDULE CLEAR</small><h2>No active assignment.</h2><p>Keep availability on to see suitable work below.</p></div>}<div className="provider-work-list-head"><div><h2>{tab === "Schedule" ? "All assignments" : "Nearby opportunities"}</h2><p>{tab === "Schedule" ? "Your current and completed Mwenza work." : "Matched to your services and availability."}</p></div>{tab !== "Schedule" && <button onClick={() => setTab("Available jobs")}>View all →</button>}</div></>}
        {(tab === "Today" || tab === "Available jobs") && <div className="provider-job-list">{available.length ? available.map((job) => <article key={job.id}><div><small>{job.id}</small><h3>{job.option}</h3><p>{job.area || job.address}</p></div><div><small>ARRIVAL</small><b>{job.scheduledDay} · {job.scheduledTime}</b><p>{job.scope || `${job.customerType || "Customer"} service`}</p></div><strong>{job.total ? `KSh ${job.total.toLocaleString()}` : "Quote"}</strong><button disabled={!accepting || working === job.id} onClick={() => acceptJob(job)}>{working === job.id ? "Accepting…" : accepting ? "Accept job →" : "Unavailable"}</button></article>) : <div className="provider-list-empty"><b>No suitable open jobs right now.</b><span>New work will appear when it matches your approved services.</span></div>}</div>}
        {tab === "Schedule" && <div className="provider-job-list">{assigned.map((job) => <article key={job.id}><div><small>{job.id}</small><h3>{job.option}</h3><p>{job.address}</p></div><div><small>ARRIVAL</small><b>{job.scheduledDay} · {job.scheduledTime}</b><p>{job.status}</p></div><strong>{job.total ? `KSh ${job.total.toLocaleString()}` : "Quote"}</strong><button onClick={() => setTab("Support")}>Get help</button></article>)}</div>}
        {tab === "Earnings" && <div className="provider-earnings"><div><small>COMPLETED WORK</small><b>{profile.completedJobs} jobs</b><button onClick={() => setTab("Support")}>Payout support →</button></div><div><span><small>WORKSPACE STATUS</small><b>{profile.status}</b></span><span><small>OPEN ASSIGNMENTS</small><b>{assigned.filter((item) => !["Completed", "Cancelled"].includes(item.status)).length}</b></span><span><small>PENDING REVIEW</small><b>{assigned.filter((item) => item.status === "Completed").length}</b></span></div><h3>Earnings records</h3><p><span>Completed-job amounts appear after operations review.</span><b>—</b></p></div>}
        {tab === "Quality" && <div className="provider-quality"><div><b>{score}</b><span>★★★★★</span><p>Your quality score updates after reviewed services.</p></div><ul><li><span>Approved services</span><b>{parseServices(profile.services)}</b></li><li><span>Completed jobs</span><b>{profile.completedJobs}</b></li><li><span>Profile status</span><b>{profile.status}</b></li><li><span>Open quality issues</span><b>View support</b></li></ul></div>}
        {tab === "Support" && <div className="provider-support"><small>PROVIDER SUPPORT</small><h2>Help while you work.</h2><p>Email the provider team with your booking ID. Verified phone and WhatsApp channels will appear here once connected.</p><a href="mailto:providers@mwenza.co.ke"><b>Active jobs, payments and account help</b><span>Email provider support →</span></a></div>}
      </section>
    </div>
  </main>;
}
