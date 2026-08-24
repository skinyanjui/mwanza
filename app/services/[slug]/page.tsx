import { notFound, redirect } from "next/navigation";
import { getService, serviceData } from "../service-data";

export function generateStaticParams() {
  return serviceData.map(service => ({ slug: service.slug }));
}

export default async function LegacyServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getService(slug)) notFound();
  redirect(`/services/${slug}/home`);
}
