import { Star } from "lucide-react";
import type { Product } from "@/types/store";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "./section-heading";

type Props = { id: string; title: string; products: Product[]; layout: "new-items" | "popular" | "for-you" };

export function ProductSection({ id, title, products, layout }: Props) {
  return (
    <section id={id} className={`home-section ${layout}-section`} aria-labelledby={`${id}-title`}>
      <SectionHeading id={`${id}-title`} title={title} seeAll={layout !== "for-you"}>{layout === "for-you" && <Star size={19} fill="currentColor" className="recommendation-star" aria-hidden="true" />}</SectionHeading>
      <div className={`product-grid ${layout}-grid ${layout !== "for-you" ? "scroll-row" : ""}`}>
        {products.map((product) => <ProductCard key={product.id} product={product} variant={layout === "popular" ? "compact" : "standard"} />)}
      </div>
    </section>
  );
}
