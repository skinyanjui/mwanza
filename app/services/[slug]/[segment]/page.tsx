import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetailTemplate from "../../service-detail-template";
import { getService, serviceData } from "../../service-data";
import { getSegmentPresentation, isServiceSegment, serviceSegments } from "../../service-segments";

export function generateStaticParams() {
  return serviceData.flatMap(service => serviceSegments.map(segment => ({ slug: service.slug, segment })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; segment: string }> }): Promise<Metadata> {
  const { slug, segment } = await params;
  const service = getService(slug);
  if (!service || !isServiceSegment(segment)) return {};
  const presentation = getSegmentPresentation(service, segment);
  const title = `${presentation.title} for ${presentation.shortLabel} in Nairobi | Mwenza`;
  const canonical = `/services/${service.slug}/${segment}`;
  return {
    title,
    description: presentation.description,
    alternates: { canonical },
    openGraph: { title, description: presentation.description, images: [{ url: presentation.image, alt: `${presentation.title} from Mwenza Kenya` }] },
    twitter: { card: "summary_large_image", title, description: presentation.description, images: [presentation.image] },
  };
}

export default async function SegmentServicePage({ params }: { params: Promise<{ slug: string; segment: string }> }) {
  const { slug, segment } = await params;
  const service = getService(slug);
  if (!service || !isServiceSegment(segment)) notFound();
  return <ServiceDetailTemplate service={service} segment={segment}/>;
}

