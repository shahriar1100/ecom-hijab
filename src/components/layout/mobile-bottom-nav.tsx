import { House, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { SavedLink } from "./saved-link";
import { CartLink } from "./cart-link";
export function MobileBottomNav({ activePage = "home" }: { activePage?: "home" | "shop" | "saved" | "cart" | "account" }) { return <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><div className="bottom-nav-inner"><Link href="/#home" className={`bottom-nav-item ${activePage === "home" ? "selected" : ""}`}><House /><span>Home</span></Link><Link href="/shop" className={`bottom-nav-item ${activePage === "shop" ? "selected" : ""}`}><Store /><span>Shop</span></Link><SavedLink variant="bottom" active={activePage === "saved"} /><CartLink variant="bottom" /><Link href="/account" className={`bottom-nav-item ${activePage === "account" ? "selected" : ""}`}><UserRound /><span>Account</span></Link></div></nav>; }
