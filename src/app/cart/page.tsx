import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartContent } from "@/components/cart/cart-content";
import "./cart.css";
export const metadata: Metadata = { title: "Shopping Bag | NOOR" };
export default function CartPage() { return <><SiteHeader /><main id="main-content" className="page-container cart-page"><p className="cart-eyebrow">YOUR SHOPPING BAG</p><h1>Cart</h1><CartContent /></main><SiteFooter /><MobileBottomNav activePage="cart" /></>; }
