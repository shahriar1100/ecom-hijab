import type { CatalogProduct, Fabric, Photo, ProductColour, ProductDetails, ProductVariant } from "@/types/store";
import { photos } from "./photos";

// Local preview data only. Replace dimensions, stock and variant image URLs with
// real catalogue data later; the page does not infer inventory or generate photos.
const colourGalleries: Record<ProductColour, [Photo, ...Photo[]]> = {
  rose: [photos.rose, photos.roseFolds],
  olive: [photos.olive, photos.jersey],
  black: [photos.black],
  sand: [photos.sand, photos.chiffon],
  mocha: [photos.mocha],
  mauve: [photos.mauve, photos.silk],
  burgundy: [photos.burgundy],
  multi: [photos.folded, photos.roseFolds],
  gold: [photos.accessories],
};

const demoStock: Record<ProductColour, number> = {
  rose: 8, olive: 7, black: 12, sand: 4, mocha: 6, mauve: 3, burgundy: 0, multi: 10, gold: 12,
};

const fabricDetails: Record<Fabric, { material: string; size: string; description: string; colours: ProductColour[] }> = {
  modal: { material: "Modal", size: "180 × 70 cm", description: "A soft, fluid drape for everyday styling. An effortless finishing touch, from quiet mornings to evenings out.", colours: ["rose", "sand", "mocha", "black", "mauve", "burgundy"] },
  chiffon: { material: "Chiffon", size: "180 × 70 cm", description: "Light, airy layers with a delicate finish. A versatile piece to fold, drape and style your own way.", colours: ["rose", "sand", "black"] },
  jersey: { material: "Jersey", size: "180 × 75 cm", description: "An easy, relaxed drape with a comfortable feel. A simple companion for your everyday wardrobe.", colours: ["olive", "black"] },
  silk: { material: "Silk", size: "180 × 70 cm", description: "A smooth finish with a gentle sheen. Softly flowing folds bring a little elegance to everyday moments.", colours: ["mauve", "rose", "sand", "mocha"] },
};

const accessoryDetails: Record<string, { material: string; size: string; description: string }> = {
  "flower-scrunchie": { material: "Fabric scrunchie", size: "One size", description: "A soft floral accessory for a simple finishing touch to your everyday styling." },
  "gold-hijab-pins": { material: "Metal", size: "Set of 4 pins", description: "Simple gold-tone pins to keep your favourite drape neatly in place." },
  "accessory-set": { material: "Fabric & metal", size: "One-size assortment", description: "A coordinated selection of scrunchies and hijab pins for everyday styling." },
};

export function createDemoDetails(product: Pick<CatalogProduct, "id" | "category" | "fabric" | "colour" | "photo">): ProductDetails {
  const fabric = product.fabric ? fabricDetails[product.fabric] : null;
  const information = fabric ?? accessoryDetails[product.id] ?? {
    material: "Accessories", size: "One size", description: "A thoughtful finishing touch for your everyday collection.",
  };

  function variant(colour: ProductColour, primary: Photo): ProductVariant {
    const extras = product.category === "accessories" ? [] : colourGalleries[colour].filter((photo) => photo.src !== primary.src);
    return { colour, stock: demoStock[colour], gallery: [primary, ...extras] };
  }

  return {
    description: information.description,
    material: information.material,
    size: information.size,
    deliveryNote: "Delivery timings and charges will be shared when ordering opens.",
    variants: [variant(product.colour, product.photo), ...(fabric?.colours ?? [])
      .filter((colour) => colour !== product.colour)
      .map((colour) => variant(colour, colourGalleries[colour][0]))],
  };
}
