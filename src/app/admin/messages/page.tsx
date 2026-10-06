import { Check, Mail, MessageCircle, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { ActionButton } from "@/components/admin/client";
import { fmtAgo } from "@/components/admin/format";
import { Card, EmptyState, PageHeader, Pagination, buttonClass } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { deleteMessage, setMessageHandled } from "@/server/admin/actions/messages";
import { requireAdminPage } from "@/server/admin/auth";
import { PAGE_SIZE } from "@/server/admin/constants";
import { first, pageOf } from "@/server/admin/queries";

export const metadata = { title: "Messages" };

const TOPICS: Record<string, string> = { order: "Order", product: "Choosing a fragrance", gifting: "Gifting & corporate", wholesale: "Wholesale", other: "Other" };

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdminPage("/admin/messages");
  const sp = await searchParams;
  const done = first(sp.view) === "done";
  const page = pageOf(sp.page);
  const [rows, total, open] = await Promise.all([
    db.contactMessage.findMany({ where: { handled: done }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.contactMessage.count({ where: { handled: done } }),
    db.contactMessage.count({ where: { handled: false } }),
  ]);

  return (
    <>
      <PageHeader title="Messages" description="Everything sent through the website’s contact form. Reply by email or WhatsApp, then mark it done." />
      <div className="mb-4 flex gap-1 border-b border-[#e9dfcc]">
        {(
          [
            ["inbox", `Inbox (${open})`],
            ["done", "Done"],
          ] as const
        ).map(([k, label]) => (
          <Link key={k} href={`/admin/messages?view=${k}`} className={cn("-mb-px border-b-2 px-3 py-2.5 text-sm", (k === "done") === done ? "border-ink font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink")}>
            {label}
          </Link>
        ))}
      </div>
      <Card padded={false}>
        {rows.length ? (
          <>
            <ul>
              {rows.map((m) => {
                const subject = encodeURIComponent(`Re: your message to Aayat al-Ruh${m.orderNumber ? ` (${m.orderNumber})` : ""}`);
                return (
                  <li key={m.id} className="border-b border-[#f0e8d9] px-5 py-4 last:border-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">
                          {m.name} <span className="font-normal text-ink-muted">· {TOPICS[m.topic] ?? m.topic}</span>
                          {m.locale === "ar" ? <span className="ms-2 rounded bg-[#f3ecdf] px-1.5 text-[0.68rem] text-ink-muted">Arabic</span> : null}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {m.email}
                          {m.phone ? ` · ${m.phone}` : ""}
                          {m.orderNumber ? (
                            <>
                              {" · "}
                              <Link href={`/admin/orders/${encodeURIComponent(m.orderNumber)}`} className="underline">
                                {m.orderNumber}
                              </Link>
                            </>
                          ) : null}{" "}
                          · {fmtAgo(m.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <a href={`mailto:${m.email}?subject=${subject}`} className={buttonClass("secondary", "sm")}>
                          <Mail /> Reply
                        </a>
                        {m.phone ? (
                          <a href={`https://wa.me/${m.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                            <MessageCircle /> WhatsApp
                          </a>
                        ) : null}
                        <ActionButton variant={done ? "ghost" : "primary"} action={setMessageHandled.bind(null, m.id, !done)}>
                          {done ? <RotateCcw /> : <Check />} {done ? "Back to inbox" : "Done"}
                        </ActionButton>
                        <ActionButton variant="ghost" className="text-ruby" action={deleteMessage.bind(null, m.id)} confirm="Delete this message?" aria-label="Delete message">
                          <Trash2 />
                        </ActionButton>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm text-ink" dir="auto">
                      {m.message}
                    </p>
                  </li>
                );
              })}
            </ul>
            <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(p) => `/admin/messages?view=${done ? "done" : "inbox"}&page=${p}`} />
          </>
        ) : (
          <EmptyState title={done ? "Nothing here yet" : "Inbox zero"} text={done ? undefined : "New messages from the contact page will appear here."} />
        )}
      </Card>
    </>
  );
}
