import Image from "next/image";
import { BottleArt, type BottleForm } from "@/components/brand/bottle-art";
import type { FormType } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A product's packshot: uploaded photography when available, otherwise the
 * generated house-style bottle, staged on a glow tinted by the juice colour.
 */
export function ProductVisual({
  form,
  kind,
  image,
  name,
  color,
  shape,
  colors,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
  className,
  plain,
  stage = true,
}: {
  form: FormType;
  kind?: string;
  image?: string | null;
  name: string;
  color: string;
  shape?: string;
  colors?: string[];
  sizes?: string;
  priority?: boolean;
  className?: string;
  plain?: boolean;
  stage?: boolean;
}) {
  const bottleForm: BottleForm = kind === "DISCOVERY_SET" ? "DISCOVERY" : (form as BottleForm);
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {stage ? (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 55% at 50% 62%, ${color}38 0%, transparent 70%), radial-gradient(ellipse at 50% 100%, #2a1f16 0%, #15100c 55%, #0b0907 100%)`,
          }}
        />
      ) : null}
      {image ? (
        <Image src={image} alt={name} fill sizes={sizes} loading={priority ? "eager" : undefined} fetchPriority={priority ? "high" : undefined} className="object-cover" />
      ) : (
        <div className="absolute inset-[9%_14%_7%]">
          <BottleArt form={bottleForm} color={color} shape={shape} name={plain ? undefined : name} colors={colors} plain={plain} title={name} />
        </div>
      )}
    </div>
  );
}
