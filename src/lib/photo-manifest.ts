/**
 * Stand-in photography — every image was checked by eye: no third-party
 * perfume brands and no sacred texts. Sources are free for commercial use
 * (Unsplash License / Pexels License). Files are self-hosted by
 * `pnpm photos:fetch` into public/images/library/<key>.webp.
 *
 * u:<id>  → images.unsplash.com/photo-<id>
 * p:<id>  → images.pexels.com/photos/<id>
 */
export const PHOTO_SOURCES = {
  // ── Perfume bottles (unbranded) ─────────────────────────────────────────
  archBottle: "p:10688062",
  amberGlow: "u:1617661338085-d1ec6a89a6d8",
  amberSilk: "u:1733660227163-01bc46e0d7d7",
  amberBottle: "u:1638295916768-459f6cf440bc",
  amberSquare: "u:1733660227168-444e3c751a1e",
  marbleBottle: "u:1594125311687-3b1b3eafa9f4",
  goldenSpray: "u:1622618991746-fe6004db3a47",
  floralBottle: "u:1615108395437-df128ad79e80",
  silkBottles: "u:1571206508927-2ef3026ada5d",
  flowerBottle: "p:35237609",
  crystalFlowers: "p:2221692",
  whiteFlowerBottle: "p:264950",
  blankBottleRock: "u:1705899853374-d91c048b81d2",
  blankBottleRock2: "u:1705899844877-81bb0a0665c1",
  blankBottlePink: "p:15574229",
  woodCapBottle: "p:4735929",
  swirlBottles: "p:264819",
  clearSpray: "u:1720423514789-15a33e59fc81",
  sprayMist: "p:10873814",

  // ── Attars & distillation ───────────────────────────────────────────────
  attarLantern: "u:1738414808975-201966230c59",
  attarPair: "u:1654524438549-10892fe4aec4",
  attarSilk: "u:1650686036849-ff87bcaa2e9e",
  attarSilkGrey: "u:1650686037139-f6a8afec44fc",
  attarRoll: "u:1646149757906-e6e9e9a7c77f",
  orientalDecanter: "p:36389331",
  corkVial: "p:10533996",
  crystalDecanters: "u:1535683577427-740aaac4ec25",
  labVials: "u:1602928321679-560bb453f190",
  vialsFilling: "u:1602928298849-325cec8771c0",
  dropperFillAmber: "u:1709660274780-d089327578d0",
  dropperFillGold: "u:1709662217659-c7966220219f",
  dropperFillDeep: "u:1709666414115-47ecd5143293",
  dropperFillWarm: "u:1709662369957-0cbf9f8452fc",
  perfumeShelvesWarm: "u:1598207548924-fcab47e9b272",

  // ── Therapy oils ────────────────────────────────────────────────────────
  dropperStones: "p:18708752",
  dropperStones2: "p:18708753",
  dropperStones3: "p:18708751",
  dropperPair: "p:18708750",
  rollerStones: "p:6694132",
  apothecaryJar: "p:7797104",
  dropperLavender: "p:7795817",
  dropperLavender2: "p:7795814",
  oilLinen: "p:8490177",
  diffuserSteam: "p:6914876",
  oilBottlesDark: "p:6915111",
  dropperMarble: "p:6621442",
  dropperPedestal: "u:1608571423902-eed4a5ad8108",
  dropperEucalyptus: "u:1617897903246-719242758050",
  dropperWhite: "u:1576426863848-c21f53c60b19",
  dropperHand: "u:1515377905703-c4788e51af15",
  massageOil: "u:1544161515-4ab6ce6db874",
  facialRitual: "u:1570172619644-dfd03ed5d881",

  // ── Gifting ─────────────────────────────────────────────────────────────
  giftBlackGold: "p:33629670",
  giftGold: "p:33629668",
  giftCream: "p:33629664",
  giftSilver: "p:33629667",
  giftBlackMinimal: "p:190930",
  giftGoldBokeh: "p:6333099",

  // ── Atmosphere: incense, smoke, candles, lanterns, arches ──────────────
  bakhoorBurner: "u:1684039568465-24c31d0cc80f",
  goldSmoke: "u:1512917860049-18d416baa831",
  smokeBlack: "u:1613750255797-7d4f877615df",
  incenseLotus: "u:1541795083-1b160cf4f3d7",
  incenseWood: "u:1628709353367-35f0bb07413d",
  silverIncense: "u:1731345356052-fa162523666d",
  candleGlow: "u:1602874801007-bd458bb1b8b6",
  candleCosy: "u:1603006905003-be475563bc59",
  candleWood: "u:1605651202774-7d573fd3f12d",
  candlesEucalyptus: "u:1613068431228-8cb6a1e92573",
  tealights: "u:1476900164809-ff19b8ae5968",
  lanternMarble: "p:20689021",
  lanternsHanging: "p:19934802",
  lanternTable: "p:1073273",
  lanternOrnate: "u:1779599790541-2f50889661ed",
  lanternsColour: "u:1574936293035-134adffbeb6f",
  archDoorway: "p:28566995",
  archDoorway2: "p:28566961",
  arabianNight: "p:28566964",
  ornateDoor: "u:1775663472406-c3a809895ef6",
  moroccanFountain: "u:1539020140153-e479b8c22e70",
  tajThroughArch: "u:1548013146-72479768bada",
  desertDunes: "u:1473580044384-7ba9967e16a0",

  // ── Portraits (Fragrance Score) ─────────────────────────────────────────
  portraitFlower: "p:6394735",
  portraitRed: "p:7302328",
  portraitDark: "p:37214351",

  // ── Flowers & raw materials ─────────────────────────────────────────────
  peoniesDark: "u:1511201173873-c327e63eb6c4",
  roseDark: "u:1712251769591-622112611df4",
  flowersDark: "u:1623183074617-90611646e4ca",
  rosesNiche: "u:1612351641432-20a0f196086c",
  redRose: "u:1496062031456-07b8f162a322",
  pinkRose: "u:1518895949257-7621c3c786d7",
  spiceBowls: "u:1532336414038-cf19250c5757",
  spiceScatter: "u:1596040033229-a9821ebd058d",
  orangeSlices: "u:1582979512210-99b6a53386f9",
  lavenderField: "u:1499002238440-d264edd596ec",

  // ── Wellness & places ───────────────────────────────────────────────────
  waterfall: "u:1432405972618-c60b0225b8f9",
  waterfallBridge: "u:1433086966358-54859d0ed716",
  mountainRiver: "u:1609920658906-8223bd289001",
  meditation: "u:1506126613408-eca07ce68773",
  yogaSunset: "u:1544367567-0f2fcb009e0b",
  spaStill: "u:1540555700478-4be289fbecef",
  hairCare: "u:1522337360788-8b13dee7a37e",
  morningCoffee: "u:1495474472287-4d71bcdd2085",
  focusDesk: "u:1497032628192-86f99bcd76bc",
  goldJewellery: "u:1606760227091-3dd870d97f1d",
} as const;

export type PhotoKey = keyof typeof PHOTO_SOURCES;

export function photoSourceUrl(key: PhotoKey, width = 1600) {
  const [src, id] = PHOTO_SOURCES[key].split(":");
  return src === "u"
    ? `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=85&fm=jpg`
    : `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

export function photoPageUrl(key: PhotoKey) {
  const [src, id] = PHOTO_SOURCES[key].split(":");
  return src === "u" ? `https://unsplash.com/photos/${id}` : `https://www.pexels.com/photo/${id}/`;
}
