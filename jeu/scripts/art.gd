class_name Art
## Génération de textures pixel-art par code : héros, emojis, bâtiments d'applis,
## éclats d'énergie, sol « circuit imprimé », statue de l'Horloge, antenne WiFi…

const PIX_BODY := Color("6CF5C8")
const PIX_EDGE := Color("2E8F72")
const DARK_INK := Color("0B1929")
const GROUND := Color("0A0D19")
const STREET := Color("141A2E")
const PLAZA := Color("101830")
const NEON := Color("6CF5C8")

# ----------------------------------------------------------------- outils ----

static func make_image(width: int, height: int) -> Image:
	return Image.create_empty(width, height, false, Image.FORMAT_RGBA8)

static func to_texture(image: Image) -> ImageTexture:
	return ImageTexture.create_from_image(image)

static func shade(color: Color, factor: float) -> Color:
	if factor >= 0.0:
		return color.lightened(factor)
	return color.darkened(-factor)

static func set_rect(image: Image, x: int, y: int, width: int, height: int, color: Color) -> void:
	for py in range(y, y + height):
		for px in range(x, x + width):
			if px >= 0 and py >= 0 and px < image.get_width() and py < image.get_height():
				image.set_pixel(px, py, color)

static func _in_rounded(x: int, y: int, x0: int, y0: int, x1: int, y1: int, radius: int) -> bool:
	if x < x0 or x >= x1 or y < y0 or y >= y1:
		return false
	var corner_x := clampi(x, x0 + radius, x1 - 1 - radius)
	var corner_y := clampi(y, y0 + radius, y1 - 1 - radius)
	var dx := x - corner_x
	var dy := y - corner_y
	return dx * dx + dy * dy <= radius * radius

static func rounded_rect(image: Image, x0: int, y0: int, x1: int, y1: int, radius: int, color: Color) -> void:
	for py in range(y0, y1):
		for px in range(x0, x1):
			if _in_rounded(px, py, x0, y0, x1, y1, radius):
				image.set_pixel(px, py, color)

static func set_circle(image: Image, cx: int, cy: int, radius: int, color: Color) -> void:
	for py in range(cy - radius, cy + radius + 1):
		for px in range(cx - radius, cx + radius + 1):
			if Vector2i(px - cx, py - cy).length_squared() <= radius * radius:
				if px >= 0 and py >= 0 and px < image.get_width() and py < image.get_height():
					image.set_pixel(px, py, color)

static func set_arc(image: Image, cx: int, cy: int, radius: int, angle_from: float, angle_to: float, color: Color) -> void:
	var steps := maxi(8, int(absf(angle_to - angle_from) * radius))
	for i in steps + 1:
		var angle := lerpf(angle_from, angle_to, float(i) / float(steps))
		var px := cx + int(round(cos(angle) * radius))
		var py := cy + int(round(sin(angle) * radius))
		if px >= 0 and py >= 0 and px < image.get_width() and py < image.get_height():
			image.set_pixel(px, py, color)

static func _point_in_polygon(point: Vector2, points: PackedVector2Array) -> bool:
	var inside := false
	var j := points.size() - 1
	for i in points.size():
		var a := points[i]
		var b := points[j]
		if (a.y > point.y) != (b.y > point.y):
			if point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x:
				inside = not inside
		j = i
	return inside

static func fill_polygon(image: Image, points: PackedVector2Array, color: Color) -> void:
	var min_x := points[0].x
	var max_x := points[0].x
	var min_y := points[0].y
	var max_y := points[0].y
	for point in points:
		min_x = minf(min_x, point.x)
		max_x = maxf(max_x, point.x)
		min_y = minf(min_y, point.y)
		max_y = maxf(max_y, point.y)
	for py in range(int(min_y), int(max_y) + 1):
		for px in range(int(min_x), int(max_x) + 1):
			if px < 0 or py < 0 or px >= image.get_width() or py >= image.get_height():
				continue
			if _point_in_polygon(Vector2(px, py), points):
				image.set_pixel(px, py, color)

## Dégradé radial (halo lumineux).
static func radial(size: int, color: Color) -> Image:
	var image := make_image(size, size)
	var center := size / 2.0
	for py in size:
		for px in size:
			var d := Vector2(px + 0.5 - center, py + 0.5 - center).length() / center
			if d <= 1.0:
				var color_copy := color
				color_copy.a = color.a * (1.0 - d) * (1.0 - d)
				image.set_pixel(px, py, color_copy)
	return image

# ------------------------------------------------------------------ héros ----

