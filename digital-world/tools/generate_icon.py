#!/usr/bin/env python3
"""Original BYTE launcher icon, rasterized with only the Python standard library."""
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "assets"


def image(size):
    pixels = bytearray()
    # Rounded rectangle layers in the SVG's original 256×256 coordinates.
    layers = [
        (0, 0, 256, 256, 50, "152b46"),
        (183, 38, 192, 80, 4, "f89477"),
        (178, 29, 196, 47, 9, "ffcd75"),
        (46, 74, 210, 206, 49, "d9eeeb"),
        (63, 112, 193, 177, 19, "152b46"),
        (88, 126, 102, 151, 6, "45d9c5"),
        (154, 126, 168, 151, 6, "45d9c5"),
        (118, 159, 138, 164, 2, "ffcd75"),
    ]
    for y in range(size):
        pixels.append(0)
        for x in range(size):
            px, py = (x + 0.5) * 256 / size, (y + 0.5) * 256 / size
            color = (21, 43, 70, 255)
            for left, top, right, bottom, radius, hex_color in layers:
                if not (left <= px <= right and top <= py <= bottom):
                    continue
                cx = max(left + radius, min(right - radius, px))
                cy = max(top + radius, min(bottom - radius, py))
                if (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2:
                    color = (*bytes.fromhex(hex_color), 255)
            pixels.extend(color)
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(pixels), 9)) + chunk(b"IEND", b""))


if __name__ == "__main__":
    (ROOT / "icon-192.png").write_bytes(image(192))
