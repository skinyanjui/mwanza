import type { ReactNode } from "react";
import type { ServiceSlug } from "../data/marketplace-services";

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

export default function ServiceIcon({ slug }: { slug: ServiceSlug }) {
  switch (slug) {
    case "laundry":
      return <Icon><path d="M8 7.5 12 5l4 2.5 2.5 3V20H5.5V10.5L8 7.5z"/><path d="M8 7.5 12 12l4-4.5"/></Icon>;
    case "cleaning":
      return <Icon><path d="M12 3.5v3.5M12 17v3.5M3.5 12H7M17 12h3.5M6.2 6.2 8.6 8.6M15.4 15.4l2.4 2.4M17.8 6.2 15.4 8.6M8.6 15.4 6.2 17.8"/></Icon>;
    case "cooking":
      return <Icon><path d="M8 9V7.5a4 4 0 0 1 8 0V9"/><path d="M4.5 10.5h15"/><path d="M6 10.5v6.5a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-6.5"/></Icon>;
    case "fundi":
      return <Icon><path d="M14.6 6.4a3.6 3.6 0 0 0-5 5.1L5 16.1V20h3.9l4.6-4.6a3.6 3.6 0 0 0 5.1-5l-2.8 2.8-3-3 2.8-2.8z"/></Icon>;
    case "auto-care":
      return <Icon><path d="M4.5 15.5v-1.2L6.8 9.5h10.4l2.3 4.8v1.2"/><path d="M4 14h16"/><circle cx="7" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/></Icon>;
    case "home-support":
      return <Icon><path d="M4.5 11 12 4.5 19.5 11v8.5h-15V11z"/><path d="M10 19.5v-6h4v6"/></Icon>;
    case "pest-control":
      return <Icon><path d="M8 9.5h8V16a4 4 0 0 1-8 0V9.5z"/><path d="M12 9.5V6.5M9.5 6.5h5"/><path d="M5 12h3M16 12h3M5 16h3M16 16h3"/></Icon>;
    case "outdoor-care":
      return <Icon><path d="M6 19c7-.8 11.5-7 12.5-14C12.5 6 6 11 6 19z"/><path d="M8.5 16.5c2.6-2.6 5.2-7 6-10.5"/></Icon>;
    default: {
      const exhaustive: never = slug;
      throw new Error(`Unhandled service icon: ${exhaustive}`);
    }
  }
}