## PIX : pixel-emoji 26×26 (avec chapeau optionnel).
static func pix_sprite(with_hat: bool) -> Image:
	var image := make_image(26, 26)
	rounded_rect(image, 2, 2, 24, 24, 7, PIX_EDGE)
	rounded_rect(image, 4, 4, 22, 22, 6, PIX_BODY)
	# Yeux
	rounded_rect(image, 7, 9, 11, 15, 2, DARK_INK)
	rounded_rect(image, 15, 9, 19, 15, 2, DARK_INK)
	set_rect(image, 8, 10, 1, 1, Color("EFFFF9"))
	set_rect(image, 16, 10, 1, 1, Color("EFFFF9"))
	# Sourire
	for point in [Vector2i(10, 18), Vector2i(11, 19), Vector2i(12, 20), Vector2i(13, 20), Vector2i(14, 20), Vector2i(15, 19), Vector2i(16, 18)]:
		image.set_pixel(point.x, point.y, DARK_INK)
	# Joues
	set_rect(image, 4, 15, 2, 2, Color(1.0, 0.55, 0.65, 0.7))
	set_rect(image, 20, 15, 2, 2, Color(1.0, 0.55, 0.65, 0.7))
	if with_hat:
		rounded_rect(image, 5, 0, 21, 4, 2, Color("FF5A5A"))
		rounded_rect(image, 2, 3, 13, 6, 2, Color("C03A3A"))
	return image

## Ombre portée elliptique.
static func shadow(width: int, height: int) -> Image:
	var image := make_image(width, height)
	var cx := width / 2.0
	var cy := height / 2.0
	for py in height:
		for px in width:
			var dx := (px + 0.5 - cx) / cx
			var dy := (py + 0.5 - cy) / cy
			if dx * dx + dy * dy <= 1.0:
				image.set_pixel(px, py, Color(0, 0, 0, 0.28))
	return image

# ------------------------------------------------------------------ éclat ----

## Éclat d'énergie (losange jaune).
static func spark() -> Image:
	var image := make_image(20, 20)
	for py in 20:
		for px in 20:
			if absi(px - 10) + absi(py - 10) <= 8:
				image.set_pixel(px, py, Color("FFE24A"))
	set_rect(image, 9, 2, 3, 16, Color("FFF7C9"))
	set_rect(image, 2, 9, 16, 3, Color("FFF7C9"))
	return image

# ----------------------------------------------------------------- emojis ----

const EMOJI_FACE := Color("FFD93B")
const EMOJI_EDGE := Color("D9A521")

static func emoji(kind: String) -> Image:
	var image := make_image(30, 30)
	set_circle(image, 15, 15, 13, EMOJI_EDGE)
	set_circle(image, 15, 15, 11, EMOJI_FACE)
	match kind:
		"joy":
			set_rect(image, 9, 11, 4, 4, DARK_INK)
			set_rect(image, 17, 11, 4, 4, DARK_INK)
			set_arc(image, 15, 14, 7, 0.35, PI - 0.35, DARK_INK)
			set_arc(image, 15, 14, 8, 0.35, PI - 0.35, DARK_INK)
		"cool":
			set_rect(image, 5, 10, 9, 4, DARK_INK)
			set_rect(image, 16, 10, 9, 4, DARK_INK)
			set_rect(image, 13, 11, 4, 2, DARK_INK)
			set_arc(image, 15, 16, 6, 0.5, PI - 0.7, DARK_INK)
		"sleepy":
			set_rect(image, 8, 12, 6, 2, DARK_INK)
			set_rect(image, 16, 12, 6, 2, DARK_INK)
			set_circle(image, 15, 20, 2, DARK_INK)
			set_rect(image, 23, 4, 4, 1, Color("EFFFF9"))
			set_rect(image, 24, 3, 1, 4, Color("EFFFF9"))
	return image

## CURSEUR : flèche de pointeur blanc avec contour.
static func cursor_arrow() -> Image:
	var image := make_image(30, 40)
	var shape := PackedVector2Array([
		Vector2(4, 4), Vector2(4, 28), Vector2(10, 22),
		Vector2(13, 31), Vector2(17, 29), Vector2(14, 21),
		Vector2(22, 21),
	])
	var outline := PackedVector2Array()
	for point in shape:
		outline.append(point + Vector2(3, 3))
	fill_polygon(image, outline, DARK_INK)
	fill_polygon(image, shape, Color("F2F6FF"))
	return image

# -------------------------------------------------------------- bâtiments ----

