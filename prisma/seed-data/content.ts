import { photo } from "../../src/lib/images";

export const COLLECTIONS = [
  // Rule-based navigation collections
  { slug: "perfumes", name: "Perfumes", nameAr: "العطور", tagline: "For every personality", taglineAr: "لكل شخصية", image: photo("goldenSpray"), filter: { form: "PERFUME" }, position: 1 },
  { slug: "attars", name: "Attars", nameAr: "العطور الزيتية", tagline: "Pure & traditional", taglineAr: "نقية وتقليدية", image: photo("attarPair"), filter: { form: "ATTAR" }, position: 2 },
  { slug: "therapies", name: "Therapies", nameAr: "العلاجات العطرية", tagline: "Mind · Body · Soul", taglineAr: "عقل · جسد · روح", image: photo("dropperStones"), filter: { kind: "THERAPY" }, position: 3 },
  { slug: "gift-sets", name: "Gift Sets", nameAr: "أطقم الهدايا", tagline: "For special moments", taglineAr: "للحظات الخاصة", image: photo("giftBlackGold"), filter: { kind: "GIFT_SET" }, position: 4, isFeatured: true, description: "Hand-finished keepsake boxes for weddings, Eid, Diwali and every reason in between.", descriptionAr: "صناديق تذكارية مصقولة يدوياً للأعراس والعيد وديوالي وكل مناسبة." },
  { slug: "for-him", name: "For Him", nameAr: "له", tagline: "Bold & timeless", taglineAr: "جريء وخالد", image: photo("archBottle"), filter: { kind: "FRAGRANCE", gender: ["MEN", "UNISEX"] }, position: 5 },
  { slug: "for-her", name: "For Her", nameAr: "لها", tagline: "Elegant & graceful", taglineAr: "أنيق ورقيق", image: photo("floralBottle"), filter: { kind: "FRAGRANCE", gender: ["WOMEN", "UNISEX"] }, position: 6 },
  { slug: "new-arrivals", name: "New Arrivals", nameAr: "وصل حديثاً", tagline: "Latest creations", taglineAr: "أحدث الإبداعات", image: photo("amberGlow"), filter: { isNew: true }, position: 7 },
  { slug: "offers", name: "Offers", nameAr: "العروض", tagline: "Exclusive deals", taglineAr: "عروض حصرية", image: photo("giftGold"), filter: { onSale: true }, position: 8 },
  { slug: "bestsellers", name: "Bestsellers", nameAr: "الأكثر مبيعاً", tagline: "Most loved", taglineAr: "الأكثر حبّاً", image: photo("crystalDecanters"), filter: { isBestseller: true }, position: 9 },

  // Curated, featured collections (manual membership)
  { slug: "luxury-collection", name: "Luxury Collection", nameAr: "المجموعة الفاخرة", tagline: "For special occasions", taglineAr: "للمناسبات الخاصة", image: photo("amberSilk"), isFeatured: true, position: 10,
    description: "Our most precious compositions — rare ouds, saffron and amber, made in the smallest batches.", descriptionAr: "أثمن تركيباتنا — عود نادر وزعفران وعنبر، تُصنع بأصغر الدفعات.",
    products: ["oud-al-layl", "zafran-royale", "oud-malaki", "amber-sultan", "bakhoor-nights", "shamama"] },
  { slug: "everyday-essentials", name: "Everyday Essentials", nameAr: "أساسيات كل يوم", tagline: "Scents for daily confidence", taglineAr: "عطور للثقة اليومية", image: photo("marbleBottle"), isFeatured: true, position: 11,
    description: "Easy, luminous scents for the office, the commute and everything in between.", descriptionAr: "عطور سهلة ومضيئة للمكتب والطريق وكل ما بينهما.",
    products: ["musk-noor", "noor-al-sabah", "khus", "saba", "ambergris-sky", "kewda-breeze", "bahr"] },
  { slug: "arabic-attars", name: "Arabic Attars", nameAr: "العطور الزيتية العربية", tagline: "Timeless tradition", taglineAr: "تقاليد خالدة", image: photo("attarLantern"), isFeatured: true, position: 12,
    description: "Alcohol-free oils distilled the slow, traditional way — intimate, long-lasting and deeply rooted.", descriptionAr: "زيوت خالية من الكحول تُقطَّر بالطريقة التقليدية البطيئة — حميمة وتدوم طويلاً وعريقة الجذور.",
    products: ["oud-malaki", "shamama", "ruh-gulab", "mitti", "majmua", "jannat-al-firdaus", "hina"] },
  { slug: "wellness-collection", name: "Wellness Collection", nameAr: "مجموعة العافية", tagline: "Mind · Body · Soul", taglineAr: "عقل · جسد · روح", image: photo("diffuserSteam"), isFeatured: true, position: 13,
    description: "Aromatherapy blends and nourishing oils for calmer days and restful nights.", descriptionAr: "مزائج عطرية وزيوت مغذية لأيام أهدأ وليالٍ أكثر راحة.",
    products: ["sukoon-stress-relief", "layl-better-sleep", "nashat-focus-energy", "shifa-skin-hair", "mizan-emotional-balance", "nafas-breathe-easy", "calm-ritual-box"] },
];

