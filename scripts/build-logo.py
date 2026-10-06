"""
Builds the website's logo files from the client's logo (black + gold on white).

Every pixel of the source is split into gold, black and white shares by least
squares, so anti-aliased edges stay smooth. White becomes transparent; black is
kept (light backgrounds) or turned to ivory (dark backgrounds); gold is kept.

    python scripts/build-logo.py path/to/logo.jpg
Writes public/brand/{logo,mark,word}-on-{dark,light}.png and the app icons.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path("public/brand")
OUT.mkdir(parents=True, exist_ok=True)

GOLD = np.array([198, 164, 116], float)
BLACK = np.array([20, 20, 20], float)
WHITE = np.array([254, 254, 254], float)
IVORY = np.array([244, 236, 221], float)
INK = np.array([28, 21, 16], float)

img = np.asarray(Image.open(SRC).convert("RGB")).astype(float)

# Solve  W - C = tg*(W - G) + tk*(W - K)  per pixel
d = WHITE - img                       # (h, w, 3)
dg, dk = WHITE - GOLD, WHITE - BLACK
A = np.stack([dg, dk], axis=1)        # 3x2
pinv = np.linalg.pinv(A)              # 2x3
t = d @ pinv.T                        # (h, w, 2)
tg = np.clip(t[..., 0], 0, 1)
tk = np.clip(t[..., 1], 0, 1)
alpha = np.clip(tg + tk, 0, 1)
alpha[alpha < 0.08] = 0               # JPEG noise on the white background
share_g = np.divide(tg, tg + tk, out=np.zeros_like(tg), where=(tg + tk) > 0)[..., None]


def render(black_as, box, name, scale=2):
    x0, y0, x1, y1 = box
    rgb = share_g * GOLD + (1 - share_g) * black_as
    rgba = np.dstack([rgb, alpha * 255])[y0:y1, x0:x1]
    im = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA")
    if scale != 1:
        # Resample in premultiplied space so edges don't pick up dark fringes
        pre = np.asarray(im).astype(float)
        pre[..., :3] *= pre[..., 3:4] / 255
        big = Image.fromarray(pre.astype(np.uint8), "RGBA").resize((im.width * scale, im.height * scale), Image.LANCZOS)
        arr = np.asarray(big).astype(float)
        a = arr[..., 3:4] / 255
        arr[..., :3] = np.divide(arr[..., :3], a, out=np.zeros_like(arr[..., :3]), where=a > 0)
        im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
    im.save(OUT / name, optimize=True)
    print(name, im.size)
    return im


PAD = 6
LOGO = (126 - PAD, 90 - PAD, 456 + PAD, 460 + PAD)   # monogram + wordmark + divider
MARK = (126 - PAD, 90 - PAD, 448 + PAD, 368 + PAD)   # the AR monogram
WORD = (131 - 2, 381 - 2, 456 + 2, 434 + 2)          # "Aayat-al-Ruh"

for tone, colour in (("dark", IVORY), ("light", INK)):
    render(colour, LOGO, f"logo-on-{tone}.png")
    render(colour, MARK, f"mark-on-{tone}.png")
    render(colour, WORD, f"word-on-{tone}.png")

# App icons: the mark (ivory + gold) centred on the noir brand square
mark = Image.open(OUT / "mark-on-dark.png")


def icon(size, inner, radius, path):
    canvas = Image.new("RGBA", (size, size), (11, 9, 7, 255))
    m = mark.copy()
    m.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    if radius:
        mask = Image.new("L", (size, size), 0)
        from PIL import ImageDraw

        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
        canvas.putalpha(mask)
    canvas.save(path, optimize=True)
    print(path, canvas.size)


icon(512, 400, 0, "public/icons/icon-512.png")
icon(192, 152, 0, "public/icons/icon-192.png")
icon(512, 330, 0, "public/icons/maskable-512.png")   # inside the maskable safe zone
icon(180, 140, 0, "src/app/apple-icon.png")
icon(64, 54, 12, "src/app/icon.png")

# Small copies for places that load the PNG directly (intro veil, emails)
for name, height in (("mark-on-dark", 240), ("word-on-dark", 52), ("logo-on-dark", 268)):
    im = Image.open(OUT / f"{name}.png")
    w = round(im.width * height / im.height)
    # A 256-colour palette is visually identical for this two-colour artwork and ~3x smaller
    small = im.resize((w, height), Image.LANCZOS).quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    small.save(OUT / f"{name}-sm.png", optimize=True)
    print(f"{name}-sm.png", small.size)
