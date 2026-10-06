import { photo } from "@/lib/images";
import { ogCard } from "@/server/og";

/** Default share image for pages without their own. */
export async function GET() {
  return ogCard({
    photo: photo("crystalDecanters"),
    eyebrow: "Perfumes · Attars · Therapies",
    title: "Verses of the Soul",
    subtitle: "Fine perfumes, pure attars and natural therapies — crafted to elevate your mind, body and everyday moments.",
  });
}
