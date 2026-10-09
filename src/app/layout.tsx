import type { Metadata, Viewport } from "next";
import { ComingSoonNotice } from "@/components/ui/coming-soon";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOOR | Everyday Elegance",
  description: "Discover everyday elegance with NOOR. A curated collection of modal, chiffon, jersey and silk hijabs in beautiful, timeless colours.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a href="#main-content" className="skip-link">Skip to content</a>{children}<ComingSoonNotice /></body></html>;
}
