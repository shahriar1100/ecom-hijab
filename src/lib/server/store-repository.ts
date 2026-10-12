import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { catalogProducts } from "@/data/catalog";
import { photos } from "@/data/photos";
import { createDemoDetails } from "@/data/product-details";
import { DEFAULT_CATALOG_TAXONOMY, type CatalogTaxonomy } from "@/data/shop-options";
import { sliderCategories, stories as defaultStories } from "@/data/store";
import type { Order, OrderDeliveryZone, OrderPaymentMethod } from "@/lib/orders";
import type {
  CatalogProduct,
  Category,
  Fabric,
  Photo,
  ProductCategory,
  ProductColour,
  ProductVariant,
  Story,
} from "@/types/store";
import {
  deleteUploadedMedia,
  getCanonicalMediaKey,
  isManagedUploadedMedia,
} from "./cloudinary";
import { getBackendConfig } from "./env";

export type ProductSectionKey =
  | "new-items"
  | "flash-sale"
  | "most-popular"
  | "just-for-you"
  | "top-products";

export type ProductStatus = "active" | "inactive";

export type AdminProductRecord = CatalogProduct & {
  sku: string;
  costPrice: number | null;
  status: ProductStatus;
  stock: number;
  lowStockThreshold: number;
  lastRestockedAt: string | null;
  sections: ProductSectionKey[];
};

export type AdminProductInput = {
  id?: string;
  sku?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  costPrice?: number | null;
  status?: ProductStatus;
  category: ProductCategory;
  fabric: Fabric | null;
  colour: ProductColour;
  stock: number;
  lowStockThreshold?: number;
  material?: string;
  size?: string;
  deliveryNote?: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition?: string;
  sections: ProductSectionKey[];
  variantStocks?: Partial<Record<ProductColour, number>>;
};

export type AdminOrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

export type AdminPaymentStatus =
  | "Paid"
  | "Pending"
  | "Failed"
  | "Refunded"
  | "Partially Refunded";

export type AdminDeliveryStatus =
  | "Pending Dispatch"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Returned"
  | "Cancelled";

export type AdminOrderRecord = Omit<Order, "status"> & {
  status: AdminOrderStatus;
  paymentStatus: AdminPaymentStatus;
  deliveryStatus: AdminDeliveryStatus;
  discountAmount: number;
  couponCode?: string | null;
  taxAmount: number;
  refundAmount: number;
  updatedAt?: string;
};

export type AdminCouponRecord = {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  active: boolean;
  usageCount: number;
  createdAt: string;
};

export type HeroBannerConfig = {
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition: string;
};

export type StoreSocialLinks = {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
};

export type FlashSaleConfig = {
  enabled: boolean;
  endsAt: string | null;
  expiredBehavior: "revert-prices" | "hide-section";
  title: string;
  subtitle: string;
  badge: string;
};

export type AdminSettingsRecord = {
  storeName: string;
  timezone: string;
  currency: string;
  lowStockThreshold: number;
  monthlySalesTarget: number | null;
  insideDhakaShippingFee: number;
  outsideDhakaShippingFee: number;
  contactEmail?: string;
  contactPhone?: string;
  contactLocation?: string;
  socialLinks?: StoreSocialLinks;
  heroBanner: HeroBannerConfig;
  flashSale: FlashSaleConfig;
  taxonomy: CatalogTaxonomy;
  stories: Story[];
};

export type AdminActivityRecord = {
  id: string;
  type: "order" | "product" | "inventory" | "coupon" | "settings";
  title: string;
  detail: string;
  timestamp: string;
};

export type AdminReviewRecord = {
  id: string;
  productId: string;
  productName?: string;
  orderId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  rating: number;
  title?: string;
  comment: string;
  status: "pending" | "approved" | "rejected";
  verifiedPurchase: boolean;
  createdAt: string;
};

type SupabaseProductRow = {
  id: string;
  slug: string;
  sku?: string | null;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  cost_price?: number | null;
  status?: ProductStatus | null;
  category: ProductCategory;
  fabric: Fabric | null;
  colour: ProductColour;
  stock: number;
  low_stock_threshold?: number | null;
  material: string;
  size: string;
  delivery_note: string;
  image_src: string;
  image_alt: string;
  image_position: string | null;
  sections: ProductSectionKey[] | null;
  variants: ProductVariant[] | null;
  last_restocked_at?: string | null;
  added_at: string;
};

type SupabaseOrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  customer_city: string;
  customer_notes: string | null;
  delivery_zone: OrderDeliveryZone;
  payment_method: OrderPaymentMethod;
  payment_phone: string | null;
  payment_status?: AdminPaymentStatus | null;
  delivery_status?: AdminDeliveryStatus | null;
  items: Order["items"];
  subtotal: number;
  discount_amount?: number | null;
  coupon_code?: string | null;
  shipping_fee: number;
  tax_amount?: number | null;
  refund_amount?: number | null;
  total: number;
  status: AdminOrderStatus;
  created_at: string;
  updated_at?: string | null;
};

const LEGACY_DUPLICATE_ID_MAP: Record<string, string> = {
  "popular-mocha": "sale-mocha",
  "for-you-jersey": "jersey-olive",
};

const LEGACY_CANONICAL_NAME_MAP: Record<string, { oldName: string; newName: string }> = {
  "chiffon-classics": { oldName: "Chiffon Hijab", newName: "Classic Chiffon Hijab" },
  "silk-mauve": { oldName: "Silk Hijab", newName: "Rose Silk Hijab" },
  "for-you-mauve": { oldName: "Premium Modal Hijab", newName: "Soft Mauve Modal Hijab" },
  "for-you-black": { oldName: "Chiffon Hijab", newName: "Midnight Black Chiffon Hijab" },
  "for-you-silk": { oldName: "Silk Hijab", newName: "Lustre Mauve Silk Hijab" },
};

const DEFAULT_SECTION_MAP: Record<ProductSectionKey, readonly string[]> = {
  "new-items": ["premium-modal-rose", "chiffon-classics", "jersey-olive", "silk-mauve"],
  "flash-sale": ["sale-black", "sale-rose", "sale-ivory", "sale-colors", "sale-mocha", "sale-essentials"],
  "most-popular": ["sale-mocha", "popular-black", "popular-sand", "popular-mauve", "popular-olive"],
  "just-for-you": ["for-you-rose", "for-you-modal", "jersey-olive", "for-you-mauve", "for-you-black", "for-you-silk"],
  "top-products": [
    "popular-sand",
    "chiffon-classics",
    "popular-black",
    "top-jersey",
    "premium-modal-rose",
    "sale-essentials",
    "jersey-olive",
    "silk-mauve",
    "sale-mocha",
    "sale-colors",
  ],
};

export const DEFAULT_HERO_BANNER: HeroBannerConfig = {
  titleLine1: "Everyday",
  titleLine2: "Elegance",
  subtitle: "Premium Hijabs for You",
  ctaLabel: "Explore Collection",
  ctaHref: "#new-items",
  imageSrc: "/images/hijab-black-banner.png",
  imageAlt: "Studio portrait of a woman wearing a black hijab",
  imagePosition: "center 18%",
};

export const DEFAULT_FLASH_SALE: FlashSaleConfig = {
  enabled: true,
  endsAt: null,
  expiredBehavior: "revert-prices",
  title: "Flash Sale",
  subtitle: "Exclusive markdowns on signature drapes before the timer runs out.",
  badge: "Limited Time Offer",
};

export function isFlashSaleActive(config?: FlashSaleConfig | null): boolean {
  if (!config) return true;
  if (!config.enabled) return false;
  if (config.endsAt) {
    const endMs = Date.parse(config.endsAt);
    if (!Number.isNaN(endMs) && endMs <= Date.now()) {
      return false;
    }
  }
  return true;
}

const DEFAULT_SETTINGS: AdminSettingsRecord = {
  storeName: "NOOR Hijab & Modest Wear",
  timezone: "Asia/Dhaka",
  currency: "BDT",
  lowStockThreshold: 5,
  monthlySalesTarget: null,
  insideDhakaShippingFee: 70,
  outsideDhakaShippingFee: 130,
  contactEmail: "support@noor-demo.example",
  contactPhone: "+880 1700-000000",
  contactLocation: "Dhaka, Bangladesh",
  socialLinks: {
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  },
  heroBanner: DEFAULT_HERO_BANNER,
  flashSale: DEFAULT_FLASH_SALE,
  taxonomy: DEFAULT_CATALOG_TAXONOMY,
  stories: defaultStories,
};

function generateSku(
  product: { id: string; category: ProductCategory; fabric: Fabric | null; colour: ProductColour },
  index = 0,
): string {
  const catCode =
    product.category === "accessories"
      ? "ACC"
      : (product.fabric ?? product.category ?? "HIJ").slice(0, 3).toUpperCase();
  const colCode = (product.colour || "STD").slice(0, 3).toUpperCase();
  const parts = product.id.split("-").filter(Boolean);
  const rawSuffix =
    parts.length >= 2
      ? `${parts[0].slice(0, 2)}${parts[parts.length - 1].slice(-2)}`
      : product.id.replace(/[^a-z0-9]/gi, "").slice(-4);
  const suffix = rawSuffix.toUpperCase() || String(index + 1).padStart(3, "0");
  return `NR-${catCode}-${colCode}-${suffix}`;
}

function getDefaultSectionsForId(id: string): ProductSectionKey[] {
  const canonicalId = LEGACY_DUPLICATE_ID_MAP[id] ?? id;
  const keys = Object.keys(DEFAULT_SECTION_MAP) as ProductSectionKey[];
  return keys.filter((section) => DEFAULT_SECTION_MAP[section].includes(canonicalId));
}

function sumVariantStocks(variants: readonly ProductVariant[]): number {
  return variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock ?? 0)), 0);
}

function buildDefaultAdminProducts(): AdminProductRecord[] {
  return deduplicateAndNormalizeProducts(
    catalogProducts.map((product, index) => {
      const totalVariantStock = sumVariantStocks(product.details.variants);
      return {
        ...product,
        sku: generateSku(product, index),
        costPrice: null,
        status: "active",
        stock: totalVariantStock,
        lowStockThreshold: 5,
        lastRestockedAt: null,
        sections: getDefaultSectionsForId(product.id),
      };
    }),
  );
}

const RUNTIME_STORE_PATH = path.join(process.cwd(), "data", "runtime-store.json");

export type CustomerAccountRecord = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  password: string;
  createdAt: string;
};

export type ContactMessageRecord = {
  id: string;
  name: string;
  contact: string;
  topic: string;
  message: string;
  status: "unread" | "resolved";
  createdAt: string;
};

type LocalRuntimeStore = {
  products: AdminProductRecord[];
  orders: AdminOrderRecord[];
  coupons: AdminCouponRecord[];
  settings: AdminSettingsRecord;
  activities: AdminActivityRecord[];
  reviews: AdminReviewRecord[];
  customers?: CustomerAccountRecord[];
  contactMessages?: ContactMessageRecord[];
};

function normalizeProductRecord(raw: Partial<AdminProductRecord> & CatalogProduct, index = 0): AdminProductRecord {
  const variants = raw.details?.variants ?? createDemoDetails(raw).variants;
  const variantTotal = sumVariantStocks(variants);
  const renameRule = LEGACY_CANONICAL_NAME_MAP[raw.id];
  const resolvedName =
    renameRule && raw.name === renameRule.oldName ? renameRule.newName : raw.name;
  return {
    ...raw,
    name: resolvedName,
    sku: raw.sku || generateSku(raw, index),
    costPrice: typeof raw.costPrice === "number" && !Number.isNaN(raw.costPrice) ? raw.costPrice : null,
    status: raw.status === "inactive" ? "inactive" : "active",
    stock: typeof raw.stock === "number" ? raw.stock : variantTotal,
    lowStockThreshold: typeof raw.lowStockThreshold === "number" ? raw.lowStockThreshold : 5,
    lastRestockedAt: raw.lastRestockedAt ?? null,
    sections: Array.isArray(raw.sections) ? raw.sections : getDefaultSectionsForId(raw.id),
  };
}

