class_name Player
extends CharacterBody2D
## PIX : déplacement libre en vue de dessus (clavier ou joystick tactile),
## animations de rebond, halo lumineux et détection des interactions proches.

const SPEED := 340.0

var _sprite: Sprite2D
var _glow: Sprite2D
var _bob := 0.0
var _pulse := 0.0

func _ready() -> void:
	Game.player = self
	collision_layer = 2
	collision_mask = 1

	var shape := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 16.0
	shape.shape = circle
	add_child(shape)

	var shadow := Sprite2D.new()
	shadow.texture = Art.to_texture(Art.shadow(48, 16))
	shadow.position = Vector2(0, 24)
	add_child(shadow)

	_glow = Sprite2D.new()
	_glow.texture = Art.to_texture(Art.radial(96, Color(0.42, 0.96, 0.78, 0.30)))
	_glow.scale = Vector2(2.4, 2.4)
	var glow_material := CanvasItemMaterial.new()
	glow_material.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	_glow.material = glow_material
	add_child(_glow)

	_sprite = Sprite2D.new()
	_sprite.texture = Art.to_texture(Art.pix_sprite(Game.hat))
	add_child(_sprite)

	Game.hat_changed.connect(refresh_hat)

func configure_camera(map_width: int, map_height: int) -> void:
	var camera := Camera2D.new()
	camera.limit_left = 0
	camera.limit_top = 0
	camera.limit_right = map_width
	camera.limit_bottom = map_height
	camera.position_smoothing_enabled = true
	camera.position_smoothing_speed = 7.0
	add_child(camera)

func refresh_hat() -> void:
	_sprite.texture = Art.to_texture(Art.pix_sprite(Game.hat))

func _input_locked() -> bool:
	return Game.dialogue_active or Game.shop_open

func _physics_process(delta: float) -> void:
	var direction := Vector2.ZERO
	if not _input_locked():
		direction = Input.get_vector("move_left", "move_right", "move_up", "move_down")
		if Game.touch_active:
			direction = Game.touch_axis
	velocity = direction.limit_length(1.0) * SPEED
	move_and_slide()

	if velocity.length_squared() > 100.0:
		_bob += delta * 11.0
		_sprite.offset = Vector2(0, -absf(sin(_bob)) * 6.0)
		_sprite.rotation = velocity.x * 0.0004
	else:
		_sprite.offset = _sprite.offset.lerp(Vector2.ZERO, delta * 10.0)
		_sprite.rotation = lerpf(_sprite.rotation, 0.0, delta * 10.0)

	_pulse += delta
	var pulse := 2.4 + sin(_pulse * 2.2) * 0.18
	_glow.scale = Vector2(pulse, pulse)

	Game.update_prompt()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact"):
		Game.interact()
		get_viewport().set_input_as_handled()
