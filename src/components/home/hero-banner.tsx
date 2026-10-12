"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { hero, photos } from "@/data/store";
import type { HeroBannerConfig } from "@/lib/server/store-repository";

interface HeroBannerProps {
  banner?: HeroBannerConfig;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides: HeroBannerConfig[] = [
    {
      titleLine1: banner?.titleLine1 || hero.title[0],
      titleLine2: banner?.titleLine2 || hero.title[1],
      subtitle: banner?.subtitle || hero.subtitle,
      ctaLabel: banner?.ctaLabel || "Explore Collection",
      ctaHref: banner?.ctaHref || "#new-items",
      imageSrc: banner?.imageSrc || hero.photo.src,
      imageAlt: banner?.imageAlt || hero.photo.alt,
      imagePosition: banner?.imagePosition || hero.photo.position || "center 24%",
    },
    {
      titleLine1: "Signature Modal",
      titleLine2: "& Chiffon Drapes",
      subtitle: "Breathable, lightweight fabrics crafted for effortless all-day grace",
      ctaLabel: "Shop Modal & Chiffon",
      ctaHref: "/shop?fabric=modal",
      imageSrc: photos.sand.src,
      imageAlt: photos.sand.alt,
      imagePosition: photos.sand.position || "center 20%",
    },
    {
      titleLine1: "Limited Time",
      titleLine2: "Flash Sale Edit",
      subtitle: "Exclusive seasonal markdowns on signature hijabs & modest essentials",
      ctaLabel: "Shop Flash Sale",
      ctaHref: "#flash-sale",
      imageSrc: photos.rose.src,
      imageAlt: photos.rose.alt,
      imagePosition: photos.rose.position || "center 18%",
    },
  ];

  const current = slides[activeSlide] ?? slides[0];
  const isExternalImage =
    current.imageSrc.startsWith("http://") || current.imageSrc.startsWith("https://");

  return (
    <section className="hero-banner" aria-labelledby="hero-title">
      <Image
        key={current.imageSrc}
        src={current.imageSrc}
        alt={current.imageAlt}
        fill
        preload={activeSlide === 0}
        unoptimized={isExternalImage}
        sizes="(min-width: 1328px) 1200px, (min-width: 768px) 90vw, 94vw"
        className="hero-photo"
        style={{ objectPosition: current.imagePosition }}
      />
      <div className="hero-shade" />
      <div className="hero-copy">
        <h1 id="hero-title">
          {current.titleLine1}
          <br />
          {current.titleLine2}
        </h1>
        <p>{current.subtitle}</p>
        <a href={current.ctaHref} className="hero-cta">
          {current.ctaLabel} <ArrowRight aria-hidden="true" />
        </a>
      </div>
      <div className="hero-pagination" role="group" aria-label="Banner slides">
        {slides.map((slide, idx) => {
          const isCurrent = idx === activeSlide;
          return (
            <button
              key={idx}
              type="button"
              className={isCurrent ? "hero-current-dot" : undefined}
              style={isCurrent ? { background: "#8e5b39" } : undefined}
              aria-label={`Slide ${idx + 1} of ${slides.length}: ${slide.titleLine1} ${slide.titleLine2}`}
              aria-pressed={isCurrent}
              onClick={() => setActiveSlide(idx)}
            >
              <span />
            </button>
          );
        })}
      </div>
    </section>
  );
}

