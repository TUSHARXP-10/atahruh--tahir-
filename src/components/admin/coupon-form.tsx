"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteCoupon, saveCoupon } from "@/server/admin/actions/coupons";
import { ActionButton, ActionForm, SubmitButton } from "./client";
import { Card, Checkbox, Field, Select, TextInput } from "./ui";

export type CouponDraft = {
  id?: string;
  code: string;
  type: "PERCENT" | "FLAT" | "FREE_SHIPPING";
  value: string;
  minSubtotal: string;
  maxDiscount: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perUserLimit: string;
  firstOrderOnly: boolean;
  active: boolean;
  description: string;
  usedCount: number;
};

export function CouponForm({ initial }: { initial: CouponDraft }) {
  const [type, setType] = useState(initial.type);
  return (
    <ActionForm action={saveCoupon} className="grid max-w-3xl gap-6">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <Card title="Discount">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" hint="What customers type at checkout">
            <TextInput name="code" defaultValue={initial.code} required className="font-mono uppercase" placeholder="EID20" />
          </Field>
          <Field label="Type">
            <Select name="type" value={type} onChange={(e) => setType(e.target.value as CouponDraft["type"])}>
              <option value="PERCENT">Percentage off</option>
              <option value="FLAT">Fixed amount off (₹)</option>
              <option value="FREE_SHIPPING">Free shipping</option>
            </Select>
          </Field>
          {type !== "FREE_SHIPPING" ? (
            <Field label={type === "PERCENT" ? "Percent off" : "Amount off (₹)"}>
              <TextInput name="value" inputMode="decimal" defaultValue={initial.value} required />
            </Field>
          ) : null}
          {type === "PERCENT" ? (
            <Field label="Maximum discount (₹)" hint="Optional cap, e.g. 500">
              <TextInput name="maxDiscount" inputMode="decimal" defaultValue={initial.maxDiscount} />
            </Field>
          ) : null}
          <Field label="Minimum order (₹)" hint="Bag subtotal needed to use the code">
            <TextInput name="minSubtotal" inputMode="decimal" defaultValue={initial.minSubtotal} placeholder="0" />
          </Field>
          <Field label="Note for the team" hint="Not shown to customers" className="sm:col-span-2">
            <TextInput name="description" defaultValue={initial.description} placeholder="e.g. Instagram Eid campaign" />
          </Field>
        </div>
      </Card>

      <Card title="Limits">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts on" hint="Optional">
            <TextInput type="date" name="startsAt" defaultValue={initial.startsAt} />
          </Field>
          <Field label="Ends on" hint="Optional — valid through the whole day">
            <TextInput type="date" name="endsAt" defaultValue={initial.endsAt} />
          </Field>
          <Field label="Total uses" hint={`Optional · used ${initial.usedCount} time${initial.usedCount === 1 ? "" : "s"} so far`}>
            <TextInput name="usageLimit" inputMode="numeric" defaultValue={initial.usageLimit} placeholder="Unlimited" />
          </Field>
          <Field label="Uses per customer" hint="Optional (signed-in customers)">
            <TextInput name="perUserLimit" inputMode="numeric" defaultValue={initial.perUserLimit} placeholder="Unlimited" />
          </Field>
          <Checkbox name="firstOrderOnly" defaultChecked={initial.firstOrderOnly} label="First order only" hint="Customer must sign in; only works before their first order" />
          <Checkbox name="active" defaultChecked={initial.active} label="Active" hint="Switch off to pause the code" />
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        {initial.id ? (
          <ActionButton variant="danger" size="md" action={() => deleteCoupon(initial.id!)} confirm={`Delete coupon ${initial.code}?`}>
            <Trash2 /> Delete
          </ActionButton>
        ) : (
          <span />
        )}
        <SubmitButton>{initial.id ? "Save coupon" : "Create coupon"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
