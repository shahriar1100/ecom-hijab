import { ChevronDown, Heart, ShoppingBag, UserRound } from "lucide-react";
import { navigation } from "@/data/store";
import { Brand } from "@/components/ui/brand";
import { ComingSoonButton } from "@/components/ui/coming-soon";
import { SearchControl } from "@/components/ui/search-control";

export function SiteHeader() {
  return (
    <header className="site-header page-container">
      <Brand />
      <nav aria-label="Main navigation" className="desktop-nav">
        {navigation.map((item, index) => <a className={index === 0 ? "active" : ""} href={item.href} key={item.label} aria-current={index === 0 ? "page" : undefined}>{item.label}{item.label === "Collections" && <ChevronDown size={14} />}</a>)}
      </nav>
      <nav aria-label="Tablet navigation" className="tablet-nav"><a href="#new-items" className="active">Shop</a><a href="#new-items">New In</a></nav>
      <div className="header-actions">
        <SearchControl />
        <ComingSoonButton feature="Saved favourites" className="icon-button header-wishlist" aria-label="Saved favourites — Coming soon"><Heart /></ComingSoonButton>
        <ComingSoonButton feature="Your account" className="icon-button header-account" aria-label="Account — Coming soon"><UserRound /></ComingSoonButton>
        <ComingSoonButton feature="Shopping bag" className="icon-button bag-button" aria-label="Shopping bag — Coming soon"><ShoppingBag /><span className="bag-badge" aria-hidden="true">3</span><span className="sr-only">Demo bag count: 3</span></ComingSoonButton>
      </div>
    </header>
  );
}
