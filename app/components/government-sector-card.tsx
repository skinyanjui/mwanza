/* eslint-disable @next/next/no-img-element */

type GovernmentSectorCardProps = {
  index: number;
  title: string;
  description: string;
  image: string;
};

export default function GovernmentSectorCard({ index, title, description, image }: GovernmentSectorCardProps) {
  return <article className="government-sector-card">
    <img src={image} alt={`Mwenza professionals supporting ${title.toLowerCase()}`}/>
    <div className="government-sector-body">
      <header><span>{String(index + 1).padStart(2, "0")}</span><small>INSTITUTION PROFILE</small></header>
      <h3>{title}</h3>
      <p>{description}</p>
      <a href="#public-services">View eligible services →</a>
    </div>
  </article>;
}
