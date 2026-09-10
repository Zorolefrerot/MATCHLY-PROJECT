#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Build-time maintenance tool only. ImageMagick is NOT needed on Render.
if command -v magick >/dev/null; then
  image=(magick)
  identify=(magick identify)
else
  image=(convert)
  identify=(identify)
fi
read -r width height < <("${identify[@]}" -format '%w %h\n' public/idrem-zenkai.png)
size=$((width < height ? width : height))
# A square crop retains the two foreground characters and the IDREM ZENKAI title.
x=$(((width - size) / 2))
y=$((height * 33 / 100))
(( y + size > height )) && y=$((height - size))
"${image[@]}" public/idrem-zenkai.png -crop "${size}x${size}+${x}+${y}" +repage \
  -filter Lanczos -resize 512x512 -strip public/icon-512.png
for pixels in 32 48 180 192; do
  case "$pixels" in
    32|48) name="favicon-${pixels}x${pixels}.png" ;;
    180) name="apple-touch-icon.png" ;;
    192) name="icon-192.png" ;;
  esac
  "${image[@]}" public/icon-512.png -filter Lanczos -resize "${pixels}x${pixels}" -strip "public/$name"
done
"${image[@]}" public/icon-512.png -define icon:auto-resize=64,48,32,16 public/favicon.ico
