import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalDocument from "../../components/legal-document";
import { getLegalDocument, legalDocuments } from "../legal-data";

export function generateStaticParams() {
  return legalDocuments.map(document => ({ slug: document.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) return {};
  return { title: `${document.title} | Mwenza`, description: document.summary };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) notFound();
  return <LegalDocument document={document}/>;
}
