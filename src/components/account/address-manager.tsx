"use client";

import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal, ModalContent, ModalTitle } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import { INDIAN_STATES } from "@/lib/delivery";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/server/actions/account";

export type AddressRow = { id: string; name: string; phone: string; line1: string; line2: string; landmark: string; city: string; state: string; pincode: string; isDefault: boolean };
const BLANK = { name: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" };

export function AddressManager({ addresses }: { addresses: AddressRow[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [editing, setEditing] = useState<(typeof BLANK & { id?: string }) | null>(null);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [pending, start] = useTransition();

  const field = (key: keyof typeof BLANK, label: string, opts: { full?: boolean; type?: string } = {}) => (
    <div className={opts.full ? "sm:col-span-2" : undefined}>
      <Label htmlFor={`addr-${key}`} className={invalid.includes(key) ? "text-[#e48a96]" : undefined}>
        {label}
      </Label>
      <Input
        id={`addr-${key}`}
        type={opts.type}
        value={editing?.[key] ?? ""}
        aria-invalid={invalid.includes(key)}
        onChange={(e) => setEditing((a) => (a ? { ...a, [key]: e.target.value } : a))}
      />
    </div>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-3xl text-ivory">{t("account.addresses")}</h2>
        <Button size="sm" variant="outline" onClick={() => setEditing({ ...BLANK })}>
          <Plus /> {t("account.addAddress")}
        </Button>
      </div>

      {addresses.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="relative rounded-sm border border-gold/15 p-5">
              {a.isDefault ? <span className="absolute end-4 top-4 rounded-full bg-gold/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-gold-light">{t("account.defaultAddress")}</span> : null}
              <p className="font-semibold text-ivory">{a.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                <span dir="ltr">{a.phone}</span>
              </p>
              <div className="mt-4 flex gap-4 text-xs">
                <button type="button" className="inline-flex items-center gap-1 text-gold hover:text-gold-light" onClick={() => setEditing({ ...a })}>
                  <Pencil className="size-3" /> {t("account.editAddress")}
                </button>
                {!a.isDefault ? (
                  <button type="button" className="inline-flex items-center gap-1 text-smoke hover:text-ivory" onClick={() => start(async () => { await setDefaultAddress(a.id); router.refresh(); })}>
                    <Star className="size-3" /> {t("account.makeDefault")}
                  </button>
                ) : null}
                <button type="button" className="ms-auto inline-flex items-center gap-1 text-mist hover:text-[#e48a96]" onClick={() => start(async () => { await deleteAddress(a.id); router.refresh(); })}>
                  <Trash2 className="size-3" /> {t("account.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-sm border border-dashed border-gold/20 p-10 text-center text-smoke">{t("account.noAddresses")}</p>
      )}

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <ModalContent className="w-[min(94vw,40rem)] p-7 sm:p-9" closeLabel={t("common.close")}>
          <ModalTitle className="mb-6 font-display text-3xl text-ivory">{editing?.id ? t("account.editAddress") : t("account.addAddress")}</ModalTitle>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editing) return;
              start(async () => {
                const res = await saveAddress(editing);
                if (!res.ok) {
                  setInvalid("fields" in res && res.fields ? res.fields : []);
                  toast.error(t("checkout.errors.INVALID"));
                  return;
                }
                setInvalid([]);
                setEditing(null);
                toast.success(t("account.saved"));
                router.refresh();
              });
            }}
          >
            {field("name", t("checkout.fullName"))}
            {field("phone", t("checkout.phone"), { type: "tel" })}
            {field("line1", t("checkout.line1"), { full: true })}
            {field("line2", t("checkout.line2"), { full: true })}
            {field("pincode", t("checkout.pincode"))}
            {field("city", t("checkout.city"))}
            <div className="sm:col-span-2">
              <Label htmlFor="addr-state">{t("checkout.state")}</Label>
              <select
                id="addr-state"
                value={editing?.state ?? ""}
                onChange={(e) => setEditing((a) => (a ? { ...a, state: e.target.value } : a))}
                className="h-12 w-full rounded-sm border border-gold/25 bg-ebony/70 px-4 text-sm text-ivory focus:border-gold/70 focus:outline-none"
              >
                <option value="">{t("checkout.selectState")}</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                {t("account.cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {t("account.save")}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
