import { Timer } from "lucide-react";
import { demoSale, saleProducts } from "@/data/store";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "./section-heading";

export function FlashSaleSection() {
  return (
    <section id="flash-sale" className="home-section flash-sale-section" aria-labelledby="flash-sale-title">
      <SectionHeading id="flash-sale-title" title="Flash Sale" seeAll>
        <div className="sale-countdown" aria-label="Demo sale countdown, static preview: 0 hours, 36 minutes, 58 seconds"><span className="countdown-demo">Demo</span><Timer aria-hidden="true" /><span aria-hidden="true">{demoSale.hours}</span><span aria-hidden="true">{demoSale.minutes}</span><span aria-hidden="true">{demoSale.seconds}</span></div>
      </SectionHeading>
      <div className="sale-grid">{saleProducts.map((product) => <ProductCard key={product.id} product={product} variant="sale" />)}</div>
    </section>
  );
}
