import type { CatalogProduct } from "@/types/store";
import { photos } from "./photos";
import { createDemoDetails } from "./product-details";

// One shared local catalogue for homepage selections and /shop. These are demo
// products, not stock records. Existing homepage names, prices and photos stay intact.
const productEntries: Omit<CatalogProduct, "slug" | "details">[] = [
  { id: "premium-modal-rose", name: "Premium Modal Hijab", price: 650, photo: photos.rose, category: "hijabs", fabric: "modal", colour: "rose", addedAt: "2026-10-09" },
  { id: "chiffon-classics", name: "Chiffon Hijab", price: 490, photo: photos.folded, category: "hijabs", fabric: "chiffon", colour: "multi", addedAt: "2026-10-08" },
  { id: "jersey-olive", name: "Jersey Hijab", price: 750, photo: photos.olive, category: "hijabs", fabric: "jersey", colour: "olive", addedAt: "2026-10-07" },
  { id: "silk-mauve", name: "Silk Hijab", price: 650, photo: photos.roseFolds, category: "hijabs", fabric: "silk", colour: "rose", addedAt: "2026-10-06" },
  { id: "sale-black", name: "Classic Black Hijab", price: 520, originalPrice: 650, photo: photos.black, category: "hijabs", fabric: "modal", colour: "black", addedAt: "2026-09-20" },
  { id: "sale-rose", name: "Rose Chiffon Hijab", price: 480, originalPrice: 600, photo: photos.rose, category: "hijabs", fabric: "chiffon", colour: "rose", addedAt: "2026-09-21" },
  { id: "sale-ivory", name: "Ivory Modal Hijab", price: 560, originalPrice: 700, photo: photos.sand, category: "hijabs", fabric: "modal", colour: "sand", addedAt: "2026-09-22" },
  { id: "sale-colors", name: "Everyday Chiffon Hijab", price: 480, originalPrice: 600, photo: photos.folded, category: "hijabs", fabric: "chiffon", colour: "multi", addedAt: "2026-09-23" },
  { id: "sale-mocha", name: "Mocha Modal Hijab", price: 520, originalPrice: 650, photo: photos.mocha, category: "hijabs", fabric: "modal", colour: "mocha", addedAt: "2026-09-24" },
  { id: "sale-essentials", name: "Signature Modal Hijab", price: 560, originalPrice: 700, photo: photos.folded, category: "hijabs", fabric: "modal", colour: "multi", addedAt: "2026-09-25" },
  { id: "popular-mocha", name: "Mocha Modal Hijab", price: 650, photo: photos.mocha, category: "hijabs", fabric: "modal", colour: "mocha", addedAt: "2026-09-26" },
  { id: "popular-black", name: "Black Jersey Hijab", price: 750, photo: photos.black, category: "hijabs", fabric: "jersey", colour: "black", addedAt: "2026-09-27" },
  { id: "popular-sand", name: "Sand Chiffon Hijab", price: 650, photo: photos.sand, category: "hijabs", fabric: "chiffon", colour: "sand", addedAt: "2026-09-28" },
  { id: "popular-mauve", name: "Mauve Silk Hijab", price: 750, photo: photos.mauve, category: "hijabs", fabric: "silk", colour: "mauve", addedAt: "2026-09-29" },
  { id: "popular-olive", name: "Olive Modal Hijab", price: 650, photo: photos.olive, category: "hijabs", fabric: "modal", colour: "olive", addedAt: "2026-09-30" },
  { id: "for-you-rose", name: "Premium Chiffon Hijab", price: 650, photo: photos.rose, category: "hijabs", fabric: "chiffon", colour: "rose", addedAt: "2026-10-01" },
  { id: "for-you-modal", name: "Modal Hijab", price: 490, photo: photos.folded, category: "hijabs", fabric: "modal", colour: "multi", addedAt: "2026-10-02" },
  { id: "for-you-jersey", name: "Jersey Hijab", price: 750, photo: photos.olive, category: "hijabs", fabric: "jersey", colour: "olive", addedAt: "2026-10-03" },
  { id: "for-you-mauve", name: "Premium Modal Hijab", price: 650, photo: photos.mauve, category: "hijabs", fabric: "modal", colour: "mauve", addedAt: "2026-10-04" },
  { id: "for-you-black", name: "Chiffon Hijab", price: 490, photo: photos.black, category: "hijabs", fabric: "chiffon", colour: "black", addedAt: "2026-10-05" },
  { id: "for-you-silk", name: "Silk Hijab", price: 750, photo: photos.silk, category: "hijabs", fabric: "silk", colour: "mauve", addedAt: "2026-09-19" },
  { id: "top-jersey", name: "Olive Jersey", price: 750, photo: photos.jersey, category: "hijabs", fabric: "jersey", colour: "olive", addedAt: "2026-09-18" },
  { id: "burgundy-modal", name: "Burgundy Modal Hijab", price: 690, photo: photos.burgundy, category: "hijabs", fabric: "modal", colour: "burgundy", addedAt: "2026-10-09" },
  { id: "ivory-silk", name: "Ivory Silk Hijab", price: 950, photo: photos.chiffon, category: "hijabs", fabric: "silk", colour: "sand", addedAt: "2026-10-08" },
  { id: "mocha-silk", name: "Signature Mocha Silk", price: 1050, photo: photos.mocha, category: "hijabs", fabric: "silk", colour: "mocha", addedAt: "2026-10-07" },
  { id: "flower-scrunchie", name: "Flower Scrunchie", price: 250, photo: photos.accessories, category: "accessories", fabric: null, colour: "black", addedAt: "2026-10-06" },
  { id: "gold-hijab-pins", name: "Gold Hijab Pins", price: 180, photo: photos.accessories, category: "accessories", fabric: null, colour: "gold", addedAt: "2026-10-05" },
  { id: "accessory-set", name: "Everyday Accessories Set", price: 450, photo: photos.accessories, category: "accessories", fabric: null, colour: "multi", addedAt: "2026-10-04" },
];

export const catalogProducts: CatalogProduct[] = productEntries.map((product) => ({
  ...product,
  slug: product.id,
  details: createDemoDetails(product),
}));

export function findProductBySlug(slug: string): CatalogProduct | undefined {
  return catalogProducts.find((product) => product.slug === slug);
}

export function selectProducts(ids: readonly string[]): CatalogProduct[] {
  return ids.map((id) => {
    const product = catalogProducts.find((item) => item.id === id);
    if (!product) throw new Error(`Unknown product in homepage selection: ${id}`);
    return product;
  });
}