## Bâtiment d'appli 220×260 : corps néon, toit, fenêtres, porte lumineuse.
static func building(color: Color) -> Image:
	var image := make_image(220, 260)
	var edge := shade(color, -0.45)
	var body := shade(color, -0.10)
	rounded_rect(image, 0, 0, 220, 260, 18, edge)
	rounded_rect(image, 4, 4, 216, 256, 15, body)
	# Bandeau de toit plus clair
	rounded_rect(image, 14, 12, 206, 44, 10, shade(color, 0.18))
	rounded_rect(image, 14, 34, 206, 44, 10, shade(color, 0.18))
	# Fenêtres
	var window_color := Color(1, 1, 1, 0.14)
	rounded_rect(image, 24, 84, 60, 120, 6, window_color)
	rounded_rect(image, 160, 84, 196, 120, 6, window_color)
	rounded_rect(image, 24, 136, 60, 172, 6, window_color)
	rounded_rect(image, 160, 136, 196, 172, 6, window_color)
	# Fenêtre du milieu en néon (enseigne)
	rounded_rect(image, 96, 84, 124, 120, 6, Color(color.r, color.g, color.b, 0.55))
	# Porte
	rounded_rect(image, 80, 198, 140, 254, 8, DARK_INK)
	rounded_rect(image, 85, 202, 135, 250, 6, shade(color, 0.35))
	rounded_rect(image, 94, 208, 126, 244, 5, shade(color, 0.15))
	# Liseré néon au sol
	rounded_rect(image, 66, 246, 154, 258, 5, Color(color.r, color.g, color.b, 0.8))
	return image

## Icône géométrique de chaque appli (56×56).
static func glyph(kind: String) -> Image:
	var image := make_image(56, 56)
	match kind:
		"heart":
			set_circle(image, 20, 20, 10, Color("FF6B81"))
			set_circle(image, 36, 20, 10, Color("FF6B81"))
			fill_polygon(image, PackedVector2Array([
				Vector2(10, 24), Vector2(46, 24), Vector2(28, 46),
			]), Color("FF6B81"))
		"play":
			fill_polygon(image, PackedVector2Array([
				Vector2(18, 12), Vector2(44, 28), Vector2(18, 44),
			]), Color("FFFFFF"))
		"candy":
			set_circle(image, 28, 28, 15, Color("FFFFFF"))
			for py in 56:
				for px in 56:
					if Vector2i(px - 28, py - 28).length() <= 15 and (px + py) % 10 < 4:
						image.set_pixel(px, py, Color("FF6B9E"))
		"marbles":
			set_circle(image, 18, 38, 7, Color("FF5A5A"))
			set_circle(image, 28, 28, 7, Color("FFE24A"))
			set_circle(image, 38, 18, 7, Color("5AB4FF"))
		"mail":
			set_rect(image, 10, 18, 36, 24, Color("F2F6FF"))
			for i in 18:
				image.set_pixel(10 + i * 2, 18 + i, DARK_INK)
				image.set_pixel(45 - i * 2, 18 + i, DARK_INK)
		"chat":
			set_circle(image, 28, 24, 14, Color("F2F6FF"))
			set_circle(image, 16, 42, 5, Color("F2F6FF"))
			set_circle(image, 15, 44, 5, Color(0.08, 0.09, 0.16, 1.0))
			set_rect(image, 22, 22, 3, 5, DARK_INK)
			set_rect(image, 27, 22, 3, 5, DARK_INK)
			set_rect(image, 32, 22, 3, 5, DARK_INK)
		"clip":
			rounded_rect(image, 10, 22, 46, 44, 6, Color("F2F6FF"))
			rounded_rect(image, 12, 10, 40, 20, 5, Color("D9468F"))
			set_rect(image, 10, 20, 36, 4, Color("0B1929"))
		"compass":
			set_circle(image, 28, 28, 16, Color("F2F6FF"))
			set_circle(image, 28, 28, 13, Color("4A90E2"))
			fill_polygon(image, PackedVector2Array([
				Vector2(28, 12), Vector2(33, 28), Vector2(28, 28),
			]), Color("FF5A5A"))
			fill_polygon(image, PackedVector2Array([
				Vector2(28, 44), Vector2(23, 28), Vector2(28, 28),
			]), Color("F2F6FF"))
		"bag":
			rounded_rect(image, 14, 22, 42, 46, 6, Color("FFC24A"))
			set_arc(image, 28, 22, 8, PI, TAU, Color("FFE7B3"))
			set_arc(image, 28, 22, 9, PI, TAU, Color("FFE7B3"))
		"battery":
			rounded_rect(image, 12, 16, 44, 44, 6, Color("3ECF5E"))
			set_rect(image, 22, 10, 14, 6, Color("3ECF5E"))
			fill_polygon(image, PackedVector2Array([
				Vector2(32, 20), Vector2(22, 34), Vector2(29, 34),
				Vector2(26, 42), Vector2(37, 28), Vector2(30, 28),
			]), Color("FFF7C9"))
	return image

# -------------------------------------------------------- décor du monde ----

