/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "../../components/site-header";
import SiteFooter from "../../components/site-footer";
import ApplyPanel from "./apply-panel";
import { getJob, jobDetails } from "../job-data";

type Profile = {
  heading: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  reportsTo: string;
  schedule: string;
  compensation: string;
};

const teamProfiles: Record<string, Profile> = {
  "Field services": {
    heading: "Make every visit feel dependable.",
    summary: "You’ll deliver hands-on service in customer spaces while keeping quality, timing and communication consistent.",
    responsibilities: ["Complete the agreed checklist and document service completion.", "Prepare the right supplies and flag access or scope issues early.", "Care for customer property and leave the space ready to use."],
    requirements: ["Practical experience in the relevant service category.", "Reliable travel within your assigned Nairobi service area.", "Strong hygiene, time-management and customer-care habits."],
    reportsTo: "Area service lead",
    schedule: "Scheduled shifts and customer arrival windows",
    compensation: "Role rate shared before the first interview",
  },
  "Food services": {
    heading: "Turn thoughtful preparation into a reliable meal.",
    summary: "You’ll plan and prepare food in customer or workplace kitchens, with close attention to portions, dietary needs and a clean finish.",
    responsibilities: ["Confirm menus, portions, ingredients and dietary notes before cooking.", "Follow food-safety, storage and kitchen-cleanliness standards.", "Keep preparation on schedule and communicate substitutions early."],
    requirements: ["Professional cooking or high-volume meal-preparation experience.", "Working knowledge of Kenyan dishes and common dietary needs.", "Strong organization, food-safety and customer communication skills."],
    reportsTo: "Food services lead",
    schedule: "Meal-based shifts, including some early or weekend work",
    compensation: "Role or visit rate shared before the first interview",
  },
  "Skilled trades": {
    heading: "Solve the right problem, safely and clearly.",
    summary: "You’ll assess trade requests, explain the work, confirm materials and complete approved tasks to a professional standard.",
    responsibilities: ["Diagnose the task and provide a clear labour and materials estimate.", "Complete only approved work within your verified trade scope.", "Capture completion notes and escalate unsafe or out-of-scope conditions."],
    requirements: ["Demonstrable experience in your listed trade.", "Current credentials where the work or local requirements demand them.", "Your own safe tools, professional conduct and reliable transport."],
    reportsTo: "Skilled services coordinator",
    schedule: "Contract appointments selected around availability",
    compensation: "Per-job labour rate confirmed before acceptance",
  },
  "Auto care": {
    heading: "Deliver a finish customers can see.",
    summary: "You’ll provide mobile washing and detailing at homes, offices and fleet sites, with careful setup and inspection.",
    responsibilities: ["Prepare equipment and confirm water, power and parking access.", "Follow the selected wash or detailing checklist for each vehicle.", "Inspect the finish with the customer and record any pre-existing damage."],
    requirements: ["Vehicle washing or detailing experience.", "Confidence handling cleaning products, tools and mobile equipment safely.", "Reliable travel and disciplined care around customer vehicles."],
    reportsTo: "Auto care operations lead",
    schedule: "Site-based shifts with some weekend availability",
    compensation: "Role rate shared before the first interview",
  },
  "Customer operations": {
    heading: "Make every customer feel supported.",
    summary: "You’ll guide customers through bookings, changes and service questions with calm, accurate and timely communication.",
    responsibilities: ["Resolve booking questions across phone, email and digital support channels.", "Document every handoff and follow open cases through resolution.", "Spot recurring friction and share clear feedback with operations and product teams."],
    requirements: ["Customer support or service-operations experience.", "Excellent written and spoken English and Swahili.", "Sound judgment when handling private customer and booking information."],
    reportsTo: "Customer operations manager",
    schedule: "Rotating weekday and weekend support shifts",
    compensation: "Salary band shared before the first interview",
  },
  "Operations": {
    heading: "Keep service quality moving in real time.",
    summary: "You’ll coordinate providers, schedules and quality signals so customers and service teams know what happens next.",
    responsibilities: ["Monitor work queues, exceptions and service-level commitments.", "Coach providers using clear evidence and documented standards.", "Turn operational patterns into better training and repeatable processes."],
    requirements: ["Experience in field operations, logistics, quality or workforce coordination.", "Comfort using operational data to prioritize action.", "Strong follow-through across customers, providers and internal teams."],
    reportsTo: "Head of operations",
    schedule: "Full-time with rotating operational coverage",
    compensation: "Salary band shared before the first interview",
  },
  "Growth": {
    heading: "Build demand market by market.",
    summary: "You’ll turn local customer needs into practical Mwenza launches, partnerships and recurring business accounts.",
    responsibilities: ["Develop a qualified pipeline and keep opportunity records current.", "Translate customer needs into clear service plans and proposals.", "Partner with operations so every promise can be delivered consistently."],
    requirements: ["Experience in sales, partnerships, market launches or account growth.", "Confident discovery, proposal and negotiation skills.", "A practical understanding of Nairobi or regional Kenyan markets."],
    reportsTo: "Commercial growth lead",
    schedule: "Full-time with customer and field meetings",
    compensation: "Base and incentive structure shared before interview",
  },
  "Technology": {
    heading: "Build tools for work that happens in the real world.",
    summary: "You’ll help shape customer, provider and operations products around clear service workflows and reliable execution.",
    responsibilities: ["Turn real service problems into simple, testable product improvements.", "Collaborate closely with operations, support and growth teams.", "Measure outcomes and improve the experience after launch."],
    requirements: ["A strong portfolio or track record relevant to the role.", "Clear product thinking and collaborative communication.", "Comfort working across discovery, delivery and iteration."],
    reportsTo: "Product and technology lead",
    schedule: "Full-time with flexible hybrid or remote collaboration",
    compensation: "Salary band shared before the first interview",
  },
};

