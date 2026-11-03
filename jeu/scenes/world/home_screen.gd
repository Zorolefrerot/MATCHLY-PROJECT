class_name HomeScreen
extends Node2D
## L'ÉCRAN D'ACCUEIL du téléphone : la ville-hub de l'acte 1.
## Grille d'applis, place de l'Horloge, antenne WiFi, mission « Batterie critique ».

const MAP_WIDTH := 2600
const MAP_HEIGHT := 1800

const SPAWN := Vector2(1300, 1230)

## Positions fixes des 5 éclats d'énergie (mission Batterie).
const SPARK_POSITIONS := [
	Vector2(700, 700),
	Vector2(1950, 700),
	Vector2(450, 1450),
	Vector2(2350, 1450),
	Vector2(1300, 1660),
]

var sparks: Array[Node2D] = []
var _intro_seen := false

func _ready() -> void:
	Game.mission_changed.connect(_on_mission_changed)
	_build_ground()
	_build_bounds()
	_build_buildings()
	_build_npcs()
	_build_player()
	_build_sparks()
	_run_intro()

# ------------------------------------------------------------------ sols ----

func _build_ground() -> void:
	var tile := Art.to_texture(Art.ground_tile())
	var ground := Sprite2D.new()
	ground.texture = tile
	ground.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
	ground.region_enabled = true
	ground.region_rect = Rect2(0, 0, MAP_WIDTH, MAP_HEIGHT)
	ground.centered = false
	add_child(ground)

	var plaza := Sprite2D.new()
	plaza.texture = Art.to_texture(Art.plaza())
	plaza.position = Vector2(1300, 940)
	add_child(plaza)

	var h_street := Art.to_texture(Art.street(2480, 120, true))
	var v_street := Art.to_texture(Art.street(120, 1680, false))
	for street_y in [660, 1280]:
		var h := Sprite2D.new()
		h.texture = h_street
		h.position = Vector2(60, street_y)
		h.centered = false
		add_child(h)
	for street_x in [620, 1300, 1875]:
		var v := Sprite2D.new()
		v.texture = v_street
		v.position = Vector2(street_x, 60)
		v.centered = false
		add_child(v)

func _build_bounds() -> void:
	_make_wall(Vector2(MAP_WIDTH / 2.0, -40), Vector2(MAP_WIDTH + 400, 80))
	_make_wall(Vector2(MAP_WIDTH / 2.0, MAP_HEIGHT + 40), Vector2(MAP_WIDTH + 400, 80))
	_make_wall(Vector2(-40, MAP_HEIGHT / 2.0), Vector2(80, MAP_HEIGHT + 400))
	_make_wall(Vector2(MAP_WIDTH + 40, MAP_HEIGHT / 2.0), Vector2(80, MAP_HEIGHT + 400))

func _make_wall(center: Vector2, size: Vector2) -> void:
	var body := StaticBody2D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	body.position = center
	var shape := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = size
	shape.shape = rectangle
	body.add_child(shape)
	add_child(body)

# ------------------------------------------------------------ bâtiments ----

func _build_buildings() -> void:
	var configs := [
		{"name": "AmiBook", "color": Color("4A6FA5"), "glyph": "heart", "locked_line": "locked_amibook", "pos": Vector2(250, 320)},
		{"name": "VidiTube", "color": Color("C8433C"), "glyph": "play", "locked_line": "locked_viditube", "pos": Vector2(900, 320)},
		{"name": "Bonbon Smash", "color": Color("D9558C"), "glyph": "candy", "locked_line": "locked_bonbon", "pos": Vector2(1550, 320)},
		{"name": "Marbouilles", "color": Color("7B4FBF"), "glyph": "marbles", "locked_line": "locked_marbouilles", "pos": Vector2(2200, 320)},
		{"name": "ChronoMail", "color": Color("3E8E6E"), "glyph": "mail", "locked_line": "locked_chronomail", "pos": Vector2(250, 1000)},
		{"name": "Blabla", "color": Color("2E9C9C"), "glyph": "chat", "locked_line": "locked_blabla", "pos": Vector2(2200, 1000)},
		{"name": "Navik", "color": Color("4A90E2"), "glyph": "compass", "locked_line": "locked_navik", "pos": Vector2(250, 1560)},
		{"name": "ClipClip", "color": Color("D9468F"), "glyph": "clip", "locked_line": "locked_clipclip", "pos": Vector2(1550, 1560)},
		{"name": "BOUTIQUE", "kind": "boutique", "color": Color("E8A33D"), "glyph": "bag", "pos": Vector2(900, 1560)},
		{"name": "BATTERIE", "kind": "battery", "color": Color("3ECF5E"), "glyph": "battery", "pos": Vector2(2200, 1560)},
	]
	for config in configs:
		var building := Building.new()
		var data: Dictionary = config.duplicate()
		if data.get("kind", "app") == "boutique":
			data["name"] = Game.t("app_boutique")
		elif data.get("kind", "app") == "battery":
			data["name"] = Game.t("app_battery")
		else:
			data["name"] = String(config["name"])
		building.setup(data)
		building.position = config["pos"]
		building.activated.connect(_on_building_activated)
		add_child(building)

	var antenna := Building.new()
	antenna.setup({
		"name": Game.t("app_wifi"),
		"kind": "wifi",
		"texture": Art.antenna(),
		"footprint": Vector2(140, 170),
	})
	antenna.position = Vector2(1300, 320)
	antenna.activated.connect(_on_building_activated)
	add_child(antenna)

func _on_building_activated(kind: String, building: Building) -> void:
	match kind:
		"app":
			Game.open_dialogue([Game.t(building.locked_line_key)], building.app_name)
		"boutique":
			Game.shop_open = true
			Game.shop_requested.emit()
		"battery":
			_battery_interacted()
		"wifi":
			Game.open_dialogue([Game.t("wifi_line")], Game.t("app_wifi"))

