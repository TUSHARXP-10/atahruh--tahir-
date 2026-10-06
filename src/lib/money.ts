/** All money is integer paise. ₹1 = 100 paise. */

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(locale: string) {
  const key = locale === "ar" ? "ar-u-nu-latn" : "en-IN";
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(key, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
    formatters.set(key, f);
  }
  return f;
}

export function formatPrice(paise: number, locale = "en") {
  return formatter(locale).format(Math.round(paise) / 100);
}

export function rupees(amount: number) {
  return Math.round(amount * 100);
}

export function discountPercent(price: number, mrp?: number | null) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
