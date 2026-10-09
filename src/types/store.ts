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

export type Story = {
  id: string;
  label: string;
  photo: Photo;
  avatar: Photo;
};

export type Category = { id: string; name: string; photo: Photo };
export type NavItem = { label: string; href?: string; feature?: string };
