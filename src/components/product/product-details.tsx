"use client";

import { useState, type ReactNode } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import type { ProductVariant } from "@/types/store";
import { colourOptions } from "@/data/shop-options";
import { ProductGallery } from "./product-gallery";
import { SaveProductButton } from "./save-product-button";

export function ProductDetails({ productId, name, variants, summary, specifications, delivery }: {
  productId: string;
  name: string;
  variants: [ProductVariant, ...ProductVariant[]];
  summary: ReactNode;
  specifications: ReactNode;
  delivery: ReactNode;
}) {
  const [selectedColour, setSelectedColour] = useState(variants[0].colour);
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState(false);
  const variant = variants.find(({ colour }) => colour === selectedColour) ?? variants[0];
  const colourName = colourOptions.find(({ value }) => value === variant.colour)?.label;
  const inStock = variant.stock > 0;

  function selectVariant(next: ProductVariant) {
    setSelectedColour(next.colour);
    setQuantity((current) => Math.max(1, Math.min(current, next.stock)));
    setCartNotice(false);
  }

  function changeQuantity(next: number) {
    setQuantity(Math.max(1, Math.min(variant.stock, next)));
    setCartNotice(false);
  }

  return <div className="product-detail-layout">
    <ProductGallery key={variant.colour} photos={variant.gallery} name={name} />
    <div className="product-information">
      {summary}
      <div className="product-save-action"><SaveProductButton productId={productId} name={name} variant="label" /></div>
      <fieldset className="product-colours"><legend>Colour <span>{colourName}</span></legend><div className="product-colour-options">{variants.map((option) => {
        const colour = colourOptions.find(({ value }) => value === option.colour);
        return <label className="product-colour-option" key={option.colour}><input type="radio" name="product-colour" value={option.colour} checked={variant.colour === option.colour} onChange={() => selectVariant(option)} /><span className="product-colour-dot" style={{ background: colour?.swatch }} aria-hidden="true" /><span>{colour?.label}</span></label>;
      })}</div></fieldset>
      {specifications}
      <p className={`product-stock ${inStock ? "in-stock" : "out-of-stock"}`} role="status" aria-live="polite" aria-atomic="true"><span className="product-stock-dot" aria-hidden="true" />{inStock ? `In stock · ${variant.stock} available` : "Out of stock in this colour"}</p>
      <p className="product-demo-note">Size and availability shown are demo details.</p>
      <div className="product-purchase-controls"><div className="product-quantity"><span id="quantity-label">Quantity</span><div className="product-quantity-stepper" role="group" aria-labelledby="quantity-label"><button type="button" aria-label="Decrease quantity" disabled={!inStock || quantity <= 1} onClick={() => changeQuantity(quantity - 1)}><Minus size={16} aria-hidden="true" /></button><output aria-label="Selected quantity" aria-live="polite">{quantity}</output><button type="button" aria-label="Increase quantity" disabled={!inStock || quantity >= variant.stock} onClick={() => changeQuantity(quantity + 1)}><Plus size={16} aria-hidden="true" /></button></div></div><button type="button" className="product-add-button" disabled={!inStock} aria-describedby="cart-feature-note" onClick={() => setCartNotice(true)}><ShoppingBag size={20} aria-hidden="true" />Add to Bag</button></div>
      <p id="cart-feature-note" className={`product-cart-note ${cartNotice ? "is-announced" : ""}`} role="status" aria-live="polite" aria-atomic="true">{cartNotice ? "Cart feature coming next" : "Ordering will be available in a future update."}</p>
      {delivery}
    </div>
  </div>;
}
