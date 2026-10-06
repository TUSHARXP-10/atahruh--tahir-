"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { createContext, use, useState, type ReactNode } from "react";
import { Ornament } from "@/components/brand/ornament";
import { Modal, ModalContent, ModalTitle } from "@/components/ui/sheet";
import { Stars } from "@/components/ui/stars";
import { Link } from "@/i18n/navigation";
import type { FormType, ProductCardData } from "@/lib/types";
import { ProductVisual } from "./product-visual";
import { PurchaseOptions } from "./purchase-options";

type Ctx = { open: (p: ProductCardData, form?: FormType) => void };
const QuickViewCtx = createContext<Ctx>({ open: () => {} });

export function useQuickView() {
  return use(QuickViewCtx);
}

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<ProductCardData | null>(null);
  const [form, setForm] = useState<FormType>("PERFUME");

  return (
    <QuickViewCtx
      value={{
        open: (p, f) => {
          setForm(f ?? p.forms[0]?.type ?? "PERFUME");
          setProduct(p);
        },
      }}
    >
      {children}
      <Modal open={!!product} onOpenChange={(o) => !o && setProduct(null)}>
        {product ? <QuickViewBody product={product} form={form} setForm={setForm} onClose={() => setProduct(null)} /> : null}
      </Modal>
    </QuickViewCtx>
  );
}

function QuickViewBody({
  product,
  form,
  setForm,
  onClose,
}: {
  product: ProductCardData;
  form: FormType;
  setForm: (f: FormType) => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const current = product.forms.find((f) => f.type === form) ?? product.forms[0];
  return (
    <ModalContent closeLabel={t("common.close")} className="w-[min(94vw,60rem)]">
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-square md:aspect-auto md:min-h-[34rem]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={current.type}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductVisual
                form={current.type}
                kind={product.kind}
                image={current.image}
                name={product.name}
                color={product.accentColor}
                shape={product.bottleShape}
                sizes="(min-width: 768px) 30rem, 94vw"
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex flex-col p-7 sm:p-9">
          <div className="mb-3 flex items-center gap-2">
            <Ornament className="w-6" />
            <span className="eyebrow text-[0.6rem]">{product.family ? t(`families.${product.family}`) : t(`forms.${current.type}`)}</span>
          </div>
          <ModalTitle className="font-display text-4xl leading-tight text-ivory">{product.name}</ModalTitle>
          <p className="mt-2 font-display text-lg italic text-smoke">{product.tagline}</p>
          {product.rating.count > 0 ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-mist">
              <Stars value={product.rating.avg} />
              {t("common.reviews", { count: product.rating.count })}
            </div>
          ) : null}
          <div className="mt-8">
            <PurchaseOptions product={product} form={current.type} onFormChange={setForm} compact />
          </div>
          <Link
            href={{ pathname: `/products/${product.slug}`, query: current.type === "ATTAR" ? { form: "attar" } : {} }}
            onClick={onClose}
            className="mt-8 inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold hover:text-gold-light"
          >
            {t("common.learnMore")} <ArrowRight className="size-3.5 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </ModalContent>
  );
}
