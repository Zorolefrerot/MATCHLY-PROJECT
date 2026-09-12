class_name VillageAvatar
extends Node3D
## Display only: never simulate combat, collisions, damage or account progression.
var fighter: TrainingFighter
var nameplate: Label3D
var target: Vector3 = KonohaMap.SPAWN
var target_yaw: float = 0.0
var motion: String = "idle"
var has_pose: bool = false
var animation_clock: float = 0.0
var current_appearance: Dictionary = {}
var base_name: String = "Genin"
var combat_health: int = 120

func _ready() -> void:
	fighter = TrainingFighter.new()
	add_child(fighter)
	fighter.configure(Color("385962"),0,120)
	fighter.collision_mask = 0
	nameplate = Label3D.new()
	nameplate.position = Vector3(0,2.35,0)
	nameplate.font_size = 28
	nameplate.pixel_size = 0.008
	nameplate.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(nameplate)
	hide() # A roster alone must not show phantom avatars at the origin.

func configure(data: Dictionary) -> void:
	base_name = data["name"]
	nameplate.text = base_name
	var look: Dictionary = data["appearance"] if data.get("appearance") is Dictionary else CharacterAppearance.DEFAULTS
	if look != current_appearance:
		current_appearance = look.duplicate()
		fighter.apply_appearance(look)

func set_combat_health(value: int, active: bool) -> void:
	combat_health = clampi(value,0,120)
	if active:
		nameplate.text = "%s\n%d PV" % [base_name,combat_health]
	else:
		nameplate.text = base_name

func update_pose(data: Dictionary) -> void:
	target = Vector3(float(data["p"][0]),float(data["p"][1]),float(data["p"][2]))
	target_yaw = float(data["yaw"])
	motion = data["motion"]
	if not has_pose or position.distance_to(target) > 5:
		position = target
		fighter.visual.rotation.y = target_yaw
	has_pose = true
	show()

func _process(delta: float) -> void:
	if not has_pose:
		return
	var blend: float = 1.0-exp(-14.0*delta)
	position = position.lerp(target,blend)
	fighter.visual.rotation.y = lerp_angle(fighter.visual.rotation.y,target_yaw,blend)
	animation_clock += delta*(13 if motion == "run" else 9)
	var amplitude: float = 0.6 if motion in ["walk","run"] else 0.2 if motion == "jump" else 0.0
	fighter.left_leg.rotation.x = sin(animation_clock)*amplitude
	fighter.right_leg.rotation.x = -sin(animation_clock)*amplitude
	fighter.left_arm.rotation.x = -1.15 if motion == "run" else -sin(animation_clock)*amplitude
	fighter.right_arm.rotation.x = -1.15 if motion == "run" else sin(animation_clock)*amplitude
	fighter.visual.rotation.x = lerpf(fighter.visual.rotation.x,-0.18 if motion == "run" else 0.0,blend)
