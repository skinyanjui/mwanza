import Link from "next/link";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { legalDocuments } from "./legal-data";

export default function LegalCenter() {
  return <main className="legal-page legal-center">
    <SiteHeader/>
    <header className="legal-hero"><small>MWENZA LEGAL CENTER</small><h1>Clear rules for every side of the service.</h1><p>Customer, provider, privacy, safety and institutional policies in one place.</p></header>
    <section className="legal-card-grid">{legalDocuments.map((document, index) => <Link key={document.slug} href={`/legal/${document.slug}`}><span>{String(index + 1).padStart(2, "0")}</span><h2>{document.shortTitle}</h2><p>{document.summary}</p><b>Read document →</b></Link>)}</section>
    <SiteFooter/>
  </main>;
}
