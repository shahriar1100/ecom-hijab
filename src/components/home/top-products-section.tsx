import Image from "next/image";
import { topProducts } from "@/data/store";
import { ComingSoonButton } from "@/components/ui/coming-soon";
import { SectionHeading } from "./section-heading";

export function TopProductsSection() {
  return (
    <section className="home-section top-products-section" aria-labelledby="top-products-title">
      <SectionHeading id="top-products-title" title="Top Products" seeAll className="top-products-heading" />
      <div className="top-products-row scroll-row">
        {topProducts.map((product) => <ComingSoonButton feature={product.name} key={product.id} className="top-product" aria-label={`${product.name} — Coming soon`}><Image src={product.photo.src} alt={product.photo.alt} fill sizes="(min-width: 768px) 110px, 15vw" style={{ objectPosition: product.photo.position }} /></ComingSoonButton>)}
      </div>
    </section>
  );
}
