"use client";

import { UserMinus } from "lucide-react";
import type { ReactNode } from "react";
import { addAdmin, removeAdmin, saveSettings } from "@/server/admin/actions/settings";
import { ActionButton, ActionForm, SubmitButton } from "./client";
import { Card, Field, TextArea, TextInput } from "./ui";

type Def = { name: string; label: string; hint?: string; prefix?: string; type?: string; long?: boolean };

export function SettingsGroup({ group, title, description, fields, values }: { group: string; title: string; description?: ReactNode; fields: Def[]; values: Record<string, string> }) {
  return (
    <Card title={title} description={description}>
      <ActionForm action={saveSettings} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="group" value={group} />
        {fields.map((f) => (
          <Field key={f.name} label={f.label} hint={f.hint} className={f.long ? "sm:col-span-2" : undefined} htmlFor={`${group}-${f.name}`}>
            {f.long ? (
              <TextArea id={`${group}-${f.name}`} name={f.name} defaultValue={values[f.name] ?? ""} className="min-h-20" />
            ) : (
              <div className="relative">
                {f.prefix ? <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">{f.prefix}</span> : null}
                <TextInput id={`${group}-${f.name}`} name={f.name} type={f.type ?? "text"} defaultValue={values[f.name] ?? ""} className={f.prefix ? "ps-7" : undefined} inputMode={f.prefix ? "decimal" : undefined} />
              </div>
            )}
          </Field>
        ))}
        <div className="flex justify-end sm:col-span-2">
          <SubmitButton>Save</SubmitButton>
        </div>
      </ActionForm>
    </Card>
  );
}

export function AdminTeam({ admins, me }: { admins: { id: string; name: string; email: string }[]; me: string }) {
  return (
    <Card title="Admin team" description="People who can open this admin. They sign in with their normal website account.">
      <ul className="mb-4 divide-y divide-[#f0e8d9]">
        {admins.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="text-sm text-ink">
                {a.name} {a.id === me ? <span className="text-xs text-ink-muted">(you)</span> : null}
              </p>
              <p className="text-xs text-ink-muted">{a.email}</p>
            </div>
            {a.id !== me ? (
              <ActionButton variant="ghost" action={() => removeAdmin(a.id)} confirm={`Remove admin access for ${a.email}?`}>
                <UserMinus /> Remove
              </ActionButton>
            ) : null}
          </li>
        ))}
      </ul>
      <ActionForm action={addAdmin} resetOnSuccess className="flex flex-wrap gap-2">
        <TextInput name="email" type="email" placeholder="Email of an existing account" className="max-w-xs" aria-label="Email to make admin" required />
        <SubmitButton variant="secondary" pendingText="Adding…">
          Add admin
        </SubmitButton>
      </ActionForm>
    </Card>
  );
}
