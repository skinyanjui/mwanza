"use client";
/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { useEffect, useRef, useState } from "react";
import BrandMark from "./brand-mark";

const services = [
  ["Laundry", "Washing, ironing and linen", "/services/laundry/home", "/service-laundry.webp"],
  ["Cleaning", "Homes, offices and turnovers", "/services/cleaning/home", "/service-cleaning.webp"],
  ["Cooking", "Meals and weekly preparation", "/services/cooking/home", "/service-cooking.webp"],
  ["Fundi", "Repairs and maintenance", "/services/fundi/home", "/service-fundi.webp"],
  ["Auto care", "Mobile wash and detailing", "/services/auto-care/home", "/service-auto.webp"],
  ["Home support", "Errands and organization", "/services/home-support/home", "/service-support.webp"],
  ["Pest control", "Treatment and prevention", "/services/pest-control/home", "/service-pest.webp"],
  ["Outdoor care", "Gardens and grounds", "/services/outdoor-care/home", "/service-outdoor.webp"],
] as const;

type Menu = "services" | "opportunities" | "location" | "mobile" | null;
type Shell = "home" | "business" | "government";

export default function SiteHeader({
  accountLabel = "Sign in",
  shell = "home",
}: {
  accountLabel?: string;
  shell?: Shell;
}) {
  const [openMenu, setOpenMenu] = useState<Menu>(null);
  const headerRef = useRef<HTMLElement>(null);
  const isHomeShell = shell === "home";

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenMenu(null); };
    const closeOutside = (event: PointerEvent) => { if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null); };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => { document.removeEventListener("keydown", closeOnEscape); document.removeEventListener("pointerdown", closeOutside); };
  }, []);

  useEffect(() => {
    if (openMenu !== "mobile") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [openMenu]);

  const toggle = (menu: Exclude<Menu, null>) => setOpenMenu(current => current === menu ? null : menu);
  const closeFromLink = (event: React.MouseEvent<HTMLElement>) => { if ((event.target as HTMLElement).closest("a")) setOpenMenu(null); };

  return <header className="site-nav" ref={headerRef} data-shell={shell}>
    <BrandMark/>
    <div className="site-nav-right">
      <nav className="desktop-links" aria-label="Primary navigation">
        <details className="mega-menu" open={openMenu === "services"}>
          <summary aria-expanded={openMenu === "services"} aria-controls="services-mega-panel" onClick={event => { event.preventDefault(); toggle("services"); }}>Services <i>⌄</i></summary>
          <div className="mega-panel" id="services-mega-panel" onClick={closeFromLink}>
            <div className="mega-heading">
              <div><small>HOME SERVICES</small><b>Choose a service and get started.</b></div>
              <a href="/book">Book a service →</a>
            </div>
            <div className="mega-layout mega-layout-home">
              <div className="mega-grid">{services.map(service => <a href={service[2]} key={service[0]}><img src={service[3]} alt=""/><span><b>{service[0]}</b><small>{service[1]}</small></span></a>)}</div>
            </div>
            <div className="mega-bottom">
              <a href="/account">Manage bookings</a>
              <a href="/provider">Become a provider</a>
              <a href="/jobs">Find a job</a>
              {!isHomeShell && <a href="/franchise">Own a territory</a>}
              {isHomeShell && <a href="/business">For business</a>}
              {isHomeShell && <a href="/government">Government</a>}
            </div>
          </div>
        </details>
        {!isHomeShell && <a href="/business">Business</a>}
        {!isHomeShell && <a href="/government">Government</a>}
        {!isHomeShell && (
          <details className="opportunity-menu" open={openMenu === "opportunities"}>
            <summary aria-expanded={openMenu === "opportunities"} aria-controls="opportunities-panel" onClick={event => { event.preventDefault(); toggle("opportunities"); }}>Work with us <i>⌄</i></summary>
            <div id="opportunities-panel" onClick={closeFromLink}><a href="/provider"><b>Become a service provider</b><small>Flexible work using your skills</small></a><a href="/jobs"><b>Join the Mwenza team</b><small>Operations and office roles</small></a><a href="/franchise"><b>Own a Mwenza territory</b><small>Build a local service business</small></a></div>
          </details>
        )}
      </nav>

      <details className="location-menu" open={openMenu === "location"}>
        <summary aria-expanded={openMenu === "location"} aria-controls="location-panel" onClick={event => { event.preventDefault(); toggle("location"); }}><span>⌖</span> Nairobi <i>⌄</i></summary>
        <div id="location-panel" onClick={closeFromLink}><small>SERVICE AREA</small><b>Nairobi and surrounding areas</b><p>Westlands · Kilimani · Karen · Lavington · Kileleshwa · Parklands · Runda · Gigiri</p><a href="/book">Check your address</a></div>
      </details>
      <a className="account-link" href="/account">{accountLabel}</a>
      <a className="nav-book" href="/book">Book a service</a>

      <details className="mobile-menu" open={openMenu === "mobile"}>
        <summary aria-label={openMenu === "mobile" ? "Close menu" : "Open menu"} aria-expanded={openMenu === "mobile"} aria-controls="mobile-navigation-panel" onClick={event => { event.preventDefault(); toggle("mobile"); }}><span/><span/><span/></summary>
        <button className="mobile-backdrop" aria-label="Close menu" onClick={() => setOpenMenu(null)}/>
        <div className="mobile-panel" id="mobile-navigation-panel" role="dialog" aria-modal="true" aria-label="Main menu" onClick={closeFromLink}>
          <div className="mobile-panel-head"><BrandMark/></div>
          <div className="mobile-quick-actions"><a href="/book"><b>Book a service</b><span>Home services in Nairobi →</span></a><a href="/account"><b>{accountLabel}</b><span>Bookings and account →</span></a></div>
          <section className="mobile-menu-section">
            <div className="mobile-menu-section-head"><b>Services</b><a href="/#services">View all</a></div>
            <div className="mobile-service-grid">{services.map(service => <a href={service[2]} key={service[0]}><img src={service[3]} alt=""/><span>{service[0]}</span></a>)}</div>
          </section>
          <section className="mobile-menu-section">
            <div className="mobile-menu-section-head"><b>{isHomeShell ? "More" : "For every kind of work"}</b></div>
            <div className="mobile-link-list">
              {isHomeShell ? (
                <>
                  <a href="/provider"><span><b>Become a provider</b><small>Turn your skills into flexible work</small></span><i>→</i></a>
                  <a href="/jobs"><span><b>Find a job</b><small>Join the Mwenza team</small></span><i>→</i></a>
                  <a href="/business"><span><b>For business</b><small>Managed plans for workplaces</small></span><i>→</i></a>
                  <a href="/government"><span><b>Government</b><small>Institutional services</small></span><i>→</i></a>
                </>
              ) : (
                <>
                  <a href="/business"><span><b>Business</b><small>Build a managed service plan</small></span><i>→</i></a>
                  <a href="/government"><span><b>Government</b><small>Procurement-ready facility services</small></span><i>→</i></a>
                  <a href="/provider"><span><b>Become a provider</b><small>Turn your skills into flexible work</small></span><i>→</i></a>
                  <a href="/jobs"><span><b>Find a job</b><small>Join the Mwenza team</small></span><i>→</i></a>
                  <a href="/franchise"><span><b>Own a territory</b><small>Build Mwenza in your area</small></span><i>→</i></a>
                </>
              )}
            </div>
          </section>
          <div className="mobile-location"><span><b>Nairobi</b><small>Current service area</small></span><a href="/book">Check an address</a></div>
        </div>
      </details>
    </div>
  </header>;
}
