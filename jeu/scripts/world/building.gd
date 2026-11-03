class_name Building
extends Node2D
## Bâtiment d'application sur l'écran d'accueil : corps néon, icône,
## enseigne, porte lumineuse et collision. Émet « activated » quand on entre.

signal activated(kind: String, building: Building)

var app_name := ""
var kind := "app"
var locked_line_key := ""
var footprint := Vector2(220, 260)
var custom_texture: Image = null
var custom_color := Color("4A6FA5")
var glyph_kind := ""

func setup(config: Dictionary) -> void:
	app_name = String(config.get("name", ""))
	kind = String(config.get("kind", "app"))
	locked_line_key = String(config.get("locked_line", ""))
	if config.has("footprint"):
		footprint = config["footprint"]
	if config.has("texture"):
		custom_texture = config["texture"]
	if config.has("color"):
		custom_color = config["color"]
	if config.has("glyph"):
		glyph_kind = String(config["glyph"])

func _ready() -> void:
	add_to_group("interactable")

	var body_sprite := Sprite2D.new()
	if custom_texture != null:
		body_sprite.texture = Art.to_texture(custom_texture)
	else:
		body_sprite.texture = Art.to_texture(Art.building(custom_color))
	add_child(body_sprite)

	if glyph_kind != "":
		var glyph := Sprite2D.new()
		glyph.texture = Art.to_texture(Art.glyph(glyph_kind))
		glyph.position = Vector2(0, -footprint.y * 0.22)
		add_child(glyph)

	if app_name != "":
		var label := Label.new()
		label.text = app_name
		label.size = Vector2(footprint.x + 60, 44)
		label.position = Vector2(-(footprint.x + 60) / 2.0, -footprint.y / 2.0 - 46)
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		var settings := LabelSettings.new()
		settings.font_size = 30
		settings.font_color = Color("F2F6FF")
		settings.outline_size = 10
		settings.outline_color = Color(0.04, 0.05, 0.10, 0.9)
		label.label_settings = settings
		add_child(label)

	var body := StaticBody2D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	var shape := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	if custom_texture != null:
		rectangle.size = Vector2(footprint.x * 0.5, footprint.y * 0.82)
		shape.position = Vector2(0, footprint.y * 0.08)
	else:
		rectangle.size = footprint
	shape.shape = rectangle
	body.add_child(shape)
	add_child(body)

func get_interact_radius() -> float:
	return 250.0

func get_prompt() -> String:
	return Game.tf("prompt_enter", [app_name])

func interact() -> void:
	Sfx.play("blip")
	activated.emit(kind, self)