export const TESTIMONIALS = [
  { name: "Ayesha K.", location: "Hyderabad", rating: 5, product: "oud-al-layl",
    quote: "Oud al-Layl is pure magic. Long-lasting and so luxurious — I get compliments every single time I wear it.",
    quoteAr: "عود الليل سحرٌ خالص. يدوم طويلاً وفاخر جداً — أتلقى المديح في كل مرة أضعه." },
  { name: "Priya M.", location: "Bengaluru", rating: 5, product: "layl-better-sleep",
    quote: "The Layl sleep ritual has completely changed my evenings. I diffuse it every night now.",
    quoteAr: "غيّر طقس ليل أمسياتي تماماً. أنشره كل ليلة الآن." },
  { name: "Sameer R.", location: "Mumbai", rating: 5, product: "mitti",
    quote: "Authentic attars with amazing quality. Mitti smells exactly like the first rain in my hometown.",
    quoteAr: "عطور زيتية أصيلة بجودة مذهلة. رائحة مِتّي تماماً كأول مطر في مدينتي." },
  { name: "Fatima Z.", location: "Lucknow", rating: 5, product: "ruh-gulab",
    quote: "Ruh Gulab is the most beautiful rose I have ever smelled. The packaging felt like opening a jewel box.",
    quoteAr: "روح الگلاب أجمل وردة شممتها في حياتي. فتح العلبة كان كفتح صندوق مجوهرات." },
  { name: "Arjun S.", location: "Delhi", rating: 4, product: "malik",
    quote: "Malik is my new office signature. Refined, not loud, and it lasts through a twelve-hour day.",
    quoteAr: "مَلِك توقيعي الجديد في المكتب. راقٍ وغير صاخب ويدوم طوال يوم عمل من اثنتي عشرة ساعة." },
  { name: "Noor A.", location: "Dubai", rating: 5, product: "bakhoor-nights",
    quote: "Bakhoor Nights reminds me of my grandmother's majlis. Shipping to Dubai was quick and beautifully packed.",
    quoteAr: "ليالي البخور يذكّرني بمجلس جدتي. الشحن إلى دبي كان سريعاً والتغليف رائعاً." },
];

/** Pool for seeded demo reviews (flagged as placeholders). */
export const REVIEW_POOL = [
  { authorName: "Rahul V.", location: "Pune", title: "Lasts all day", body: "Projection is beautiful for the first few hours and it is still there on my shirt the next morning." },
  { authorName: "Sana H.", location: "Bhopal", title: "My new signature", body: "I bought the 6 ml to try and came back for the big bottle within a week. Truly special." },
  { authorName: "Karan D.", location: "Chandigarh", title: "Gorgeous packaging", body: "Arrived in two days, wrapped like a gift. The scent is even better than the description." },
  { authorName: "Meera J.", location: "Jaipur", title: "Elegant and unique", body: "Nothing like the mass-market perfumes I own. People keep asking what I am wearing." },
  { authorName: "Imran Q.", location: "Kolkata", title: "Worth every rupee", body: "Smooth, rich and not at all synthetic. The attar version is incredibly long-lasting." },
  { authorName: "Ananya P.", location: "Chennai", title: "Soft but noticeable", body: "Perfect for office — present without being overwhelming. Lovely dry-down." },
  { authorName: "Yusuf M.", location: "Hyderabad", title: "Authentic quality", body: "You can tell these are made with care. Reminds me of the attar shops of the old city." },
  { authorName: "Tanvi G.", location: "Ahmedabad", title: "Beautiful gift", body: "Gifted this to my mother for Diwali and she loved it. The gift wrap was stunning." },
];

