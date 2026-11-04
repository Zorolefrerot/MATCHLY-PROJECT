class_name ByteController
extends CharacterBody3D
signal health_changed(value: int)
signal respawn_requested
signal moved(distance: float)
@export var walk_speed := 3.2
@export var run_speed := 6.0
@export var jump_speed := 8.0
@onready var visual: ByteVisual = $Visual
var camera_rig: OrbitCamera
var joystick := Vector2.ZERO
var touch_jump := false
var controls_enabled := false
var health := 100
var damage_cooldown := 0.0
var pose_timer := 0.0
var locked_pose := ""
var dead := false
var distance_walked := 0.0

func _physics_process(delta: float) -> void:
	damage_cooldown = maxf(0, damage_cooldown - delta)
	pose_timer = maxf(0, pose_timer - delta)
	var axis := Vector2.ZERO
	if controls_enabled and not dead:
		axis = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
		if joystick.length() > 0.08:
			axis = joystick
	var running := Input.is_action_pressed("run") or joystick.length() > 0.82
	var speed := run_speed if running else walk_speed
	var direction := Vector3(axis.x, 0, axis.y)
	if camera_rig:
		direction = direction.rotated(Vector3.UP, camera_rig.yaw)
	if direction.length() > 1.0:
		direction = direction.normalized()
	var desired := direction * speed
	velocity.x = move_toward(velocity.x, desired.x, 30 * delta)
	velocity.z = move_toward(velocity.z, desired.z, 30 * delta)
	if not is_on_floor():
		velocity.y -= 22 * delta
	if controls_enabled and not dead and is_on_floor() and (Input.is_action_just_pressed("jump") or touch_jump):
		velocity.y = jump_speed
		Audio.effect("jump")
	touch_jump = false
	var was_on_floor := is_on_floor()
	var previous := global_position
	move_and_slide()
	var travelled := Vector2(global_position.x - previous.x, global_position.z - previous.z).length()
	if controls_enabled:
		distance_walked += travelled
		moved.emit(travelled)
	if direction.length() > 0.1:
		visual.rotation.y = lerp_angle(visual.rotation.y, atan2(-direction.x, -direction.z), 1 - exp(-14 * delta))
	if not was_on_floor and is_on_floor():
		pose("Landing", 0.18)
		Audio.effect("land")
	var actual_speed := travelled / maxf(delta, 0.001)
	if dead:
		visual.play("Death")
	elif pose_timer > 0:
		visual.play(locked_pose)
	elif not is_on_floor():
		visual.play("Jump" if velocity.y > 0 else "Falling")
	elif actual_speed > 0.2:
		var state := "Run" if running else "Walk"
		visual.play(state, clampf(actual_speed / speed, 0.3, 1.3))
	else:
		visual.play("Idle")
	if global_position.y < -8:
		respawn_requested.emit()

func pose(state: String, duration: float) -> void:
	locked_pose = state
	pose_timer = duration

func damage(amount: int) -> void:
	if damage_cooldown > 0 or dead or not controls_enabled:
		return
	health = maxi(0, health - amount)
	health_changed.emit(health)
	damage_cooldown = 1.5
	Audio.effect("hit")
	if health == 0:
		dead = true
		visual.play("Death")
		await get_tree().create_timer(1.2, false).timeout
		respawn_requested.emit()
	else:
		pose("Hit", 0.25)

func reset_at(point: Vector3) -> void:
	global_position = point
	velocity = Vector3.ZERO
	health = 100
	dead = false
	pose_timer = 0
	damage_cooldown = 2
	health_changed.emit(health)
