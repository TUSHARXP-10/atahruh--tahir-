import type { z } from "zod";

/** What every admin Server Action returns to the browser. */
export type ActionResult =
  | { ok: true; message?: string; redirect?: string; data?: Record<string, unknown> }
  | { ok: false; error: string; fields?: Record<string, string> };

export const done = (message?: string, extra?: { redirect?: string; data?: Record<string, unknown> }): ActionResult => ({ ok: true, message, ...extra });

export const fail = (error: string, fields?: Record<string, string>): ActionResult => ({ ok: false, error, fields });

/** Turn a zod error into a readable message plus per-field messages. */
export function invalid(error: z.ZodError): ActionResult {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fields[key]) fields[key] = issue.message;
  }
  const first = error.issues[0];
  const where = first?.path.length ? `${first.path.join(" › ")}: ` : "";
  return fail(`${where}${first?.message ?? "Please check the form"}`, fields);
}

/** Prisma unique-constraint violations → a friendly message. */
export function uniqueViolation(e: unknown, what: string): ActionResult | null {
  if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
    return fail(`That ${what} is already in use — choose another.`);
  }
  return null;
}
