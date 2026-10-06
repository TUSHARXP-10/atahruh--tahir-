import type { GalleryImage } from "./image-field";
import { FAMILIES, FORMS, GENDERS, KINDS, SHAPES } from "./labels";

/* Draft shapes and helpers shared by the product editor (client) and its pages (server). */

export type FormType = keyof typeof FORMS;

export type VariantDraft = { key: string; id?: string; label: string; sizeMl: string; price: string; mrp: string; sku: string; stock: string; isDefault: boolean };
export type FormDraft = {
  key: string;
  id?: string;
  type: FormType;
  concentration: string;
  concentrationAr: string;
  description: string;
  descriptionAr: string;
  howToUse: string;
  howToUseAr: string;
  images: GalleryImage[];
  variants: VariantDraft[];
};
export type ProductDraft = {
  id?: string;
  name: string;
  nameAr: string;
  slug: string;
  kind: keyof typeof KINDS;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  tagline: string;
  taglineAr: string;
  story: string;
  storyAr: string;
  family: keyof typeof FAMILIES | "";
  gender: keyof typeof GENDERS;
  moods: string[];
  therapyNeeds: string[];
  seasons: string[];
  times: string[];
  occasions: string[];
  longevity: number;
  sillage: number;
  intensity: number;
  accentColor: string;
  bottleShape: keyof typeof SHAPES;
  isBestseller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isSampleable: boolean;
  useBottleArt: boolean;
  position: string;
  seoTitle: string;
  seoDescription: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  collectionIds: string[];
  pairIds: string[];
  forms: FormDraft[];
};

/** Stable-enough React key for rows created in the editor */
export const draftKey = () => Math.random().toString(36).slice(2, 10);
const key = draftKey;

const DEFAULT_SIZES: Record<FormType, [string, string][]> = {
  PERFUME: [["50 ml", "50"], ["100 ml", "100"]],
  ATTAR: [["6 ml", "6"], ["12 ml", "12"]],
  OIL: [["10 ml", "10"], ["30 ml", "30"]],
  SET: [["Set", "0"]],
};

export function skuFor(slug: string, type: FormType, size: string) {
  const base = (slug || "new").split("-").map((w) => w.slice(0, 3)).join("").toUpperCase().slice(0, 8);
  return `AAR-${base}-${type[0]}${size.replace(/\D/g, "") || "1"}`;
}

export function newForm(type: FormType, slug: string): FormDraft {
  return {
    key: key(),
    type,
    concentration: type === "PERFUME" ? "Eau de Parfum" : type === "ATTAR" ? "Pure attar oil" : "",
    concentrationAr: "",
    description: "",
    descriptionAr: "",
    howToUse: "",
    howToUseAr: "",
    images: [],
    variants: DEFAULT_SIZES[type].map(([label, ml], i) => ({ key: key(), label, sizeMl: ml, price: "", mrp: "", sku: skuFor(slug, type, ml), stock: "0", isDefault: i === 0 })),
  };
}