function deduplicateAndNormalizeProducts(records: AdminProductRecord[]): AdminProductRecord[] {
  const byCanonicalId = new Map<string, AdminProductRecord>();

  // 1. Merge legacy duplicate IDs (e.g. popular-mocha -> sale-mocha, for-you-jersey -> jersey-olive) and exact ID duplicates
  for (const item of records) {
    const targetId = LEGACY_DUPLICATE_ID_MAP[item.id] ?? item.id;
    const isAlias = targetId !== item.id;
    const existing = byCanonicalId.get(targetId);

    if (!existing) {
      const normalizedItem: AdminProductRecord = isAlias
        ? {
            ...item,
            id: targetId,
            slug: targetId,
            sections: Array.from(new Set([...item.sections, ...getDefaultSectionsForId(targetId)])),
          }
        : item;
      byCanonicalId.set(targetId, normalizedItem);
    } else {
      const mergedSections = Array.from(
        new Set([...existing.sections, ...item.sections, ...getDefaultSectionsForId(targetId)]),
      );
      const primary = isAlias ? existing : item;
      const secondary = isAlias ? item : existing;
      byCanonicalId.set(targetId, {
        ...primary,
        id: targetId,
        slug: targetId,
        originalPrice: primary.originalPrice ?? secondary.originalPrice,
        sections: mergedSections,
      });
    }
  }

  // 2. Merge any remaining records that have the exact same (name + category + fabric + colour)
  const byIdentityKey = new Map<string, AdminProductRecord>();
  for (const item of byCanonicalId.values()) {
    const identityKey = [
      item.name.trim().toLowerCase(),
      item.category.trim().toLowerCase(),
      (item.fabric ?? "").trim().toLowerCase(),
      item.colour.trim().toLowerCase(),
    ].join("::");
    const existing = byIdentityKey.get(identityKey);
    if (!existing) {
      byIdentityKey.set(identityKey, item);
    } else {
      byIdentityKey.set(identityKey, {
        ...existing,
        originalPrice: existing.originalPrice ?? item.originalPrice,
        sections: Array.from(new Set([...existing.sections, ...item.sections])),
      });
    }
  }

  // 3. Ensure every product has a 100% unique SKU and distinct display title
  const usedSkus = new Set<string>();
  const nameCounts = new Map<string, number>();
  const deduplicated = Array.from(byIdentityKey.values());

  for (const item of deduplicated) {
    const key = item.name.trim().toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }

  return deduplicated.map((item, idx) => {
    const nameKey = item.name.trim().toLowerCase();
    let finalName = item.name.trim();
    if ((nameCounts.get(nameKey) ?? 0) > 1) {
      const colourLabel =
        item.colour.charAt(0).toUpperCase() + item.colour.slice(1).replace(/-/g, " ");
      if (!finalName.toLowerCase().includes(colourLabel.toLowerCase())) {
        finalName = `${finalName} (${colourLabel})`;
      }
    }

    let candidateSku = (item.sku || generateSku(item, idx)).trim().toUpperCase();
    if (usedSkus.has(candidateSku)) {
      candidateSku = generateSku(item, idx).toUpperCase();
    }
    let counter = 2;
    while (usedSkus.has(candidateSku)) {
      candidateSku = `${generateSku(item, idx).toUpperCase()}-${counter}`;
      counter += 1;
    }
    usedSkus.add(candidateSku);

    return {
      ...item,
      name: finalName,
      sku: candidateSku,
    };
  });
}

export function derivePaymentStatus(
  status: AdminOrderStatus,
  paymentMethod: OrderPaymentMethod,
  explicit?: AdminPaymentStatus | null,
  refundAmount = 0,
  total = 0,
): AdminPaymentStatus {
  if (explicit) return explicit;
  if (status === "Refunded" || (refundAmount > 0 && refundAmount >= total)) return "Refunded";
  if (refundAmount > 0 && refundAmount < total) return "Partially Refunded";
  if (status === "Cancelled") return "Failed";
  if (paymentMethod === "cod") {
    if (status === "Delivered") return "Paid";
    return "Pending";
  }
  if (paymentMethod === "bkash" || paymentMethod === "nagad") return "Paid";
  if (status === "Delivered") return "Paid";
  return "Pending";
}

export function deriveDeliveryStatus(
  status: AdminOrderStatus,
  explicit?: AdminDeliveryStatus | null,
): AdminDeliveryStatus {
  if (explicit) return explicit;
  switch (status) {
    case "Delivered":
      return "Delivered";
    case "Shipped":
      return "In Transit";
    case "Returned":
    case "Refunded":
      return "Returned";
    case "Cancelled":
      return "Cancelled";
    case "Processing":
      return "Pending Dispatch";
    case "Pending":
      return "Pending Dispatch";
    default:
      return "Pending Dispatch";
  }
}

function normalizeOrderRecord(
  raw: Omit<Order, "status"> & Partial<AdminOrderRecord> & { status?: AdminOrderStatus },
): AdminOrderRecord {
  const status: AdminOrderStatus =
    raw.status ?? (raw.paymentMethod === "cod" ? "Pending" : "Confirmed");
  const subtotal = Number(raw.subtotal ?? 0);
  const shippingFee = Number(raw.shippingFee ?? 0);
  const discountAmount = Math.max(0, Number(raw.discountAmount ?? 0));
  const taxAmount = Math.max(0, Number(raw.taxAmount ?? 0));
  const total = Number(raw.total ?? Math.max(0, subtotal - discountAmount + shippingFee + taxAmount));
  const refundAmount =
    status === "Refunded" && !raw.refundAmount
      ? total
      : Math.max(0, Number(raw.refundAmount ?? 0));

  return {
    ...raw,
    status,
    subtotal,
    shippingFee,
    discountAmount,
    couponCode: raw.couponCode ?? null,
    taxAmount,
    refundAmount,
    total,
    paymentStatus: derivePaymentStatus(status, raw.paymentMethod, raw.paymentStatus, refundAmount, total),
    deliveryStatus: deriveDeliveryStatus(status, raw.deliveryStatus),
    updatedAt: raw.updatedAt ?? raw.createdAt,
  };
}

const MEMORY_CACHE_TTL_MS = 60_000;

let cachedLocalStore: { data: LocalRuntimeStore; expiresAt: number } | null = null;
let cachedSettings: { data: AdminSettingsRecord; expiresAt: number } | null = null;
let inFlightSettingsPromise: Promise<AdminSettingsRecord> | null = null;
let cachedRawProducts: { data: AdminProductRecord[]; expiresAt: number } | null = null;
let inFlightProductsPromise: Promise<AdminProductRecord[]> | null = null;
let cachedApprovedReviews: { data: AdminReviewRecord[]; expiresAt: number } | null = null;
let inFlightApprovedReviewsPromise: Promise<AdminReviewRecord[]> | null = null;

export function invalidateStoreMemoryCache(): void {
  cachedLocalStore = null;
  cachedSettings = null;
  inFlightSettingsPromise = null;
  cachedRawProducts = null;
  inFlightProductsPromise = null;
  cachedApprovedReviews = null;
  inFlightApprovedReviewsPromise = null;
}

const TMP_RUNTIME_STORE_PATH = path.join(os.tmpdir(), "noor-runtime-store.json");

async function readRawRuntimeJson(): Promise<string> {
  try {
    return await readFile(TMP_RUNTIME_STORE_PATH, "utf8");
  } catch {
    return await readFile(RUNTIME_STORE_PATH, "utf8");
  }
}

async function readLocalStore(): Promise<LocalRuntimeStore> {
  if (cachedLocalStore && Date.now() < cachedLocalStore.expiresAt) {
    return cachedLocalStore.data;
  }
  try {
    const raw = await readRawRuntimeJson();
    const parsed = JSON.parse(raw) as Partial<LocalRuntimeStore>;
    const rawProducts =
      Array.isArray(parsed.products) && parsed.products.length > 0
        ? parsed.products.map((p, idx) => normalizeProductRecord(p, idx))
        : buildDefaultAdminProducts();
    const products = deduplicateAndNormalizeProducts(rawProducts);
    const orders = Array.isArray(parsed.orders)
      ? parsed.orders.map((o) => normalizeOrderRecord(o as Order))
      : [];
    const coupons = Array.isArray(parsed.coupons) ? parsed.coupons : [];
    const settings: AdminSettingsRecord = {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings ?? {}),
    };
    const activities = Array.isArray(parsed.activities) ? parsed.activities : [];
    const reviews = Array.isArray(parsed.reviews) ? parsed.reviews : [];
    const customers = Array.isArray(parsed.customers) ? parsed.customers : [];
    const contactMessages = Array.isArray(parsed.contactMessages)
      ? parsed.contactMessages
      : [];
    const storeData: LocalRuntimeStore = {
      products,
      orders,
      coupons,
      settings,
      activities,
      reviews,
      customers,
      contactMessages,
    };
    cachedLocalStore = {
      data: storeData,
      expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
    };
    return storeData;
  } catch {
    const fallbackData: LocalRuntimeStore = {
      products: buildDefaultAdminProducts(),
      orders: [],
      coupons: [],
      settings: DEFAULT_SETTINGS,
      activities: [],
      reviews: [],
      customers: [],
      contactMessages: [],
    };
    cachedLocalStore = {
      data: fallbackData,
      expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
    };
    return fallbackData;
  }
}

async function writeLocalStore(store: LocalRuntimeStore): Promise<void> {
  invalidateStoreMemoryCache();
  cachedLocalStore = {
    data: store,
    expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
  };
  const serialized = JSON.stringify(store, null, 2);
  try {
    await mkdir(path.dirname(RUNTIME_STORE_PATH), { recursive: true });
    await writeFile(RUNTIME_STORE_PATH, serialized, "utf8");
  } catch {
    // On Vercel serverless, process.cwd() is read-only (EROFS). Fall back to /tmp safely.
    try {
      await writeFile(TMP_RUNTIME_STORE_PATH, serialized, "utf8");
    } catch {
      // Keep in-memory cache + Supabase persistence
    }
  }
}

function appendActivity(
  store: LocalRuntimeStore,
  entry: Omit<AdminActivityRecord, "id" | "timestamp">,
) {
  store.activities = [
    {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    },
    ...store.activities,
  ].slice(0, 60);
}

function rowToProduct(row: SupabaseProductRow, index = 0): AdminProductRecord {
  const photo: Photo = {
    src: row.image_src,
    alt: row.image_alt || row.name,
    ...(row.image_position ? { position: row.image_position } : {}),
  };

  const fallbackDetails = createDemoDetails({
    id: row.id,
    category: row.category,
    fabric: row.fabric,
    colour: row.colour,
    photo,
  });

  const variants: [ProductVariant, ...ProductVariant[]] =
    Array.isArray(row.variants) && row.variants.length > 0
      ? [
          {
            ...row.variants[0],
            gallery:
              Array.isArray(row.variants[0].gallery) && row.variants[0].gallery.length > 0
                ? [photo, ...row.variants[0].gallery.slice(1)]
                : [photo],
          },
          ...row.variants.slice(1),
        ]
      : [
          {
            colour: row.colour,
            stock: row.stock,
            gallery: [photo],
          },
          ...fallbackDetails.variants.slice(1),
        ];

  const computedStock =
    typeof row.stock === "number" ? Number(row.stock) : sumVariantStocks(variants);

  return {
    id: row.id,
    slug: row.slug || row.id,
    sku: row.sku || generateSku({ id: row.id, category: row.category, fabric: row.fabric, colour: row.colour }, index),
    name: row.name,
    description: row.description || fallbackDetails.description,
    price: Number(row.price),
    ...(row.original_price && Number(row.original_price) > Number(row.price)
      ? { originalPrice: Number(row.original_price) }
      : {}),
    costPrice:
      row.cost_price !== null && row.cost_price !== undefined
        ? Number(row.cost_price)
        : null,
    status: row.status === "inactive" ? "inactive" : "active",
    photo,
    category: row.category,
    fabric: row.fabric,
    colour: row.colour,
    addedAt: row.added_at || new Date().toISOString().slice(0, 10),
    stock: computedStock,
    lowStockThreshold: Number(row.low_stock_threshold ?? 5),
    lastRestockedAt: row.last_restocked_at ?? null,
    sections: Array.isArray(row.sections) ? row.sections : [],
    details: {
      description: row.description || fallbackDetails.description,
      material: row.material || fallbackDetails.material,
      size: row.size || fallbackDetails.size,
      deliveryNote: row.delivery_note || fallbackDetails.deliveryNote,
      variants,
    },
  };
}