const roleOverrides: Record<string, Partial<Profile>> = {
  "laundry-care-professional": {
    heading: "Care for every garment like it matters.",
    responsibilities: ["Sort garments by fabric, colour and care instructions.", "Wash, press, fold and package orders to the Mwenza garment-care standard.", "Record stains, damage or special handling before processing."],
    requirements: ["Hands-on laundry, pressing or garment-care experience.", "Knowledge of fabric handling, stain care and safe product use.", "Consistent attention to order separation, labelling and presentation."],
  },
  "product-designer": {
    heading: "Design calm experiences for complicated service work.",
    responsibilities: ["Map booking, provider and operations journeys from research to launch.", "Create flows, prototypes and production-ready interface specifications.", "Partner with engineering to protect interaction quality through delivery."],
    requirements: ["A portfolio showing end-to-end product and interaction design work.", "Strong systems thinking, prototyping and usability-research skills.", "Comfort designing responsive tools for customers and operations teams."],
  },
  "full-stack-engineer": {
    heading: "Build reliable systems from booking to completion.",
    responsibilities: ["Ship customer, provider and operations features across the stack.", "Design resilient APIs, data models and observable service workflows.", "Review code and improve performance, security and delivery quality."],
    requirements: ["Production experience with TypeScript, React and server-side systems.", "Strong database, API and testing fundamentals.", "Comfort owning features through deployment and operational follow-up."],
  },
};

export function generateStaticParams(){return jobDetails.map(job=>({slug:job[0]}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const job=getJob(slug);return job?{title:`${job[1]} | Jobs at Mwenza`,description:job[5],alternates:{canonical:`/jobs/${slug}`}}:{}}

export default async function JobPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const job=getJob(slug);
  if(!job)notFound();
  const current=job!;
  const base=teamProfiles[current[2]];
  const profile={...base,...(roleOverrides[current[0]]||{})};

  return <main><SiteHeader/><section className="job-detail-hero"><div><a href="/jobs">← All open roles</a><small>{current[2].toUpperCase()}</small><h1>{current[1]}</h1><p>{current[5]}</p><div><span>{current[3]}</span><span>{current[4]}</span><span>Applications reviewed on a rolling basis</span></div></div></section><section className="job-detail-shell"><div className="job-description">
    <section><small>THE ROLE</small><h2>{profile.heading}</h2><p>{profile.summary}</p><div className="job-role-facts"><span><small>Reports to</small><b>{profile.reportsTo}</b></span><span><small>Working pattern</small><b>{profile.schedule}</b></span><span><small>Compensation</small><b>{profile.compensation}</b></span></div></section>
    <section><small>WHAT YOU’LL DO</small><h2>Your responsibilities.</h2><ul>{profile.responsibilities.map(item=><li key={item}>{item}</li>)}<li>Communicate clearly through Mwenza tools before, during and after the work.</li><li>Protect customer privacy, property and trust at every step.</li></ul></section>
    <section><small>WHAT YOU BRING</small><h2>Experience that helps.</h2><ul>{profile.requirements.map(item=><li key={item}>{item}</li>)}<li>Dependability, good judgment and respectful communication.</li></ul></section>
    <section><small>APPLICATION PROCESS</small><h2>What happens next.</h2><div className="job-process">{[["01","Application review"],["02","Role conversation"],["03","Practical or portfolio review"],["04","References and offer"]].map(item=><span key={item[0]}><small>{item[0]}</small><b>{item[1]}</b></span>)}</div></section>
    <section><small>WORKING AT MWENZA</small><h2>What you can expect.</h2><div className="job-benefits"><span><b>Clear expectations</b>Know the scope and standard.</span><span><b>Training and support</b>Learn the Mwenza way of working.</span><span><b>Room to grow</b>Build toward specialist or leadership roles.</span><span><b>Local impact</b>Make everyday life easier across Kenya.</span></div></section>
    <p className="job-equal">Mwenza welcomes qualified applicants from every background. Final pay, benefits and engagement terms are shared before interviews progress and depend on role type, verification and local requirements.</p>
  </div><ApplyPanel title={current[1]}/></section><section className="job-next"><div><small>KEEP EXPLORING</small><h2>Your next opportunity may be one click away.</h2><p>Browse every open Mwenza role or learn how to lead a local territory.</p></div><div><a href="/jobs">View all open roles →</a><a href="/franchise">Explore franchise opportunities</a></div></section><SiteFooter/></main>;
}
