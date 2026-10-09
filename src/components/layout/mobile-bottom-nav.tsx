import { Heart, House, NotebookText, ShoppingBag, UserRound } from "lucide-react";
import { ComingSoonButton } from "@/components/ui/coming-soon";

const items = [
  { label: "Saved", feature: "Saved favourites", icon: Heart },
  { label: "Orders", feature: "Your orders", icon: NotebookText },
  { label: "Bag", feature: "Shopping bag", icon: ShoppingBag },
  { label: "Account", feature: "Your account", icon: UserRound },
];

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="bottom-nav-inner">
        <a href="#home" aria-current="page" className="bottom-nav-item selected"><House fill="currentColor" /><span>Home</span></a>
        {items.map(({ label, feature, icon: Icon }) => <ComingSoonButton key={label} feature={feature} className="bottom-nav-item" aria-label={`${label} — Coming soon`}><span className="relative"><Icon />{label === "Bag" && <span aria-hidden="true" className="bag-badge">3</span>}</span><span>{label}</span></ComingSoonButton>)}
      </div>
    </nav>
  );
}
