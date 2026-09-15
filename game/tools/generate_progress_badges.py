#!/usr/bin/env python3
"""Bake the two HUD progress badges: a gold "IG" coin and a "LVL" plate.

Deterministic offline drawing (no AI service, no network, no runtime
generation): supersampled 4x then reduced with LANCZOS, auto-cropped to the
inked content and re-padded to an exact square so the HUD never stretches or
overflows its row. Pillow only; the font is the DejaVu Sans Bold shipped with
the development image, never a licensed Naruto asset.
"""
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "game" / "assets" / "ui"
OUT.mkdir(parents=True, exist_ok=True)
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
S = 4  # supersampling factor
SIZE = 128  # final exported edge, in pixels
CANVAS = SIZE * S  # 512
PAD = 3  # transparent margin kept around the cropped artwork, in final pixels


def font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise SystemExit("A DejaVu TrueType font is required to bake the badges.")


def radial_shade(base: Image.Image, center, inner, outer, power=1.0):
    """Blend a disc from `inner` to `outer` colour, used for the coin body."""
    width, height = base.size
    gradient = Image.new("RGBA", (width, height))
    pixels = gradient.load()
    cx, cy = center
    # Distance to the farthest corner keeps the ramp from saturating early.
    radius = (
        max(
            math.hypot(cx, cy),
            math.hypot(width - cx, cy),
            math.hypot(cx, height - cy),
            math.hypot(width - cx, height - cy),
        )
        * 1.02
    )
    for y in range(height):
        for x in range(width):
            alpha = base.getpixel((x, y))[3]
            if alpha == 0:
                continue
            t = min(1.0, math.hypot(x - cx, y - cy) / radius) ** power
            pixels[x, y] = (
                round(inner[0] + (outer[0] - inner[0]) * t),
                round(inner[1] + (outer[1] - inner[1]) * t),
                round(inner[2] + (outer[2] - inner[2]) * t),
                alpha,
            )
    return gradient


