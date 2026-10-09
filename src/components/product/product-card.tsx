import type { Product } from "@/types/store";
import { formatPrice } from "@/data/store";
import Link from "next/link";
import { ProductPhoto } from "./product-photo";

export function ProductCard({ product, variant = "standard", caption, id }: { product: Product; variant?: "standard" | "compact" | "sale" | "catalog"; caption?: string; id?: string }) {
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <article id={id} data-product-id={product.id} className={`product-card product-card-${variant}`}>
      <Link href={`/products/${product.slug}`} className="product-link" aria-label={`View ${product.name}, ${formatPrice(product.price)}${discount ? `, ${discount}% off` : ""}`}>
        <span className="product-image"><ProductPhoto photo={product.photo} sizes={variant === "catalog" ? "(min-width: 1328px) 230px, (min-width: 1024px) 19vw, (min-width: 768px) 30vw, 47vw" : variant === "sale" ? "(min-width: 1328px) 190px, (min-width: 1024px) 15vw, (min-width: 768px) 30vw, 31vw" : "(min-width: 1328px) 288px, (min-width: 1024px) 23vw, (min-width: 768px) 30vw, 47vw"} />{discount > 0 && <span className="discount-badge">-{discount}%</span>}</span>
        <span className="product-details">{(variant === "standard" || variant === "catalog") && <span className="product-name">{product.name}</span>}{caption && <span className="product-caption">{caption}</span>}<span className="product-prices"><span className="current-price">{formatPrice(product.price)}</span>{product.originalPrice && <del className="original-price"><span className="sr-only">Original price </span>{formatPrice(product.originalPrice)}</del>}</span></span>
      </Link>
    </article>
  );
}
