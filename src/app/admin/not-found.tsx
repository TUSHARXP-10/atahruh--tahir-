import Link from "next/link";
import { buttonClass } from "@/components/admin/ui";

export default function AdminNotFound() {
  return (
    <div className="mx-auto grid min-h-[60dvh] max-w-md place-items-center text-center">
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">404</p>
        <h1 className="mt-3 font-display text-4xl text-ink">This admin page doesn’t exist</h1>
        <p className="mt-3 text-sm text-ink-muted">The link may be mistyped, or the item was deleted.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/admin" className={buttonClass("gold")}>
            Go to the dashboard
          </Link>
          <Link href="/" className="inline-flex h-10 items-center rounded-lg border border-[#e0d3bb] px-4 text-sm text-ink hover:border-[#8e6b2f]">
            View the store
          </Link>
        </div>
      </div>
    </div>
  );
}
