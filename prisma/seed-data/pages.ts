/**
 * Admin-editable page content: FAQ and the four policies.
 * Tokens in {curly braces} are filled from Admin → Settings when the page renders,
 * so fees and contact details never go stale. See src/lib/tokens.ts.
 *
 * The policies are a careful starting point written for an Indian D2C fragrance
 * brand — the client should have them reviewed before launch.
 */

const FAQ_EN = [
  { topic: "Orders & delivery", q: "How long does delivery take?", a: "Orders are hand-packed and usually leave our Mumbai atelier within one business day. Mumbai and Thane receive them in 1–2 business days, other metro cities in 2–3, the rest of India in 4–7, and remote areas (North-East, J&K, islands) in 6–9. You’ll see the estimate for your pincode at checkout." },
  { topic: "Orders & delivery", q: "What does shipping cost?", a: "Standard shipping is free on orders above {freeShippingThreshold}; below that it is {standardShippingFee}. Express delivery is {expressShippingFee} where available." },
  { topic: "Orders & delivery", q: "How do I track my order?", a: "As soon as your parcel ships we email the courier and tracking number. You can also enter your order number on the Track Order page at any time." },
  { topic: "Orders & delivery", q: "Do you ship outside India?", a: "Not yet — we currently deliver across India only. International shipping is on its way; join our newsletter to hear first." },
  { topic: "Payments", q: "Which payment methods do you accept?", a: "UPI, credit and debit cards, net banking and wallets through Paytm’s secure checkout, and cash on delivery. All prices include GST." },
  { topic: "Payments", q: "Is cash on delivery available?", a: "Yes, for orders up to {codMaxOrder} on most pincodes, with a {codFee} handling fee. Please keep the exact amount ready for the courier." },
  { topic: "Payments", q: "My payment failed but money was debited. What now?", a: "Don’t worry — failed payments are reversed automatically by your bank, usually within 5–7 business days. If your order shows “payment pending”, it may still confirm within minutes. Write to {email} with your order number and we’ll check it for you." },
  { topic: "Returns", q: "Can I return a fragrance?", a: "Because fragrances and oils are personal-care products, we can accept returns of unopened items with the seal intact within 7 days of delivery. If anything arrives damaged or wrong, tell us within 48 hours and we’ll replace or refund it — see our Returns policy." },
  { topic: "Returns", q: "How do I cancel an order?", a: "Write to {email} or WhatsApp us on {phone} with your order number before it ships, and we’ll cancel it and refund you in full." },
  { topic: "Our fragrances", q: "What is the difference between a perfume and an attar?", a: "Our perfumes are Eau de Parfum sprays — airy, diffusive and lovely on clothes. Attars are the same compositions as pure, alcohol-free oils — concentrated, skin-close and remarkably long-lasting. Many scents come in both; use the Perfume / Attar switch on any product." },
  { topic: "Our fragrances", q: "Are your attars alcohol-free?", a: "Yes. Every attar is a pure oil blend with no alcohol, made in the traditional way." },
  { topic: "Our fragrances", q: "How long will a fragrance last on me?", a: "Perfumes typically last 6–10 hours and attars 10–14 hours or more, depending on your skin, the weather and where you apply them. Each product shows its longevity and projection." },
  { topic: "Our fragrances", q: "Are the therapy oils safe for my skin?", a: "Our therapy oils are blended for aromatherapy and topical use as directed, but every skin is different. Always do a patch test first, and speak to your doctor if you are pregnant, nursing or have a medical condition. They support wellbeing and are not a medical treatment." },
  { topic: "Our fragrances", q: "How should I store my fragrances?", a: "Keep them away from direct sunlight and heat, with the cap closed. Stored well, a perfume stays beautiful for years and an attar deepens with age." },
  { topic: "Gifting", q: "Do you gift-wrap?", a: "Yes — add gift wrap with a handwritten note in your bag for {giftWrapFee}. We never include the invoice inside gift-wrapped parcels." },
  { topic: "Gifting", q: "What is the complimentary sample?", a: "Orders above {freeSampleThreshold} unlock a free 2 ml sample of your choice at checkout — a lovely way to discover your next favourite." },
];