function productToRow(product: AdminProductRecord): SupabaseProductRow {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    description: product.description ?? product.details.description,
    price: product.price,
    original_price: product.originalPrice ?? null,
    cost_price: product.costPrice,
    status: product.status,
    category: product.category,
    fabric: product.fabric,
    colour: product.colour,
    stock: product.stock,
    low_stock_threshold: product.lowStockThreshold,
    material: product.details.material,
    size: product.details.size,
    delivery_note: product.details.deliveryNote,
    image_src: product.photo.src,
    image_alt: product.photo.alt,
    image_position: product.photo.position ?? null,
    sections: product.sections,
    variants: product.details.variants,
    last_restocked_at: product.lastRestockedAt,
    added_at: product.addedAt,
  };
}

function supabaseHeaders(useServiceRole = false): HeadersInit {
  const config = getBackendConfig();
  const key = useServiceRole
    ? config.supabaseServiceRoleKey || config.supabaseAnonKey
    : config.supabaseAnonKey || config.supabaseServiceRoleKey;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function fetchRawProductsFromSource(bypassCache?: boolean): Promise<AdminProductRecord[]> {
  const config = getBackendConfig();
  let products: AdminProductRecord[] | null = null;

  if (config.supabaseConfigured) {
    try {
      const endpoint = `${config.supabaseUrl}/rest/v1/products?select=*&order=added_at.desc,created_at.desc`;
      const response = await fetch(
        endpoint,
        bypassCache
          ? { headers: supabaseHeaders(true), cache: "no-store" }
          : { headers: supabaseHeaders(false), next: { revalidate: 120 } },
      );

      if (response.ok) {
        const rows = (await response.json()) as SupabaseProductRow[];
        if (Array.isArray(rows) && rows.length > 0) {
          products = deduplicateAndNormalizeProducts(
            rows.map((row, idx) => normalizeProductRecord(rowToProduct(row, idx), idx)),
          );
        }
      }
    } catch {
      // Fall back gracefully if network/table is not ready yet
    }
  }

  if (!products) {
    const local = await readLocalStore();
    products = local.products;
  }

  return products;
}

export async function getAllStoreProducts(options?: {
  bypassCache?: boolean;
  includeInactive?: boolean;
}): Promise<AdminProductRecord[]> {
  let products: AdminProductRecord[];

  if (options?.bypassCache) {
    products = await fetchRawProductsFromSource(true);
    cachedRawProducts = {
      data: products,
      expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
    };
  } else if (cachedRawProducts && Date.now() < cachedRawProducts.expiresAt) {
    products = cachedRawProducts.data;
  } else {
    if (!inFlightProductsPromise) {
      inFlightProductsPromise = fetchRawProductsFromSource(false)
        .then((res) => {
          cachedRawProducts = {
            data: res,
            expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
          };
          inFlightProductsPromise = null;
          return res;
        })
        .catch((err) => {
          inFlightProductsPromise = null;
          throw err;
        });
    }
    products = await inFlightProductsPromise;
  }

  if (options?.includeInactive) {
    return products;
  }

  const activeProducts = products.filter((item) => item.status !== "inactive");
  const settings = await getStoreSettings();
  const saleActive = isFlashSaleActive(settings.flashSale);

  if (!saleActive) {
    // Standard E-Commerce Expiry Logic:
    // When Flash Sale ends or is disabled, products in the "flash-sale" section automatically
    // revert to their regular originalPrice across the storefront (Shop, Product page, Cart, Checkout).
    return activeProducts.map((item) => {
      if (
        item.sections.includes("flash-sale") &&
        typeof item.originalPrice === "number" &&
        item.originalPrice > item.price
      ) {
        const { originalPrice, ...rest } = item;
        return {
          ...rest,
          price: originalPrice,
        };
      }
      return item;
    });
  }

  return activeProducts;
}

export async function getHomepageCollections() {
  const [products, settings] = await Promise.all([
    getAllStoreProducts({ includeInactive: false }),
    getStoreSettings(),
  ]);
  const bySection = (section: ProductSectionKey, defaultIds: readonly string[]) => {
    const matched = products.filter((item) => item.sections.includes(section));
    if (matched.length > 0) {
      const custom = matched.filter((item) => !defaultIds.includes(item.id));
      const defaults = defaultIds
        .map((id) => matched.find((item) => item.id === id))
        .filter((item): item is AdminProductRecord => Boolean(item));
      return [...custom, ...defaults];
    }
    return products.slice(0, 6);
  };

  const taxonomy = settings.taxonomy ?? DEFAULT_CATALOG_TAXONOMY;
  const fallbackPool = [
    photos.folded,
    photos.rose,
    photos.mauve,
    photos.olive,
    photos.sand,
    photos.mocha,
  ];

  // 1. Custom categories added by Admin (everything except the base "hijabs" umbrella, plus "accessories")
  const customCategories: Category[] = taxonomy.categories
    .filter((cat) => cat.value !== "hijabs" && cat.value !== "accessories")
    .map((cat, idx) => {
      const matchingProduct = products.find((p) => p.category === cat.value);
      const fallbackPhoto = fallbackPool[idx % fallbackPool.length];
      const src = cat.imageSrc || matchingProduct?.photo.src || fallbackPhoto.src;
      const alt =
        cat.imageAlt ||
        matchingProduct?.photo.alt ||
        `${cat.label} collection`;
      return {
        id: `cat-${cat.value}`,
        name: cat.label,
        photo: { src, alt },
        href: `/shop?category=${encodeURIComponent(cat.value)}`,
      };
    });

  // 2. All active fabrics from taxonomy
  const fabricCategoryItems: Category[] = taxonomy.fabrics.map((fab, idx) => {
    const matchingProduct = products.find((p) => p.fabric === fab.value);
    const defaultMatch = sliderCategories.find((c) => c.id === fab.value);
    const fallbackPhoto = fallbackPool[(idx + 2) % fallbackPool.length];
    const src =
      fab.imageSrc ||
      defaultMatch?.photo.src ||
      matchingProduct?.photo.src ||
      fallbackPhoto.src;
    const alt =
      fab.imageAlt ||
      defaultMatch?.photo.alt ||
      matchingProduct?.photo.alt ||
      `${fab.label} hijabs`;
    return {
      id: fab.value,
      name: fab.label,
      photo: { src, alt },
      href: `/shop?fabric=${encodeURIComponent(fab.value)}`,
    };
  });

  // 3. Accessories (if active in taxonomy.categories)
  const accessoriesCat = taxonomy.categories.find((c) => c.value === "accessories");
  const accessoriesItem: Category[] = accessoriesCat
    ? [
        {
          id: "accessories",
          name: accessoriesCat.label,
          photo: {
            src: accessoriesCat.imageSrc || photos.accessories.src,
            alt: accessoriesCat.imageAlt || photos.accessories.alt,
          },
          href: "/shop?category=accessories",
        },
      ]
    : [];

  // 4. Extra curated showcase items from sliderCategories so the slider stays full
  const extraSliderItems = sliderCategories.slice(5);

  const homepageCategories: Category[] = [
    ...customCategories,
    ...fabricCategoryItems,
    ...accessoriesItem,
    ...extraSliderItems,
  ];

  return {
    allProducts: products,
    heroBanner: settings.heroBanner ?? DEFAULT_HERO_BANNER,
    flashSale: settings.flashSale ?? DEFAULT_FLASH_SALE,
    homepageStories:
      Array.isArray(settings.stories) && settings.stories.length > 0
        ? settings.stories
        : defaultStories,
    homepageCategories,
    newItems: bySection("new-items", DEFAULT_SECTION_MAP["new-items"]),
    saleProducts: bySection("flash-sale", DEFAULT_SECTION_MAP["flash-sale"]),
    popularProducts: bySection("most-popular", DEFAULT_SECTION_MAP["most-popular"]),
    recommendedProducts: bySection("just-for-you", DEFAULT_SECTION_MAP["just-for-you"]),
    topProducts: bySection("top-products", DEFAULT_SECTION_MAP["top-products"]),
  };
}

export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function collectProductMediaUrls(product?: AdminProductRecord | null): string[] {
  if (!product) return [];
  const urls = new Set<string>();
  if (product.photo?.src) {
    urls.add(product.photo.src);
  }
  for (const variant of product.details?.variants ?? []) {
    for (const galleryItem of variant.gallery ?? []) {
      if (galleryItem?.src) {
        urls.add(galleryItem.src);
      }
    }
  }
  return Array.from(urls);
}

function collectSettingsMediaUrls(settings?: AdminSettingsRecord | null): string[] {
  if (!settings) return [];
  const urls = new Set<string>();
  if (settings.heroBanner?.imageSrc) {
    urls.add(settings.heroBanner.imageSrc);
  }
  for (const story of settings.stories ?? []) {
    if (story.videoSrc) urls.add(story.videoSrc);
    if (story.photo?.src) urls.add(story.photo.src);
    if (story.avatar?.src) urls.add(story.avatar.src);
  }
  for (const cat of settings.taxonomy?.categories ?? []) {
    if (cat.imageSrc) urls.add(cat.imageSrc);
  }
  for (const fab of settings.taxonomy?.fabrics ?? []) {
    if (fab.imageSrc) urls.add(fab.imageSrc);
  }
  return Array.from(urls);
}

export async function cleanupUnusedMediaUrls(
  candidateUrls: Array<string | undefined | null>,
): Promise<number> {
  const managedCandidates = candidateUrls
    .map((u) => u?.trim() ?? "")
    .filter((u) => u.length > 0 && isManagedUploadedMedia(u));

  if (managedCandidates.length === 0) {
    return 0;
  }

  const [allProducts, settings] = await Promise.all([
    getAllStoreProducts({ bypassCache: true, includeInactive: true }),
    getStoreSettings(),
  ]);

  const activeReferenceKeys = new Set<string>();
  for (const product of allProducts) {
    for (const url of collectProductMediaUrls(product)) {
      const key = getCanonicalMediaKey(url);
      if (key) activeReferenceKeys.add(key);
    }
  }
  for (const url of collectSettingsMediaUrls(settings)) {
    const key = getCanonicalMediaKey(url);
    if (key) activeReferenceKeys.add(key);
  }

  const processedKeys = new Set<string>();
  let deletedCount = 0;

  for (const candidateUrl of managedCandidates) {
    const key = getCanonicalMediaKey(candidateUrl);
    if (!key || processedKeys.has(key) || activeReferenceKeys.has(key)) {
      continue;
    }
    processedKeys.add(key);
    const deleted = await deleteUploadedMedia(candidateUrl);
    if (deleted) {
      deletedCount += 1;
    }
  }

  return deletedCount;
}

export async function upsertStoreProduct(input: AdminProductInput): Promise<{
  product: AdminProductRecord;
  storage: "supabase" | "local";
}> {
  const [local, currentCatalog] = await Promise.all([
    readLocalStore(),
    getAllStoreProducts({ bypassCache: true, includeInactive: true }),
  ]);
  const category: ProductCategory = input.category?.trim() || "hijabs";
  const fabric: Fabric | null =
    category === "accessories" || !input.fabric ? null : input.fabric.trim();
  const colour: ProductColour = input.colour?.trim() || "rose";
  const normalizedInputName = input.name.trim().toLowerCase();

  // Standard E-commerce Duplicate Guard:
  // 1. If editing by explicit ID, find that product.
  // 2. If creating a new product, check if an identical product (same Name + Category + Fabric + Colour, or same custom SKU) already exists.
  //    If so, merge into that existing product instead of creating a duplicate inventory row.
  // 3. If a product with the same slug/name exists but has a DIFFERENT colour/fabric, disambiguate the slug (`${baseSlug}-${colour}`).
  const searchPool = [...local.products, ...currentCatalog];
  let existing = input.id?.trim()
    ? searchPool.find((item) => item.id === input.id?.trim())
    : searchPool.find(
        (item) =>
          (input.sku?.trim() && item.sku.toLowerCase() === input.sku.trim().toLowerCase()) ||
          (item.name.trim().toLowerCase() === normalizedInputName &&
            item.category === category &&
            (item.fabric ?? null) === fabric &&
            item.colour === colour),
      );

  const baseSlug = slugifyProductName(input.id || input.name) || `hijab-${Date.now()}`;
  let id = existing?.id || input.id?.trim() || baseSlug;

  if (!existing && !input.id?.trim()) {
    const slugCollision = searchPool.find((item) => item.id === id);
    if (slugCollision) {
      // Same base slug but different colour/fabric -> append colour to create a distinct product slug
      id = `${baseSlug}-${slugifyProductName(colour)}`;
      if (searchPool.some((item) => item.id === id)) {
        id = `${id}-${Date.now().toString().slice(-3)}`;
      }
    }
  }
  existing = existing ?? searchPool.find((item) => item.id === id);
  const previousMediaUrls = collectProductMediaUrls(existing);
  const previousPrimarySrc = existing?.photo?.src;

  const photo: Photo = {
    src: input.imageSrc.trim(),
    alt: input.imageAlt.trim() || input.name.trim(),
    ...(input.imagePosition ? { position: input.imagePosition } : {}),
  };

  const price = Math.max(0, Number(input.price));
  const originalPrice =
    input.originalPrice && Number(input.originalPrice) > price
      ? Number(input.originalPrice)
      : undefined;
  const costPrice =
    input.costPrice !== undefined && input.costPrice !== null && String(input.costPrice) !== ""
      ? Math.max(0, Number(input.costPrice))
      : existing?.costPrice ?? null;

  const baseDetails = createDemoDetails({
    id,
    category,
    fabric,
    colour,
    photo,
  });

  const description = input.description.trim() || baseDetails.description;
  const material = input.material?.trim() || baseDetails.material;
  const size = input.size?.trim() || baseDetails.size;
  const deliveryNote =
    input.deliveryNote?.trim() ||
    "Delivery within 1–3 business days inside Dhaka and 3–5 days nationwide.";

  const baseVariants = existing?.details.variants ?? baseDetails.variants;
  const primaryStock = Math.max(0, Math.round(Number(input.stock ?? 10)));

  const updatedVariants = baseVariants.map((v, idx) => {
    const filteredGallery = v.gallery.filter(
      (p) => p.src !== photo.src && p.src !== previousPrimarySrc,
    );
    const customVariantStock = input.variantStocks?.[v.colour];
    if (customVariantStock !== undefined) {
      return {
        ...v,
        stock: Math.max(0, Math.round(Number(customVariantStock))),
        gallery:
          idx === 0
            ? ([photo, ...filteredGallery] as [Photo, ...Photo[]])
            : v.gallery,
      };
    }
    if (idx === 0 || v.colour === colour) {
      return {
        ...v,
        colour: idx === 0 ? colour : v.colour,
        stock: primaryStock,
        gallery: [photo, ...filteredGallery] as [Photo, ...Photo[]],
      };
    }
    return v;
  }) as [ProductVariant, ...ProductVariant[]];

  const totalStock = input.variantStocks
    ? sumVariantStocks(updatedVariants)
    : primaryStock;

  const wasRestocked = existing ? totalStock > existing.stock : false;

  // Ensure SKU is unique across all other products
  const otherSkus = new Set(
    local.products.filter((item) => item.id !== id).map((item) => item.sku.toUpperCase()),
  );
  let resolvedSku = (
    input.sku?.trim() ||
    existing?.sku ||
    generateSku({ id, category, fabric, colour }, local.products.length)
  ).toUpperCase();
  let skuCounter = 2;
  const baseSku = resolvedSku;
  while (otherSkus.has(resolvedSku)) {
    resolvedSku = `${baseSku}-${skuCounter}`;
    skuCounter += 1;
  }

  // Merge sections if this was matched to an existing identical product when creating
  const mergedSections =
    !input.id?.trim() && existing
      ? Array.from(new Set([...existing.sections, ...input.sections]))
      : Array.from(new Set(input.sections));

  const product: AdminProductRecord = {
    id,
    slug: id,
    sku: resolvedSku,
    name: input.name.trim(),
    description,
    price,
    ...(originalPrice ? { originalPrice } : {}),
    costPrice,
    status: input.status ?? existing?.status ?? "active",
    photo,
    category,
    fabric,
    colour,
    addedAt: existing?.addedAt ?? new Date().toISOString().slice(0, 10),
    stock: totalStock,
    lowStockThreshold: Math.max(
      0,
      Math.round(Number(input.lowStockThreshold ?? existing?.lowStockThreshold ?? local.settings.lowStockThreshold)),
    ),
    lastRestockedAt: wasRestocked ? new Date().toISOString() : existing?.lastRestockedAt ?? null,
    sections: mergedSections,
    details: {
      description,
      material,
      size,
      deliveryNote,
      variants: updatedVariants,
    },
  };

  const config = getBackendConfig();
  let storage: "supabase" | "local" = "local";

  if (config.supabaseWriteConfigured) {
    try {
      const endpoint = `${config.supabaseUrl}/rest/v1/products?on_conflict=id`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...supabaseHeaders(true),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify([productToRow(product)]),
      });

      if (response.ok) {
        storage = "supabase";
      }
    } catch {
      // Fall back to local store
    }
  }

  const existingIndex = local.products.findIndex((item) => item.id === product.id);
  if (existingIndex >= 0) {
    local.products[existingIndex] = product;
    appendActivity(local, {
      type: wasRestocked ? "inventory" : "product",
      title: wasRestocked ? `Restocked ${product.name}` : `Updated ${product.name}`,
      detail: `SKU ${product.sku} · Price ৳${product.price} · Stock ${product.stock} units`,
    });
  } else {
    local.products.unshift(product);
    appendActivity(local, {
      type: "product",
      title: `Added new product: ${product.name}`,
      detail: `SKU ${product.sku} · Price ৳${product.price} · Initial stock ${product.stock}`,
    });
  }
  await writeLocalStore(local);

  // Smart Auto-Cleanup: Delete any replaced product image from Cloudinary / local uploads if no longer referenced
  void cleanupUnusedMediaUrls(previousMediaUrls);

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/cart");
  revalidatePath("/saved");
  revalidatePath("/checkout");
  revalidatePath(`/products/${product.slug}`);

  return { product, storage };
}

