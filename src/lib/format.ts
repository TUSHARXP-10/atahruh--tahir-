/** Localise a variant size label ("50 ml", "Gift box", "5 × 2 ml"). */
export function sizeLabel(label: string, locale: string) {
  if (locale !== "ar") return label;
  if (/^gift box$/i.test(label)) return "علبة هدية";
  return label.replace(/\bml\b/gi, "مل");
}
