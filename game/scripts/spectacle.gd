class_name TrainingSpectacle
extends Node3D
## Shared image atlas, depth-tested sprites, bounded layers; purely visual.
## Timings never decide hits. No flashes, time scaling or screen-sized overlays.
const ATLAS: Texture2D = preload("res://assets/vfx/combat/combat_atlas.png")
const MAX_SPRITES: int = 10
var motif: int = 9
var tint: Color = Color("ffb271")
var accent: Color = Color("ffdfad")
var monumental: bool = false
var standard: bool = false
var duration: float = 1.8
var magnitude: float = 1.0
var age: float = 0.0
var layers: Array[Sprite3D] = []
var sizes: Array[float] = []

func _ready() -> void:
	if monumental: duration = TrainingUltimateRules.DURATION
	_add_stamp(1, true, 3.5 if monumental else 0.8)
	_add_stamp(motif, false, 3.7 if monumental else 1.2)
	_add_stamp(9, false, 2.2 if monumental else 0.85)
	if monumental:
		for i in range(7 if standard else 4):
			_add_stamp(11 if motif in [5,11] else 7 if motif == 8 else motif,false,0.62)
	_update()

func _add_stamp(cell: int, ground: bool, size_factor: float) -> void:
	if layers.size() >= MAX_SPRITES: return
	var sprite := Sprite3D.new()
	sprite.texture = ATLAS
	sprite.hframes = 4
	sprite.vframes = 4
	sprite.frame = clampi(cell,0,15)
	sprite.pixel_size = 0.01
	sprite.shaded = false
	sprite.no_depth_test = false
	sprite.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	sprite.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR
	if ground:
		sprite.rotation.x = -PI/2
		sprite.position.y = 0.10
	else:
		sprite.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(sprite)
	layers.append(sprite)
	sizes.append(size_factor)

func _process(delta: float) -> void:
	age += maxf(0,delta)
	if age >= duration:
		queue_free()
		return
	_update()

func _update() -> void:
	var charge_end: float = TrainingUltimateRules.WINDUP if monumental else 0.12
	var charge: float = smoothstep(0,charge_end,age)
	var release: float = smoothstep(charge_end,charge_end+0.65,age)
	var fade: float = 1.0-smoothstep(duration*0.56,duration,age)
	for i in range(layers.size()):
		var sprite: Sprite3D = layers[i]
		var size_factor: float = sizes[i]*magnitude
		var alpha: float = fade
		if i == 0:
			sprite.scale = Vector3.ONE*size_factor*(0.3+0.7*charge+0.3*release)
			sprite.rotation.z = age*0.18
			alpha *= charge*0.46
		elif i == 1:
			# A giant apparition rises during release, not a one-frame icon.
			sprite.scale = Vector3.ONE*size_factor*(0.12+0.88*release)
			sprite.position.y = (3.6 if monumental else 0.8)*release*magnitude
			alpha *= (0.15*charge+0.70*release)
		elif i == 2:
			sprite.scale = Vector3.ONE*size_factor*(0.2+1.2*release)
			sprite.position.y = 0.4+release*0.5
			alpha *= release*0.30
		else:
			var angle: float = float(i-3)*TAU/float(layers.size()-3)+age*(0.55 if motif % 2 == 0 else -0.55)
			var radius: float = (1.2+2.1*release)*magnitude
			sprite.position = Vector3(cos(angle)*radius,0.4+sin(age*0.8+i)*0.3+release*1.7,sin(angle)*radius)
			sprite.scale = Vector3.ONE*size_factor*(0.2+release)
			alpha *= release*0.42
		var color: Color = accent if i in [0,2] else tint
		color.a = clampf(alpha,0,0.85)
		sprite.modulate = color