export const JOURNAL = [
  {
    slug: "how-to-choose-the-right-perfume-for-your-personality",
    title: "How to Choose the Right Perfume for Your Personality",
    titleAr: "كيف تختار العطر المناسب لشخصيتك",
    excerpt: "Your scent is the first thing people remember about you. Here is how to find one that sounds like you.",
    excerptAr: "عطرك أول ما يتذكّره الناس عنك. إليك كيف تجد عطراً يشبهك.",
    cover: photo("silkBottles"),
    tags: ["Guides", "Perfume"],
    readMinutes: 5,
    body: `Fragrance is the most intimate accessory you will ever wear. It sits on your skin, moves when you move and lingers after you have left the room. Choosing one should feel less like shopping and more like recognising yourself.

## Start with how you want to feel

Before you think about notes, think about mood. Do you want to feel **calm and collected**, **confident and magnetic**, or **bright and energised**? Calm personalities often gravitate to musks and sandalwood; the bold tend towards oud, saffron and amber; the energetic love citrus and fresh herbs.

## Learn the four families

- **Floral** — rose, jasmine, tuberose. Romantic, expressive, warm-hearted.
- **Woody** — sandalwood, cedar, vetiver. Grounded, thoughtful, quietly assured.
- **Amber & Oud** — resins, spices, agarwood. Bold, sensual, unforgettable.
- **Fresh & Citrus** — bergamot, sea salt, mint. Optimistic, active, open.

## Test on skin, not paper

A blotter tells you about the top notes. Your skin tells you the whole story. Apply to the inner wrist, wait twenty minutes and smell again — the heart notes are where a fragrance truly reveals itself.

## Consider perfume *and* attar

Many of our fragrances come in two forms. The **perfume** is airy and diffusive — perfect if you love a scent trail. The **attar** is a concentrated, alcohol-free oil that sits close to the skin and lasts remarkably long. Some people wear the attar by day and the perfume by night.

## Let the quiz do the heavy lifting

Our [Fragrance Score](/fragrance-quiz) asks eight quick questions about your mood, lifestyle and preferences, then matches you with the scents in our collection that fit you best — with a percentage score for each.`,
    bodyAr: `العطر أكثر الإكسسوارات حميمية. يستقر على بشرتك ويتحرك معك ويبقى بعد مغادرتك. يجب أن يكون اختياره أشبه بالتعرّف على نفسك.

## ابدأ بالشعور الذي تريده

هل تريد أن تشعر بالهدوء أم بالثقة أم بالحيوية؟ يميل الهادئون إلى المسك والصندل، والجريئون إلى العود والزعفران والعنبر، والنشيطون إلى الحمضيات والأعشاب المنعشة.

## جرّب على البشرة لا على الورق

ضع العطر على باطن المعصم وانتظر عشرين دقيقة ثم شمّه مجدداً — ففي نوتات القلب يكشف العطر عن حقيقته.

## العطر أم العطر الزيتي؟

العطر خفيف وفوّاح، أما العطر الزيتي فمركّز وخالٍ من الكحول ويدوم طويلاً قريباً من البشرة. جرّب [اختبار العطر](/ar/fragrance-quiz) ليقترح عليك الأنسب.`,
  },
  {
    slug: "aromatherapy-rituals-for-better-sleep",
    title: "Aromatherapy Rituals for Better Sleep",
    titleAr: "طقوس العلاج العطري لنوم أفضل",
    excerpt: "Simple, scent-led evening rituals that help the mind slow down and the body settle.",
    excerptAr: "طقوس مسائية بسيطة يقودها العطر تساعد العقل على التمهّل والجسد على الاستقرار.",
    cover: photo("lavenderField"),
    tags: ["Wellness", "Therapies"],
    readMinutes: 4,
    body: `Good sleep rarely begins in bed. It begins an hour earlier, in the small signals we give ourselves that the day is over. Scent is one of the most powerful of those signals.

## Build a wind-down hour

Dim the lights, put the phone in another room and diffuse a calming blend such as **Layl** (lavender, chamomile and cedarwood). Repeating the same scent every evening teaches your mind to associate it with rest.

## A two-minute temple massage

Dilute two drops of oil in a teaspoon of carrier oil. Massage slowly in circles at the temples and the base of the skull while breathing in for four counts and out for six.

## Scent your pillow, lightly

A single drop on the corner of your pillowcase is plenty. Less is more at night.

## A gentle note

Aromatherapy is a lovely complement to healthy sleep habits — it is not a medical treatment. If you have ongoing sleep difficulties, are pregnant, or have a medical condition, please speak to your doctor before using essential oils.`,
    bodyAr: `النوم الجيد نادراً ما يبدأ في السرير، بل قبل ساعة، في الإشارات الصغيرة التي نعطيها لأنفسنا بأن اليوم قد انتهى.

## ساعة للاسترخاء

خفّف الأضواء وانشر مزيجاً مهدئاً مثل **ليل** (خزامى وبابونج وخشب الأرز). تكرار العطر نفسه كل مساء يعلّم عقلك ربطه بالراحة.

## ملاحظة لطيفة

العلاج العطري مكمّل جميل لعادات النوم الصحية وليس علاجاً طبياً. استشر طبيبك إن كنت تعاني من صعوبات مستمرة في النوم أو كنتِ حاملاً.`,
  },
  {
    slug: "the-art-of-arabic-attars",
    title: "The Art of Arabic Attars",
    titleAr: "فنّ العطور الزيتية العربية",
    excerpt: "From the copper stills of Kannauj to the souks of the Gulf — a short history of the world's oldest perfumes.",
    excerptAr: "من أواني التقطير النحاسية في قنّوج إلى أسواق الخليج — تاريخ موجز لأقدم عطور العالم.",
    cover: photo("attarLantern"),
    tags: ["Heritage", "Attar"],
    readMinutes: 6,
    body: `Long before perfume came in spray bottles, it came as oil. Attar — from the Persian *atr*, meaning fragrance — is perfume in its most ancient and concentrated form.

## Deg and bhapka

In Kannauj, on the banks of the Ganges, perfumers still distil attars much as they did four centuries ago. Flowers are packed into a copper still called a **deg** and heated over a wood fire. The fragrant steam travels through a bamboo pipe into a **bhapka**, a receiving vessel filled with sandalwood oil, which slowly absorbs the scent. It can take weeks to make a single batch.

## Why attars last so long

Attars contain no alcohol. Instead of evaporating quickly, the oil bonds to the skin and releases its scent slowly over many hours. A single swipe is often enough for the whole day.

## How to wear attar

Glide the glass wand over the wrists, behind the ears, on the beard or along a collar. Do not rub — let the oil warm on the skin. In the Gulf it is traditional to layer an attar beneath a spray perfume to give it depth and staying power.

## A living tradition

At Aayat al-Ruh we work with families of distillers whose craft has been handed down for generations. Every attar we offer is a small act of preservation — of a technique, a landscape and a way of life.`,
    bodyAr: `قبل أن يأتي العطر في قوارير الرذاذ، كان يأتي زيتاً. العطر الزيتي هو العطر في أقدم صوره وأكثرها تركيزاً.

## الديغ والبهابكا

في قنّوج على ضفاف نهر الغانج، ما زال العطّارون يقطّرون العطور كما فعلوا قبل أربعة قرون: تُوضع الزهور في إناء نحاسي يسمى **ديغ**، ويمر البخار عبر أنبوب من الخيزران إلى **بهابكا** مملوءة بزيت الصندل الذي يمتص الرائحة ببطء.

## لماذا يدوم طويلاً؟

لا يحتوي على الكحول، فيلتصق الزيت بالبشرة ويطلق رائحته ببطء لساعات طويلة.`,
  },
  {
    slug: "skincare-with-natural-oils",
    title: "Skincare with Natural Oils",
    titleAr: "العناية بالبشرة بالزيوت الطبيعية",
    excerpt: "Argan, rosehip and saffron — how to bring a nourishing oil ritual into your evening routine.",
    excerptAr: "الأرغان وثمر الورد والزعفران — كيف تضيف طقس الزيت المغذي إلى روتينك المسائي.",
    cover: photo("facialRitual"),
    tags: ["Wellness", "Skin"],
    readMinutes: 4,
    body: `Facial oils have been part of beauty rituals from Marrakech to Kerala for centuries. Used well, they leave skin soft, supple and glowing.

## Oil goes last

Apply oil as the final step of your evening routine, after cleansing and any water-based serums. Three to four drops are enough for the face and neck.

## Press, don't rub

Warm the oil between your palms and press it gently into the skin. Finish with upward strokes along the jawline and cheekbones.

## For hair

Massage a few drops into the scalp and lengths an hour before washing, or smooth a single drop over dry ends.

## Always patch test

Natural does not mean suitable for everyone. Apply a small amount to the inner arm and wait 24 hours before using a new oil on your face.`,
    bodyAr: `الزيوت جزء من طقوس الجمال من مراكش إلى كيرالا منذ قرون. ضع الزيت كخطوة أخيرة في روتينك المسائي، واضغطه برفق على البشرة بدلاً من فركه. وجرّبه دائماً على مساحة صغيرة قبل الاستخدام.`,
  },
  {
    slug: "perfume-or-attar-which-is-right-for-you",
    title: "Perfume or Attar: Which Is Right for You?",
    titleAr: "العطر أم العطر الزيتي: أيهما يناسبك؟",
    excerpt: "Same soul, two forms. A simple guide to choosing — or wearing both.",
    excerptAr: "روح واحدة بصورتين. دليل بسيط للاختيار — أو لارتداء الاثنين معاً.",
    cover: photo("dropperFillGold"),
    tags: ["Guides", "Attar", "Perfume"],
    readMinutes: 3,
    body: `Many Aayat al-Ruh fragrances are made in two forms. Here is how to choose.

| | Perfume (spray) | Attar (oil) |
|---|---|---|
| Base | Fine perfumer's alcohol | Pure oil, alcohol-free |
| Projection | Diffusive, leaves a trail | Skin-close and intimate |
| Longevity | 6–10 hours | 8–14+ hours |
| Best for | Clothes, outdoors, evenings | Skin, prayer, office, travel |

## Why not both?

Layer the attar on your pulse points and spray the perfume over clothing. The oil anchors the scent while the spray gives it lift.`,
    bodyAr: `كثير من عطور آيات الروح تأتي بصورتين: العطر (رذاذ) فوّاح ويترك أثراً، والعطر الزيتي قريب من البشرة ويدوم أطول. جرّب الاثنين معاً: الزيت على نقاط النبض والرذاذ على الملابس.`,
  },
  {
    slug: "layering-like-the-gulf",
    title: "Layering Like the Gulf",
    titleAr: "طبقات العطر على الطريقة الخليجية",
    excerpt: "Bakhoor, attar, perfume — the art of building a scent that is entirely your own.",
    excerptAr: "البخور والعطر الزيتي والعطر — فنّ بناء رائحة خاصة بك تماماً.",
    cover: photo("bakhoorBurner"),
    tags: ["Heritage", "Guides"],
    readMinutes: 5,
    body: `In the Gulf, fragrance is not applied — it is composed, layer by layer, every morning.

1. **Bakhoor.** Fragrant wood chips are smouldered in a mabkhara and the smoke is wafted through hair and clothing.
2. **Attar.** A rich oil — often oud or rose — is applied to the pulse points.
3. **Perfume.** A spray chosen to complement the attar is misted over the top.

## Combinations to try

- **Oud al-Layl attar + Rose Sahar perfume** — dark and romantic.
- **Musk Noor attar + Amber Sultan perfume** — soft, golden, glowing.
- **Mitti attar + Sandal Sufi perfume** — earthy, calm and grounding.

Start with two layers, then experiment. There are no rules — only signatures.`,
    bodyAr: `في الخليج، لا يوضع العطر بل يُبنى طبقةً فوق طبقة: البخور أولاً، ثم العطر الزيتي على نقاط النبض، ثم رذاذ العطر فوقه. جرّب: عود الليل الزيتي مع ورد السَّحَر، أو مسك النور مع عنبر السلطان.`,
  },
];