const FAQ_AR = [
  { topic: "الطلبات والتوصيل", q: "كم يستغرق التوصيل؟", a: "نُغلّف الطلبات يدوياً، وتغادر مشغلنا في مومباي عادةً خلال يوم عمل واحد. تصل إلى مومباي وثين خلال ١–٢ يوم عمل، وإلى المدن الكبرى الأخرى خلال ٢–٣، وبقية الهند خلال ٤–٧، والمناطق النائية خلال ٦–٩. ستجد التقدير الخاص برمزك البريدي عند الدفع." },
  { topic: "الطلبات والتوصيل", q: "ما تكلفة الشحن؟", a: "الشحن العادي مجاني للطلبات التي تزيد على {freeShippingThreshold}، وإلا فتكلفته {standardShippingFee}. التوصيل السريع بسعر {expressShippingFee} حيثما يتوفر." },
  { topic: "الطلبات والتوصيل", q: "كيف أتتبّع طلبي؟", a: "فور شحن طردك نرسل إليك اسم شركة الشحن ورقم التتبع بالبريد الإلكتروني. ويمكنك إدخال رقم طلبك في صفحة تتبّع الطلب في أي وقت." },
  { topic: "الطلبات والتوصيل", q: "هل تشحنون خارج الهند؟", a: "ليس بعد — نوصل حالياً داخل الهند فقط. الشحن الدولي قادم قريباً؛ اشترك في نشرتنا لتعرف أولاً." },
  { topic: "الدفع", q: "ما طرق الدفع المتاحة؟", a: "UPI والبطاقات الائتمانية والمدينة والخدمات المصرفية والمحافظ عبر بوابة Paytm الآمنة، بالإضافة إلى الدفع عند الاستلام. جميع الأسعار تشمل ضريبة السلع والخدمات." },
  { topic: "الدفع", q: "هل يتوفر الدفع عند الاستلام؟", a: "نعم، للطلبات حتى {codMaxOrder} في معظم المناطق، مقابل رسوم {codFee}. يُرجى تجهيز المبلغ المطلوب للمندوب." },
  { topic: "الدفع", q: "فشلت عملية الدفع لكن المبلغ خُصم. ماذا أفعل؟", a: "لا تقلق — يعيد البنك المبالغ في العمليات الفاشلة تلقائياً خلال ٥–٧ أيام عمل عادةً. إن ظهر طلبك «بانتظار الدفع» فقد يتأكد خلال دقائق. راسلنا على {email} مع رقم الطلب وسنتحقق لك." },
  { topic: "الإرجاع", q: "هل يمكنني إرجاع العطر؟", a: "لأن العطور والزيوت من منتجات العناية الشخصية، نقبل إرجاع المنتجات غير المفتوحة بختمها الأصلي خلال ٧ أيام من الاستلام. وإن وصلك منتج تالف أو خاطئ فأخبرنا خلال ٤٨ ساعة لنستبدله أو نعيد المبلغ." },
  { topic: "الإرجاع", q: "كيف ألغي طلبي؟", a: "راسلنا على {email} أو عبر واتساب على {phone} مع رقم الطلب قبل شحنه، وسنلغيه ونعيد المبلغ كاملاً." },
  { topic: "عطورنا", q: "ما الفرق بين العطر والعطر الزيتي؟", a: "عطورنا بخاخات «أو دو بارفان» — خفيفة وفوّاحة وجميلة على الملابس. أما العطور الزيتية فهي التركيبات نفسها على هيئة زيوت نقية خالية من الكحول — مركّزة وقريبة من البشرة وتدوم طويلاً. كثير من روائحنا متوفرة بالشكلين." },
  { topic: "عطورنا", q: "هل عطوركم الزيتية خالية من الكحول؟", a: "نعم. كل عطر زيتي مزيج زيوت نقي بلا كحول، مصنوع بالطريقة التقليدية." },
  { topic: "عطورنا", q: "كم يدوم العطر؟", a: "تدوم العطور عادةً ٦–١٠ ساعات، والعطور الزيتية ١٠–١٤ ساعة أو أكثر، بحسب البشرة والطقس ومكان الاستخدام. تجد الثبات والانتشار في صفحة كل منتج." },
  { topic: "عطورنا", q: "هل الزيوت العلاجية آمنة لبشرتي؟", a: "زيوتنا العلاجية ممزوجة للعلاج بالروائح والاستخدام الموضعي حسب الإرشادات، لكن كل بشرة مختلفة. اختبرها على مساحة صغيرة أولاً، واستشر طبيبك في حالات الحمل أو الرضاعة أو الأمراض. هي لدعم الراحة وليست علاجاً طبياً." },
  { topic: "عطورنا", q: "كيف أحفظ عطوري؟", a: "احفظها بعيداً عن أشعة الشمس والحرارة مع إغلاق الغطاء. العطر المحفوظ جيداً يبقى جميلاً لسنوات، والعطر الزيتي يزداد عمقاً مع الوقت." },
  { topic: "الهدايا", q: "هل تقدمون تغليف الهدايا؟", a: "نعم — أضف تغليف الهدية مع بطاقة مكتوبة بخط اليد مقابل {giftWrapFee}. لا نضع الفاتورة داخل الطرود المغلّفة كهدايا." },
  { topic: "الهدايا", q: "ما هي العينة المجانية؟", a: "الطلبات التي تزيد على {freeSampleThreshold} تحصل على عينة مجانية ٢ مل من اختيارك عند الدفع." },
];

