class_name OrbitCamera
extends Node3D
## SpringArm collision test runs before the smoothed pivot's child camera.
@export var target: Node3D
@onready var arm: SpringArm3D = $SpringArm3D
@onready var camera: Camera3D = $SpringArm3D/Camera3D
var yaw := 0.0
var pitch := -0.3
var enabled := false
var finger := -1
var mouse_dragging := false
var menu_time := 0.0

func _ready() -> void:
	var probe := SphereShape3D.new()
	probe.radius = 0.25
	arm.shape = probe
	arm.spring_length = 6.5
	arm.margin = 0.18
	arm.collision_mask = 1
	if target is CollisionObject3D:
		arm.add_excluded_object(target.get_rid())

func reset() -> void:
	yaw = 0
	pitch = -0.3
	finger = -1
	if target:
		global_position = target.global_position + Vector3(0, 1.35, 0)

func _process(delta: float) -> void:
	if enabled and target:
		global_position = global_position.lerp(target.global_position + Vector3(0, 1.35, 0), 1 - exp(-12 * delta))
		rotation = Vector3(pitch, yaw, 0)
		arm.spring_length = 6.5
	elif not GameState.active:
		menu_time += delta * 0.06
		global_position = Vector3(0, 2.5, 0)
		rotation = Vector3(-0.5, menu_time, 0)
		arm.spring_length = 24

func _unhandled_input(event: InputEvent) -> void:
	if not enabled:
		return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_RIGHT:
		mouse_dragging = event.pressed
	if event is InputEventMouseMotion and mouse_dragging:
		_orbit(event.relative)
	if event is InputEventScreenTouch:
		if not event.pressed and event.index == finger:
			finger = -1
		elif event.pressed and finger == -1:
			var size := get_viewport().get_visible_rect().size
			if event.position.x > size.x * 0.45 and event.position.y < size.y * 0.70:
				finger = event.index
	if event is InputEventScreenDrag and event.index == finger:
		_orbit(event.relative)

func _orbit(relative: Vector2) -> void:
	var sensitivity := float(GameState.settings["sensitivity"]) * 0.006 + 0.001
	yaw -= relative.x * sensitivity
	pitch = clampf(pitch - relative.y * sensitivity, -1.05, 0.2)
