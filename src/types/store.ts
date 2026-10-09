export type Photo = {
  src: string;
  alt: string;
  position?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  photo: Photo;
};

export type Fabric = "modal" | "chiffon" | "jersey" | "silk";
export type ProductCategory = "hijabs" | "accessories";
export type ProductColour = "rose" | "olive" | "black" | "sand" | "mocha" | "mauve" | "burgundy" | "multi" | "gold";

export type ProductVariant = {
  colour: ProductColour;
  stock: number;
  gallery: [Photo, ...Photo[]];
};

export type ProductDetails = {
  description: string;
  material: string;
  size: string;
  deliveryNote: string;
  variants: [ProductVariant, ...ProductVariant[]];
};

export type CatalogProduct = Product & {
  category: ProductCategory;
  fabric: Fabric | null;
  colour: ProductColour;
  addedAt: string;
  details: ProductDetails;
};

export type Story = {
  id: string;
  label: string;
  photo: Photo;
  avatar: Photo;
};

export type Category = { id: string; name: string; photo: Photo; href: string };
export type NavItem = { label: string; href?: string; feature?: string };
