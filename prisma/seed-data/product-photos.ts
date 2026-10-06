import type { PhotoKey } from "../../src/lib/photo-manifest";

type Form = "PERFUME" | "ATTAR" | "OIL" | "SET";

/**
 * Stand-in photography per product form: [primary packshot, hover/mood image, ...gallery].
 * Dark, warm shots go to the bestsellers shown on the home page so the
 * storefront carries the sample's mood. Replace via Admin once real
 * product photography exists.
 */
export const PRODUCT_PHOTOS: Record<string, Partial<Record<Form, PhotoKey[]>>> = {
  // Fragrances
  "oud-al-layl": { PERFUME: ["archBottle", "bakhoorBurner", "goldSmoke"], ATTAR: ["attarLantern", "lanternOrnate"] },
  "rose-sahar": { PERFUME: ["floralBottle", "redRose", "peoniesDark"], ATTAR: ["crystalDecanters", "roseDark"] },
  "amber-sultan": { PERFUME: ["amberSilk", "candleGlow", "goldSmoke"], ATTAR: ["dropperFillGold", "lanternMarble"] },
  "musk-noor": { PERFUME: ["silkBottles", "candleCosy"], ATTAR: ["attarSilk", "silkBottles"] },
  "sandal-sufi": { PERFUME: ["woodCapBottle", "incenseWood"], ATTAR: ["labVials", "incenseLotus"] },
  mitti: { ATTAR: ["corkVial", "mountainRiver"] },
  shamama: { ATTAR: ["dropperFillAmber", "spiceBowls"] },
  majmua: { ATTAR: ["vialsFilling", "attarPair"] },
  khus: { PERFUME: ["flowerBottle", "mountainRiver"], ATTAR: ["attarSilkGrey", "attarRoll"] },
  "ruh-gulab": { ATTAR: ["orientalDecanter", "pinkRose"] },
  "jannat-al-firdaus": { PERFUME: ["crystalFlowers", "moroccanFountain"], ATTAR: ["attarPair", "rosesNiche"] },
  "zafran-royale": { PERFUME: ["amberGlow", "spiceScatter"], ATTAR: ["dropperFillDeep", "lanternTable"] },
  layla: { PERFUME: ["blankBottlePink", "candlesEucalyptus"], ATTAR: ["dropperFillWarm", "flowersDark"] },
  bahr: { PERFUME: ["clearSpray", "sprayMist"] },
  "noor-al-sabah": { PERFUME: ["goldenSpray", "orangeSlices"] },
  malik: { PERFUME: ["swirlBottles", "incenseWood"], ATTAR: ["attarRoll", "incenseLotus"] },
  yasmin: { PERFUME: ["whiteFlowerBottle", "peoniesDark"], ATTAR: ["attarSilk", "peoniesDark"] },
  hina: { ATTAR: ["dropperFillWarm", "spiceScatter"] },
  "kewda-breeze": { PERFUME: ["blankBottleRock", "waterfall"], ATTAR: ["attarPair", "corkVial"] },
  "oud-malaki": { ATTAR: ["attarLantern", "bakhoorBurner"] },
  saba: { PERFUME: ["blankBottleRock2", "lavenderField"] },
  "qahwa-noir": { PERFUME: ["amberBottle", "silverIncense"], ATTAR: ["dropperFillDeep", "morningCoffee"] },
  "ambergris-sky": { PERFUME: ["marbleBottle", "desertDunes"] },
  "bakhoor-nights": { PERFUME: ["amberSquare", "bakhoorBurner"], ATTAR: ["crystalDecanters", "smokeBlack"] },

  // Therapies
  "sukoon-stress-relief": { OIL: ["dropperStones", "meditation"] },
  "layl-better-sleep": { OIL: ["dropperLavender2", "lavenderField"] },
  "nashat-focus-energy": { OIL: ["rollerStones", "focusDesk"] },
  "shifa-skin-hair": { OIL: ["oilLinen", "facialRitual"] },
  "mizan-emotional-balance": { OIL: ["dropperPedestal", "yogaSunset"] },
  "nafas-breathe-easy": { OIL: ["dropperStones3", "diffuserSteam"] },

  // Gift sets
  "the-royal-edit": { SET: ["giftBlackGold", "crystalDecanters"] },
  "attar-treasury": { SET: ["giftSilver", "attarPair"] },
  "her-rose-garden": { SET: ["giftGoldBokeh", "redRose"] },
  "calm-ritual-box": { SET: ["giftCream", "candlesEucalyptus"] },
  "festive-celebration-set": { SET: ["giftGold", "tealights"] },
  "discovery-set": { SET: ["labVials", "vialsFilling"] },
};
