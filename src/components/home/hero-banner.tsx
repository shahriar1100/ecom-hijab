import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { hero } from "@/data/store";
import { ComingSoonButton } from "@/components/ui/coming-soon";

export function HeroBanner() {
  return (
    <section className="hero-banner" aria-labelledby="hero-title">
      <Image src={hero.photo.src} alt={hero.photo.alt} fill preload sizes="(min-width: 1328px) 1200px, (min-width: 768px) 90vw, 94vw" className="hero-photo" style={{ objectPosition: hero.photo.position }} />
      <div className="hero-shade" />
      <div className="hero-copy"><h1 id="hero-title">{hero.title[0]}<br />{hero.title[1]}</h1><p>{hero.subtitle}</p><a href="#new-items" className="hero-cta">Explore Collection <ArrowRight aria-hidden="true" /></a></div>
      <div className="hero-pagination" role="group" aria-label="Banner slides"><span className="hero-current-dot" role="img" aria-label="Slide 1 of 3, current slide" />{[2, 3].map((slide) => <ComingSoonButton key={slide} feature="More collections" aria-label={`Banner slide ${slide} — Coming soon`}><span /></ComingSoonButton>)}</div>
    </section>
  );
}
