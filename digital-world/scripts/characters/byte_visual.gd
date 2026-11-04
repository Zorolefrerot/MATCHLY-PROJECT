class_name ByteVisual
extends Node3D
## Original articulated toy-like digital suit. AnimationPlayer drives rigid joints.
var animator: AnimationPlayer
var rig: Node3D
var eyes: Array[MeshInstance3D] = []
var current := ""
var phase := 0.0

func _ready() -> void:
	rig = Node3D.new()
	rig.name = "Rig"
	add_child(rig)
	DigitalArt.shape(rig, "sphere", Vector3(0, 0.92, 0), Vector3(0.78, 0.94, 0.54), DigitalArt.TEAL)
	DigitalArt.box(rig, Vector3(0, 0.92, -0.29), Vector3(0.37, 0.27, 0.06), DigitalArt.INK)
	DigitalArt.box(rig, Vector3(0, 0.94, -0.33), Vector3(0.16, 0.09, 0.025), DigitalArt.GOLD, true)
	DigitalArt.box(rig, Vector3(0, 0.95, 0.29), Vector3(0.5, 0.58, 0.24), DigitalArt.BLUE)
	DigitalArt.box(rig, Vector3(0, 1.04, 0.43), Vector3(0.25, 0.08, 0.02), DigitalArt.GOLD, true)
	var head := Node3D.new()
	head.name = "Head"
	head.position.y = 1.52
	rig.add_child(head)
	DigitalArt.shape(head, "sphere", Vector3.ZERO, Vector3(1.0, 0.82, 0.75), DigitalArt.PALE)
	DigitalArt.box(head, Vector3(0, 0, -0.34), Vector3(0.76, 0.41, 0.17), DigitalArt.INK)
	for x in [-0.19, 0.19]:
		eyes.append(DigitalArt.box(head, Vector3(x, 0.035, -0.435), Vector3(0.1, 0.16, 0.025), DigitalArt.TEAL, true))
	DigitalArt.box(head, Vector3(0, -0.11, -0.435), Vector3(0.12, 0.026, 0.026), DigitalArt.GOLD, true)
	DigitalArt.box(head, Vector3(0.34, 0.41, 0), Vector3(0.07, 0.27, 0.07), DigitalArt.CORAL)
	DigitalArt.shape(head, "sphere", Vector3(0.34, 0.58, 0), Vector3.ONE * 0.14, DigitalArt.GOLD, true)
	for side in [-1, 1]:
		var leg := Node3D.new()
		leg.name = "LeftLeg" if side == -1 else "RightLeg"
		leg.position = Vector3(side * 0.23, 0.6, 0)
		rig.add_child(leg)
		DigitalArt.box(leg, Vector3(0, -0.23, 0), Vector3(0.27, 0.48, 0.3), DigitalArt.INK)
		DigitalArt.box(leg, Vector3(0, -0.49, -0.1), Vector3(0.35, 0.2, 0.5), DigitalArt.PALE)
		DigitalArt.box(leg, Vector3(0, -0.48, -0.36), Vector3(0.29, 0.07, 0.025), DigitalArt.TEAL, true)
		var arm := Node3D.new()
		arm.name = "LeftArm" if side == -1 else "RightArm"
		arm.position = Vector3(side * 0.51, 1.23, 0)
		rig.add_child(arm)
		DigitalArt.shape(arm, "sphere", Vector3.ZERO, Vector3.ONE * 0.29, DigitalArt.CORAL)
		DigitalArt.box(arm, Vector3(0, -0.23, 0), Vector3(0.22, 0.4, 0.24), DigitalArt.BLUE)
		DigitalArt.shape(arm, "sphere", Vector3(0, -0.48, 0), Vector3(0.27, 0.26, 0.27), DigitalArt.PALE)
	_make_animations()
	play("Idle")

func _track(animation: Animation, path: String, values: Array) -> void:
	var index := animation.add_track(Animation.TYPE_VALUE)
	animation.track_set_path(index, NodePath(path))
	for key: Array in values:
		animation.track_insert_key(index, key[0], key[1])

func _make_animations() -> void:
	animator = AnimationPlayer.new()
	animator.name = "AnimationPlayer"
	add_child(animator)
	var library := AnimationLibrary.new()
	for state in ["Idle", "Walk", "Run", "Jump", "Falling", "Landing", "Interaction", "Hit", "Death"]:
		var animation := Animation.new()
		var duration := 1.6
		var swing := 0.0
		var bob := 0.018
		match state:
			"Walk": duration = 0.52; swing = 0.7; bob = 0.035
			"Run": duration = 0.38; swing = 1.05; bob = 0.065
			"Jump", "Falling": duration = 0.35
			"Landing", "Hit": duration = 0.22
			"Interaction": duration = 0.65
			"Death": duration = 0.8
		animation.length = duration
		animation.loop_mode = Animation.LOOP_LINEAR if state in ["Idle", "Walk", "Run", "Falling"] else Animation.LOOP_NONE
		var pose := 0.0
		if state == "Jump": pose = -0.55
		if state == "Falling": pose = 0.35
		_track(animation, "Rig:position", [[0, Vector3.ZERO], [duration * 0.25, Vector3(0, bob, 0)], [duration * 0.5, Vector3.ZERO], [duration * 0.75, Vector3(0, bob, 0)], [duration, Vector3.ZERO]])
		_track(animation, "Rig:rotation", [[0, Vector3.ZERO], [duration, Vector3(0, 0, -1.45) if state == "Death" else Vector3.ZERO]])
		for side in ["Left", "Right"]:
			var sign_value := 1.0 if side == "Left" else -1.0
			_track(animation, "Rig/" + side + "Leg:rotation", [[0, Vector3(swing * sign_value + pose, 0, 0)], [duration / 2, Vector3(-swing * sign_value + pose, 0, 0)], [duration, Vector3(swing * sign_value + pose, 0, 0)]])
			var arm_pose := -1.6 if state in ["Interaction", "Falling"] else -pose
			_track(animation, "Rig/" + side + "Arm:rotation", [[0, Vector3(-swing * sign_value + arm_pose, 0, 0)], [duration / 2, Vector3(swing * sign_value + arm_pose, 0, 0)], [duration, Vector3(-swing * sign_value + arm_pose, 0, 0)]])
		if state == "Landing" or state == "Hit":
			_track(animation, "Rig:scale", [[0, Vector3(1.1, 0.8, 1.1)], [duration, Vector3.ONE]])
		else:
			_track(animation, "Rig:scale", [[0, Vector3.ONE]])
		library.add_animation(state, animation)
	animator.add_animation_library("", library)

func play(state: String, rate := 1.0) -> void:
	if current != state:
		current = state
		animator.play(state, 0.12)
	animator.speed_scale = rate

func _process(delta: float) -> void:
	phase += delta
	var blink := 0.15 if fmod(phase, 4.2) > 4.05 else 1.0
	for eye in eyes:
		eye.scale.y = 0.16 * blink