export async function updateVariantInventory(input: {
  productId: string;
  colour: ProductColour;
  stock: number;
  costPrice?: number | null;
  lowStockThreshold?: number;
}): Promise<{ product: AdminProductRecord; storage: "supabase" | "local" }> {
  const local = await readLocalStore();
  const existing = local.products.find((item) => item.id === input.productId);
  if (!existing) {
    throw new Error(`Product not found: ${input.productId}`);
  }

  const nextStock = Math.max(0, Math.round(Number(input.stock)));
  const updatedVariants = existing.details.variants.map((variant) =>
    variant.colour === input.colour ? { ...variant, stock: nextStock } : variant,
  ) as [ProductVariant, ...ProductVariant[]];

  const totalStock = sumVariantStocks(updatedVariants);
  const wasRestocked = totalStock > existing.stock;

  const updated: AdminProductRecord = {
    ...existing,
    stock: totalStock,
    ...(input.costPrice !== undefined ? { costPrice: input.costPrice } : {}),
    ...(input.lowStockThreshold !== undefined
      ? { lowStockThreshold: Math.max(0, Math.round(input.lowStockThreshold)) }
      : {}),
    lastRestockedAt: wasRestocked ? new Date().toISOString() : existing.lastRestockedAt,
    details: {
      ...existing.details,
      variants: updatedVariants,
    },
  };

  const config = getBackendConfig();
  let storage: "supabase" | "local" = "local";

  if (config.supabaseWriteConfigured) {
    try {
      const endpoint = `${config.supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(updated.id)}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: supabaseHeaders(true),
        body: JSON.stringify({
          stock: updated.stock,
          cost_price: updated.costPrice,
          low_stock_threshold: updated.lowStockThreshold,
          variants: updated.details.variants,
          last_restocked_at: updated.lastRestockedAt,
        }),
      });
      if (response.ok) storage = "supabase";
    } catch {
      // Keep local sync
    }
  }

  const idx = local.products.findIndex((item) => item.id === updated.id);
  if (idx >= 0) local.products[idx] = updated;
  appendActivity(local, {
    type: "inventory",
    title: `Variant stock updated: ${updated.name} (${input.colour})`,
    detail: `Variant stock set to ${nextStock} units · Total product stock: ${updated.stock}`,
  });
  await writeLocalStore(local);

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/cart");
  revalidatePath("/saved");
  revalidatePath("/checkout");
  revalidatePath(`/products/${updated.slug}`);

  return { product: updated, storage };
}

export async function deleteStoreProduct(id: string): Promise<{ storage: "supabase" | "local" }> {
  const [local, currentCatalog] = await Promise.all([
    readLocalStore(),
    getAllStoreProducts({ bypassCache: true, includeInactive: true }),
  ]);
  const removedFromLocal = local.products.find((item) => item.id === id);
  const removedFromCatalog = currentCatalog.find((item) => item.id === id);
  const removed = removedFromLocal ?? removedFromCatalog;
  const removedMediaUrls = collectProductMediaUrls(removed);

  const config = getBackendConfig();
  let storage: "supabase" | "local" = "local";

  if (config.supabaseWriteConfigured) {
    const endpoint = `${config.supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(id)}`;
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: supabaseHeaders(true),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase delete failed: ${errText}`);
    }
    storage = "supabase";
  }

  local.products = local.products.filter((item) => item.id !== id);
  if (removed) {
    appendActivity(local, {
      type: "product",
      title: `Removed product: ${removed.name}`,
      detail: `SKU ${removed.sku} was deleted from catalog`,
    });
  }
  await writeLocalStore(local);

  // Smart Auto-Cleanup: Delete removed product's images from Cloudinary / local uploads if not used elsewhere
  void cleanupUnusedMediaUrls(removedMediaUrls);

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/cart");
  revalidatePath("/saved");
  revalidatePath("/checkout");

  return { storage };
}

