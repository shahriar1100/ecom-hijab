import { ArrowRight } from "lucide-react";
import { ComingSoonButton } from "@/components/ui/coming-soon";
import type { ReactNode } from "react";
import Link from "next/link";

export function SectionHeading({ id, title, seeAll = false, seeAllHref, children, className = "" }: { id: string; title: string; seeAll?: boolean; seeAllHref?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={`section-heading ${className}`}>
      <h2 id={id}>{title}</h2>
      {children}
      {seeAll && (seeAllHref ? <Link href={seeAllHref} className="see-all" aria-label={`See all ${title.toLowerCase()}`}>See All <ArrowRight size={19} /></Link> : <ComingSoonButton feature={`All ${title.toLowerCase()}`} className="see-all" aria-label={`See all ${title.toLowerCase()} — Coming soon`}>See All <ArrowRight size={19} /></ComingSoonButton>)}
    </div>
  );
}
