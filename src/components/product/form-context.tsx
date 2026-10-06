"use client";

import { createContext, use, useState, type ReactNode } from "react";
import type { FormType } from "@/lib/types";

type Ctx = { form: FormType; setForm: (f: FormType) => void };
const FormCtx = createContext<Ctx | null>(null);

/**
 * Shares the selected Perfume/Attar form across the product page so every
 * section (gallery, purchase panel, how-to-wear) switches together, and keeps
 * `?form=` in the URL so the attar edition is linkable.
 */
export function ProductFormProvider({ initialForm, defaultForm, children }: { initialForm: FormType; defaultForm: FormType; children: ReactNode }) {
  const [form, setFormState] = useState<FormType>(initialForm);
  const setForm = (f: FormType) => {
    setFormState(f);
    const url = new URL(window.location.href);
    if (f === defaultForm) url.searchParams.delete("form");
    else url.searchParams.set("form", f.toLowerCase());
    window.history.replaceState(null, "", url);
  };
  return <FormCtx value={{ form, setForm }}>{children}</FormCtx>;
}

export function useProductForm() {
  const ctx = use(FormCtx);
  if (!ctx) throw new Error("useProductForm must be used inside <ProductFormProvider>");
  return ctx;
}

/** Renders the text for whichever form is currently selected. */
export function FormAwareText({ texts, className }: { texts: Partial<Record<FormType, string>>; className?: string }) {
  const { form } = useProductForm();
  const text = texts[form] ?? Object.values(texts)[0];
  return text ? <p className={className}>{text}</p> : null;
}