export async function seedSupabaseCatalog(): Promise<{ count: number }> {
  const config = getBackendConfig();
  if (!config.supabaseWriteConfigured) {
    throw new Error(
      "Supabase keys (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are not configured in .env.local yet.",
    );
  }

  const local = await readLocalStore();
  const rows = local.products.map(productToRow);

  const endpoint = `${config.supabaseUrl}/rest/v1/products?on_conflict=id`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...supabaseHeaders(true),
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Supabase seed failed: ${errText}`);
  }

  invalidateStoreMemoryCache();
  revalidatePath("/");
  revalidatePath("/shop");

  return { count: rows.length };
}

export async function getAllStoreOrders(): Promise<AdminOrderRecord[]> {
  const config = getBackendConfig();

  if (config.supabaseWriteConfigured) {
    try {
      const endpoint = `${config.supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc`;
      const response = await fetch(endpoint, {
        headers: supabaseHeaders(true),
        cache: "no-store",
      });
      if (response.ok) {
        const rows = (await response.json()) as SupabaseOrderRow[];
        return rows.map((row) =>
          normalizeOrderRecord({
            id: row.id,
            createdAt: row.created_at,
            updatedAt: row.updated_at ?? row.created_at,
            customer: {
              name: row.customer_name,
              phone: row.customer_phone,
              ...(row.customer_email ? { email: row.customer_email } : {}),
              address: row.customer_address,
              city: row.customer_city,
              ...(row.customer_notes ? { notes: row.customer_notes } : {}),
            },
            deliveryZone: row.delivery_zone,
            paymentMethod: row.payment_method,
            ...(row.payment_phone ? { paymentPhone: row.payment_phone } : {}),
            items: row.items,
            subtotal: Number(row.subtotal),
            discountAmount: Number(row.discount_amount ?? 0),
            couponCode: row.coupon_code ?? null,
            shippingFee: Number(row.shipping_fee),
            taxAmount: Number(row.tax_amount ?? 0),
            refundAmount: Number(row.refund_amount ?? 0),
            total: Number(row.total),
            status: row.status as Order["status"],
            paymentStatus: row.payment_status ?? undefined,
            deliveryStatus: row.delivery_status ?? undefined,
          }),
        );
      }
    } catch {
      // Fallback to local store
    }
  }

  const local = await readLocalStore();
  return local.orders;
}

function normalizePhoneForMatch(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  // Match last 11 digits for BD numbers (e.g. +88017... vs 017...)
  return digits.length > 11 ? digits.slice(-11) : digits;
}

export async function getStoreOrdersByIds(ids: string[]): Promise<AdminOrderRecord[]> {
  if (!ids || ids.length === 0) return [];
  const allOrders = await getAllStoreOrders();
  const idSet = new Set(ids);
  return allOrders.filter((order) => idSet.has(order.id));
}

export async function getStoreOrdersByCustomer(query: {
  ids?: string[];
  phone?: string | null;
  email?: string | null;
}): Promise<AdminOrderRecord[]> {
  const idSet = new Set((query.ids ?? []).map((id) => id.trim()).filter(Boolean));
  const cleanPhone = normalizePhoneForMatch(query.phone);
  const cleanEmail = query.email?.trim().toLowerCase() || "";

  if (idSet.size === 0 && !cleanPhone && !cleanEmail) {
    return [];
  }

  const allOrders = await getAllStoreOrders();
  return allOrders.filter((order) => {
    if (idSet.has(order.id)) return true;
    if (cleanPhone && normalizePhoneForMatch(order.customer.phone) === cleanPhone) return true;
    if (cleanEmail && order.customer.email?.trim().toLowerCase() === cleanEmail) return true;
    return false;
  });
}

const SYSTEM_SETTINGS_ROW_ID = "__system_store_settings__";
const SYSTEM_SETTINGS_CODE = "__SYSTEM_SETTINGS__";
const SYSTEM_CUSTOMERS_ROW_ID = "__system_customers_registry__";
const SYSTEM_CUSTOMERS_CODE = "__SYSTEM_CUSTOMERS__";
const SYSTEM_CONTACT_MESSAGES_ROW_ID = "__system_contact_messages__";
const SYSTEM_CONTACT_MESSAGES_CODE = "__SYSTEM_CONTACT_MESSAGES__";

function isSystemCouponRow(row: { id: string; code: string }): boolean {
  return (
    row.id === SYSTEM_SETTINGS_ROW_ID ||
    row.code === SYSTEM_SETTINGS_CODE ||
    row.id === SYSTEM_CUSTOMERS_ROW_ID ||
    row.code === SYSTEM_CUSTOMERS_CODE ||
    row.id === SYSTEM_CONTACT_MESSAGES_ROW_ID ||
    row.code === SYSTEM_CONTACT_MESSAGES_CODE ||
    row.id.startsWith("__system_") ||
    row.code.startsWith("__SYSTEM_")
  );
}

function isActiveOrderInventoryState(status: string): boolean {
  return status !== "Cancelled" && status !== "Returned";
}

async function validateOrderStock(items: Order["items"]): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your order must contain at least one item.");
  }
  const allProducts = await getAllStoreProducts({ bypassCache: true, includeInactive: true });
  for (const item of items) {
    const qty = Math.max(1, Math.round(Number(item.quantity ?? 1)));
    const prod = allProducts.find((p) => p.id === item.id || p.slug === item.slug);
    if (!prod) continue;
    if (prod.status === "inactive") {
      throw new Error(`Sorry, "${prod.name}" is currently unavailable.`);
    }
    const available = Math.max(0, Number(prod.stock ?? 0));
    if (available <= 0) {
      throw new Error(`Sorry, "${prod.name}" is currently out of stock (স্টক শেষ).`);
    }
    if (qty > available) {
      throw new Error(
        `Sorry, only ${available} unit(s) of "${prod.name}" are available in stock.`,
      );
    }
  }
}

async function adjustCatalogStockForOrderItems(
  local: LocalRuntimeStore,
  items: Order["items"],
  direction: -1 | 1,
): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;
  const config = getBackendConfig();

  for (const item of items) {
    const qty = Math.max(0, Math.round(Number(item.quantity ?? 1)));
    if (qty <= 0) continue;

    // 1. Update local store product stock
    const localProd = local.products.find((p) => p.id === item.id || p.slug === item.slug);
    let nextStock: number | undefined;
    let nextVariants: ProductVariant[] | undefined;

    if (localProd) {
      localProd.stock = Math.max(0, localProd.stock + direction * qty);
      if (localProd.details.variants.length > 0) {
        const targetIdx = item.colour
          ? localProd.details.variants.findIndex((v) => v.colour === item.colour)
          : 0;
        const resolvedIdx = targetIdx >= 0 ? targetIdx : 0;
        localProd.details.variants[resolvedIdx].stock = Math.max(
          0,
          localProd.details.variants[resolvedIdx].stock + direction * qty,
        );
      }
      nextStock = localProd.stock;
      nextVariants = localProd.details.variants;
    }

    // 2. Sync stock adjustment to Supabase products table
    if (config.supabaseWriteConfigured) {
      try {
        if (nextStock === undefined) {
          const checkRes = await fetch(
            `${config.supabaseUrl}/rest/v1/products?select=id,stock,variants&id=eq.${encodeURIComponent(item.id)}&limit=1`,
            {
              headers: supabaseHeaders(true),
              cache: "no-store",
            },
          );
          if (checkRes.ok) {
            const rows = (await checkRes.json()) as Array<{
              id: string;
              stock: number;
              variants?: ProductVariant[];
            }>;
            if (rows[0]) {
              nextStock = Math.max(0, Number(rows[0].stock ?? 0) + direction * qty);
              if (Array.isArray(rows[0].variants) && rows[0].variants.length > 0) {
                const targetIdx = item.colour
                  ? rows[0].variants.findIndex((v) => v.colour === item.colour)
                  : 0;
                const resolvedIdx = targetIdx >= 0 ? targetIdx : 0;
                nextVariants = rows[0].variants.map((v, idx) =>
                  idx === resolvedIdx
                    ? { ...v, stock: Math.max(0, Number(v.stock ?? 0) + direction * qty) }
                    : v,
                );
              }
            }
          }
        }

        if (nextStock !== undefined) {
          await fetch(
            `${config.supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(item.id)}`,
            {
              method: "PATCH",
              headers: supabaseHeaders(true),
              body: JSON.stringify({
                stock: nextStock,
                ...(nextVariants ? { variants: nextVariants } : {}),
              }),
            },
          );
        }
      } catch {
        // Keep local stock update
      }
    }
  }
}

async function incrementCouponUsage(
  local: LocalRuntimeStore,
  couponCode?: string | null,
): Promise<void> {
  if (!couponCode) return;
  const normalizedCode = couponCode.trim().toUpperCase();
  if (!normalizedCode) return;

  const localCoupon = local.coupons.find((c) => c.code === normalizedCode);
  if (localCoupon) {
    localCoupon.usageCount = Math.max(0, (localCoupon.usageCount ?? 0) + 1);
  }

  const config = getBackendConfig();
  if (config.supabaseWriteConfigured) {
    try {
      const checkRes = await fetch(
        `${config.supabaseUrl}/rest/v1/coupons?select=id,usage_count&code=eq.${encodeURIComponent(normalizedCode)}&limit=1`,
        {
          headers: supabaseHeaders(true),
          cache: "no-store",
        },
      );
      if (checkRes.ok) {
        const rows = (await checkRes.json()) as Array<{ id: string; usage_count: number }>;
        if (rows[0]) {
          const nextUsage = Math.max(0, Number(rows[0].usage_count ?? 0) + 1);
          await fetch(
            `${config.supabaseUrl}/rest/v1/coupons?id=eq.${encodeURIComponent(rows[0].id)}`,
            {
              method: "PATCH",
              headers: supabaseHeaders(true),
              body: JSON.stringify({ usage_count: nextUsage }),
            },
          );
        }
      }
    } catch {
      // Keep local usage count
    }
  }
}

export async function recordCustomerOrder(
  order: Order & Partial<Pick<AdminOrderRecord, "discountAmount" | "couponCode" | "paymentStatus" | "deliveryStatus">>,
): Promise<{ storage: "supabase" | "local"; order: AdminOrderRecord }> {
  const normalized = normalizeOrderRecord(order);
  await validateOrderStock(normalized.items);
  const config = getBackendConfig();
  let storage: "supabase" | "local" = "local";

  if (config.supabaseConfigured) {
    try {
      const row: SupabaseOrderRow = {
        id: normalized.id,
        customer_name: normalized.customer.name,
        customer_phone: normalized.customer.phone,
        customer_email: normalized.customer.email ?? null,
        customer_address: normalized.customer.address,
        customer_city: normalized.customer.city,
        customer_notes: normalized.customer.notes ?? null,
        delivery_zone: normalized.deliveryZone,
        payment_method: normalized.paymentMethod,
        payment_phone: normalized.paymentPhone ?? null,
        payment_status: normalized.paymentStatus,
        delivery_status: normalized.deliveryStatus,
        items: normalized.items,
        subtotal: normalized.subtotal,
        discount_amount: normalized.discountAmount,
        coupon_code: normalized.couponCode ?? null,
        shipping_fee: normalized.shippingFee,
        tax_amount: normalized.taxAmount,
        refund_amount: normalized.refundAmount,
        total: normalized.total,
        status: normalized.status,
        created_at: normalized.createdAt,
      };
      const endpoint = `${config.supabaseUrl}/rest/v1/orders`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: supabaseHeaders(true),
        body: JSON.stringify([row]),
      });
      if (response.ok) {
        storage = "supabase";
      }
    } catch {
      // Fallback to local runtime store
    }
  }

  const local = await readLocalStore();
  if (!local.orders.some((existing) => existing.id === normalized.id)) {
    local.orders.unshift(normalized);

    // Deduct stock in both local store and Supabase products table
    await adjustCatalogStockForOrderItems(local, normalized.items, -1);

    // Increment coupon usage count if a coupon was applied
    if (normalized.couponCode) {
      await incrementCouponUsage(local, normalized.couponCode);
    }

    appendActivity(local, {
      type: "order",
      title: `New order ${normalized.id} from ${normalized.customer.name}`,
      detail: `${normalized.items.length} item(s) · Total ৳${normalized.total} via ${normalized.paymentMethod.toUpperCase()}`,
    });
    await writeLocalStore(local);
  }

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { storage, order: normalized };
}

export async function updateStoreOrder(input: {
  id: string;
  status?: AdminOrderStatus;
  paymentStatus?: AdminPaymentStatus;
  deliveryStatus?: AdminDeliveryStatus;
  refundAmount?: number;
}): Promise<{ storage: "supabase" | "local"; order: AdminOrderRecord | null }> {
  const local = await readLocalStore();
  const target = local.orders.find((order) => order.id === input.id);
  const previousStatus = target?.status ?? "Pending";

  let derivedStatusFromDelivery: AdminOrderStatus | undefined;
  if (!input.status && input.deliveryStatus) {
    if (input.deliveryStatus === "Delivered") {
      derivedStatusFromDelivery = "Delivered";
    } else if (input.deliveryStatus === "In Transit" || input.deliveryStatus === "Out for Delivery") {
      derivedStatusFromDelivery = "Shipped";
    } else if (input.deliveryStatus === "Returned") {
      derivedStatusFromDelivery = "Returned";
    } else if (input.deliveryStatus === "Cancelled") {
      derivedStatusFromDelivery = "Cancelled";
    } else if (input.deliveryStatus === "Pending Dispatch") {
      const currentSt = target?.status;
      derivedStatusFromDelivery =
        currentSt === "Pending" || currentSt === "Confirmed" || currentSt === "Processing"
          ? currentSt
          : "Confirmed";
    }
  }

  const nextStatus = input.status ?? derivedStatusFromDelivery ?? target?.status ?? "Pending";
  const nextRefund =
    input.refundAmount !== undefined
      ? Math.max(0, Number(input.refundAmount))
      : nextStatus === "Refunded" && target
        ? target.total
        : target?.refundAmount ?? 0;

  const nextPaymentStatus =
    input.paymentStatus ??
    (target
      ? derivePaymentStatus(nextStatus, target.paymentMethod, undefined, nextRefund, target.total)
      : nextStatus === "Delivered"
        ? "Paid"
        : "Pending");

  const nextDeliveryStatus =
    input.deliveryStatus ?? deriveDeliveryStatus(nextStatus, undefined);

  const config = getBackendConfig();
  let storage: "supabase" | "local" = "local";

  if (config.supabaseWriteConfigured) {
    try {
      const endpoint = `${config.supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(input.id)}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: supabaseHeaders(true),
        body: JSON.stringify({
          status: nextStatus,
          payment_status: nextPaymentStatus,
          delivery_status: nextDeliveryStatus,
          refund_amount: nextRefund,
        }),
      });
      if (response.ok) {
        storage = "supabase";
      }
    } catch {
      // Keep local update
    }
  }

  // Restore stock if order transitions from active -> Cancelled/Returned, or re-deduct if re-activated
  if (target && previousStatus !== nextStatus) {
    const wasActive = isActiveOrderInventoryState(previousStatus);
    const isNowActive = isActiveOrderInventoryState(nextStatus);
    if (wasActive && !isNowActive) {
      await adjustCatalogStockForOrderItems(local, target.items, 1);
    } else if (!wasActive && isNowActive) {
      await adjustCatalogStockForOrderItems(local, target.items, -1);
    }
  }

  if (target) {
    target.status = nextStatus;
    target.paymentStatus = nextPaymentStatus;
    target.deliveryStatus = nextDeliveryStatus;
    target.refundAmount = nextRefund;
    target.updatedAt = new Date().toISOString();
    appendActivity(local, {
      type: "order",
      title: `Order ${target.id} updated`,
      detail: `Order: ${nextStatus} · Payment: ${nextPaymentStatus} · Delivery: ${nextDeliveryStatus}`,
    });
    await writeLocalStore(local);
  }

  revalidatePath("/");
  revalidatePath("/shop");

  return { storage, order: target ?? null };
}

