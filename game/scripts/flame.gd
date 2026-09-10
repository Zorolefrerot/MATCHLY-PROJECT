class_name TrainingFlame
extends Node3D
## Animated world-space flames, not a screen overlay or an opaque orange ball.
enum Style { PROJECTILE, TRAIL, IMPACT }
const ATLAS: Texture2D = preload("res://assets/vfx/flame_atlas.png")
const FRAMES: int = 8
var style: Style = Style.PROJECTILE
var direction: Vector3 = Vector3.FORWARD
var age: float = 0.0
var sprites: Array[Sprite3D] = []
var bases: Array[Vector3] = []

func _ready() -> void:
	var count: int = 1 if style == Style.TRAIL else 3
	for i in range(count):
		var sprite := Sprite3D.new()
		sprite.texture = ATLAS
		sprite.hframes = FRAMES
		sprite.pixel_size = 0.008
		sprite.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		sprite.shaded = false
		sprite.no_depth_test = false
		sprite.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		sprite.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR
		add_child(sprite)
		sprites.append(sprite)
		var base := Vector3(0.95 - i*0.18, 0.68 + i*0.03, 1)
		if style == Style.TRAIL:
			base = Vector3(0.48, 0.46, 1)
		elif style == Style.IMPACT:
			base = Vector3(1.3 - i*0.22, 0.86 - i*0.1, 1)
		bases.append(base)
	_update_visuals()

func _process(delta: float) -> void:
	age += delta
	_update_visuals()

func _update_visuals() -> void:
	var side: Vector3 = direction.cross(Vector3.UP).normalized()
	if side.length_squared() < 0.01:
		side = Vector3.RIGHT
	for i in range(sprites.size()):
		var sprite: Sprite3D = sprites[i]
		sprite.frame = (int(age * 18.0) + i*3) % FRAMES
		var pulse: float = 1.0 + sin(age * 28.0 + i*2.0)*0.07
		sprite.scale = bases[i] * Vector3(pulse, 1.0 / pulse, 1.0)
		var opacity: float = 0.95 - i*0.16
		if style == Style.PROJECTILE:
			sprite.position = -direction * float(i)*0.27 + Vector3.UP * (0.1 + i*0.035)
			sprite.position += side * sin(age*14 + i*2.2)*0.08
		elif style == Style.TRAIL:
			sprite.position = -direction * age*1.3 + Vector3.UP * age*0.8
			sprite.scale *= maxf(0.1, 1.0-age*1.6)
			opacity *= clampf(1.0-age/0.30, 0.0, 1.0)
		else:
			var growth: float = minf(1.0, 0.35+age*6.0)
			sprite.scale *= growth
			sprite.position = side * float(i-1)*0.28 + Vector3.UP * (0.12+age*0.8)
			opacity *= 1.0-smoothstep(0.16, 0.58, age)
		sprite.modulate = Color(1.0, 1.0, 1.0, opacity)
