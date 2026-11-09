"""Generate the favicon set from the site's monogram (src/components/Monogram.astro).

Dark disc, conic brand ring (pink -> orange -> amber -> violet), "RE" in Clash Display semibold.
Glyphs are converted to outlines so the SVG never depends on a web font.

    pip install fonttools brotli pillow numpy
    python _tools/favicon.py

Writes public/favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png.
"""
from io import BytesIO
from pathlib import Path

import numpy as np
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image, ImageFont, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
FONT = ROOT / 'src/assets/fonts/ClashDisplay-Variable.woff2'

BG = '#07070a'
FG = '#f5f5f7'
RING = ['#ff3d81', '#ff7a2f', '#ffc247', '#8b5cf6']  # --color-pink/orange/amber/violet

# Geometry in a 64-unit box.
VB = 64
RING_W = 4.2          # thicker than the 1.5px nav ring so it survives 16px
CAP_H = 23.0          # cap height of "RE"
TRACK = -0.02         # letter-spacing in em (Monogram uses tracking-tight)
WGHT = 600


def load_font() -> TTFont:
    f = TTFont(FONT)
    f.flavor = None
    return instantiateVariableFont(f, {'wght': WGHT})


def glyph_svg_path(font: TTFont) -> str:
    upm = font['head'].unitsPerEm
    cap = font['OS/2'].sCapHeight
    scale = CAP_H / cap
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    names = [cmap[ord(c)] for c in 'RE']
    hmtx = font['hmtx']
    # Visible bounds of the pair, for optical centering.
    from fontTools.pens.boundsPen import BoundsPen
    x = 0.0
    placements = []
    xmin, xmax = None, None
    for n in names:
        bp = BoundsPen(gs)
        gs[n].draw(bp)
        b = bp.bounds
        placements.append((n, x))
        xmin = x + b[0] if xmin is None else min(xmin, x + b[0])
        xmax = x + b[2] if xmax is None else max(xmax, x + b[2])
        x += hmtx[n][0] + TRACK * upm
    width = (xmax - xmin) * scale
    ox = (VB - width) / 2 - xmin * scale
    oy = (VB + CAP_H) / 2  # baseline so caps sit centred
    pen = SVGPathPen(gs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
    for n, gx in placements:
        tp = TransformPen(pen, (scale, 0, 0, -scale, ox + gx * scale, oy))
        gs[n].draw(tp)
    return pen.getCommands()


def write_svg(path_d: str) -> None:
    r = VB / 2 - RING_W / 2
    stops = ''.join(f'<stop offset="{i / (len(RING) - 1):.2f}" stop-color="{c}"/>' for i, c in enumerate(RING))
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VB} {VB}">'
        f'<defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1">{stops}</linearGradient></defs>'
        f'<circle cx="32" cy="32" r="32" fill="{BG}"/>'
        f'<circle cx="32" cy="32" r="{r:g}" fill="none" stroke="url(#r)" stroke-width="{RING_W:g}"/>'
        f'<path fill="{FG}" d="{path_d}"/>'
        '</svg>\n'
    )
    (PUBLIC / 'favicon.svg').write_text(svg)


def hex_rgb(h: str) -> np.ndarray:
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)


def render(size: int, font_path: Path, *, full_bleed: bool = False, pad: float = 0.0) -> Image.Image:
    """Raster version. full_bleed fills the square with BG (Apple / maskable icons)."""
    ss = 4
    S = size * ss
    k = S / VB
    yy, xx = np.mgrid[0:S, 0:S] + 0.5
    cx = cy = S / 2
    content = 1 - 2 * pad  # shrink the disc into the safe zone for maskable
    dx, dy = (xx - cx) / content, (yy - cy) / content
    d = np.hypot(dx, dy)
    R = S / 2
    # True conic ring, same as the site's CSS conic-gradient(from 0deg, ...).
    ang = (np.degrees(np.arctan2(dx, -dy)) % 360) / 360
    cols = [hex_rgb(c) for c in RING + RING[:1]]
    seg = ang * (len(cols) - 1)
    i = np.clip(seg.astype(int), 0, len(cols) - 2)
    t = (seg - i)[..., None]
    ring_rgb = np.take(np.stack(cols), i, axis=0) * (1 - t) + np.take(np.stack(cols), i + 1, axis=0) * t
    img = np.zeros((S, S, 4))
    bg = hex_rgb(BG)
    if full_bleed:
        img[..., :3] = bg
        img[..., 3] = 255
    disc = d <= R
    img[disc, :3] = bg
    img[disc, 3] = 255
    ring = (d <= R) & (d >= R - RING_W * k)
    img[ring, :3] = ring_rgb[ring]
    out = Image.fromarray(img.astype(np.uint8), 'RGBA')
    # Letters: same metrics as the SVG.
    pf = ImageFont.truetype(str(font_path), size=10)
    tf = TTFont(font_path)
    upm, cap = tf['head'].unitsPerEm, tf['OS/2'].sCapHeight
    px = CAP_H / cap * upm * k * content
    pf = ImageFont.truetype(str(font_path), size=round(px))
    draw = ImageDraw.Draw(out)
    letters = []
    x = 0.0
    for ch in 'RE':
        letters.append((ch, x))
        x += pf.getlength(ch) + TRACK * px
    bbs = [pf.getbbox(ch) for ch in 'RE']
    left = min(lx + bb[0] for (ch, lx), bb in zip(letters, bbs))
    right = max(lx + bb[2] for (ch, lx), bb in zip(letters, bbs))
    ox = cx - (right - left) / 2 - left
    baseline = cy + CAP_H * k * content / 2
    for ch, lx in letters:
        draw.text((ox + lx, baseline), ch, font=pf, fill=FG, anchor='ls')
    return out.resize((size, size), Image.LANCZOS)


def main() -> None:
    font = load_font()
    write_svg(glyph_svg_path(font))
    ttf = Path(__file__).resolve().parent / '.clash-600.ttf'
    font.save(ttf)
    try:
        render(180, ttf, full_bleed=True).convert('RGB').save(PUBLIC / 'apple-touch-icon.png', optimize=True)
        render(192, ttf).save(PUBLIC / 'icon-192.png', optimize=True)
        render(512, ttf).save(PUBLIC / 'icon-512.png', optimize=True)
        render(512, ttf, full_bleed=True, pad=0.1).convert('RGB').save(PUBLIC / 'icon-maskable-512.png', optimize=True)
        # ICO: render each size natively so 16px stays crisp, then pack them.
        frames = [render(s, ttf) for s in (16, 32, 48)]
        buf = BytesIO()
        frames[-1].save(buf, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=frames[:-1])
        (PUBLIC / 'favicon.ico').write_bytes(buf.getvalue())
    finally:
        ttf.unlink(missing_ok=True)
    print('wrote favicon set to', PUBLIC)


if __name__ == '__main__':
    main()
