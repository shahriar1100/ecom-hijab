import { ChevronDown, Heart, ShoppingBag, UserRound } from "lucide-react";
import { categories, navigation } from "@/data/store";
import { Brand } from "@/components/ui/brand";
import { ComingSoonButton } from "@/components/ui/coming-soon";
import { SearchControl } from "@/components/ui/search-control";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { NavigationDrawer } from "./navigation-drawer";

export function SiteHeader({ activePage = "home" }: { activePage?: "home" | "shop" }) {
  return (
    <header className="site-header page-container">
      <Brand />
      <nav aria-label="Main navigation" className="desktop-nav">
        {navigation.map((item) => <Link className={item.label.toLowerCase() === activePage ? "active" : ""} href={item.href ?? "/"} key={item.label} aria-current={item.label.toLowerCase() === activePage ? "page" : undefined}>{item.label}{item.label === "Collections" && <ChevronDown size={14} />}</Link>)}
      </nav>
      <div className="header-actions">
        <SearchControl catalogSearch={activePage === "shop"} />
        <span className="header-theme-control"><ThemeToggle /></span>
        <ComingSoonButton feature="Saved favourites" className="icon-button header-wishlist" aria-label="Saved favourites — Coming soon"><Heart /></ComingSoonButton>
        <ComingSoonButton feature="Your account" className="icon-button header-account" aria-label="Account — Coming soon"><UserRound /></ComingSoonButton>
        <ComingSoonButton feature="Shopping bag" className="icon-button bag-button" aria-label="Shopping bag — Coming soon"><ShoppingBag /><span className="bag-badge" aria-hidden="true">3</span><span className="sr-only">Demo bag count: 3</span></ComingSoonButton>
        <NavigationDrawer activePage={activePage} categories={categories.map(({ id, name, href }) => ({ id, name, href }))} />
      </div>
    </header>
  );
}
