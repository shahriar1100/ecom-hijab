import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SavedProductsContent } from "@/components/saved/saved-products-content";
import "./saved.css";

export const metadata: Metadata = {
  title: "Saved Products | NOOR",
  description: "View the hijabs and accessories you have saved at NOOR.",
};

export default function SavedPage() {
  return <>
    <SiteHeader activePage="saved" />
    <main id="main-content" className="page-container saved-page">
      <nav className="saved-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={13} aria-hidden="true" /><span aria-current="page">Saved products</span></nav>
      <header className="saved-intro"><span className="saved-eyebrow">YOUR WISHLIST</span><h1>Saved products</h1><p>Keep your favourites close and come back to them anytime.</p></header>
      <SavedProductsContent />
    </main>
    <SiteFooter />
    <MobileBottomNav activePage="saved" />
  </>;
}
