import { Heart, House, NotebookText, ShoppingBag, UserRound } from "lucide-react";
import { ComingSoonButton } from "@/components/ui/coming-soon";
import Link from "next/link";

const items = [
  { label: "Saved", feature: "Saved favourites", icon: Heart },
  { label: "Orders", feature: "Your orders", icon: NotebookText },
  { label: "Bag", feature: "Shopping bag", icon: ShoppingBag },
  { label: "Account", feature: "Your account", icon: UserRound },
];

export function MobileBottomNav({ activePage = "home" }: { activePage?: "home" | "shop" }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="bottom-nav-inner">
        <Link href="/#home" aria-current={activePage === "home" ? "page" : undefined} className={`bottom-nav-item ${activePage === "home" ? "selected" : ""}`}><House fill={activePage === "home" ? "currentColor" : "none"} /><span>Home</span></Link>
        {items.map(({ label, feature, icon: Icon }) => <ComingSoonButton key={label} feature={feature} className="bottom-nav-item" aria-label={`${label} — Coming soon`}><span className="relative"><Icon />{label === "Bag" && <span aria-hidden="true" className="bag-badge">3</span>}</span><span>{label}</span></ComingSoonButton>)}
      </div>
    </nav>
  );
}