const SHIPPING = `Every order is hand-packed at our atelier in Mumbai and usually leaves within **one business day** (Monday to Saturday, excluding public holidays). You’ll receive an email with your courier and tracking number as soon as it ships.

## Delivery times

| Where | Standard delivery |
|---|---|
| Mumbai & Thane | 1–2 business days |
| Other metro cities | 2–3 business days |
| Maharashtra, Gujarat and neighbouring states | 2–4 business days |
| Rest of India | 4–7 business days |
| North-East, Jammu & Kashmir, Ladakh, islands | 6–9 business days |

These are estimates from dispatch; festivals, weather and courier delays can occasionally add a day or two. The estimate for your pincode is shown at checkout.

## Shipping charges

- **Free standard shipping** on orders above {freeShippingThreshold}.
- Below that, standard shipping is **{standardShippingFee}**.
- **Express delivery** is {expressShippingFee}, where your pincode supports it.

## Cash on delivery

Cash on delivery is available on orders up to **{codMaxOrder}** on most pincodes, with a handling fee of **{codFee}**. Please keep the exact amount ready. A small number of remote pincodes are prepaid-only; checkout will tell you.

If cash-on-delivery parcels are repeatedly refused, we may ask for prepayment on future orders.

## Fragrances in transit

Perfumes contain alcohol and are shipped by surface in protective, compliant packaging. Attars and oils are packed upright with leak protection.

## If a delivery fails

Couriers attempt delivery up to three times. If a parcel returns to us because the address was incomplete or the parcel was refused, we’ll contact you to re-ship (shipping charges may apply) or refund your order minus shipping costs.

## Questions

Write to {email} or WhatsApp {phone} with your order number — we’re happy to help.`;

const RETURNS = `We want you to love every scent. Because fragrances, attars and oils are personal-care products, we follow strict hygiene rules — please read below.

## Damaged, leaking or wrong items

If your order arrives damaged, leaking, incomplete or not what you ordered, tell us **within 48 hours of delivery** at {email} or on WhatsApp {phone}, with your order number and photos. An unboxing video helps us resolve it fastest. We’ll send a **free replacement** or a **full refund**, including shipping.

## Unopened items

You can return **unopened products with the seal and packaging intact within 7 days of delivery**. Once we receive and inspect the return, we refund the product price.

## Not returnable

For hygiene reasons we can’t accept:

- products that have been opened, sprayed, swatched or used
- samples, discovery sets and complimentary gifts
- items returned without their original packaging

## Cancellations

You can cancel any order **before it ships** by writing to {email} with your order number — you’ll receive a full refund. Once shipped, the returns rules above apply.

## Refunds

- **Paid online:** refunded to your original payment method through Paytm within **5–7 business days** after approval.
- **Cash on delivery:** refunded by UPI or bank transfer to the account you share with us, within **5–7 business days** after approval.
- Shipping and cash-on-delivery fees are refundable only when the problem was our mistake.

## How to start a return

Write to {email} with your order number, the item and the reason. We’ll arrange a pickup where available, or share the return address.`;

