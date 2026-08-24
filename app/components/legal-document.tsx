import type { LegalDocument as LegalDocumentType } from "../legal/legal-data";
import Link from "next/link";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";

function linkedText(text: string) {
  const match = text.match(/https:\/\/\S+/);
  if (!match) return text;
  const url = match[0].replace(/[.,)]$/, "");
  const start = text.indexOf(url);
  const before = text.slice(0, start);
  const after = text.slice(start + url.length);
  return <>{before}<a href={url} target="_blank" rel="noreferrer">Kenya Law</a>{after}</>;
}

export default function LegalDocument({ document }: { document: LegalDocumentType }) {
  return <main className="legal-page">
    <SiteHeader/>
    <header className="legal-hero"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/legal">Legal</Link><span>/</span><b>{document.shortTitle}</b></nav><small>MWENZA LEGAL</small><h1>{document.title}</h1><p>{document.summary}</p><div><span>Effective 24 August 2026</span><span>Kenya</span></div></header>
    <div className="legal-shell"><aside><b>In this document</b>{document.sections.map(section => <a key={section.heading} href={`#${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{section.heading}</a>)}</aside><article>{document.sections.map((section, index) => <section key={section.heading} id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}><span>{String(index + 1).padStart(2, "0")}</span><h2>{section.heading}</h2>{section.paragraphs?.map(paragraph => <p key={paragraph}>{linkedText(paragraph)}</p>)}{section.bullets && <ul>{section.bullets.map(item => <li key={item}>{item}</li>)}</ul>}</section>)}<div className="legal-contact"><b>Questions about this document?</b><p>Email <a href="mailto:hello@mwenza.co.ke">hello@mwenza.co.ke</a>. These public pages provide general platform terms and should be reviewed by Kenyan counsel before commercial launch.</p></div></article></div>
    <SiteFooter/>
  </main>;
}
