"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Ornament } from "@/components/brand/ornament";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { mergeCartAfterSignIn } from "@/server/actions/cart";

function useAfterSignIn(next?: string) {
  const router = useRouter();
  const locale = useLocale();
  const { replaceCart } = useStore();
  return async () => {
    try {
      replaceCart(await mergeCartAfterSignIn(locale));
    } catch {}
    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
    // Admin is a separate, unlocalised app: leave the storefront with a full load
    if (target === "/admin" || target.startsWith("/admin/")) return window.location.assign(target);
    router.push(target);
    router.refresh();
  };
}

function Header({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <Ornament className="w-8" />
        <span className="eyebrow text-[0.62rem]">Aayat al-Ruh</span>
      </div>
      <h1 className="font-display text-5xl text-ivory">{title}</h1>
      <p className="mt-3 text-sm text-smoke">{text}</p>
    </div>
  );
}

function ErrorText({ children }: { children?: ReactNode }) {
  return children ? (
    <p className="rounded-sm border border-ruby/40 bg-ruby/10 px-3 py-2 text-sm text-[#f0a3ad]" role="alert">
      {children}
    </p>
  ) : null;
}

function GoogleButton({ next }: { next?: string }) {
  const t = useTranslations("auth");
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next && next.startsWith("/") ? next : "/account" })}
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.07-1.1-.16-1.6H12z" />
        </svg>
        {t("google")}
      </Button>
      <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-mist">
        <span className="h-px flex-1 bg-gold/15" />
        {t("or")}
        <span className="h-px flex-1 bg-gold/15" />
      </div>
    </>
  );
}

export function LoginForm({ googleEnabled, next }: { googleEnabled: boolean; next?: string }) {
  const t = useTranslations("auth");
  const after = useAfterSignIn(next);
  const [mode, setMode] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onPassword = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) setError(t("errors.invalidCredentials"));
      else await after();
    });
  };

  const onCode = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      if (!codeSent) {
        const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
        if (error) setError(t("errors.generic"));
        else setCodeSent(true);
        return;
      }
      const { error } = await authClient.signIn.emailOtp({ email, otp });
      if (error) setError(t("errors.invalidCode"));
      else await after();
    });
  };

  return (
    <div>
      <Header title={t("welcomeBack")} text={t("signInText")} />
      {googleEnabled ? <GoogleButton next={next} /> : null}

      <div className="mb-6 grid grid-cols-2 rounded-full border border-gold/25 p-1" role="tablist">
        {(["password", "code"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn("rounded-full py-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] transition-colors", mode === m ? "bg-gold-metal text-ink" : "text-smoke hover:text-ivory")}
          >
            {m === "password" ? t("withPassword") : t("withCode")}
          </button>
        ))}
      </div>

      {mode === "password" ? (
        <form onSubmit={onPassword} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="password">{t("password")}</Label>
              <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-light">
                {t("forgot")}
              </Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {t("signIn")}
          </Button>
        </form>
      ) : (
        <form onSubmit={onCode} className="space-y-4">
          <div>
            <Label htmlFor="email-otp">{t("email")}</Label>
            <Input id="email-otp" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={codeSent} />
          </div>
          {codeSent ? (
            <div>
              <p className="mb-3 text-sm text-gold-light">{t("codeSent", { email })}</p>
              <Label htmlFor="otp">{t("code")}</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="text-center font-display text-2xl tracking-[0.6em]"
                dir="ltr"
              />
              <button type="button" onClick={() => setCodeSent(false)} className="mt-2 text-xs text-gold hover:text-gold-light">
                {t("resend")}
              </button>
            </div>
          ) : null}
          <ErrorText>{error}</ErrorText>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {codeSent ? t("verify") : t("sendCode")}
          </Button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-mist">
        {t("noAccount")}{" "}
        <Link href={{ pathname: "/register", query: next ? { next } : {} }} className="text-gold hover:text-gold-light">
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm({ googleEnabled, next }: { googleEnabled: boolean; next?: string }) {
  const t = useTranslations("auth");
  const after = useAfterSignIn(next);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <Header title={t("join")} text={t("signUpText")} />
      {googleEnabled ? <GoogleButton next={next} /> : null}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (form.password.length < 8) return setError(t("errors.weakPassword"));
          start(async () => {
            const { error } = await authClient.signUp.email({
              name: form.name,
              email: form.email,
              password: form.password,
              ...(form.phone ? { phone: form.phone } : {}),
            });
            if (error) setError(error.code === "USER_ALREADY_EXISTS" || error.status === 422 ? t("errors.exists") : t("errors.generic"));
            else await after();
          });
        }}
      >
        <div>
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="r-email">{t("email")}</Label>
          <Input id="r-email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="r-phone">{t("phone")}</Label>
          <Input id="r-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
        </div>
        <div>
          <Label htmlFor="r-password">{t("password")}</Label>
          <Input id="r-password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <p className="mt-1.5 text-[0.68rem] text-mist">{t("passwordHint")}</p>
        </div>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {t("signUp")}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-mist">
        {t("haveAccount")}{" "}
        <Link href={{ pathname: "/login", query: next ? { next } : {} }} className="text-gold hover:text-gold-light">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}

export function ResetForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"email" | "code" | "done">("email");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (stage === "done") {
    return (
      <div>
        <Header title={t("resetTitle")} text={t("resetDone")} />
        <Button asChild size="lg" className="w-full">
          <Link href="/login">{t("signIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Header title={t("resetTitle")} text={t("resetText")} />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            if (stage === "email") {
              const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "forget-password" });
              if (error) setError(t("errors.generic"));
              else setStage("code");
              return;
            }
            if (password.length < 8) return setError(t("errors.weakPassword"));
            const { error } = await authClient.emailOtp.resetPassword({ email, otp, password });
            if (error) setError(t("errors.invalidCode"));
            else setStage("done");
          });
        }}
      >
        <div>
          <Label htmlFor="reset-email">{t("email")}</Label>
          <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={stage !== "email"} />
        </div>
        {stage === "code" ? (
          <>
            <p className="text-sm text-gold-light">{t("codeSent", { email })}</p>
            <div>
              <Label htmlFor="reset-otp">{t("code")}</Label>
              <Input id="reset-otp" inputMode="numeric" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="text-center font-display text-2xl tracking-[0.6em]" dir="ltr" />
            </div>
            <div>
              <Label htmlFor="reset-password">{t("newPassword")}</Label>
              <Input id="reset-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </>
        ) : null}
        <ErrorText>{error}</ErrorText>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {stage === "email" ? t("sendCode") : t("resetCta")}
        </Button>
      </form>
    </div>
  );
}
