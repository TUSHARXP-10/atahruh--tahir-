"use client";

import { Eraser, PackageX } from "lucide-react";
import { purgeDemoContent, purgeTestOrders } from "@/server/admin/actions/launch";
import { ActionButton } from "./client";
import { Card } from "./ui";

export function LaunchActions({ demo, testOrders }: { demo: number; testOrders: number }) {
  return (
    <Card title="Clean up before launch" description="Both actions are permanent.">
      <div className="flex flex-wrap gap-3">
        <ActionButton variant="danger" size="md" disabled={!demo} action={purgeDemoContent} confirm="Delete all demo reviews and demo testimonials? Real ones are kept.">
          <Eraser /> Remove demo content ({demo})
        </ActionButton>
        <ActionButton variant="danger" size="md" disabled={!testOrders} action={purgeTestOrders} confirm="Delete every order placed with an @example.com email? Their stock is put back.">
          <PackageX /> Delete test orders ({testOrders})
        </ActionButton>
      </div>
    </Card>
  );
}
