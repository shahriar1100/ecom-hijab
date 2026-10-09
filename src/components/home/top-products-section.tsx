import Link from "next/link";
import { topProducts } from "@/data/store";
import { ProductPhoto } from "@/components/product/product-photo";
import { SectionHeading } from "./section-heading";

export function TopProductsSection() {
  return (
    <section className="home-section top-products-section" aria-labelledby="top-products-title">
      <SectionHeading id="top-products-title" title="Top Products" seeAll className="top-products-heading" />
      <div className="top-products-row scroll-row">
        {topProducts.map((product) => <Link href={`/products/${product.slug}`} key={product.id} className="top-product" aria-label={`View ${product.name}`}><ProductPhoto photo={product.photo} sizes="(min-width: 768px) 110px, 15vw" /></Link>)}
      </div>
    </section>
  );
}
