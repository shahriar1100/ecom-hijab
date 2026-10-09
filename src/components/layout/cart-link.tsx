"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartProducts } from "@/lib/cart-products";
export function CartLink({ variant }: { variant: "header" | "bottom" }) { const { items } = useCartProducts(); const count = items.reduce((total, item) => total + item.quantity, 0); return <Link href="/cart" className={variant === "header" ? "icon-button bag-button" : "bottom-nav-item"} aria-label={`Shopping bag, ${count} items`}><span className="relative"><ShoppingBag />{count > 0 && <span className="bag-badge">{count}</span>}</span>{variant === "bottom" && <span>Bag</span>}</Link>; }
