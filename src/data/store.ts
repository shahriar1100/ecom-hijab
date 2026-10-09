import type { Category, NavItem, Story } from "@/types/store";
import { photos } from "./photos";
import { selectProducts } from "./catalog";
export { photos } from "./photos";

export const hero = {
  title: ["Everyday", "Elegance"],
  subtitle: "Premium Hijabs for You",
  photo: photos.hero,
};

export const categories: Category[] = [
  { id: "modal", name: "Modal", photo: photos.modal, href: "/shop?fabric=modal" },
  { id: "chiffon", name: "Chiffon", photo: photos.chiffon, href: "/shop?fabric=chiffon" },
  { id: "jersey", name: "Jersey", photo: photos.jersey, href: "/shop?fabric=jersey" },
  { id: "silk", name: "Silk", photo: photos.silk, href: "/shop?fabric=silk" },
  { id: "accessories", name: "Accessories", photo: photos.accessories, href: "/shop?category=accessories" },
];

export const stories: Story[] = [
  { id: "new-in", label: "New In", photo: photos.burgundy, avatar: photos.rose },
  { id: "modal-edit", label: "Modal Edit", photo: photos.folded, avatar: photos.black },
  { id: "styling", label: "Styling", photo: photos.sand, avatar: photos.sand },
  { id: "your-looks", label: "Your Looks", photo: photos.black, avatar: photos.rose },
  { id: "daily-wear", label: "Daily Wear", photo: photos.folded, avatar: photos.olive },
  { id: "tutorials", label: "Tutorials", photo: photos.rose, avatar: photos.rose },
  { id: "customer-love", label: "Customer Love", photo: photos.olive, avatar: photos.sand },
  { id: "care-tips", label: "Care Tips", photo: photos.folded, avatar: photos.black },
  { id: "behind-scenes", label: "BTS", photo: photos.mauve, avatar: photos.rose },
];

export const newItems = selectProducts([
  "premium-modal-rose", "chiffon-classics", "jersey-olive", "silk-mauve",
]);

export const saleProducts = selectProducts([
  "sale-black", "sale-rose", "sale-ivory", "sale-colors", "sale-mocha", "sale-essentials",
]);

export const popularProducts = selectProducts([
  "popular-mocha", "popular-black", "popular-sand", "popular-mauve", "popular-olive",
]);

export const recommendedProducts = selectProducts([
  "for-you-rose", "for-you-modal", "for-you-jersey", "for-you-mauve", "for-you-black", "for-you-silk",
]);

export const topProducts = selectProducts([
  "popular-sand", "chiffon-classics", "popular-black", "top-jersey", "premium-modal-rose",
  "sale-essentials", "jersey-olive", "silk-mauve", "popular-mocha", "sale-colors",
]);

export const navigation: NavItem[] = [
  { label: "Home", href: "/#home" },
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/#new-items" },
  { label: "Collections", href: "/#categories" },
];

export const footerLinks: { title: string; items: NavItem[] }[] = [
  { title: "Shop", items: [
    { label: "All Hijabs", href: "/shop?category=hijabs" },
    { label: "New Arrivals", href: "/#new-items" },
    { label: "Collections", href: "/#categories" },
    { label: "Accessories", href: "/shop?category=accessories" },
  ] },
  { title: "Help", items: [
    { label: "Size Guide", feature: "Size guide" },
    { label: "Care Instructions", feature: "Care instructions" },
    { label: "Shipping & Delivery", feature: "Shipping information" },
    { label: "Returns & Exchanges", feature: "Returns and exchanges" },
    { label: "FAQs", feature: "FAQs" },
  ] },
];

// Intentionally not real business contact details. Replace before any future launch.
export const demoContact = {
  isPlaceholder: true,
  email: "hello@noor.example",
  phone: "+880 1XXX XXXXXX",
  location: "Dhaka, Bangladesh",
};

export const demoSale = { isDemo: true, hours: "00", minutes: "36", seconds: "58" };
export const formatPrice = (price: number) => `৳${price.toLocaleString("en-BD")}`;
