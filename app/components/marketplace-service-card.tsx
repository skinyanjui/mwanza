/* eslint-disable @next/next/no-img-element */

type MarketplaceServiceCardProps = {
  title: string;
  description: string;
  price: string;
  image: string;
  detailHref: string;
  actionHref: string;
  actionLabel?: string;
  className?: string;
  /** Airbnb-like catalog tile used on the Home shell. */
  variant?: "default" | "listing";
};

export default function MarketplaceServiceCard({
  title,
  description,
  price,
  image,
  detailHref,
  actionHref,
  actionLabel = "Book",
  className = "",
  variant = "default",
}: MarketplaceServiceCardProps) {
  if (variant === "listing") {
    return (
      <article className={`listing-catalog-card ${className}`.trim()}>
        <a className="listing-catalog-media" href={detailHref} aria-label={`View ${title}`}>
          <img src={image} alt="" />
        </a>
        <div className="listing-catalog-body">
          <div className="listing-catalog-copy">
            <h3><a href={detailHref}>{title}</a></h3>
            <p>{description}</p>
          </div>
          <div className="listing-catalog-meta">
            <b>{price}</b>
            <a href={actionHref}>{actionLabel}</a>
          </div>
        </div>
      </article>
    );
  }

  return <article className={`marketplace-service-card ${className}`.trim()}>
    <a className="marketplace-service-image" href={detailHref} aria-label={`View ${title}`}><img src={image} alt={`${title} from Mwenza`}/></a>
    <div className="marketplace-service-body">
      <h3><a href={detailHref}>{title}</a></h3>
      <p>{description}</p>
      <div className="marketplace-service-bottom"><b>{price}</b><a href={actionHref}>{actionLabel}</a></div>
    </div>
  </article>;
}
