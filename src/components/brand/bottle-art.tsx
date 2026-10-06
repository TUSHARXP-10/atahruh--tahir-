import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Generated product packshots in the Aayat al-Ruh house style.
 * Used whenever a product form has no photography yet, so the catalogue always
 * looks consistent. Each form has a distinct silhouette — that is what makes the
 * Perfume ⇄ Attar switch visibly change the bottle.
 */

export type BottleShape = "facet" | "round" | "column" | "arch";
export type BottleForm = "PERFUME" | "ATTAR" | "OIL" | "SET" | "DISCOVERY";

type Props = {
  form: BottleForm;
  color?: string;
  shape?: BottleShape | string;
  name?: string;
  /** Liquid colours for the discovery tray */
  colors?: string[];
  className?: string;
  /** Hide the label text (e.g. tiny thumbnails) */
  plain?: boolean;
  title?: string;
};

// ─── colour helpers ─────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}

/** amount > 0 lightens towards white, < 0 darkens towards black */
function shade(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  const mix = (c: number) => Math.round((t - c) * p + c);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

const GOLD_STOPS = [
  ["0%", "#5e4319"],
  ["18%", "#a9843f"],
  ["38%", "#f4e2b4"],
  ["52%", "#d0ad62"],
  ["70%", "#8a6729"],
  ["88%", "#c8a55d"],
  ["100%", "#5e4319"],
] as const;

// ─── component ──────────────────────────────────────────────────────────────

export function BottleArt({
  form,
  color = "#C9A55C",
  shape = "facet",
  name,
  colors,
  className,
  plain,
  title,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (k: string) => `${k}${uid}`;
  const url = (k: string) => `url(#${id(k)})`;

  const liquidTop = shade(color, 0.28);
  const liquidMid = color;
  const liquidBottom = shade(color, -0.45);

  return (
    <svg
      viewBox="0 0 240 320"
      className={cn("h-full w-full overflow-visible", className)}
      role="img"
      aria-label={title ?? name ?? "Aayat al-Ruh bottle"}
    >
      <defs>
        <linearGradient id={id("gold")} x1="0" x2="1" y1="0" y2="0">
          {GOLD_STOPS.map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={id("goldV")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f6e6bb" />
          <stop offset="45%" stopColor="#c9a55c" />
          <stop offset="100%" stopColor="#6d4f20" />
        </linearGradient>
        <linearGradient id={id("liquid")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={liquidTop} stopOpacity="0.92" />
          <stop offset="45%" stopColor={liquidMid} stopOpacity="0.9" />
          <stop offset="100%" stopColor={liquidBottom} stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id={id("liquidSide")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.35" />
          <stop offset="22%" stopColor="#000" stopOpacity="0" />
          <stop offset="78%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={id("glass")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="10%" stopColor="#fff" stopOpacity="0.07" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="88%" stopColor="#fff" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={id("amberGlass")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#2a1406" />
          <stop offset="20%" stopColor="#6b3a12" />
          <stop offset="48%" stopColor="#9a5a1e" />
          <stop offset="75%" stopColor="#5a2e0d" />
          <stop offset="100%" stopColor="#1d0d03" />
        </linearGradient>
        <linearGradient id={id("noir")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#050403" />
          <stop offset="40%" stopColor="#2a2119" />
          <stop offset="55%" stopColor="#3a2f24" />
          <stop offset="100%" stopColor="#060504" />
        </linearGradient>
        <radialGradient id={id("shadow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#000" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("glow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("shine")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ambient glow + floor shadow */}
      <ellipse cx="120" cy="300" rx="78" ry="9" fill={url("shadow")} />
      <ellipse cx="120" cy="296" rx="60" ry="22" fill={url("glow")} />

      {form === "PERFUME" && (
        <Perfume shape={shape as BottleShape} url={url} id={id} name={plain ? undefined : name} />
      )}
      {form === "ATTAR" && <Attar url={url} name={plain ? undefined : name} round={shape === "round" || shape === "arch"} />}
      {form === "OIL" && <Oil url={url} name={plain ? undefined : name} color={color} />}
      {form === "SET" && <GiftBox url={url} name={plain ? undefined : name} />}
      {form === "DISCOVERY" && (
        <DiscoveryTray url={url} colors={colors?.length ? colors : [color]} />
      )}
    </svg>
  );
}

type PartProps = { url: (k: string) => string; id?: (k: string) => string; name?: string };

function LabelText({ name, y, size = 10.5, light }: { name: string; y: number; size?: number; light?: boolean }) {
  const fs = name.length > 14 ? size - 2.5 : name.length > 10 ? size - 1 : size;
  return (
    <>
      <text
        x="120"
        y={y - 13}
        textAnchor="middle"
        fontSize="5.2"
        letterSpacing="2.4"
        fill={light ? "#5e4319" : "#d9bd82"}
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        AAYAT AL-RUH
      </text>
      <text
        x="120"
        y={y}
        textAnchor="middle"
        fontSize={fs}
        letterSpacing="1.6"
        fill={light ? "#2a1f16" : "#f3e3bd"}
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        {name.toUpperCase()}
      </text>
    </>
  );
}

// ─── Perfume flacons ────────────────────────────────────────────────────────

function Perfume({ shape, url, id, name }: PartProps & { shape: BottleShape }) {
  const clipId = id ? id("rc") : "rc";
  switch (shape) {
    case "round":
      return (
        <g>
          {/* neck + collar */}
          <rect x="106" y="104" width="28" height="26" fill={url("glass")} stroke="#ffffff22" />
          <rect x="98" y="96" width="44" height="13" rx="2" fill={url("gold")} />
          {/* globe cap */}
          <circle cx="120" cy="66" r="32" fill={url("gold")} />
          <ellipse cx="110" cy="54" rx="11" ry="7" fill="#fff" opacity="0.35" />
          <rect x="88" y="86" width="64" height="6" fill="#00000033" />
          {/* body */}
          <ellipse cx="120" cy="214" rx="78" ry="82" fill="#ffffff08" stroke="#ffffff30" strokeWidth="1.2" />
          <clipPath id={clipId}>
            <ellipse cx="120" cy="214" rx="70" ry="74" />
          </clipPath>
          <g clipPath={`url(#${clipId})`}>
            <rect x="40" y="168" width="160" height="130" fill={url("liquid")} />
            <rect x="40" y="168" width="160" height="130" fill={url("liquidSide")} />
            <ellipse cx="120" cy="168" rx="70" ry="5" fill="#fff" opacity="0.18" />
          </g>
          <ellipse cx="120" cy="214" rx="78" ry="82" fill={url("glass")} />
          <path d="M58 172 C 52 196 52 236 64 262" stroke="#fff" strokeOpacity="0.45" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M178 186 C 184 206 182 234 174 252" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" fill="none" strokeLinecap="round" />
          {name && (
            <g>
              <rect x="80" y="200" width="80" height="34" rx="2" fill="#0b0907" opacity="0.62" stroke="#c9a55c" strokeOpacity="0.7" strokeWidth="0.8" />
              <LabelText name={name} y={224} />
            </g>
          )}
        </g>
      );
    case "column":
      return (
        <g>
          {/* ribbed cap */}
          <rect x="88" y="20" width="64" height="70" rx="3" fill={url("gold")} />
          {[30, 42, 54, 66, 78].map((y) => (
            <rect key={y} x="88" y={y} width="64" height="2" fill="#00000030" />
          ))}
          <rect x="96" y="22" width="8" height="66" fill="#fff" opacity="0.28" />
          <rect x="102" y="90" width="36" height="14" fill={url("goldV")} />
          {/* body */}
          <rect x="80" y="104" width="80" height="190" rx="5" fill="#ffffff08" stroke="#ffffff30" strokeWidth="1.2" />
          <rect x="86" y="126" width="68" height="160" rx="3" fill={url("liquid")} />
          <rect x="86" y="126" width="68" height="160" rx="3" fill={url("liquidSide")} />
          <rect x="86" y="126" width="68" height="3" fill="#fff" opacity="0.22" />
          <rect x="80" y="104" width="80" height="190" rx="5" fill={url("glass")} />
          <rect x="88" y="110" width="5" height="176" rx="2.5" fill={url("shine")} />
          <rect x="80" y="276" width="80" height="18" rx="4" fill="#ffffff10" />
          {name && (
            <g>
              <rect x="88" y="186" width="64" height="42" fill="#0b0907" opacity="0.6" stroke="#c9a55c" strokeOpacity="0.7" strokeWidth="0.8" />
              <LabelText name={name} y={214} size={9.5} />
            </g>
          )}
        </g>
      );
    case "arch":
      return (
        <g>
          {/* dome cap */}
          <path d="M120 22 C 100 46 90 62 92 80 C 94 92 104 98 120 99 C 136 98 146 92 148 80 C 150 62 140 46 120 22 Z" fill={url("gold")} />
          <circle cx="120" cy="18" r="5" fill={url("goldV")} />
          <path d="M108 40 C 100 54 98 66 100 76" stroke="#fff" strokeOpacity="0.45" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="100" y="98" width="40" height="10" fill={url("goldV")} />
          <rect x="106" y="108" width="28" height="14" fill={url("glass")} stroke="#ffffff22" />
          {/* arch body */}
          <path d="M60 294 V178 C60 148 86 130 120 116 C154 130 180 148 180 178 V294 Z" fill="#ffffff08" stroke="#ffffff30" strokeWidth="1.2" />
          <path d="M67 288 V182 C67 156 90 140 120 128 C150 140 173 156 173 182 V288 Z" fill={url("liquid")} />
          <path d="M67 288 V182 C67 156 90 140 120 128 C150 140 173 156 173 182 V288 Z" fill={url("liquidSide")} />
          <path d="M60 294 V178 C60 148 86 130 120 116 C154 130 180 148 180 178 V294 Z" fill={url("glass")} />
          <path d="M70 280 V186 C70 166 82 152 98 142" stroke="#fff" strokeOpacity="0.45" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M84 196 C 84 176 100 166 120 158 C 140 166 156 176 156 196" stroke="#c9a55c" strokeOpacity="0.55" fill="none" strokeWidth="0.8" />
          <rect x="60" y="280" width="120" height="14" fill="#ffffff10" />
          {name && (
            <g>
              <rect x="82" y="206" width="76" height="40" fill="#0b0907" opacity="0.6" stroke="#c9a55c" strokeOpacity="0.7" strokeWidth="0.8" />
              <LabelText name={name} y={233} />
            </g>
          )}
        </g>
      );
    case "facet":
    default:
      return (
        <g>
          {/* faceted cap */}
          <path d="M90 34 H150 L158 48 V86 L150 96 H90 L82 86 V48 Z" fill={url("gold")} />
          <path d="M90 34 H150 L158 48 H82 Z" fill="#fff" opacity="0.25" />
          <path d="M82 86 H158 L150 96 H90 Z" fill="#000" opacity="0.25" />
          <rect x="96" y="40" width="7" height="52" fill="#fff" opacity="0.3" />
          <rect x="100" y="96" width="40" height="12" fill={url("goldV")} />
          <rect x="106" y="108" width="28" height="14" fill={url("glass")} stroke="#ffffff22" />
          {/* body */}
          <path d="M74 122 H166 L182 138 V278 L166 294 H74 L58 278 V138 Z" fill="#ffffff08" stroke="#ffffff30" strokeWidth="1.2" />
          <path d="M72 146 H168 L174 152 V274 L162 286 H78 L66 274 V152 Z" fill={url("liquid")} />
          <path d="M72 146 H168 L174 152 V274 L162 286 H78 L66 274 V152 Z" fill={url("liquidSide")} />
          <rect x="68" y="146" width="104" height="2.5" fill="#fff" opacity="0.22" />
          <path d="M74 122 H166 L182 138 V278 L166 294 H74 L58 278 V138 Z" fill={url("glass")} />
          <path d="M58 138 L74 122 H166 L182 138 Z" fill="#fff" opacity="0.12" />
          <rect x="66" y="132" width="6" height="146" rx="3" fill={url("shine")} />
          <rect x="170" y="140" width="2" height="132" fill="#fff" opacity="0.2" />
          <path d="M58 278 L74 294 H166 L182 278 Z" fill="#ffffff14" />
          {name && (
            <g>
              <rect x="80" y="196" width="80" height="44" fill="#0b0907" opacity="0.6" stroke="#c9a55c" strokeOpacity="0.75" strokeWidth="0.8" />
              <rect x="83" y="199" width="74" height="38" fill="none" stroke="#c9a55c" strokeOpacity="0.3" strokeWidth="0.5" />
              <LabelText name={name} y={226} />
            </g>
          )}
        </g>
      );
  }
}

// ─── Attar decanter ─────────────────────────────────────────────────────────

function Attar({ url, name, round }: PartProps & { round?: boolean }) {
  return (
    <g>
      {/* spire + onion dome stopper */}
      <line x1="120" y1="40" x2="120" y2="70" stroke={url("goldV")} strokeWidth="3" />
      <circle cx="120" cy="38" r="5.5" fill={url("gold")} />
      <circle cx="120" cy="56" r="3" fill={url("goldV")} />
      <path d="M120 66 C 102 88 92 102 95 120 C 97 134 107 142 120 143 C 133 142 143 134 145 120 C 148 102 138 88 120 66 Z" fill={url("gold")} />
      <path d="M110 84 C 102 96 100 110 102 122" stroke="#fff" strokeOpacity="0.5" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M120 66 C 114 92 113 120 120 143 C 127 120 126 92 120 66" fill="#000" opacity="0.12" />
      <rect x="104" y="143" width="32" height="9" rx="1.5" fill={url("goldV")} />
      {/* neck */}
      <rect x="109" y="152" width="22" height="34" fill={url("glass")} stroke="#ffffff2a" />
      <rect x="112" y="152" width="3" height="34" fill="#fff" opacity="0.3" />
      <rect x="104" y="182" width="32" height="7" rx="1.5" fill={url("gold")} />

      {round ? (
        <g>
          <path d="M120 189 C 88 200 66 224 66 252 C 66 278 90 296 120 296 C 150 296 174 278 174 252 C 174 224 152 200 120 189 Z" fill="#ffffff08" stroke="#ffffff30" strokeWidth="1.2" />
          <path d="M120 197 C 92 207 73 228 73 252 C 73 274 94 289 120 289 C 146 289 167 274 167 252 C 167 228 148 207 120 197 Z" fill={url("liquid")} />
          <path d="M120 197 C 92 207 73 228 73 252 C 73 274 94 289 120 289 C 146 289 167 274 167 252 C 167 228 148 207 120 197 Z" fill={url("liquidSide")} />
          {/* cut-crystal facets */}
          <g stroke="#fff" strokeOpacity="0.16" strokeWidth="0.8" fill="none">
            <path d="M120 197 L 96 250 L 120 289 L 144 250 Z" />
            <path d="M73 252 H167" />
            <path d="M84 222 L120 250 L156 222" />
            <path d="M84 280 L120 250 L156 280" />
          </g>
          <path d="M120 189 C 88 200 66 224 66 252 C 66 278 90 296 120 296 C 150 296 174 278 174 252 C 174 224 152 200 120 189 Z" fill={url("glass")} />
          <path d="M78 236 C 74 252 78 270 88 280" stroke="#fff" strokeOpacity="0.5" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M92 189 H148 L170 214 V272 L148 296 H92 L70 272 V214 Z" fill="#ffffff08" stroke="#ffffff30" strokeWidth="1.2" />
          <path d="M95 196 H145 L163 216 V270 L145 289 H95 L77 270 V216 Z" fill={url("liquid")} />
          <path d="M95 196 H145 L163 216 V270 L145 289 H95 L77 270 V216 Z" fill={url("liquidSide")} />
          <g stroke="#fff" strokeOpacity="0.17" strokeWidth="0.8" fill="none">
            <path d="M92 189 L120 242 L148 189" />
            <path d="M70 214 L120 242 L170 214" />
            <path d="M70 272 L120 242 L170 272" />
            <path d="M92 296 L120 242 L148 296" />
          </g>
          <path d="M92 189 H148 L170 214 V272 L148 296 H92 L70 272 V214 Z" fill={url("glass")} />
          <path d="M70 214 L92 189 H148 L170 214 Z" fill="#fff" opacity="0.12" />
          <rect x="76" y="220" width="5" height="48" rx="2.5" fill="#fff" opacity="0.42" />
        </g>
      )}

      {/* hanging medallion */}
      <path d="M131 186 C 146 196 154 206 156 218" stroke="#c9a55c" strokeWidth="0.9" fill="none" />
      <circle cx="157" cy="226" r="9" fill={url("gold")} />
      <text x="157" y="229" textAnchor="middle" fontSize="7" fill="#3a2a12" style={{ fontFamily: "var(--font-amiri), serif" }}>
        آ
      </text>

      {name && (
        <text
          x="120"
          y="314"
          textAnchor="middle"
          fontSize="8.5"
          letterSpacing="2.2"
          fill="#d9bd82"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {name.toUpperCase()}
        </text>
      )}
    </g>
  );
}

// ─── Therapy dropper ────────────────────────────────────────────────────────

function Oil({ url, name, color }: PartProps & { color: string }) {
  return (
    <g>
      {/* bulb */}
      <rect x="106" y="36" width="28" height="64" rx="14" fill={url("noir")} />
      <rect x="110" y="42" width="5" height="52" rx="2.5" fill="#fff" opacity="0.18" />
      <rect x="100" y="94" width="40" height="38" rx="3" fill={url("gold")} />
      {[102, 110, 118].map((y) => (
        <rect key={y} x="100" y={y} width="40" height="1.4" fill="#00000035" />
      ))}
      {/* amber Boston round */}
      <path d="M76 172 C76 152 94 138 112 134 H128 C146 138 164 152 164 172 V282 Q164 296 150 296 H90 Q76 296 76 282 Z" fill={url("amberGlass")} />
      <path d="M76 172 C76 152 94 138 112 134 H128 C146 138 164 152 164 172 V282 Q164 296 150 296 H90 Q76 296 76 282 Z" fill={url("glass")} />
      <rect x="84" y="166" width="6" height="118" rx="3" fill="#fff" opacity="0.28" />
      {/* label */}
      <rect x="80" y="196" width="80" height="66" fill="#f4ecdd" />
      <rect x="80" y="196" width="80" height="66" fill={color} opacity="0.12" />
      <rect x="84" y="200" width="72" height="58" fill="none" stroke="#8e6b2f" strokeWidth="0.7" />
      <rect x="80" y="196" width="10" height="66" fill="#000" opacity="0.12" />
      <rect x="150" y="196" width="10" height="66" fill="#000" opacity="0.16" />
      {name ? <LabelText name={name} y={234} size={9.5} light /> : null}
      <text x="120" y="250" textAnchor="middle" fontSize="5" letterSpacing="1.6" fill="#5e4319" style={{ fontFamily: "var(--font-cinzel), serif" }}>
        THERAPY OIL
      </text>
    </g>
  );
}

// ─── Gift box ───────────────────────────────────────────────────────────────

function GiftBox({ url, name }: PartProps) {
  return (
    <g>
      {/* bow */}
      <path d="M120 128 C 96 96 70 104 82 124 C 90 136 108 134 120 128 Z" fill={url("gold")} />
      <path d="M120 128 C 144 96 170 104 158 124 C 150 136 132 134 120 128 Z" fill={url("gold")} />
      <path d="M120 128 L 104 160 M120 128 L 136 160" stroke={url("goldV")} strokeWidth="6" />
      {/* lid */}
      <rect x="34" y="128" width="172" height="36" rx="2" fill={url("noir")} stroke="#c9a55c" strokeOpacity="0.5" />
      {/* box */}
      <rect x="42" y="164" width="156" height="132" fill={url("noir")} stroke="#c9a55c" strokeOpacity="0.45" />
      <rect x="112" y="128" width="16" height="168" fill={url("gold")} />
      <rect x="34" y="138" width="172" height="12" fill={url("gold")} opacity="0.95" />
      <circle cx="120" cy="128" r="9" fill={url("goldV")} />
      {/* arch motif */}
      <path d="M62 290 V226 C62 208 74 198 86 192 C98 198 108 208 108 226 V290" fill="none" stroke="#c9a55c" strokeOpacity="0.4" />
      <path d="M132 290 V226 C132 208 144 198 156 192 C168 198 178 208 178 226 V290" fill="none" stroke="#c9a55c" strokeOpacity="0.4" />
      {name && (
        <text x="120" y="316" textAnchor="middle" fontSize="8.5" letterSpacing="2.2" fill="#d9bd82" style={{ fontFamily: "var(--font-cinzel), serif" }}>
          {name.toUpperCase()}
        </text>
      )}
    </g>
  );
}

// ─── Discovery tray ─────────────────────────────────────────────────────────

function DiscoveryTray({ url, colors }: { url: (k: string) => string; colors: string[] }) {
  const xs = [52, 86, 120, 154, 188];
  return (
    <g>
      <rect x="22" y="232" width="196" height="64" rx="4" fill={url("noir")} stroke="#c9a55c" strokeOpacity="0.5" />
      <rect x="22" y="232" width="196" height="8" fill="#c9a55c" opacity="0.25" />
      {xs.map((x, i) => {
        const c = colors[i % colors.length];
        return (
          <g key={x}>
            <rect x={x - 10} y="128" width="20" height="10" rx="2" fill={url("gold")} />
            <rect x={x - 9} y="138" width="18" height="124" rx="9" fill="#ffffff0c" stroke="#ffffff38" />
            <rect x={x - 6.5} y="160" width="13" height="99" rx="6.5" fill={c} opacity="0.85" />
            <rect x={x - 6.5} y="160" width="13" height="99" rx="6.5" fill={url("liquidSide")} />
            <rect x={x - 5} y="144" width="3" height="110" rx="1.5" fill="#fff" opacity="0.35" />
          </g>
        );
      })}
      <text x="120" y="282" textAnchor="middle" fontSize="7" letterSpacing="2.4" fill="#e8cd92" style={{ fontFamily: "var(--font-cinzel), serif" }}>
        DISCOVERY · ٥
      </text>
    </g>
  );
}