def emboss_text(layer: Image.Image, text: str, box, ink, shadow, highlight):
    """Draw the caption once dark-offset and once light-offset: engraved look."""
    draw = ImageDraw.Draw(layer)
    size = int(box)
    current = font(size)
    while size > 24:
        width = draw.textlength(text, font=current)
        if width <= box * 1.06:
            break
        size -= 8
        current = font(size)
    left, top, right, bottom = draw.textbbox((0, 0), text, font=current)
    x = (layer.width - (right - left)) / 2 - left
    y = (layer.height - (bottom - top)) / 2 - top
    offset = max(2, size // 28)
    draw.text((x, y + offset), text, font=current, fill=shadow)
    draw.text((x - offset, y - offset), text, font=current, fill=highlight)
    draw.text((x, y), text, font=current, fill=ink)
    return size


def crop_square(image: Image.Image) -> Image.Image:
    """Trim every fully transparent border, then re-pad to an exact square."""
    alpha = image.getchannel("A")
    box = alpha.getbbox()
    if box is None:
        raise SystemExit("badge is fully transparent")
    cropped = image.crop(box)
    edge = max(cropped.size) + PAD * 2 * S
    square = Image.new("RGBA", (edge, edge), (0, 0, 0, 0))
    square.paste(
        cropped, ((edge - cropped.width) // 2, (edge - cropped.height) // 2)
    )
    return square.resize((SIZE, SIZE), Image.LANCZOS)


def gold_coin() -> Image.Image:
    art = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(art)
    rim = 12 * S
    centre = CANVAS // 2
    # Outer rim, then the coin face slightly inside it.
    draw.ellipse(
        [rim, rim, CANVAS - rim, CANVAS - rim], fill=(126, 82, 16, 255)
    )
    face = art.crop((0, 0, CANVAS, CANVAS))
    body = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    ImageDraw.Draw(body).ellipse(
        [rim, rim, CANVAS - rim, CANVAS - rim], fill=(255, 255, 255, 255)
    )
    face = Image.alpha_composite(
        face,
        radial_shade(
            body,
            (centre - 46 * S, centre - 62 * S),
            (255, 232, 154),
            (196, 138, 32),
            power=0.85,
        ),
    )
    draw = ImageDraw.Draw(face)
    # Engraved inner ring and a milled edge, both inside the rim.
    inner = rim + 16 * S
    draw.ellipse(
        [inner, inner, CANVAS - inner, CANVAS - inner],
        outline=(140, 92, 18, 215),
        width=3 * S,
    )
    draw.ellipse(
        [inner + 7 * S, inner + 7 * S, CANVAS - inner - 7 * S, CANVAS - inner - 7 * S],
        outline=(255, 240, 190, 150),
        width=2 * S,
    )
    for step in range(36):
        angle = step * (math.tau / 36)
        x = centre + math.cos(angle) * (CANVAS / 2 - rim - 6 * S)
        y = centre + math.sin(angle) * (CANVAS / 2 - rim - 6 * S)
        draw.ellipse(
            [x - 2 * S, y - 2 * S, x + 2 * S, y + 2 * S], fill=(120, 78, 14, 190)
        )
    emboss_text(
        face,
        "IG",
        168,
        (86, 52, 8, 255),
        (58, 34, 4, 200),
        (255, 244, 205, 215),
    )
    # Soft top-left highlight so the coin reads as metal, not as a flat disc.
    gloss = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    ImageDraw.Draw(gloss).ellipse(
        [
            rim + 22 * S,
            rim + 16 * S,
            CANVAS // 2 + 10 * S,
            CANVAS // 2 - 20 * S,
        ],
        fill=(255, 252, 232, 82),
    )
    gloss = gloss.filter(ImageFilter.GaussianBlur(11 * S))
    face = Image.alpha_composite(face, gloss)
    return crop_square(face)


def level_plate() -> Image.Image:
    # A vertical banner: rounded top, pointed bottom, centred on the canvas so
    # the caption and the shield share the same optical centre.
    half = CANVAS // 2
    left, right = 70, CANVAS - 70
    top, bottom = 118, 394
    radius = 60
    tip = bottom + 54
    body = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    body_draw = ImageDraw.Draw(body)
    body_draw.rounded_rectangle(
        [left, top, right, bottom], radius=radius, fill=(255, 255, 255, 255)
    )
    body_draw.polygon(
        [
            (half - 112, bottom - 18),
            (half + 112, bottom - 18),
            (half, tip),
        ],
        fill=(255, 255, 255, 255),
    )
    plate = radial_shade(
        body, (half, top + 40), (41, 76, 80), (13, 31, 35), power=0.75
    )
    draw = ImageDraw.Draw(plate)
    draw.rounded_rectangle(
        [left, top, right, bottom], radius=radius, outline=(233, 180, 95, 235), width=22
    )
    draw.line(
        [(half - 108, bottom - 22), (half, tip - 6), (half + 108, bottom - 22)],
        fill=(233, 180, 95, 235),
        width=22,
        joint="curve",
    )
    # A thin inner keyline keeps the gold border readable at 30 px on a phone.
    draw.rounded_rectangle(
        [left + 14, top + 14, right - 14, bottom - 14],
        radius=max(10, radius - 14),
        outline=(255, 236, 163, 120),
        width=6,
    )
    emboss_text(
        plate,
        "LVL",
        188,
        (238, 230, 209, 255),
        (8, 18, 20, 225),
        (255, 236, 163, 165),
    )
    return crop_square(plate)


def write(image: Image.Image, name: str) -> dict:
    path = OUT / name
    image.save(path, optimize=True)
    data = path.read_bytes()
    return {
        "output": f"game/assets/ui/{name}",
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
        "size": list(image.size),
        "ink_coverage": round(
            sum(1 for pixel in image.getdata() if pixel[3] > 8)
            / (image.width * image.height),
            4,
        ),
    }


def main() -> None:
    entries = [write(gold_coin(), "progress_gold_badge.png")]
    entries.append(write(level_plate(), "progress_level_badge.png"))
    for entry in entries:
        if entry["size"] != [SIZE, SIZE]:
            raise SystemExit(f"{entry['output']} is not exactly {SIZE}x{SIZE}")
        if entry["bytes"] > 32 * 1024:
            raise SystemExit(f"{entry['output']} exceeds the 32 KiB HUD budget")
    manifest = {
        "tool": "game/tools/generate_progress_badges.py",
        "provenance": "original procedural drawing; no external artwork, no AI service, no network",
        "font": next((p for p in FONT_CANDIDATES if Path(p).exists()), ""),
        "supersampling": S,
        "transparent_padding_px": PAD,
        "pillow": __import__("PIL").__version__,
        "entries": entries,
    }
    (OUT / "progress_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    for entry in entries:
        print(entry["output"], entry["size"], entry["bytes"], entry["sha256"][:16])


if __name__ == "__main__":
    main()
