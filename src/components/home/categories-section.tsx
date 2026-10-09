import Image from "next/image";
import { categories } from "@/data/store";
import Link from "next/link";
import { SectionHeading } from "./section-heading";

export function CategoriesSection() {
  return (
    <section id="categories" className="home-section categories-section" aria-labelledby="categories-title">
      <SectionHeading id="categories-title" title="Categories" seeAll seeAllHref="/shop" />
      <div className="category-row scroll-row">
        {categories.map((category) => <Link href={category.href} key={category.id} className="category-item" aria-label={`Shop ${category.name} collection`}><span className="category-image"><Image src={category.photo.src} alt={category.photo.alt} fill sizes="(min-width: 768px) 110px, 18vw" /></span><span>{category.name}</span></Link>)}
      </div>
    </section>
  );
}
