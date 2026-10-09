import Image from "next/image";
import { categories } from "@/data/store";
import { ComingSoonButton } from "@/components/ui/coming-soon";
import { SectionHeading } from "./section-heading";

export function CategoriesSection() {
  return (
    <section id="categories" className="home-section categories-section" aria-labelledby="categories-title">
      <SectionHeading id="categories-title" title="Categories" seeAll />
      <div className="category-row scroll-row">
        {categories.map((category) => <ComingSoonButton feature={`${category.name} collection`} key={category.id} className="category-item" aria-label={`${category.name} collection — Coming soon`}><span className="category-image"><Image src={category.photo.src} alt={category.photo.alt} fill sizes="(min-width: 768px) 110px, 18vw" /></span><span>{category.name}</span></ComingSoonButton>)}
      </div>
    </section>
  );
}