export async function updateStoreOrderStatus(
  id: string,
  status: AdminOrderStatus,
): Promise<{ storage: "supabase" | "local" }> {
  const res = await updateStoreOrder({ id, status });
  return { storage: res.storage };
}

export async function getStoreCoupons(): Promise<AdminCouponRecord[]> {
  const config = getBackendConfig();
  if (config.supabaseConfigured) {
    try {
      const res = await fetch(
        `${config.supabaseUrl}/rest/v1/coupons?select=*&order=created_at.desc`,
        {
          headers: supabaseHeaders(true),
          cache: "no-store",
        },
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{
          id: string;
          code: string;
          description: string;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          min_order_amount: number;
          active: boolean;
          usage_count: number;
          created_at: string;
        }>;
        if (Array.isArray(rows)) {
          const validRows = rows.filter((r) => !isSystemCouponRow(r));
          if (validRows.length > 0) {
            return validRows.map((r) => ({
              id: r.id,
              code: r.code,
              description: r.description,
              discountType: r.discount_type,
              discountValue: Number(r.discount_value),
              minOrderAmount: Number(r.min_order_amount ?? 0),
              active: Boolean(r.active),
              usageCount: Number(r.usage_count ?? 0),
              createdAt: r.created_at,
            }));
          }
        }
      }
    } catch {
      // Fallback to local store
    }
  }

  const local = await readLocalStore();
  return local.coupons.filter((c) => !isSystemCouponRow(c));
}

export async function upsertStoreCoupon(input: {
  id?: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  active?: boolean;
}): Promise<AdminCouponRecord> {
  const local = await readLocalStore();
  const normalizedCode = input.code.trim().toUpperCase().replace(/\s+/g, "");
  const existingIdx = local.coupons.findIndex(
    (c) => c.id === input.id || c.code === normalizedCode,
  );

  const record: AdminCouponRecord = {
    id: input.id || (existingIdx >= 0 ? local.coupons[existingIdx].id : `cpn-${Date.now()}`),
    code: normalizedCode,
    description:
      input.description?.trim() ||
      `${input.discountValue}${input.discountType === "percentage" ? "%" : " BDT"} off`,
    discountType: input.discountType,
    discountValue: Math.max(0, Number(input.discountValue)),
    minOrderAmount: Math.max(0, Number(input.minOrderAmount ?? 0)),
    active: input.active ?? true,
    usageCount: existingIdx >= 0 ? local.coupons[existingIdx].usageCount : 0,
    createdAt: existingIdx >= 0 ? local.coupons[existingIdx].createdAt : new Date().toISOString(),
  };

  const config = getBackendConfig();
  if (config.supabaseWriteConfigured) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/coupons?on_conflict=id`, {
        method: "POST",
        headers: {
          ...supabaseHeaders(true),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify([
          {
            id: record.id,
            code: record.code,
            description: record.description,
            discount_type: record.discountType,
            discount_value: record.discountValue,
            min_order_amount: record.minOrderAmount,
            active: record.active,
            usage_count: record.usageCount,
            created_at: record.createdAt,
          },
        ]),
      });
    } catch {
      // Fallback to local store
    }
  }

  if (existingIdx >= 0) {
    local.coupons[existingIdx] = record;
  } else {
    local.coupons.unshift(record);
  }
  appendActivity(local, {
    type: "coupon",
    title: `Coupon ${record.code} saved`,
    detail: `${record.description} · Min order ৳${record.minOrderAmount}`,
  });
  await writeLocalStore(local);
  return record;
}

export async function deleteStoreCoupon(id: string): Promise<void> {
  const config = getBackendConfig();
  if (config.supabaseWriteConfigured) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/coupons?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: supabaseHeaders(true),
      });
    } catch {
      // Fallback
    }
  }

  const local = await readLocalStore();
  local.coupons = local.coupons.filter((c) => c.id !== id);
  await writeLocalStore(local);
}

function normalizeTaxonomy(raw?: Partial<CatalogTaxonomy> | null): CatalogTaxonomy {
  return {
    categories:
      Array.isArray(raw?.categories) && raw.categories.length > 0
        ? raw.categories
        : DEFAULT_CATALOG_TAXONOMY.categories,
    fabrics:
      Array.isArray(raw?.fabrics) && raw.fabrics.length > 0
        ? raw.fabrics
        : DEFAULT_CATALOG_TAXONOMY.fabrics,
    colours:
      Array.isArray(raw?.colours) && raw.colours.length > 0
        ? raw.colours
        : DEFAULT_CATALOG_TAXONOMY.colours,
  };
}

function optimizeStoryVideoSrc(rawUrl?: string): string | undefined {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/video/upload/")) {
    if (!trimmed.includes("/video/upload/f_auto")) {
      return trimmed.replace(
        "/video/upload/",
        "/video/upload/f_auto,q_auto:eco,vc_auto,w_720,c_limit/",
      );
    }
  }
  return trimmed;
}

function normalizeStories(raw?: Story[] | null): Story[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultStories;
  }
  return raw
    .filter(
      (item) =>
        item &&
        typeof item.label === "string" &&
        (Boolean(item.photo?.src) || Boolean(item.videoSrc?.trim())),
    )
    .map((item, idx) => {
      const fallbackPhotoSrc = item.photo?.src || defaultStories[0].photo.src;
      const optimizedVideo = optimizeStoryVideoSrc(item.videoSrc);
      return {
        id: item.id || `story-${idx + 1}`,
        label: item.label.trim() || `Story ${idx + 1}`,
        photo: {
          src: fallbackPhotoSrc,
          alt: item.photo?.alt || item.label,
          ...(item.photo?.position ? { position: item.photo.position } : {}),
        },
        avatar: {
          src: item.avatar?.src || fallbackPhotoSrc,
          alt: item.avatar?.alt || item.label,
          ...(item.avatar?.position ? { position: item.avatar.position } : {}),
        },
        ...(optimizedVideo ? { videoSrc: optimizedVideo } : {}),
        ...(item.href?.trim() ? { href: item.href.trim() } : {}),
      };
    });
}

async function fetchStoreSettingsFromSource(): Promise<AdminSettingsRecord> {
  const local = await readLocalStore();
  const config = getBackendConfig();

  if (config.supabaseConfigured) {
    try {
      const res = await fetch(
        `${config.supabaseUrl}/rest/v1/coupons?select=description&id=eq.${encodeURIComponent(SYSTEM_SETTINGS_ROW_ID)}&limit=1`,
        {
          headers: supabaseHeaders(true),
          next: { revalidate: 60 },
        },
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{ description?: string }>;
        if (rows[0]?.description) {
          const parsed = JSON.parse(rows[0].description) as Partial<AdminSettingsRecord>;
          return {
            ...DEFAULT_SETTINGS,
            ...local.settings,
            ...parsed,
            insideDhakaShippingFee: Math.max(
              0,
              Number(parsed.insideDhakaShippingFee ?? local.settings.insideDhakaShippingFee ?? 70),
            ),
            outsideDhakaShippingFee: Math.max(
              0,
              Number(parsed.outsideDhakaShippingFee ?? local.settings.outsideDhakaShippingFee ?? 130),
            ),
            contactEmail:
              parsed.contactEmail?.trim() ||
              local.settings.contactEmail?.trim() ||
              DEFAULT_SETTINGS.contactEmail,
            contactPhone:
              parsed.contactPhone?.trim() ||
              local.settings.contactPhone?.trim() ||
              DEFAULT_SETTINGS.contactPhone,
            contactLocation:
              parsed.contactLocation?.trim() ||
              local.settings.contactLocation?.trim() ||
              DEFAULT_SETTINGS.contactLocation,
            socialLinks: {
              ...DEFAULT_SETTINGS.socialLinks,
              ...(local.settings.socialLinks ?? {}),
              ...(parsed.socialLinks ?? {}),
            },
            heroBanner: {
              ...DEFAULT_HERO_BANNER,
              ...(local.settings.heroBanner ?? {}),
              ...(parsed.heroBanner ?? {}),
            },
            flashSale: {
              ...DEFAULT_FLASH_SALE,
              ...(local.settings.flashSale ?? {}),
              ...(parsed.flashSale ?? {}),
            },
            taxonomy: normalizeTaxonomy(parsed.taxonomy ?? local.settings.taxonomy),
            stories: normalizeStories(parsed.stories ?? local.settings.stories),
          };
        }
      }
    } catch {
      // Fallback to local settings
    }
  }

  return {
    ...DEFAULT_SETTINGS,
    ...local.settings,
    contactEmail: local.settings.contactEmail?.trim() || DEFAULT_SETTINGS.contactEmail,
    contactPhone: local.settings.contactPhone?.trim() || DEFAULT_SETTINGS.contactPhone,
    contactLocation: local.settings.contactLocation?.trim() || DEFAULT_SETTINGS.contactLocation,
    socialLinks: {
      ...DEFAULT_SETTINGS.socialLinks,
      ...(local.settings.socialLinks ?? {}),
    },
    heroBanner: {
      ...DEFAULT_HERO_BANNER,
      ...(local.settings.heroBanner ?? {}),
    },
    flashSale: {
      ...DEFAULT_FLASH_SALE,
      ...(local.settings.flashSale ?? {}),
    },
    taxonomy: normalizeTaxonomy(local.settings.taxonomy),
    stories: normalizeStories(local.settings.stories),
  };
}

export async function getStoreSettings(): Promise<AdminSettingsRecord> {
  if (cachedSettings && Date.now() < cachedSettings.expiresAt) {
    return cachedSettings.data;
  }
  if (!inFlightSettingsPromise) {
    inFlightSettingsPromise = fetchStoreSettingsFromSource()
      .then((res) => {
        cachedSettings = {
          data: res,
          expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
        };
        inFlightSettingsPromise = null;
        return res;
      })
      .catch((err) => {
        inFlightSettingsPromise = null;
        throw err;
      });
  }
  return inFlightSettingsPromise;
}

export async function updateStoreSettings(
  patch: Partial<AdminSettingsRecord>,
): Promise<AdminSettingsRecord> {
  const local = await readLocalStore();
  const currentSettings = await getStoreSettings();
  const previousSettingsMediaUrls = collectSettingsMediaUrls(currentSettings);
  const nextSettings: AdminSettingsRecord = {
    ...currentSettings,
    ...patch,
    lowStockThreshold: Math.max(
      0,
      Number(patch.lowStockThreshold ?? currentSettings.lowStockThreshold),
    ),
    insideDhakaShippingFee: Math.max(
      0,
      Number(patch.insideDhakaShippingFee ?? currentSettings.insideDhakaShippingFee ?? 70),
    ),
    outsideDhakaShippingFee: Math.max(
      0,
      Number(patch.outsideDhakaShippingFee ?? currentSettings.outsideDhakaShippingFee ?? 130),
    ),
    contactEmail:
      (patch.contactEmail !== undefined ? patch.contactEmail.trim() : currentSettings.contactEmail) ||
      DEFAULT_SETTINGS.contactEmail,
    contactPhone:
      (patch.contactPhone !== undefined ? patch.contactPhone.trim() : currentSettings.contactPhone) ||
      DEFAULT_SETTINGS.contactPhone,
    contactLocation:
      (patch.contactLocation !== undefined
        ? patch.contactLocation.trim()
        : currentSettings.contactLocation) || DEFAULT_SETTINGS.contactLocation,
    socialLinks: {
      ...DEFAULT_SETTINGS.socialLinks,
      ...(currentSettings.socialLinks ?? {}),
      ...(patch.socialLinks ?? {}),
    },
    monthlySalesTarget:
      patch.monthlySalesTarget === null || patch.monthlySalesTarget === undefined
        ? patch.monthlySalesTarget === null
          ? null
          : currentSettings.monthlySalesTarget
        : Math.max(0, Number(patch.monthlySalesTarget)),
    heroBanner: {
      ...DEFAULT_HERO_BANNER,
      ...(currentSettings.heroBanner ?? {}),
      ...(patch.heroBanner ?? {}),
    },
    flashSale: {
      ...DEFAULT_FLASH_SALE,
      ...(currentSettings.flashSale ?? {}),
      ...(patch.flashSale ?? {}),
    },
    taxonomy: normalizeTaxonomy(patch.taxonomy ?? currentSettings.taxonomy),
    stories: normalizeStories(patch.stories ?? currentSettings.stories),
  };

  local.settings = nextSettings;

  const config = getBackendConfig();
  if (config.supabaseWriteConfigured) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/coupons?on_conflict=id`, {
        method: "POST",
        headers: {
          ...supabaseHeaders(true),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify([
          {
            id: SYSTEM_SETTINGS_ROW_ID,
            code: SYSTEM_SETTINGS_CODE,
            description: JSON.stringify(nextSettings),
            discount_type: "fixed",
            discount_value: 0,
            min_order_amount: 0,
            active: false,
            usage_count: 0,
          },
        ]),
      });
    } catch {
      // Keep local settings
    }
  }

  appendActivity(local, {
    type: "settings",
    title: patch.stories
      ? "Homepage Stories updated"
      : patch.taxonomy
        ? "Catalog categories, fabrics & colours updated"
        : patch.heroBanner
          ? "Homepage Hero Banner & Settings updated"
          : patch.flashSale
            ? "Flash Sale timer & expiry settings updated"
            : "Store settings updated",
    detail: patch.stories
      ? `${nextSettings.stories.length} active stories on Homepage`
      : patch.taxonomy
        ? `${nextSettings.taxonomy.categories.length} categories · ${nextSettings.taxonomy.fabrics.length} fabrics · ${nextSettings.taxonomy.colours.length} colours`
        : patch.heroBanner
          ? `Banner: "${nextSettings.heroBanner.titleLine1} ${nextSettings.heroBanner.titleLine2}" — ${nextSettings.heroBanner.subtitle}`
          : patch.flashSale
            ? `Flash Sale ${nextSettings.flashSale.enabled ? "Enabled" : "Disabled"} · Action on expiry: ${nextSettings.flashSale.expiredBehavior}`
            : `Shipping: Inside Dhaka ৳${nextSettings.insideDhakaShippingFee}, Outside ৳${nextSettings.outsideDhakaShippingFee} · Low stock threshold: ${nextSettings.lowStockThreshold}`,
  });
  await writeLocalStore(local);
  cachedSettings = {
    data: nextSettings,
    expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
  };

  // Smart Auto-Cleanup: Delete any replaced/removed Hero Banner image, Story Video/Poster/Avatar, or Category image from Cloudinary / local uploads if no longer referenced
  void cleanupUnusedMediaUrls(previousSettingsMediaUrls);

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/checkout");
  revalidatePath("/cart");
  revalidatePath("/contact");

  return nextSettings;
}

