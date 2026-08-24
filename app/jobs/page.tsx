"use client";
import { useMemo, useState } from "react";
import SiteHeader from "../components/site-header";
import SiteFooter from "../components/site-footer";
import { jobDetails } from "./job-data";

export default function JobsPage(){
  const [query,setQuery]=useState("");
  const [team,setTeam]=useState("All teams");
  const [type,setType]=useState("All types");
  const [location,setLocation]=useState("All locations");
  const [sort,setSort]=useState("Recommended");
  const teams=["All teams",...Array.from(new Set(jobDetails.map(job=>job[2])))];
  const types=["All types",...Array.from(new Set(jobDetails.map(job=>job[4])))];
  const locations=["All locations","Nairobi","Hybrid","Remote","Kenya-wide"];
  const shown=useMemo(()=>{
    const matchesLocation=(value:string)=>location==="All locations"||(location==="Nairobi"&&value.includes("Nairobi"))||(location==="Hybrid"&&value.includes("Hybrid"))||(location==="Remote"&&value.includes("Remote"))||(location==="Kenya-wide"&&value==="Kenya");
    const filtered=jobDetails.filter(job=>(team==="All teams"||job[2]===team)&&(type==="All types"||job[4]===type)&&matchesLocation(job[3])&&`${job[1]} ${job[2]} ${job[3]} ${job[5]}`.toLowerCase().includes(query.toLowerCase()));
    return [...filtered].sort((a,b)=>sort==="Role A–Z"?a[1].localeCompare(b[1]):sort==="Team"?a[2].localeCompare(b[2]):0);
  },[query,team,type,location,sort]);
  const clear=()=>{setQuery("");setTeam("All teams");setType("All types");setLocation("All locations")};
  const active=[team!=="All teams",type!=="All types",location!=="All locations",query!==""].filter(Boolean).length;
  return <main className="jobboard-page"><SiteHeader/>
    <section className="jobboard-head"><div><small>MWENZA CAREERS</small><h1>Find work that fits.</h1><p>Service, operations, growth and technology opportunities across Kenya.</p></div><a href="/franchise">Explore franchise opportunities →</a></section>
    <section className="jobboard-search"><label><span>Search jobs</span><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Job title, skill or team"/></label><label><span>Location</span><select value={location} onChange={event=>setLocation(event.target.value)}>{locations.map(value=><option key={value}>{value}</option>)}</select></label><a href="#results">Search {shown.length} jobs</a></section>
    <div className="jobboard-shell">
      <aside className="jobboard-filters"><div><b>Filters</b>{active>0&&<button onClick={clear}>Clear {active}</button>}</div><fieldset><legend>Team</legend>{teams.map(value=><label key={value}><input type="radio" name="team" checked={team===value} onChange={()=>setTeam(value)}/><span>{value}</span><small>{value==="All teams"?jobDetails.length:jobDetails.filter(job=>job[2]===value).length}</small></label>)}</fieldset><fieldset><legend>Work type</legend>{types.map(value=><label key={value}><input type="radio" name="type" checked={type===value} onChange={()=>setType(value)}/><span>{value}</span><small>{value==="All types"?jobDetails.length:jobDetails.filter(job=>job[4]===value).length}</small></label>)}</fieldset><div className="jobboard-help"><b>Build your own market</b><p>Interested in operating Mwenza in your city?</p><a href="/franchise">View franchise territories →</a></div></aside>
      <section className="jobboard-results" id="results"><header><div><h2>{shown.length} open roles</h2><p>{active?"Filtered opportunities":"All current Mwenza opportunities"}</p></div><label>Sort by<select value={sort} onChange={event=>setSort(event.target.value)}><option>Recommended</option><option>Role A–Z</option><option>Team</option></select></label></header><div className="mobile-filter-row"><details><summary>Filters {active>0&&<b>{active}</b>}</summary><div><label>Team<select value={team} onChange={event=>setTeam(event.target.value)}>{teams.map(value=><option key={value}>{value}</option>)}</select></label><label>Work type<select value={type} onChange={event=>setType(event.target.value)}>{types.map(value=><option key={value}>{value}</option>)}</select></label><label>Location<select value={location} onChange={event=>setLocation(event.target.value)}>{locations.map(value=><option key={value}>{value}</option>)}</select></label><button onClick={clear}>Clear filters</button></div></details></div>{shown.length?<div className="jobboard-list">{shown.map((job,index)=><a href={`/jobs/${job[0]}`} key={job[0]}><div className="jobboard-logo"><span>M</span></div><div className="jobboard-role"><small>{job[2]}</small><h3>{job[1]}</h3><p>{job[5]}</p><div><span>{job[3]}</span><span>{job[4]}</span><span>{index<5?"New":"Open"}</span></div></div><strong>View role →</strong></a>)}</div>:<div className="jobboard-empty"><b>No matching jobs</b><p>Try removing a filter or searching for a broader role.</p><button onClick={clear}>Clear all filters</button></div>}<footer className="jobboard-alert"><div><b>Hear about future roles</b><p>Email the careers team to join the Mwenza talent list.</p></div><a className="jobboard-alert-action" href="mailto:careers@mwenza.co.ke?subject=Mwenza%20talent%20list">Email the careers team</a></footer></section>
    </div><SiteFooter/>
  </main>;
}
