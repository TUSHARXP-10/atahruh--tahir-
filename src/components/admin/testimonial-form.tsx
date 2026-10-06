"use client";

import { Trash2 } from "lucide-react";
import { deleteTestimonial, saveTestimonial } from "@/server/admin/actions/testimonials";
import { ActionButton, ActionForm, SubmitButton } from "./client";
import { Card, Checkbox, Field, Notice, Select, TextArea, TextInput } from "./ui";

export type TestimonialDraft = { id?: string; name: string; location: string; quote: string; quoteAr: string; rating: number; productId: string; position: number; active: boolean; isPlaceholder: boolean };

export function TestimonialForm({ initial, products }: { initial: TestimonialDraft; products: { id: string; name: string }[] }) {
  return (
    <ActionForm action={saveTestimonial} className="grid max-w-3xl gap-6">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {initial.isPlaceholder ? <Notice tone="warn">This is a demo quote. Saving it marks it as a real testimonial — only do that with the customer’s permission.</Notice> : null}
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer name" hint="First name and initial is fine, e.g. “Ayesha K.”">
            <TextInput name="name" defaultValue={initial.name} required />
          </Field>
          <Field label="City">
            <TextInput name="location" defaultValue={initial.location} placeholder="Mumbai" />
          </Field>
          <Field label="Quote" className="sm:col-span-2">
            <TextArea name="quote" defaultValue={initial.quote} required />
          </Field>
          <Field label="Quote in Arabic" hint="Optional" className="sm:col-span-2">
            <TextArea name="quoteAr" defaultValue={initial.quoteAr} dir="rtl" />
          </Field>
          <Field label="Stars">
            <Select name="rating" defaultValue={String(initial.rating)}>
              {[5, 4, 3].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} ({n})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="About which product?" hint="Optional — links the quote to the product">
            <Select name="productId" defaultValue={initial.productId}>
              <option value="">—</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sort order">
            <TextInput name="position" inputMode="numeric" defaultValue={String(initial.position)} />
          </Field>
          <Checkbox name="active" defaultChecked={initial.active} label="Show on the homepage" className="self-end pb-2" />
        </div>
      </Card>
      <div className="flex items-center justify-between">
        {initial.id ? (
          <ActionButton variant="danger" size="md" action={() => deleteTestimonial(initial.id!)} confirm="Delete this testimonial?">
            <Trash2 /> Delete
          </ActionButton>
        ) : (
          <span />
        )}
        <SubmitButton>Save testimonial</SubmitButton>
      </div>
    </ActionForm>
  );
}