export async function getStoreActivities(): Promise<AdminActivityRecord[]> {
  const local = await readLocalStore();
  return local.activities;
}

export async function applyStoreCoupon(
  code: string,
  subtotal: number,
): Promise<{ ok: boolean; discountAmount: number; couponCode: string; message: string }> {
  const normalized = code.trim().toUpperCase().replace(/\s+/g, "");
  const coupons = await getStoreCoupons();
  const found = coupons.find((c) => c.code === normalized && c.active);

  if (!found) {
    return { ok: false, discountAmount: 0, couponCode: "", message: "Invalid or expired coupon code." };
  }

  if (subtotal < found.minOrderAmount) {
    return {
      ok: false,
      discountAmount: 0,
      couponCode: "",
      message: `Minimum order amount of ৳${found.minOrderAmount} required for this coupon.`,
    };
  }

  let discount = 0;
  if (found.discountType === "percentage") {
    discount = Math.round((subtotal * found.discountValue) / 100);
  } else {
    discount = Math.min(subtotal, Math.round(found.discountValue));
  }

  return {
    ok: true,
    discountAmount: discount,
    couponCode: found.code,
    message: `Coupon ${found.code} applied! You saved ৳${discount}.`,
  };
}

async function fetchReviewsFromSource(options?: {
  productId?: string;
  status?: "all" | "approved" | "pending" | "rejected";
}): Promise<AdminReviewRecord[]> {
  const config = getBackendConfig();
  const isPublicApprovedRead = options?.status === "approved";

  if (config.supabaseConfigured) {
    try {
      let endpoint = `${config.supabaseUrl}/rest/v1/reviews?select=*&order=created_at.desc`;
      if (options?.productId) {
        endpoint += `&product_id=eq.${encodeURIComponent(options.productId)}`;
      }
      if (options?.status && options.status !== "all") {
        endpoint += `&status=eq.${encodeURIComponent(options.status)}`;
      }
      const res = await fetch(
        endpoint,
        isPublicApprovedRead
          ? { headers: supabaseHeaders(true), next: { revalidate: 60 } }
          : { headers: supabaseHeaders(true), cache: "no-store" },
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{
          id: string;
          product_id: string;
          order_id?: string | null;
          customer_name: string;
          customer_phone?: string | null;
          rating: number;
          title?: string;
          comment: string;
          status: "pending" | "approved" | "rejected";
          verified_purchase: boolean;
          created_at: string;
        }>;
        if (Array.isArray(rows) && rows.length > 0) {
          const products = await getAllStoreProducts({ includeInactive: true });
          const prodMap = new Map(products.map((p) => [p.id, p.name]));
          return rows.map((r) => ({
            id: r.id,
            productId: r.product_id,
            productName: prodMap.get(r.product_id) || "Hijab Product",
            orderId: r.order_id,
            customerName: r.customer_name,
            customerPhone: r.customer_phone,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            status: r.status,
            verifiedPurchase: r.verified_purchase,
            createdAt: r.created_at,
          }));
        }
      }
    } catch {
      // Fallback
    }
  }

  const local = await readLocalStore();
  const products = await getAllStoreProducts({ includeInactive: true });
  const prodMap = new Map(products.map((p) => [p.id, p.name]));

  let list = (local.reviews ?? []).map((r) => ({
    ...r,
    productName: r.productName || prodMap.get(r.productId) || "Hijab Product",
  }));

  if (options?.productId) {
    list = list.filter((r) => r.productId === options.productId);
  }
  if (options?.status && options.status !== "all") {
    list = list.filter((r) => r.status === options.status);
  }
  return list;
}

export async function getAllStoreReviews(options?: {
  productId?: string;
  status?: "all" | "approved" | "pending" | "rejected";
}): Promise<AdminReviewRecord[]> {
  if (options?.status === "approved" && !options?.productId) {
    if (cachedApprovedReviews && Date.now() < cachedApprovedReviews.expiresAt) {
      return cachedApprovedReviews.data;
    }
    if (!inFlightApprovedReviewsPromise) {
      inFlightApprovedReviewsPromise = fetchReviewsFromSource({ status: "approved" })
        .then((res) => {
          cachedApprovedReviews = {
            data: res,
            expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
          };
          inFlightApprovedReviewsPromise = null;
          return res;
        })
        .catch((err) => {
          inFlightApprovedReviewsPromise = null;
          throw err;
        });
    }
    return inFlightApprovedReviewsPromise;
  }

  return fetchReviewsFromSource(options);
}