func _battery_interacted() -> void:
	if Game.mission_battery_done:
		Game.open_dialogue([Game.t("battery_repeat")], Game.t("app_battery"))
		return
	if Game.mission_stage() == "collect":
		if Game.sparks_collected == 0:
			Game.open_dialogue([Game.t("battery_missing_0")], Game.t("app_battery"))
		else:
			Game.open_dialogue(
				[Game.tf("battery_missing_n", [Game.sparks_collected, Game.SPARKS_NEEDED])],
				Game.t("app_battery"))
		return
	Game.complete_battery_mission()
	Sfx.play("success")
	Game.toast_requested.emit(Game.t("toast_mission_done"))
	Game.open_dialogue([Game.t("battery_done_1"), Game.t("battery_done_2")], Game.t("app_battery"))

func _on_mission_changed() -> void:
	pass

# ------------------------------------------------------------------ PNJ ----

func _build_npcs() -> void:
	var curseur := Npc.new()
	curseur.setup({
		"name": "CURSEUR",
		"texture": Art.cursor_arrow(),
		"custom": Callable(self, "_curseur_talk"),
	})
	curseur.position = Vector2(1140, 1180)
	add_child(curseur)

	var horloge := Npc.new()
	horloge.setup({
		"name": "HORLOGE",
		"texture": Art.clock_statue(),
		"lines": ["horloge_1", "horloge_2"],
		"solid": true,
	})
	horloge.position = Vector2(1300, 940)
	add_child(horloge)

	var joy := Npc.new()
	joy.setup({
		"name": "GIGIL",
		"texture": Art.emoji("joy"),
		"lines": ["joy_1"],
		"wander": 120.0,
		"speed": 90.0,
	})
	joy.position = Vector2(1250, 1030)
	add_child(joy)

	var cool := Npc.new()
	cool.setup({
		"name": "SWAG",
		"texture": Art.emoji("cool"),
		"lines": ["cool_1"],
		"wander": 90.0,
		"speed": 60.0,
	})
	cool.position = Vector2(950, 760)
	add_child(cool)

	var sleepy := Npc.new()
	sleepy.setup({
		"name": "DODO",
		"texture": Art.emoji("sleepy"),
		"lines": ["sleep_1"],
		"wander": 60.0,
		"speed": 35.0,
	})
	sleepy.position = Vector2(2130, 1180)
	add_child(sleepy)

func _curseur_talk() -> void:
	match Game.mission_stage():
		"collect":
			if Game.sparks_collected == 0 and not _intro_seen:
				_intro_seen = true
				Game.open_dialogue([
					Game.t("curseur_intro_1"),
					Game.t("curseur_intro_2"),
					Game.t("curseur_intro_3"),
					Game.t("curseur_intro_4"),
					Game.t("curseur_intro_5"),
				], "CURSEUR")
			else:
				Game.open_dialogue([Game.t("curseur_hint")], "CURSEUR")
		"return":
			Game.open_dialogue([Game.t("curseur_return")], "CURSEUR")
		_:
			Game.open_dialogue([Game.t("curseur_done_1"), Game.t("curseur_done_2")], "CURSEUR")

# --------------------------------------------------------------- joueur ----

func _build_player() -> void:
	var player := Player.new()
	player.position = SPAWN
	add_child(player)
	player.configure_camera(MAP_WIDTH, MAP_HEIGHT)

# ---------------------------------------------------------------- éclats ----

func _build_sparks() -> void:
	if Game.mission_battery_done:
		return
	for i in range(Game.sparks_collected, SPARK_POSITIONS.size()):
		var spark := Node2D.new()
		spark.position = SPARK_POSITIONS[i]

		var glow := Sprite2D.new()
		glow.texture = Art.to_texture(Art.radial(64, Color(1.0, 0.85, 0.3, 0.35)))
		glow.scale = Vector2(1.6, 1.6)
		var glow_material := CanvasItemMaterial.new()
		glow_material.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
		glow.material = glow_material
		spark.add_child(glow)

		var star := Sprite2D.new()
		star.texture = Art.to_texture(Art.spark())
		spark.add_child(star)

		var shadow := Sprite2D.new()
		shadow.texture = Art.to_texture(Art.shadow(34, 12))
		shadow.position = Vector2(0, 26)
		spark.add_child(shadow)

		add_child(spark)
		sparks.append(spark)

func _process(delta: float) -> void:
	if sparks.is_empty() or Game.player == null:
		return
	var time := Time.get_ticks_msec() / 1000.0
	var to_remove: Array[Node2D] = []
	for spark in sparks:
		var star := spark.get_child(1) as Sprite2D
		var glow := spark.get_child(0) as Sprite2D
		star.offset = Vector2(0, sin(time * 3.0 + spark.position.x) * 7.0)
		star.rotation += delta * 1.2
		var pulse := 1.6 + sin(time * 4.0 + spark.position.y) * 0.3
		glow.scale = Vector2(pulse, pulse)
		if Game.player.global_position.distance_to(spark.global_position) < 48.0:
			to_remove.append(spark)
	for spark in to_remove:
		sparks.erase(spark)
		spark.queue_free()
		Sfx.play("pickup")
		Game.collect_spark()

# -------------------------------------------------------------- intro ----

func _run_intro() -> void:
	if Game.mission_battery_done:
		return
	await get_tree().create_timer(0.8).timeout
	Game.toast_requested.emit(Game.t("toast_welcome"))
	if Game.sparks_collected == 0 and not Game.dialogue_active:
		await get_tree().create_timer(1.2).timeout
		if not Game.dialogue_active:
			_curseur_talk()
