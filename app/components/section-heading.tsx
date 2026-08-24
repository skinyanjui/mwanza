export default function SectionHeading({
  eyebrow,
  title,
  description,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return <header className={className}><small>{eyebrow}</small><h2>{title}</h2>{description && <p>{description}</p>}</header>;
}
