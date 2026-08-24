/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

export default function BrandMark({
  href = "/",
  className = "brand",
}: {
  href?: string;
  className?: string;
}) {
  return <a className={className} href={href} aria-label="Mwenza home"><img src="/mwenza-mark.png" alt=""/>mwenza</a>;
}
