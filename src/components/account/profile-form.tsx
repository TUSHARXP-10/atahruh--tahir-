"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { updateProfile } from "@/server/actions/account";

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [form, setForm] = useState({ name, phone });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-10 xl:grid-cols-2">
      <form
        className="space-y-4 rounded-sm border border-gold/15 p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await updateProfile(form);
            if (res.ok) {
              toast.success(t("account.profileSaved"));
              router.refresh();
            } else toast.error(t("auth.errors.generic"));
          });
        }}
      >
        <h2 className="mb-2 font-display text-2xl text-ivory">{t("account.profile")}</h2>
        <div>
          <Label htmlFor="p-name">{t("auth.name")}</Label>
          <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="p-email">{t("auth.email")}</Label>
          <Input id="p-email" value={email} disabled />
        </div>
        <div>
          <Label htmlFor="p-phone">{t("checkout.phone")}</Label>
          <Input id="p-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
        </div>
        <Button type="submit" disabled={pending}>
          {t("account.save")}
        </Button>
      </form>

      <form
        className="space-y-4 rounded-sm border border-gold/15 p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (pw.next.length < 8) return toast.error(t("auth.errors.weakPassword"));
          start(async () => {
            const { error } = await authClient.changePassword({ currentPassword: pw.current, newPassword: pw.next, revokeOtherSessions: true });
            if (error) toast.error(t("auth.errors.invalidCredentials"));
            else {
              toast.success(t("account.saved"));
              setPw({ current: "", next: "" });
            }
          });
        }}
      >
        <h2 className="mb-2 font-display text-2xl text-ivory">{t("account.changePassword")}</h2>
        <div>
          <Label htmlFor="pw-current">{t("account.currentPassword")}</Label>
          <Input id="pw-current" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="pw-next">{t("auth.newPassword")}</Label>
          <Input id="pw-next" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          {t("account.changePassword")}
        </Button>
      </form>
    </div>
  );
}
