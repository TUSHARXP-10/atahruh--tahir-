export type FormType = "PERFUME" | "ATTAR" | "OIL" | "SET";
export type ProductKind = "FRAGRANCE" | "THERAPY" | "GIFT_SET" | "DISCOVERY_SET";

export type CardVariant = {
  id: string;
  label: string;
  sizeMl: number;
  price: number;
  mrp: number | null;
  stock: number;
  isDefault: boolean;
};

export type CardForm = {
  type: FormType;
  concentration: string | null;
  /** First uploaded photo (null → generated bottle art) */
  image: string | null;
  /** Lifestyle image shown on hover */
  hoverImage: string | null;
  variants: CardVariant[];
};

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  kind: ProductKind;
  family: string | null;
  gender: "MEN" | "WOMEN" | "UNISEX";
  accentColor: string;
  bottleShape: string;
  useBottleArt: boolean;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  isSampleable: boolean;
  rating: { avg: number; count: number };
  forms: CardForm[];
  // facets used by filters & search
  moods: string[];
  needs: string[];
  notes: string[];
  minPrice: number;
  onSale: boolean;
  position: number;
  createdAt: string;
};

export type CatalogFilter = {
  kind?: ProductKind | ProductKind[];
  form?: FormType | FormType[];
  gender?: string[];
  family?: string[];
  mood?: string[];
  need?: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  onSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  ids?: string[];
};

export type CatalogSort = "featured" | "newest" | "price-asc" | "price-desc" | "rating";
