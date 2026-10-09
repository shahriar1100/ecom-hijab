import type { CatalogProduct, Fabric, ProductCategory, ProductColour } from "@/types/store";
import { categoryOptions, colourOptions, fabricOptions, priceOptions, sortOptions, type PriceBand, type ShopSort } from "@/data/shop-options";

export type ShopFilters = {
  query: string;
  categories: ProductCategory[];
  fabrics: Fabric[];
  colours: ProductColour[];
  price: PriceBand;
  sort: ShopSort;
};

export const PAGE_SIZE = 12;
export const emptyFilters: ShopFilters = { query: "", categories: [], fabrics: [], colours: [], price: "all", sort: "featured" };

type SearchParams = Pick<URLSearchParams, "get" | "getAll">;

export function parseShopFilters(params: SearchParams): ShopFilters {
  function selected<T extends string>(key: string, options: readonly { value: T }[]): T[] {
    const values = params.getAll(key).flatMap((value) => value.split(","));
    return options.filter((option) => values.includes(option.value)).map((option) => option.value);
  }
  return {
    query: (params.get("q") ?? "").slice(0, 160),
    categories: selected("category", categoryOptions),
    fabrics: selected("fabric", fabricOptions),
    colours: selected("colour", colourOptions),
    price: priceOptions.find((option) => option.value === params.get("price"))?.value ?? "all",
    sort: sortOptions.find((option) => option.value === params.get("sort"))?.value ?? "featured",
  };
}

export function shopUrl(filters: ShopFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.categories.length) params.set("category", filters.categories.join(","));
  if (filters.fabrics.length) params.set("fabric", filters.fabrics.join(","));
  if (filters.colours.length) params.set("colour", filters.colours.join(","));
  if (filters.price !== "all") params.set("price", filters.price);
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  return `/shop${params.size ? `?${params}` : ""}`;
}

export function filterProducts(products: readonly CatalogProduct[], filters: ShopFilters): CatalogProduct[] {
  const terms = filters.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const price = priceOptions.find((option) => option.value === filters.price) ?? priceOptions[0];
  const matching = products.filter((product) => {
    const searchText = `${product.name} ${product.category} ${product.fabric ?? ""} ${product.colour}`.toLocaleLowerCase();
    return terms.every((term) => searchText.includes(term))
      && (!filters.categories.length || filters.categories.includes(product.category))
      && (!filters.fabrics.length || (product.fabric !== null && filters.fabrics.includes(product.fabric)))
      && (!filters.colours.length || filters.colours.includes(product.colour))
      && product.price >= price.min && (price.max === null || product.price <= price.max);
  });
  switch (filters.sort) {
    case "price-asc": return matching.sort((a, b) => a.price - b.price);
    case "price-desc": return matching.sort((a, b) => b.price - a.price);
    case "name-asc": return matching.sort((a, b) => a.name.localeCompare(b.name, "en"));
    case "newest": return matching.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    default: return matching;
  }
}

export function filterCount(filters: ShopFilters): number {
  return filters.categories.length + filters.fabrics.length + filters.colours.length + (filters.price === "all" ? 0 : 1);
}
