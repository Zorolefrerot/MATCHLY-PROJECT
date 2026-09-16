class_name AcademyPortrait
extends Control
## Small, procedural profile portrait. The server sends only an appearance
## reference; this control renders it once instead of loading image copies.

var profile: Dictionary = {}
var accent: Color = Color("7db8bd")

func _ready() -> void:
	custom_minimum_size = Vector2(74, 88)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()

func set_profile(value: Dictionary) -> void:
	profile = value.duplicate(true)
	accent = _accent_for(str(profile.get("clan", "")))
	queue_redraw()

func _accent_for(clan: String) -> Color:
	return {
		"Senju": Color("6c9b61"),
		"Hyūga": Color("b9d8e6"),
		"Yamanaka": Color("c985b9"),
		"Inuzuka": Color("ad805d"),
		"Uchiwa": Color("a367b5"),
		"Uzumaki": Color("d77955"),
	}.get(clan, Color("7db8bd"))

func _choice(key: String, fallback: int = 0) -> int:
	var appearance: Variant = profile.get("appearance")
	if not appearance is Dictionary:
		return fallback
	var value: Variant = appearance.get(key, fallback)
	return int(value) if typeof(value) in [TYPE_INT, TYPE_FLOAT] else fallback

func _draw() -> void:
	var w := maxf(size.x, 74.0)
	var h := maxf(size.y, 88.0)
	draw_style_box(_box(Color("14262c"), Color("42636a"), 9), Rect2(0, 0, w, h))
	var skin := CharacterAppearance.SKIN_COLORS[clampi(_choice("skin", 2), 0, CharacterAppearance.SKIN_COLORS.size() - 1)]
	var hair := CharacterAppearance.HAIR_COLORS[clampi(_choice("hair_color", 0), 0, CharacterAppearance.HAIR_COLORS.size() - 1)]
	var cloth := CharacterAppearance.CLOTH_COLORS[clampi(_choice("top_color", 0), 0, CharacterAppearance.CLOTH_COLORS.size() - 1)]
	var eyes := CharacterAppearance.EYE_COLORS[clampi(_choice("eyes", 0), 0, CharacterAppearance.EYE_COLORS.size() - 1)]
	var center := Vector2(w * 0.5, 40)
	draw_circle(center + Vector2(0, 5), 19, skin)
	draw_circle(center + Vector2(0, -8), 20, hair)
	var hair_style := _choice("hair", 0)
	if hair_style == 1:
		for i in range(5):
			draw_colored_polygon(PackedVector2Array([
				center + Vector2(-19 + i * 9, -12),
				center + Vector2(-14 + i * 9, -26 - (i % 2) * 4),
				center + Vector2(-7 + i * 9, -12),
			]), hair)
	elif hair_style == 2:
		draw_rect(Rect2(center.x - 22, center.y - 5, 5, 28), hair)
		draw_rect(Rect2(center.x + 17, center.y - 5, 5, 28), hair)
	elif hair_style == 3:
		draw_circle(center + Vector2(20, 4), 7, hair)
	for x in [-7.0, 7.0]:
		draw_circle(center + Vector2(x, 5), 5.5, Color("f4eee0"))
		draw_circle(center + Vector2(x, 5), 2.2, eyes)
	draw_line(center + Vector2(-5, 17), center + Vector2(5, 17), Color("7f4d55"), 2.0)
	draw_rect(Rect2(center.x - 25, center.y + 22, 50, 37), cloth)
	draw_rect(Rect2(center.x - 25, center.y + 22, 50, 5), accent)
	draw_string(ThemeDB.fallback_font, Vector2(8, h - 7), str(profile.get("kind", "profil")).to_upper(), HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color("d9e8dc"))

func _box(fill: Color, border: Color, radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	return style
