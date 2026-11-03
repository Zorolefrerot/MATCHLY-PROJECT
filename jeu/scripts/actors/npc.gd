class_name Npc
extends CharacterBody2D
## Habitant du téléphone : emoji, CURSEUR ou HORLOGE.
## Se balade autour de son point d'ancrage et discute quand on lui parle.

var display_name := ""
var line_keys: Array = []
var custom_interact: Callable = Callable()
var wander_radius := 0.0
var wander_speed := 70.0
var solid := false

var _texture: Image = null
var _sprite: Sprite2D
var _home := Vector2.ZERO
var _direction := Vector2.ZERO
var _think_time := 0.0

func setup(config: Dictionary) -> void:
	display_name = String(config.get("name", ""))
	line_keys = config.get("lines", [])
	custom_interact = config.get("custom", Callable())
	wander_radius = float(config.get("wander", 0.0))
	wander_speed = float(config.get("speed", 70.0))
	solid = bool(config.get("solid", false))
	if config.has("texture"):
		_texture = config["texture"]

func _ready() -> void:
	add_to_group("interactable")
	collision_layer = 4
	collision_mask = 1
	_home = global_position

	var shape := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 12.0
	shape.shape = circle
	add_child(shape)

	if solid:
		var body := StaticBody2D.new()
		body.collision_layer = 1
		body.collision_mask = 0
		var body_shape := CollisionShape2D.new()
		var body_circle := CircleShape2D.new()
		body_circle.radius = 46.0
		body_shape.shape = body_circle
		body_shape.position = Vector2(0, 60)
		body.add_child(body_shape)
		add_child(body)

	var shadow := Sprite2D.new()
	shadow.texture = Art.to_texture(Art.shadow(40, 14))
	shadow.position = Vector2(0, 20)
	add_child(shadow)

	_sprite = Sprite2D.new()
	if _texture != null:
		_sprite.texture = Art.to_texture(_texture)
	add_child(_sprite)

	_think_time = randf_range(0.5, 2.0)

func get_interact_radius() -> float:
	return 130.0

func get_prompt() -> String:
	return Game.tf("prompt_talk", [display_name])

func interact() -> void:
	Sfx.play("talk")
	if custom_interact.is_valid():
		custom_interact.call()
		return
	var lines: Array[String] = []
	for key in line_keys:
		lines.append(Game.t(String(key)))
	Game.open_dialogue(lines, display_name)

func _physics_process(delta: float) -> void:
	if Game.dialogue_active or Game.shop_open:
		velocity = Vector2.ZERO
		move_and_slide()
		return

	_think_time -= delta
	if _think_time <= 0.0:
		_think_time = randf_range(1.0, 3.0)
		if wander_radius <= 0.0 or randf() < 0.3:
			_direction = Vector2.ZERO
		else:
			var angle := randf() * TAU
			_direction = Vector2(cos(angle), sin(angle))

	if wander_radius > 0.0 and global_position.distance_to(_home) > wander_radius:
		_direction = (_home - global_position).normalized()

	velocity = _direction * wander_speed
	if velocity.length_squared() > 1.0:
		move_and_slide()
		if get_slide_collision_count() > 0:
			_direction = -_direction
	var bob_scale := 1.0 + sin(Time.get_ticks_msec() / 300.0 + float(get_instance_id() % 100)) * 0.03
	_sprite.scale = Vector2(bob_scale, 2.0 - bob_scale)
	_sprite.position = Vector2(0, 0)