export const COUPONS = [
  { code: "WELCOME10", type: "PERCENT", value: 10, maxDiscount: 50000, firstOrderOnly: true, description: "10% off your first order (up to ₹500)" },
  { code: "RUH500", type: "FLAT", value: 50000, minSubtotal: 399900, description: "₹500 off orders above ₹3,999" },
  { code: "FREESHIP", type: "FREE_SHIPPING", value: 0, description: "Free standard shipping" },
  { code: "FESTIVE15", type: "PERCENT", value: 15, minSubtotal: 299900, maxDiscount: 150000, description: "15% off above ₹2,999 (up to ₹1,500)" },
] as const;

export const CONTENT_BLOCKS = {
  inspiration: {
    data: {
      eyebrow: "Our inspiration",
      name: "Yasinali Sayed",
      caption: "The inspiration behind Aayat al-Ruh",
      text: "Behind a perfume counter in Bombay, among decanters of oud, musk, amber and rose, Yasinali Sayed taught us that a fragrance is a memory you can wear — and that every guest deserves to be welcomed like family. Aayat al-Ruh carries that lesson into every bottle.",
      image: "/images/brand/inspiration-yasinali-sayed.webp",
    },
    dataAr: {
      eyebrow: "مصدر إلهامنا",
      name: "ياسين علي سيد",
      caption: "مصدر الإلهام وراء آيات الروح",
      text: "خلف منضدة عطور في بومباي، بين قوارير العود والمسك والعنبر والورد، علّمنا ياسين علي سيد أن العطر ذكرى نرتديها — وأن كل ضيف يستحق أن يُستقبل كأحد أفراد العائلة. تحمل آيات الروح هذا الدرس في كل قارورة.",
    },
  },
  announcements: {
    data: { items: ["Free shipping on orders above ₹999", "Cash on delivery available across India", "Complimentary 2 ml sample on orders above ₹2,499", "Gift wrapping with a handwritten note"] },
    dataAr: { items: ["شحن مجاني للطلبات فوق ٩٩٩ روبية", "الدفع عند الاستلام متاح في جميع أنحاء الهند", "عيّنة مجانية ٢ مل للطلبات فوق ٢٬٤٩٩ روبية", "تغليف هدايا مع بطاقة مكتوبة بخط اليد"] },
  },
  hero: {
    data: {
      eyebrow: "Scents · Therapies · Rituals",
      title: "A Fragrance",
      titleAccent: "Beyond Time",
      subtitle: "Fine perfumes, pure attars and natural therapies — crafted to elevate your mind, body and everyday moments.",
      primaryCta: { label: "Shop Collection", href: "/shop" },
      secondaryCta: { label: "Discover Our Story", href: "/our-story" },
      image: photo("crystalDecanters"),
      imageSecondary: photo("lanternMarble"),
      background: photo("archDoorway"),
    },
    dataAr: {
      eyebrow: "عطور · علاجات · طقوس",
      title: "عطرٌ",
      titleAccent: "يتجاوز الزمن",
      subtitle: "عطور راقية وعطور زيتية نقية وعلاجات طبيعية — صُنعت لترتقي بعقلك وجسدك ولحظاتك اليومية.",
      primaryCta: { label: "تسوّق المجموعة", href: "/shop" },
      secondaryCta: { label: "اكتشف قصتنا", href: "/our-story" },
    },
  },
  stats: {
    data: {
      isPlaceholder: true,
      items: [
        { value: "50K+", label: "Happy customers" },
        { value: "60+", label: "Unique scents" },
        { value: "100%", label: "Natural ingredients" },
        { value: "4.9", label: "Customer rating" },
      ],
    },
    dataAr: {
      items: [
        { value: "+٥٠ ألف", label: "عميل سعيد" },
        { value: "+٦٠", label: "عطراً فريداً" },
        { value: "١٠٠٪", label: "مكوّنات طبيعية" },
        { value: "٤٫٩", label: "تقييم العملاء" },
      ],
    },
  },
  instagram: {
    data: {
      handle: "@aayatalruh",
      tiles: [
        photo("attarLantern"), photo("bakhoorBurner"), photo("dropperFillGold"), photo("lanternsHanging"),
        photo("amberSilk"), photo("redRose"), photo("crystalDecanters"), photo("archDoorway"),
        photo("attarPair"), photo("peoniesDark"), photo("giftBlackGold"), photo("candleGlow"),
      ],
    },
  },
  rituals: {
    data: {
      items: [
        { key: "morning", title: "Morning Energiser", notes: "Citrus & Mint", time: "6 – 9 am", image: photo("orangeSlices"),
          description: "Wake the senses before the world gets loud.",
          steps: ["Three deep breaths of Nashat from the palms", "Mist Noor al-Sabah over freshly pressed clothes", "Step into the light"],
          products: ["noor-al-sabah", "nashat-focus-energy", "saba"] },
        { key: "focus", title: "Focus at Work", notes: "Rosemary & Lemon", time: "10 am – 4 pm", image: photo("focusDesk"),
          description: "Clear thinking, quiet confidence.",
          steps: ["Diffuse Nashat at your desk for 30 minutes", "A swipe of Khus attar on the wrists", "Reset with a breath every hour"],
          products: ["nashat-focus-energy", "khus", "malik"] },
        { key: "relax", title: "Relax After a Long Day", notes: "Lavender & Chamomile", time: "6 – 8 pm", image: photo("dropperLavender"),
          description: "Let the day fall away.",
          steps: ["Warm shower, then Sukoon on the shoulders", "Light a candle and dim the lights", "Musk Noor for a soft, clean evening"],
          products: ["sukoon-stress-relief", "musk-noor", "mizan-emotional-balance"] },
        { key: "sleep", title: "Better Sleep", notes: "Sandalwood & Vetiver", time: "9 – 11 pm", image: photo("candleCosy"),
          description: "A slow, scented descent into rest.",
          steps: ["Diffuse Layl an hour before bed", "Two-minute temple massage", "A single drop of Sandal Sufi on the pillow"],
          products: ["layl-better-sleep", "sandal-sufi", "calm-ritual-box"] },
        { key: "wellness", title: "Skin & Hair Care", notes: "Natural Oil Blend", time: "Weekly", image: photo("oilLinen"),
          description: "Nourish, soften, glow.",
          steps: ["Cleanse, then press in four drops of Shifa", "Massage a little into the scalp before washing", "Finish with a breath of Mizan"],
          products: ["shifa-skin-hair", "mizan-emotional-balance", "sukoon-stress-relief"] },
      ],
    },
    dataAr: {
      items: [
        { key: "morning", title: "منشّط الصباح", notes: "حمضيات ونعناع", time: "٦ – ٩ صباحاً", description: "أيقظ حواسك قبل أن يعلو صخب العالم.",
          steps: ["ثلاثة أنفاس عميقة من نشاط بين الكفين", "رذاذ نور الصباح على الملابس", "انطلق نحو الضوء"] },
        { key: "focus", title: "تركيز في العمل", notes: "إكليل الجبل وليمون", time: "١٠ صباحاً – ٤ مساءً", description: "تفكير صافٍ وثقة هادئة.",
          steps: ["انشر نشاط على مكتبك لمدة ٣٠ دقيقة", "لمسة من خَس على المعصمين", "تنفّس بعمق كل ساعة"] },
        { key: "relax", title: "استرخاء بعد يوم طويل", notes: "خزامى وبابونج", time: "٦ – ٨ مساءً", description: "دع اليوم يرحل.",
          steps: ["حمام دافئ ثم سكون على الكتفين", "أشعل شمعة وخفّف الأضواء", "مسك النور لأمسية ناعمة ونقية"] },
        { key: "sleep", title: "نوم أفضل", notes: "صندل ونجيل الهند", time: "٩ – ١١ مساءً", description: "نزول بطيء معطّر نحو الراحة.",
          steps: ["انشر ليل قبل النوم بساعة", "تدليك للصدغين لدقيقتين", "قطرة من صندل صوفي على الوسادة"] },
        { key: "wellness", title: "العناية بالبشرة والشعر", notes: "مزيج زيوت طبيعية", time: "أسبوعياً", description: "غذاء ونعومة وإشراق.",
          steps: ["نظّف ثم اضغط أربع قطرات من شفاء", "دلّك القليل في فروة الرأس قبل الغسل", "اختم بنفَس من ميزان"] },
      ],
    },
  },
};
