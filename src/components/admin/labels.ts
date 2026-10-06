/** Human labels for catalogue enums in the admin (English). */

export const KINDS = { FRAGRANCE: "Fragrance", THERAPY: "Therapy", GIFT_SET: "Gift set", DISCOVERY_SET: "Discovery set" } as const;
export const STATUSES = { ACTIVE: "Active (on sale)", DRAFT: "Draft (hidden)", ARCHIVED: "Archived (hidden)" } as const;
export const FORMS = { PERFUME: "Perfume", ATTAR: "Attar", OIL: "Therapy oil", SET: "Gift set" } as const;
export const FAMILIES = {
  OUD: "Oud",
  FLORAL: "Floral",
  WOODY: "Woody",
  AMBER: "Amber",
  MUSK: "Musk",
  CITRUS: "Citrus",
  FRESH: "Fresh",
  SPICY: "Spicy",
  GOURMAND: "Gourmand",
  EARTHY: "Earthy",
  HERBAL: "Herbal",
} as const;
export const GENDERS = { MEN: "For him", WOMEN: "For her", UNISEX: "Unisex" } as const;
export const MOODS = { CALM: "Calm", ENERGETIC: "Energetic", CONFIDENT: "Confident", FOCUSED: "Focused", ROMANTIC: "Romantic", BALANCED: "Balanced" } as const;
export const NEEDS = { STRESS: "Stress relief", SLEEP: "Better sleep", FOCUS: "Focus & energy", SKIN_HAIR: "Skin & hair", BALANCE: "Emotional balance" } as const;
export const SEASONS = { SPRING: "Spring", SUMMER: "Summer", MONSOON: "Monsoon", AUTUMN: "Autumn", WINTER: "Winter" } as const;
export const TIMES = { DAY: "Day", NIGHT: "Night" } as const;
export const OCCASIONS = { EVERYDAY: "Everyday", OFFICE: "Office", DATE: "Date night", CELEBRATION: "Celebration", PRAYER: "Prayer", TRAVEL: "Travel" } as const;
export const SHAPES = { facet: "Faceted", round: "Round", column: "Column", arch: "Arch" } as const;

export const keysOf = <T extends Record<string, string>>(o: T) => Object.keys(o) as (keyof T & string)[];
