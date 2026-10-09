import Image from "next/image";
import { stories } from "@/data/store";
import { ComingSoonButton } from "@/components/ui/coming-soon";

export function StoriesSection() {
  return (
    <section className="stories-section" aria-label="NOOR stories">
      <div className="story-row scroll-row">
        {stories.map((story) => <ComingSoonButton key={story.id} feature={`${story.label} story`} className="story-card" aria-label={`${story.label} story — Coming soon`}><Image src={story.photo.src} alt="" fill sizes="(min-width: 1024px) 130px, (min-width: 768px) 15vw, 23vw" style={{ objectPosition: story.photo.position }} /><span className="story-gradient" /><span className="story-caption"><span className="story-avatar"><Image src={story.avatar.src} alt="" width={32} height={32} /></span><span className="story-label">{story.label}</span></span></ComingSoonButton>)}
      </div>
    </section>
  );
}
