import type { Category, NavItem, Photo, Product, Story } from "@/types/store";

// All imagery and prices are replaceable local demo content, not live inventory.
export const photos = {
  hero: { src: "/images/hero.webp", alt: "A woman in a mocha hijab and cream blouse in a warm, sunlit setting", position: "center 42%" },
  rose: { src: "/images/rose-portrait.webp", alt: "Soft dusty rose hijab, styled with a cream blouse", position: "center 35%" },
  olive: { src: "/images/olive-portrait.webp", alt: "Olive green jersey hijab with softly draped folds", position: "center 35%" },
  black: { src: "/images/black-portrait.webp", alt: "Classic black hijab styled for everyday wear", position: "center 35%" },
  sand: { src: "/images/sand-portrait.webp", alt: "Light sand hijab with a soft, flowing drape", position: "center 35%" },
  mocha: { src: "/images/mocha-portrait.webp", alt: "Mocha brown hijab with elegant layered folds", position: "center 35%" },
  mauve: { src: "/images/mauve-portrait.webp", alt: "Dusty mauve hijab styled with a relaxed drape", position: "center 35%" },
  burgundy: { src: "/images/burgundy-portrait.webp", alt: "Deep burgundy hijab in a classic everyday style", position: "center 35%" },
  roseFolds: { src: "/images/rose-folds.webp", alt: "Neatly folded dusty rose hijabs with soft flowing folds" },
  folded: { src: "/images/folded-hijabs.webp", alt: "Folded hijabs in dusty rose, beige, olive and navy" },
  modal: { src: "/images/modal-fabric.webp", alt: "Soft terracotta rose modal fabric" },
  chiffon: { src: "/images/chiffon-fabric.webp", alt: "Airy ivory chiffon fabric" },
  jersey: { src: "/images/jersey-fabric.webp", alt: "Rich olive jersey fabric" },
  silk: { src: "/images/silk-fabric.webp", alt: "Dusty mauve silk with a subtle sheen" },
  accessories: { src: "/images/accessories.webp", alt: "Flower scrunchies and gold hijab pins on a cream background" },
} satisfies Record<string, Photo>;

export const hero = {
  title: ["Everyday", "Elegance"],
  subtitle: "Premium Hijabs for You",
  photo: photos.hero,
};

export const categories: Category[] = [
  { id: "modal", name: "Modal", photo: photos.modal },
  { id: "chiffon", name: "Chiffon", photo: photos.chiffon },
  { id: "jersey", name: "Jersey", photo: photos.jersey },
  { id: "silk", name: "Silk", photo: photos.silk },
  { id: "accessories", name: "Accessories", photo: photos.accessories },
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

export const newItems: Product[] = [
  { id: "premium-modal-rose", name: "Premium Modal Hijab", price: 650, photo: photos.rose },
  { id: "chiffon-classics", name: "Chiffon Hijab", price: 490, photo: photos.folded },
  { id: "jersey-olive", name: "Jersey Hijab", price: 750, photo: photos.olive },
  { id: "silk-mauve", name: "Silk Hijab", price: 650, photo: photos.roseFolds },
];

export const saleProducts: Product[] = [
  { id: "sale-black", name: "Classic Black Hijab", price: 520, originalPrice: 650, photo: photos.black },
  { id: "sale-rose", name: "Rose Chiffon Hijab", price: 480, originalPrice: 600, photo: photos.rose },
  { id: "sale-ivory", name: "Ivory Modal Hijab", price: 560, originalPrice: 700, photo: photos.sand },
  { id: "sale-colors", name: "Everyday Chiffon Hijab", price: 480, originalPrice: 600, photo: photos.folded },
  { id: "sale-mocha", name: "Mocha Modal Hijab", price: 520, originalPrice: 650, photo: photos.mocha },
  { id: "sale-essentials", name: "Signature Modal Hijab", price: 560, originalPrice: 700, photo: photos.folded },
];

export const popularProducts: Product[] = [
  { id: "popular-mocha", name: "Mocha Modal Hijab", price: 650, photo: photos.mocha },
  { id: "popular-black", name: "Black Jersey Hijab", price: 750, photo: photos.black },
  { id: "popular-sand", name: "Sand Chiffon Hijab", price: 650, photo: photos.sand },
  { id: "popular-mauve", name: "Mauve Silk Hijab", price: 750, photo: photos.mauve },
  { id: "popular-olive", name: "Olive Modal Hijab", price: 650, photo: photos.olive },
];

export const recommendedProducts: Product[] = [
  { id: "for-you-rose", name: "Premium Chiffon Hijab", price: 650, photo: photos.rose },
  { id: "for-you-modal", name: "Modal Hijab", price: 490, photo: photos.folded },
  { id: "for-you-jersey", name: "Jersey Hijab", price: 750, photo: photos.olive },
  { id: "for-you-mauve", name: "Premium Modal Hijab", price: 650, photo: photos.mauve },
  { id: "for-you-black", name: "Chiffon Hijab", price: 490, photo: photos.black },
  { id: "for-you-silk", name: "Silk Hijab", price: 750, photo: photos.silk },
];

export const topProducts: Product[] = [
  popularProducts[2], newItems[1], popularProducts[1],
  { id: "top-jersey", name: "Olive Jersey", price: 750, photo: photos.jersey },
  newItems[0], saleProducts[5], newItems[2], newItems[3], popularProducts[0], saleProducts[3],
];

export const navigation: NavItem[] = [
  { label: "Home", href: "#home" },
  { label: "Shop", href: "#new-items" },
  { label: "New Arrivals", href: "#new-items" },
  { label: "Collections", href: "#categories" },
];

export const footerLinks: { title: string; items: NavItem[] }[] = [
  { title: "Shop", items: [
    { label: "All Hijabs", href: "#just-for-you" },
    { label: "New Arrivals", href: "#new-items" },
    { label: "Collections", href: "#categories" },
    { label: "Accessories", feature: "Accessories" },
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
