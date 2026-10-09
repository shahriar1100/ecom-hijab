import Image from "next/image";
import type { Product } from "@/types/store";
import { formatPrice } from "@/data/store";
import { ComingSoonButton } from "@/components/ui/coming-soon";

export function ProductCard({ product, variant = "standard" }: { product: Product; variant?: "standard" | "compact" | "sale" }) {
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <article className={`product-card product-card-${variant}`}>
      <ComingSoonButton feature={product.name} className="product-link" aria-label={`${product.name}, ${formatPrice(product.price)}${discount ? `, ${discount}% off` : ""} — Coming soon`}>
        <span className="product-image"><Image src={product.photo.src} alt={product.photo.alt} fill sizes={variant === "sale" ? "(min-width: 1328px) 190px, (min-width: 1024px) 15vw, (min-width: 768px) 30vw, 31vw" : "(min-width: 1328px) 288px, (min-width: 1024px) 23vw, (min-width: 768px) 30vw, 47vw"} style={{ objectPosition: product.photo.position }} />{discount > 0 && <span className="discount-badge">-{discount}%</span>}</span>
        <span className="product-details">{variant === "standard" && <span className="product-name">{product.name}</span>}<span className="product-prices"><span className="current-price">{formatPrice(product.price)}</span>{product.originalPrice && <del className="original-price"><span className="sr-only">Original price </span>{formatPrice(product.originalPrice)}</del>}</span></span>
      </ComingSoonButton>
    </article>
  );
}
