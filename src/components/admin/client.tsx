"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/server/admin/result";
import { buttonClass, type ButtonVariant } from "./ui";

export function SubmitButton({ children, variant = "primary", size = "md", className, pendingText = "Saving…" }: { children: ReactNode; variant?: ButtonVariant; size?: "sm" | "md"; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(buttonClass(variant, size), className)}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {pending ? pendingText : children}
    </button>
  );
}

/** Report an action result: toast, then follow a redirect or refresh the page data. */
export function useResultHandler() {
  const router = useRouter();
  return (res: ActionResult | null | undefined) => {
    if (!res) return;
    if (res.ok) {
      if (res.message) toast.success(res.message);
      if (res.redirect) router.push(res.redirect);
      else router.refresh();
    } else toast.error(res.error);
  };
}

/**
 * A form posting FormData to an admin Server Action, with toasts and
 * field errors. `action` receives the previous result and the form data.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  const handle = useResultHandler();
  useEffect(() => {
    handle(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  const fields = state && !state.ok ? state.fields : undefined;
  return (
    <form action={formAction} className={className} key={resetOnSuccess && state?.ok ? JSON.stringify(state) : undefined}>
      {fields && Object.keys(fields).length > 1 ? (
        <ul className="mb-4 list-inside list-disc rounded-lg border border-ruby/25 bg-[#fdf3f4] px-4 py-3 text-xs text-ruby">
          {Object.entries(fields).map(([k, v]) => (
            <li key={k}>
              <strong>{k.replaceAll(".", " › ")}</strong>: {v}
            </li>
          ))}
        </ul>
      ) : null}
      {children}
    </form>
  );
}

/** A button that runs a Server Action (optionally after confirming). */
export function ActionButton({
  action,
  confirm,
  children,
  variant = "secondary",
  size = "sm",
  className,
  ...rest
}: Omit<ComponentProps<"button">, "onClick" | "type"> & {
  action: () => Promise<ActionResult>;
  confirm?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  const [pending, start] = useTransition();
  const handle = useResultHandler();
  return (
    <button
      {...rest}
      type="button"
      disabled={pending || rest.disabled}
      className={cn(buttonClass(variant, size), className)}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => handle(await action()));
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : null}
      {children}
    </button>
  );
}
