import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { AccountContent } from "@/components/account/account-content";
import "./account.css";
export const metadata: Metadata = { title: "My Account | NOOR" };
export default function AccountPage() { return <><SiteHeader /><main id="main-content" className="page-container account-page"><AccountContent /></main><SiteFooter /><MobileBottomNav activePage="account" /></>; }
