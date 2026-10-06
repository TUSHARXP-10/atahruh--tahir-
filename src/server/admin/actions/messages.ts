"use server";

import { db } from "@/lib/db";
import { requireAdminAction } from "../auth";
import { done, type ActionResult } from "../result";

export async function setMessageHandled(id: string, handled: boolean): Promise<ActionResult> {
  await requireAdminAction();
  await db.contactMessage.update({ where: { id: String(id) }, data: { handled: !!handled } });
  return done(handled ? "Marked as done" : "Moved back to the inbox");
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  await requireAdminAction();
  await db.contactMessage.delete({ where: { id: String(id) } });
  return done("Message deleted");
}