## Tuile de sol « circuit imprimé » 128×128.
static func ground_tile() -> Image:
	var image := make_image(128, 128)
	for py in 128:
		for px in 128:
			image.set_pixel(px, py, GROUND)
	var grid := Color(1, 1, 1, 0.045)
	for i in 4:
		set_rect(image, i * 32, 0, 1, 128, grid)
		set_rect(image, 0, i * 32, 128, 1, grid)
	var trace := Color(0.42, 0.96, 0.78, 0.07)
	set_rect(image, 8, 8, 3, 3, trace)
	set_rect(image, 100, 60, 3, 3, trace)
	set_rect(image, 40, 110, 3, 3, trace)
	set_rect(image, 12, 8, 60, 1, trace)
	set_rect(image, 100, 63, 1, 47, trace)
	set_rect(image, 43, 111, 57, 1, trace)
	set_rect(image, 40, 111, 1, 20, trace)
	return image

## Rue ( avec pointillés ).
static func street(width: int, height: int, horizontal: bool) -> Image:
	var image := make_image(width, height)
	for py in height:
		for px in width:
			if _in_rounded(px, py, 0, 0, width, height, 18):
				image.set_pixel(px, py, STREET)
	var dash := Color(1, 1, 1, 0.07)
	if horizontal:
		var y := height / 2 - 2
		var x := 24
		while x + 20 < width:
			set_rect(image, x, y, 20, 4, dash)
			x += 48
	else:
		var x := width / 2 - 2
		var y := 24
		while y + 20 < height:
			set_rect(image, x, y, 4, 20, dash)
			y += 48
	return image

## Place centrale circulaire (halo de l'Horloge).
static func plaza() -> Image:
	var size := 640
	var image := make_image(size, size)
	var center := size / 2.0
	for py in size:
		for px in size:
			var d := Vector2(px + 0.5 - center, py + 0.5 - center).length()
			if d <= 318.0:
				image.set_pixel(px, py, PLAZA)
			elif d <= 324.0:
				image.set_pixel(px, py, Color(0.42, 0.96, 0.78, 0.30))
			elif d <= 336.0:
				image.set_pixel(px, py, Color(0.42, 0.96, 0.78, 0.08))
			elif d <= 342.0:
				image.set_pixel(px, py, Color(0.42, 0.96, 0.78, 0.18))
	var spoke := Color(1, 1, 1, 0.05)
	for i in 12:
		var angle := TAU * i / 12.0
		for step in 150:
			var d := 60.0 + step * 1.7
			var px := int(center + cos(angle) * d)
			var py := int(center + sin(angle) * d)
			if px >= 0 and py >= 0 and px < size and py < size:
				image.set_pixel(px, py, spoke)
	return image

## Statue de l'HORLOGE (150×190).
static func clock_statue() -> Image:
	var image := make_image(150, 190)
	rounded_rect(image, 45, 70, 105, 182, 12, Color("39466B"))
	rounded_rect(image, 52, 78, 98, 176, 9, Color("4A5A85"))
	set_circle(image, 75, 52, 38, Color("0B1929"))
	set_circle(image, 75, 52, 34, Color("F2F6FF"))
	set_circle(image, 75, 52, 30, Color("E4EAF6"))
	# Marques 12 / 3 / 6 / 9
	set_rect(image, 73, 24, 4, 8, DARK_INK)
	set_rect(image, 73, 72, 4, 8, DARK_INK)
	set_rect(image, 47, 50, 8, 4, DARK_INK)
	set_rect(image, 95, 50, 8, 4, DARK_INK)
	# Aiguilles
	for i in 20:
		image.set_pixel(75, 52 - i, DARK_INK)
	for i in 14:
		image.set_pixel(75 + i, 52, DARK_INK)
	set_circle(image, 75, 52, 3, Color("FF5A5A"))
	return image

## Antenne WiFi (140×170).
static func antenna() -> Image:
	var image := make_image(140, 170)
	rounded_rect(image, 40, 140, 100, 168, 8, Color("39466B"))
	rounded_rect(image, 46, 146, 94, 164, 6, Color("4A5A85"))
	set_rect(image, 64, 40, 12, 106, Color("5A6C9E"))
	set_rect(image, 60, 60, 20, 6, Color("5A6C9E"))
	set_rect(image, 60, 90, 20, 6, Color("5A6C9E"))
	set_rect(image, 60, 120, 20, 6, Color("5A6C9E"))
	set_circle(image, 70, 32, 9, Color("0B1929"))
	set_circle(image, 70, 32, 6, NEON)
	var wave := Color(0.42, 0.96, 0.78, 0.85)
	for angle_idx in 21:
		var angle := -PI / 2.0 + (angle_idx - 10) * 0.16
		image.set_pixel(70 + int(round(cos(angle) * 24.0)), 32 + int(round(sin(angle) * 24.0)), wave)
		image.set_pixel(70 + int(round(cos(angle) * 36.0)), 32 + int(round(sin(angle) * 36.0)), Color(0.42, 0.96, 0.78, 0.4))
	return image
