"use client";

import { ShoppingBag, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { announceNotice } from "@/components/ui/coming-soon";
import { addProductToCart } from "@/lib/cart-products";

export function ProductCardActions({ productId, name }: { productId: string; name: string }) {
  const router = useRouter();
  const add = () => { const result = addProductToCart(productId); announceNotice("Added to cart", result.persistent ? `${name} was added to your shopping bag.` : `${name} was added for this visit only.`); };
  return <div className="product-card-actions" aria-label={`${name} purchase options`}><button type="button" className="product-card-action product-card-add" aria-label={`Add ${name} to cart`} onClick={add}><ShoppingBag aria-hidden="true" />Add to Cart</button><button type="button" className="product-card-action product-card-buy" aria-label={`Buy ${name} now`} onClick={() => { addProductToCart(productId); router.push("/cart"); }}><Zap aria-hidden="true" />Buy Now</button></div>;
}
