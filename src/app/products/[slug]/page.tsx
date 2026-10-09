import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight, Truck } from "lucide-react";
import { catalogProducts, findProductBySlug } from "@/data/catalog";
import { formatPrice } from "@/data/store";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ProductDetails } from "@/components/product/product-details";
import "./product.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return catalogProducts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = findProductBySlug((await params).slug);
  if (!product) return { title: "Product not found | NOOR" };
  return { title: `${product.name} | NOOR`, description: product.details.description };
}

export default async function ProductPage({ params }: Props) {
  const product = findProductBySlug((await params).slug);
  if (!product) notFound();
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return <>
    <SiteHeader activePage="shop" />
    <main id="main-content" className="page-container product-page">
      <nav className="product-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight aria-hidden="true" /><Link href="/shop">Shop</Link><ChevronRight aria-hidden="true" /><span aria-current="page">{product.name}</span></nav>
      <ProductDetails key={product.id} productId={product.id} name={product.name} variants={product.details.variants}
        summary={<div className="product-summary"><p className="product-eyebrow">NOOR · EVERYDAY ELEGANCE</p><h1>{product.name}</h1><div className="product-detail-prices"><span className="product-detail-price">{formatPrice(product.price)}</span>{product.originalPrice && <del><span className="sr-only">Original price </span>{formatPrice(product.originalPrice)}</del>}{discount > 0 && <span className="product-saving">Save {discount}%</span>}<span className="product-currency">BDT</span></div><p className="product-description">{product.details.description}</p></div>}
        specifications={<dl className="product-specifications"><div><dt>{product.fabric ? "Fabric" : "Material"}</dt><dd>{product.details.material}</dd></div><div><dt>Size</dt><dd>{product.details.size}</dd></div></dl>}
        delivery={<div className="product-delivery"><Truck size={22} aria-hidden="true" /><div><h2>Delivery</h2><p>{product.details.deliveryNote}</p></div></div>}
      />
    </main>
    <SiteFooter />
    <MobileBottomNav activePage="shop" />
  </>;
}
