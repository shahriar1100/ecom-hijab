export type Photo = {
  src: string;
  alt: string;
  position?: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  photo: Photo;
};

export type Fabric = "modal" | "chiffon" | "jersey" | "silk";
export type ProductCategory = "hijabs" | "accessories";
export type ProductColour = "rose" | "olive" | "black" | "sand" | "mocha" | "mauve" | "burgundy" | "multi" | "gold";

export type CatalogProduct = Product & {
  category: ProductCategory;
  fabric: Fabric | null;
  colour: ProductColour;
  addedAt: string;
};

export type Story = {
  id: string;
  label: string;
  photo: Photo;
  avatar: Photo;
};

export type Category = { id: string; name: string; photo: Photo; href: string };
export type NavItem = { label: string; href?: string; feature?: string };
