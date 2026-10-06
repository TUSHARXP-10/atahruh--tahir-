"use client";

import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

type Side = "start" | "end" | "bottom" | "top";

const sideClasses: Record<Side, string> = {
  end: "inset-y-0 end-0 h-full w-[min(100vw,30rem)] border-s data-[state=open]:animate-[sheet-in-end_.5s_var(--ease-luxe)] data-[state=closed]:animate-[sheet-out-end_.35s_var(--ease-silk)]",
  start: "inset-y-0 start-0 h-full w-[min(100vw,26rem)] border-e data-[state=open]:animate-[sheet-in-start_.5s_var(--ease-luxe)] data-[state=closed]:animate-[sheet-out-start_.35s_var(--ease-silk)]",
  bottom: "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl border-t data-[state=open]:animate-[sheet-in-bottom_.5s_var(--ease-luxe)] data-[state=closed]:animate-[sheet-out-bottom_.35s_var(--ease-silk)]",
  top: "inset-x-0 top-0 border-b data-[state=open]:animate-[sheet-in-top_.5s_var(--ease-luxe)] data-[state=closed]:animate-[sheet-out-top_.35s_var(--ease-silk)]",
};

export function SheetContent({
  side = "end",
  className,
  children,
  hideClose,
  closeLabel = "Close",
  ...props
}: ComponentProps<typeof Dialog.Content> & { side?: Side; hideClose?: boolean; closeLabel?: string; children: ReactNode }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-noir/70 backdrop-blur-sm data-[state=closed]:animate-[fade-out_.3s_ease] data-[state=open]:animate-[fade-in_.4s_ease]" />
      <Dialog.Content
        data-lenis-prevent
        className={cn(
          "fixed z-[90] flex flex-col overflow-hidden border-gold/15 bg-ebony text-ivory shadow-[0_0_80px_-20px_rgba(0,0,0,0.9)] outline-none",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose ? (
          <Dialog.Close
            className="absolute end-4 top-4 z-10 grid size-9 place-items-center rounded-full text-smoke transition-colors hover:bg-white/5 hover:text-gold-light"
            aria-label={closeLabel}
          >
            <X className="size-5" strokeWidth={1.25} />
          </Dialog.Close>
        ) : null}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalTitle = Dialog.Title;
export const ModalClose = Dialog.Close;

export function ModalContent({
  className,
  children,
  closeLabel = "Close",
  ...props
}: ComponentProps<typeof Dialog.Content> & { closeLabel?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-noir/75 backdrop-blur-md data-[state=closed]:animate-[fade-out_.3s_ease] data-[state=open]:animate-[fade-in_.4s_ease]" />
      <Dialog.Content
        data-lenis-prevent
        className={cn(
          "fixed inset-0 z-[90] m-auto h-fit max-h-[92dvh] w-[min(94vw,64rem)] overflow-y-auto rounded-md border border-gold/20 bg-ebony text-ivory shadow-2xl outline-none data-[state=open]:animate-[modal-in_.5s_var(--ease-luxe)]",
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close
          className="absolute end-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-noir/50 text-smoke transition-colors hover:text-gold-light"
          aria-label={closeLabel}
        >
          <X className="size-5" strokeWidth={1.25} />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