export async function createCustomerReview(input: {
  productId: string;
  orderId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  rating: number;
  title?: string;
  comment: string;
  status?: "pending" | "approved" | "rejected";
}): Promise<AdminReviewRecord> {
  const local = await readLocalStore();
  const normalizedOrderId = input.orderId?.trim() || null;

  // Enforce 1 review per product per order
  if (normalizedOrderId) {
    const existingLocal = (local.reviews ?? []).find(
      (r) => r.orderId === normalizedOrderId && r.productId === input.productId,
    );
    if (existingLocal) {
      throw new Error("এই প্রোডাক্টটির রিভিউ আপনি ইতিমধ্যে জমা দিয়েছেন। একটি প্রোডাক্টে একবারের বেশি রিভিউ দেওয়া যাবে না।");
    }

    const config = getBackendConfig();
    if (config.supabaseConfigured) {
      try {
        const checkRes = await fetch(
          `${config.supabaseUrl}/rest/v1/reviews?select=id&order_id=eq.${encodeURIComponent(normalizedOrderId)}&product_id=eq.${encodeURIComponent(input.productId)}&limit=1`,
          {
            headers: supabaseHeaders(true),
            cache: "no-store",
          },
        );
        if (checkRes.ok) {
          const rows = (await checkRes.json()) as Array<{ id: string }>;
          if (Array.isArray(rows) && rows.length > 0) {
            throw new Error("এই প্রোডাক্টটির রিভিউ আপনি ইতিমধ্যে জমা দিয়েছেন। একটি প্রোডাক্টে একবারের বেশি রিভিউ দেওয়া যাবে না।");
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("রিভিউ")) {
          throw err;
        }
      }
    }
  }

  const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const products = await getAllStoreProducts({ includeInactive: true });
  const prod = products.find((p) => p.id === input.productId);

  const record: AdminReviewRecord = {
    id,
    productId: input.productId,
    productName: prod?.name || "Hijab Product",
    orderId: normalizedOrderId,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone?.trim() || null,
    rating: Math.max(1, Math.min(5, Math.round(Number(input.rating)))),
    title: input.title?.trim() || "",
    comment: input.comment.trim(),
    status: input.status ?? "pending",
    verifiedPurchase: Boolean(normalizedOrderId),
    createdAt: new Date().toISOString(),
  };

  const config = getBackendConfig();
  if (config.supabaseConfigured) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/reviews`, {
        method: "POST",
        headers: supabaseHeaders(true),
        body: JSON.stringify({
          id: record.id,
          product_id: record.productId,
          order_id: record.orderId,
          customer_name: record.customerName,
          customer_phone: record.customerPhone,
          rating: record.rating,
          title: record.title,
          comment: record.comment,
          status: record.status,
          verified_purchase: record.verifiedPurchase,
          created_at: record.createdAt,
        }),
      });
    } catch {
      // Fallback
    }
  }

  if (!local.reviews) local.reviews = [];
  local.reviews.unshift(record);
  appendActivity(local, {
    type: "product",
    title: `New review submitted for ${record.productName}`,
    detail: `${record.rating}★ by ${record.customerName} (Order: ${record.orderId || "Direct"})`,
  });
  await writeLocalStore(local);
  return record;
}

export async function updateStoreReview(
  id: string,
  status: "pending" | "approved" | "rejected",
): Promise<{ ok: boolean }> {
  const config = getBackendConfig();
  if (config.supabaseConfigured) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/reviews?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: supabaseHeaders(true),
        body: JSON.stringify({ status }),
      });
    } catch {
      // Fallback
    }
  }

  const local = await readLocalStore();
  if (local.reviews) {
    const target = local.reviews.find((r) => r.id === id);
    if (target) {
      target.status = status;
      appendActivity(local, {
        type: "product",
        title: `Review status changed to ${status}`,
        detail: `Review by ${target.customerName} for ${target.productName || "Product"}`,
      });
      await writeLocalStore(local);
    }
  }
  return { ok: true };
}

export async function deleteStoreReview(id: string): Promise<{ ok: boolean }> {
  const config = getBackendConfig();
  if (config.supabaseConfigured) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/reviews?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: supabaseHeaders(true),
      });
    } catch {
      // Fallback
    }
  }

  const local = await readLocalStore();
  if (local.reviews) {
    local.reviews = local.reviews.filter((r) => r.id !== id);
    await writeLocalStore(local);
  }
  return { ok: true };
}

export async function getCustomerAccounts(): Promise<CustomerAccountRecord[]> {
  const local = await readLocalStore();
  const config = getBackendConfig();

  if (config.supabaseConfigured) {
    try {
      const res = await fetch(
        `${config.supabaseUrl}/rest/v1/coupons?select=description&id=eq.${encodeURIComponent(SYSTEM_CUSTOMERS_ROW_ID)}&limit=1`,
        {
          headers: supabaseHeaders(true),
          cache: "no-store",
        },
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{ description?: string }>;
        if (rows[0]?.description) {
          const parsed = JSON.parse(rows[0].description) as CustomerAccountRecord[];
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch {
      // Fallback to local
    }
  }

  return local.customers ?? [];
}

async function saveCustomerAccounts(
  local: LocalRuntimeStore,
  accounts: CustomerAccountRecord[],
): Promise<void> {
  local.customers = accounts;
  const config = getBackendConfig();
  if (config.supabaseWriteConfigured) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/coupons?on_conflict=id`, {
        method: "POST",
        headers: {
          ...supabaseHeaders(true),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify([
          {
            id: SYSTEM_CUSTOMERS_ROW_ID,
            code: SYSTEM_CUSTOMERS_CODE,
            description: JSON.stringify(accounts),
            discount_type: "fixed",
            discount_value: 0,
            min_order_amount: 0,
            active: false,
            usage_count: accounts.length,
          },
        ]),
      });
    } catch {
      // Keep local accounts
    }
  }
  await writeLocalStore(local);
}

function hashCustomerPassword(raw: string): string {
  if (raw.startsWith("sha256:")) return raw;
  const digest = createHash("sha256").update(`noor-salt-v1:${raw}`).digest("hex");
  return `sha256:${digest}`;
}

function verifyCustomerPassword(stored: string, candidate: string): boolean {
  if (stored.startsWith("sha256:")) {
    return stored === hashCustomerPassword(candidate);
  }
  return stored === candidate;
}

export async function upsertCustomerAccount(input: {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  password: string;
}): Promise<Omit<CustomerAccountRecord, "password">> {
  const local = await readLocalStore();
  const accounts = await getCustomerAccounts();
  const cleanPhone = normalizePhoneForMatch(input.phone);
  const cleanEmail = input.email?.trim().toLowerCase() || undefined;

  const existingIdx = accounts.findIndex(
    (u) =>
      (input.id && u.id === input.id) ||
      normalizePhoneForMatch(u.phone) === cleanPhone ||
      (cleanEmail && u.email?.toLowerCase() === cleanEmail),
  );

  const record: CustomerAccountRecord = {
    id:
      input.id ||
      (existingIdx >= 0 ? accounts[existingIdx].id : `USR-${Date.now().toString().slice(-6)}`),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: cleanEmail,
    address: input.address?.trim() || undefined,
    city: input.city?.trim() || undefined,
    password: hashCustomerPassword(input.password),
    createdAt: existingIdx >= 0 ? accounts[existingIdx].createdAt : new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    accounts[existingIdx] = record;
  } else {
    accounts.unshift(record);
  }

  await saveCustomerAccounts(local, accounts);
  const { password: _pw, ...profile } = record;
  void _pw;
  return profile;
}

export async function verifyCustomerAccount(
  identifier: string,
  password: string,
): Promise<
  | { ok: true; user: Omit<CustomerAccountRecord, "password"> }
  | { ok: false; error: string }
> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPhone = normalizePhoneForMatch(identifier);
  const accounts = await getCustomerAccounts();

  const match = accounts.find(
    (u) =>
      u.phone.toLowerCase() === cleanId ||
      (cleanPhone && normalizePhoneForMatch(u.phone) === cleanPhone) ||
      (u.email && u.email.toLowerCase() === cleanId),
  );

  if (!match) {
    return {
      ok: false,
      error:
        "No account found with this phone or email. Please sign up first or continue as a guest.",
    };
  }
  if (!verifyCustomerPassword(match.password, password)) {
    return { ok: false, error: "Incorrect password. Please try again." };
  }

  const { password: _pw, ...profile } = match;
  void _pw;
  return { ok: true, user: profile };
}

export async function changeCustomerAccountPassword(input: {
  id: string;
  phone?: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const local = await readLocalStore();
  const accounts = await getCustomerAccounts();
  const idx = accounts.findIndex(
    (u) =>
      u.id === input.id ||
      (input.phone && normalizePhoneForMatch(u.phone) === normalizePhoneForMatch(input.phone)),
  );
  if (idx < 0) {
    return { ok: false, error: "Customer account not found." };
  }
  const current = accounts[idx];
  if (!verifyCustomerPassword(current.password, input.currentPassword)) {
    return { ok: false, error: "Your current password is incorrect." };
  }
  if (!input.newPassword || input.newPassword.length < 4) {
    return { ok: false, error: "New password must be at least 4 characters." };
  }
  accounts[idx] = {
    ...current,
    password: hashCustomerPassword(input.newPassword),
  };
  await saveCustomerAccounts(local, accounts);
  return { ok: true };
}

export async function updateCustomerAccountProfile(input: {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
}): Promise<Omit<CustomerAccountRecord, "password"> | null> {
  const local = await readLocalStore();
  const accounts = await getCustomerAccounts();
  const idx = accounts.findIndex(
    (u) =>
      u.id === input.id ||
      (input.phone && normalizePhoneForMatch(u.phone) === normalizePhoneForMatch(input.phone)),
  );
  if (idx < 0) return null;

  const current = accounts[idx];
  const updated: CustomerAccountRecord = {
    ...current,
    name: input.name !== undefined ? input.name.trim() || current.name : current.name,
    phone: input.phone !== undefined ? input.phone.trim() || current.phone : current.phone,
    email: input.email !== undefined ? input.email.trim().toLowerCase() || undefined : current.email,
    address: input.address !== undefined ? input.address.trim() || undefined : current.address,
    city: input.city !== undefined ? input.city.trim() || undefined : current.city,
  };

  accounts[idx] = updated;
  await saveCustomerAccounts(local, accounts);
  const { password: _pw, ...profile } = updated;
  void _pw;
  return profile;
}

export async function getCustomerAccountsPublic(): Promise<
  Array<Omit<CustomerAccountRecord, "password">>
> {
  const accounts = await getCustomerAccounts();
  return accounts.map(({ password: _pw, ...rest }) => {
    void _pw;
    return rest;
  });
}

export async function adminResetCustomerPassword(input: {
  id: string;
  phone?: string;
  newPassword: string;
}): Promise<{ ok: true; user: Omit<CustomerAccountRecord, "password"> } | { ok: false; error: string }> {
  if (!input.newPassword || input.newPassword.trim().length < 4) {
    return { ok: false, error: "New password must be at least 4 characters." };
  }
  const local = await readLocalStore();
  const accounts = await getCustomerAccounts();
  const idx = accounts.findIndex(
    (u) =>
      u.id === input.id ||
      (input.phone && normalizePhoneForMatch(u.phone) === normalizePhoneForMatch(input.phone)),
  );
  if (idx < 0) {
    return { ok: false, error: "Customer account not found." };
  }
  const current = accounts[idx];
  const updated: CustomerAccountRecord = {
    ...current,
    password: hashCustomerPassword(input.newPassword.trim()),
  };
  accounts[idx] = updated;
  appendActivity(local, {
    type: "settings",
    title: `Customer password reset: ${updated.name}`,
    detail: `Account ${updated.id} (${updated.phone}) password was reset by Admin`,
  });
  await saveCustomerAccounts(local, accounts);
  const { password: _pw, ...profile } = updated;
  void _pw;
  return { ok: true, user: profile };
}

export async function getContactMessages(): Promise<ContactMessageRecord[]> {
  const local = await readLocalStore();
  const config = getBackendConfig();

  if (config.supabaseConfigured) {
    try {
      const res = await fetch(
        `${config.supabaseUrl}/rest/v1/coupons?select=description&id=eq.${encodeURIComponent(SYSTEM_CONTACT_MESSAGES_ROW_ID)}&limit=1`,
        {
          headers: supabaseHeaders(true),
          cache: "no-store",
        },
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{ description?: string }>;
        if (rows[0]?.description) {
          const parsed = JSON.parse(rows[0].description) as ContactMessageRecord[];
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch {
      // Fallback to local
    }
  }

  return local.contactMessages ?? [];
}

async function saveContactMessages(
  local: LocalRuntimeStore,
  messages: ContactMessageRecord[],
): Promise<void> {
  local.contactMessages = messages;
  const config = getBackendConfig();
  if (config.supabaseWriteConfigured) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/coupons?on_conflict=id`, {
        method: "POST",
        headers: {
          ...supabaseHeaders(true),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify([
          {
            id: SYSTEM_CONTACT_MESSAGES_ROW_ID,
            code: SYSTEM_CONTACT_MESSAGES_CODE,
            description: JSON.stringify(messages),
            discount_type: "fixed",
            discount_value: 0,
            min_order_amount: 0,
            active: false,
            usage_count: messages.length,
          },
        ]),
      });
    } catch {
      // Keep local
    }
  }
  await writeLocalStore(local);
}

export async function createContactMessage(input: {
  name: string;
  contact: string;
  topic?: string;
  message: string;
}): Promise<ContactMessageRecord> {
  const local = await readLocalStore();
  const messages = await getContactMessages();
  const record: ContactMessageRecord = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    contact: input.contact.trim(),
    topic: input.topic?.trim() || "Order Inquiry",
    message: input.message.trim(),
    status: "unread",
    createdAt: new Date().toISOString(),
  };

  messages.unshift(record);
  appendActivity(local, {
    type: "settings",
    title: `New Contact Inquiry: ${record.topic}`,
    detail: `From ${record.name} (${record.contact})`,
  });
  await saveContactMessages(local, messages);
  return record;
}

export async function updateContactMessageStatus(
  id: string,
  status: "unread" | "resolved",
): Promise<boolean> {
  const local = await readLocalStore();
  const messages = await getContactMessages();
  const idx = messages.findIndex((m) => m.id === id);
  if (idx < 0) return false;
  messages[idx] = { ...messages[idx], status };
  await saveContactMessages(local, messages);
  return true;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const local = await readLocalStore();
  const messages = await getContactMessages();
  const next = messages.filter((m) => m.id !== id);
  await saveContactMessages(local, next);
  return true;
}

