import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Admin design kit — a calm, light back office in the brand's ink & gold. */

export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="font-display text-4xl leading-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({ title, description, actions, children, className, padded = true }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("rounded-xl border border-[#e9dfcc] bg-white shadow-[0_1px_2px_rgba(28,21,16,0.04)]", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0e8d9] px-5 py-4">
          <div>
            {title ? <h2 className="font-sans text-sm font-semibold text-ink">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}

const btn = {
  primary: "bg-ink text-gold-pale hover:bg-[#33281f] shadow-sm",
  secondary: "border border-[#dccfb6] bg-white text-ink hover:border-gold-deep hover:text-gold-deep",
  danger: "border border-ruby/30 bg-white text-ruby hover:bg-ruby hover:text-white",
  ghost: "text-ink-muted hover:bg-[#f3ecdf] hover:text-ink",
  gold: "bg-gold text-ink hover:bg-gold-light",
} as const;

export type ButtonVariant = keyof typeof btn;

export function buttonClass(variant: ButtonVariant = "primary", size: "sm" | "md" = "md") {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
    btn[variant],
  );
}

export function AButton({ variant = "primary", size = "md", className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant; size?: "sm" | "md" }) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function ALink({ variant = "secondary", size = "md", className, ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: "sm" | "md" }) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />;
}

export const inputClass =
  "w-full rounded-lg border border-[#dccfb6] bg-white px-3 text-sm text-ink placeholder:text-[#a89a86] transition-colors focus:border-gold-deep focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:bg-[#f7f2e8] aria-invalid:border-ruby";

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, "h-10", className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClass, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(inputClass, "h-10 cursor-pointer pe-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({ label, hint, error, children, className, htmlFor }: { label: ReactNode; hint?: ReactNode; error?: string; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-ruby">{error}</p> : hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ label, hint, className, ...props }: ComponentProps<"input"> & { label: ReactNode; hint?: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-ink", className)}>
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#1c1510]" {...props} />
      <span>
        {label}
        {hint ? <span className="block text-xs text-ink-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

const statusTone: Record<string, string> = {
  // order
  PENDING: "bg-[#f4ecdc] text-[#8a6a2c]",
  CONFIRMED: "bg-[#e8f0fb] text-[#2f5ea8]",
  PACKED: "bg-[#efe9fb] text-[#6345a8]",
  SHIPPED: "bg-[#e6f4f4] text-[#1f7472]",
  OUT_FOR_DELIVERY: "bg-[#e3f1ea] text-[#2c7350]",
  DELIVERED: "bg-[#dff0e4] text-[#1f6b3c]",
  CANCELLED: "bg-[#f8e5e7] text-[#9e2b38]",
  RETURNED: "bg-[#f8e5e7] text-[#9e2b38]",
  REFUNDED: "bg-[#eeeae3] text-[#5d5348]",
  // payment
  PAID: "bg-[#dff0e4] text-[#1f6b3c]",
  FAILED: "bg-[#f8e5e7] text-[#9e2b38]",
  // product / review
  ACTIVE: "bg-[#dff0e4] text-[#1f6b3c]",
  DRAFT: "bg-[#f4ecdc] text-[#8a6a2c]",
  ARCHIVED: "bg-[#eeeae3] text-[#5d5348]",
  APPROVED: "bg-[#dff0e4] text-[#1f6b3c]",
  REJECTED: "bg-[#f8e5e7] text-[#9e2b38]",
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[0.68rem] font-semibold", statusTone[status] ?? "bg-[#eeeae3] text-[#5d5348]", className)}>
      {label ?? humanize(status)}
    </span>
  );
}

export function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <p className="font-display text-2xl text-ink">{title}</p>
      {text ? <p className="mt-1 max-w-sm text-sm text-ink-muted">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Table shell with consistent header/cell styling (style cells via `th`/`td` children). */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-sm [&_td]:border-t [&_td]:border-[#f0e8d9] [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle [&_th]:whitespace-nowrap [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-start [&_th]:text-[0.68rem] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-ink-muted [&_tbody_tr:hover]:bg-[#fcf9f3]",
          className,
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-between border-t border-[#f0e8d9] px-4 py-3 text-xs text-ink-muted" aria-label="Pagination">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? <ALink href={href(page - 1)} size="sm">Previous</ALink> : null}
        {page < pages ? <ALink href={href(page + 1)} size="sm">Next</ALink> : null}
      </div>
    </nav>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "up" | "down" | "flat" }) {
  return (
    <div className="rounded-xl border border-[#e9dfcc] bg-white p-5">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {sub ? (
        <p className={cn("mt-1 text-xs", tone === "up" ? "text-[#1f6b3c]" : tone === "down" ? "text-ruby" : "text-ink-muted")}>{sub}</p>
      ) : null}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "ok"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        tone === "warn" && "border-[#ecd9a8] bg-[#fdf6e3] text-[#7a5a17]",
        tone === "ok" && "border-[#bfe0c9] bg-[#eef8f1] text-[#1f6b3c]",
        tone === "info" && "border-[#e9dfcc] bg-[#fbf7ef] text-ink-muted",
      )}
    >
      {children}
    </div>
  );
}
