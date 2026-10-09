import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ShopCatalog } from "@/components/shop/shop-catalog";
import { catalogProducts } from "@/data/catalog";
import "./shop.css";

export const metadata: Metadata = {
  title: "Shop the Collection | NOOR",
  description: "Find your everyday favourite. Explore NOOR hijabs and accessories by fabric, colour and price.",
};

export default function ShopPage() {
  return <>
    <SiteHeader activePage="shop" />
    <main id="main-content" className="page-container shop-page">
      <nav className="shop-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={13} aria-hidden="true" /><span aria-current="page">Shop</span></nav>
      <div className="shop-intro"><span className="shop-eyebrow">THE NOOR COLLECTION</span><h1>Shop the collection</h1><p>Beautiful fabrics, thoughtful colours. Find your everyday favourite.</p></div>
      <Suspense fallback={<div className="shop-loading" role="status">Loading the collection…</div>}><ShopCatalog products={catalogProducts} /></Suspense>
    </main>
    <SiteFooter />
    <MobileBottomNav activePage="shop" />
  </>;
}
