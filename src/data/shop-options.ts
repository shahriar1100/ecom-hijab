import type { Fabric, ProductCategory, ProductColour } from "@/types/store";

type Option<T extends string> = { value: T; label: string };

export const fabricOptions: Option<Fabric>[] = [
  { value: "modal", label: "Modal" }, { value: "chiffon", label: "Chiffon" },
  { value: "jersey", label: "Jersey" }, { value: "silk", label: "Silk" },
];
export const categoryOptions: Option<ProductCategory>[] = [
  { value: "hijabs", label: "Hijabs" }, { value: "accessories", label: "Accessories" },
];
export const colourOptions: (Option<ProductColour> & { swatch: string })[] = [
  { value: "rose", label: "Rose", swatch: "#c99595" },
  { value: "olive", label: "Olive", swatch: "#666b43" },
  { value: "black", label: "Black", swatch: "#292726" },
  { value: "sand", label: "Sand", swatch: "#e6d5bd" },
  { value: "mocha", label: "Mocha", swatch: "#8b6550" },
  { value: "mauve", label: "Mauve", swatch: "#987780" },
  { value: "burgundy", label: "Burgundy", swatch: "#72283d" },
  { value: "multi", label: "Multi", swatch: "linear-gradient(135deg, #c99595 33%, #666b43 33%, #666b43 66%, #d6c4ad 66%)" },
  { value: "gold", label: "Gold", swatch: "#c6a35a" },
];
export const priceOptions = [
  { value: "all", label: "Any price", min: 0, max: null },
  { value: "under-500", label: "Under ৳500", min: 0, max: 499 },
  { value: "500-699", label: "৳500 – ৳699", min: 500, max: 699 },
  { value: "700-899", label: "৳700 – ৳899", min: 700, max: 899 },
  { value: "900-plus", label: "৳900 & above", min: 900, max: null },
] as const;
export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A to Z" },
] as const;

export type PriceBand = (typeof priceOptions)[number]["value"];
export type ShopSort = (typeof sortOptions)[number]["value"];
