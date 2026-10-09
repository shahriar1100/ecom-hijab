import { House, Store, UserRound } from "lucide-react";
import { ComingSoonButton } from "@/components/ui/coming-soon";
import Link from "next/link";
import { SavedLink } from "./saved-link";
import { CartLink } from "./cart-link";

export function MobileBottomNav({ activePage = "home" }: { activePage?: "home" | "shop" | "saved" | "cart" }) {
  return <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><div className="bottom-nav-inner">
    <Link href="/#home" aria-current={activePage === "home" ? "page" : undefined} className={`bottom-nav-item ${activePage === "home" ? "selected" : ""}`}><House fill={activePage === "home" ? "currentColor" : "none"} /><span>Home</span></Link>
    <Link href="/shop" aria-current={activePage === "shop" ? "page" : undefined} className={`bottom-nav-item ${activePage === "shop" ? "selected" : ""}`}><Store /><span>Shop</span></Link>
    <SavedLink variant="bottom" active={activePage === "saved"} />
    <CartLink variant="bottom" />
    <ComingSoonButton feature="Your account" className="bottom-nav-item" aria-label="Account — Coming soon"><span className="relative"><UserRound /></span><span>Account</span></ComingSoonButton>
  </div></nav>;
}
