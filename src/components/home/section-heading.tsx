import { ArrowRight } from "lucide-react";
import { ComingSoonButton } from "@/components/ui/coming-soon";
import type { ReactNode } from "react";

export function SectionHeading({ id, title, seeAll = false, children, className = "" }: { id: string; title: string; seeAll?: boolean; children?: ReactNode; className?: string }) {
  return (
    <div className={`section-heading ${className}`}>
      <h2 id={id}>{title}</h2>
      {children}
      {seeAll && <ComingSoonButton feature={`All ${title.toLowerCase()}`} className="see-all" aria-label={`See all ${title.toLowerCase()} — Coming soon`}>See All <ArrowRight size={19} /></ComingSoonButton>}
    </div>
  );
}