const PRIVACY = `This policy explains what personal data Aayat al-Ruh (“we”) collects when you use this website, why, and the choices you have. We process personal data in line with India’s Digital Personal Data Protection Act, 2023.

## What we collect

- **Details you give us:** your name, email, phone number and delivery address; account details if you create one; messages you send us; your Fragrance Score quiz answers; product reviews.
- **Order details:** what you bought, amounts, delivery and payment status. Card, UPI and bank details are entered on **Paytm’s** secure checkout — we never see or store them.
- **Technical data:** your device, browser and pages visited — through essential cookies, and through analytics cookies only if you allow them.

## Why we use it

- to take, deliver and support your orders, and send order and delivery updates
- to run your account, wishlist and saved scent profile
- to prevent fraud and keep the website secure
- to send offers and news — **only if you subscribe**, and you can unsubscribe any time
- to improve our products and website

## Who we share it with

Only with the services that help us run the shop, and only what they need: our **courier partners** (to deliver), **Paytm** (to take payments), our **email provider** (to send order emails), our **hosting provider**, **Google** and **Meta** (website analytics — only if you accept analytics cookies), and — if you use the AI Scent Concierge — **Anthropic**, which processes your chat messages to generate replies. We never sell your data.

## Cookies

- **Essential cookies** keep your bag, your sign-in, your language and your cookie choice. The shop can’t work without them, so they are always on.
- **Analytics cookies** (Google Analytics and, where enabled, the Meta Pixel) help us understand which pages and products people find useful and how our advertising performs. They are **off until you choose “Accept all”** in the cookie banner.

You can change your choice at any time with **Cookie settings** at the bottom of every page.

## How long we keep it

We keep order records for as long as tax and accounting law requires (generally 8 years). Account data is kept until you delete your account; marketing consent until you withdraw it.

## Your rights

You can ask to **access, correct or erase** your personal data, withdraw consent, or nominate someone to exercise your rights. Write to us at {email}. We respond within 30 days.

## Grievances

If you have a concern about how we handle your data, contact our grievance officer at {email} or {phone}. You may also approach the Data Protection Board of India.

## Children

This website is not intended for children under 18, and we do not knowingly collect their data.

## Changes

We may update this policy; the date at the top shows the latest version.`;

const TERMS = `These terms apply when you browse or buy from this website, operated by Aayat al-Ruh. By placing an order you agree to them.

## Products

We describe our fragrances, attars and oils as accurately as we can. Natural ingredients vary slightly from batch to batch, and colours on screen may differ from the product. Therapy oils are for aromatherapy and wellbeing — they are **not medicines** and are not intended to diagnose, treat or cure any condition. Always patch-test first and follow the directions.

## Prices and orders

Prices are in Indian Rupees and **include GST**. An order is accepted when we confirm it by email. We may decline or cancel an order — for example if an item is out of stock, a price was shown in error, or we suspect fraud — and will refund any amount paid in full.

## Payment

Online payments are processed securely by Paytm. Cash on delivery is available within the limits shown at checkout.

## Coupons

Coupons can’t be exchanged for cash, can’t be combined unless stated, and may be withdrawn at any time. We may cancel orders that misuse coupons.

## Delivery, returns and refunds

Our Shipping policy and Returns & refunds policy form part of these terms.

## Accounts

Keep your sign-in details private; you are responsible for activity on your account. Tell us at {email} if you think it has been misused.

## Intellectual property

All content on this website — names, logos, photographs, text and design — belongs to Aayat al-Ruh or its licensors and may not be used without written permission.

## Liability

We are responsible for losses that are a foreseeable result of our breaking these terms. We are not responsible for indirect losses, or for reactions from use against the directions. Nothing here limits your rights as a consumer under Indian law.

## Law

These terms are governed by the laws of India. Courts in Mumbai, Maharashtra have jurisdiction.

## Contact

{email} · {phone}`;

export const PAGE_BLOCKS = {
  faq: {
    data: { title: "Frequently asked questions", intro: "Everything about orders, delivery, payments and our fragrances. Can’t find your answer? We’re a message away.", items: FAQ_EN },
    dataAr: { title: "الأسئلة الشائعة", intro: "كل ما يخص الطلبات والتوصيل والدفع وعطورنا. لم تجد إجابتك؟ نحن على بُعد رسالة.", items: FAQ_AR },
  },
  "policy-shipping": {
    data: { title: "Shipping policy", intro: "How and when your order reaches you.", body: SHIPPING },
    dataAr: { title: "سياسة الشحن", intro: "كيف ومتى يصلك طلبك. النص المعتمد باللغة الإنجليزية." },
  },
  "policy-returns": {
    data: { title: "Returns & refunds", intro: "What can be returned, and how refunds work.", body: RETURNS },
    dataAr: { title: "الإرجاع والاسترداد", intro: "ما الذي يمكن إرجاعه وكيف يتم الاسترداد. النص المعتمد باللغة الإنجليزية." },
  },
  "policy-privacy": {
    data: { title: "Privacy policy", intro: "How we look after your personal data.", body: PRIVACY },
    dataAr: { title: "سياسة الخصوصية", intro: "كيف نحمي بياناتك الشخصية. النص المعتمد باللغة الإنجليزية." },
  },
  "policy-terms": {
    data: { title: "Terms & conditions", intro: "The terms for using this website and buying from us.", body: TERMS },
    dataAr: { title: "الشروط والأحكام", intro: "شروط استخدام الموقع والشراء منا. النص المعتمد باللغة الإنجليزية." },
  },
} as const;
