class_name TrainingFighter
extends CharacterBody3D
## Original, procedural stand-in. No external character models or animations.

var health: float = 120.0
var maximum_health: float = 120.0
var visual: Node3D
var left_arm: Node3D
var right_arm: Node3D
var left_leg: Node3D
var right_leg: Node3D
var ring: MeshInstance3D
var body_material: StandardMaterial3D
var animation_time: float = 0.0
var dodge_remaining: float = 0.0
var dodge_cooldown: float = 0.0
var dodge_direction: Vector3 = Vector3.FORWARD
var impulse: Vector3 = Vector3.ZERO
var strike_remaining: float = 0.0
var flash_remaining: float = 0.0
var base_color: Color = Color("284852")
var appearance: Dictionary = CharacterAppearance.DEFAULTS.duplicate()
var hair_root: Node3D
var eye_material: StandardMaterial3D
var skin_material: StandardMaterial3D

func configure(color: Color, layer: int, hit_points: float) -> void:
	base_color = color
	maximum_health = hit_points
	health = hit_points
	collision_layer = layer
	collision_mask = 1 | 2 | 4
	floor_snap_length = 0.35
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.33
	capsule.height = 1.75
	var collision := CollisionShape3D.new()
	collision.shape = capsule
	collision.position.y = 0.9
	add_child(collision)
	_build_visual(appearance, color)
	var torus := TorusMesh.new()
	torus.inner_radius = 0.58
	torus.outer_radius = 0.64
	torus.rings = 24
	torus.ring_segments = 5
	ring = MeshInstance3D.new()
	ring.mesh = torus
	ring.position.y = 0.04
	ring.material_override = material(Color("f3c971"), true)
	add_child(ring)
	ring.visible = false

func apply_appearance(value: Dictionary) -> void:
	appearance = CharacterAppearance.sanitize(value)
	_build_visual(appearance, CharacterAppearance.CLOTH_COLORS[appearance["top_color"]])

func _build_visual(data: Dictionary, color: Color) -> void:
	var old_rotation := Vector3.ZERO
	if is_instance_valid(visual):
		old_rotation = visual.rotation
		remove_child(visual)
		visual.queue_free()
	visual = Node3D.new()
	visual.rotation = old_rotation
	add_child(visual)
	base_color = color
	body_material = material(color)
	skin_material = material(CharacterAppearance.SKIN_COLORS[data["skin"]])
	eye_material = material(CharacterAppearance.EYE_COLORS[data["eyes"]], true)
	var pants: StandardMaterial3D = material(CharacterAppearance.CLOTH_COLORS[data["bottom_color"]])
	var dark: StandardMaterial3D = material(Color("202a32"))
	var female: bool = data["model"] == 1
	# Modest, fully clothed silhouettes. Both use the exact same gameplay capsule.
	var width: float = 0.57 if female else 0.66
	_box(visual, Vector3(width, 0.67, 0.36), Vector3(0, 1.03, 0), body_material)
	_box(visual, Vector3(0.69, 0.12, 0.4), Vector3(0, 0.72, 0), dark)
	if data["top"] == 0:
		_box(visual, Vector3(width*0.38, 0.31, 0.08), Vector3(-width*0.25, 1.1, -0.20), body_material)
		_box(visual, Vector3(width*0.38, 0.31, 0.08), Vector3(width*0.25, 1.1, -0.20), body_material)
		_box(visual, Vector3(0.035, 0.55, 0.025), Vector3(0, 1.05, -0.195), dark)
	elif data["top"] == 1:
		_box(visual, Vector3(width+0.09, 0.26, 0.4), Vector3(0, 0.65, 0), body_material)
		_box(visual, Vector3(0.045, 0.5, 0.025), Vector3(-0.1, 1.05, -0.195), dark)
	_box(visual, Vector3(0.38 if female else 0.40, 0.40, 0.38), Vector3(0, 1.6, 0), skin_material)
	_box(visual, Vector3(0.42, 0.075, 0.025), Vector3(0, 1.71, -0.20), material(Color("acbfc0")))
	for x in [-0.095, 0.095]:
		_box(visual, Vector3(0.12, 0.068, 0.021), Vector3(x, 1.60, -0.20), material(Color("f1ebdc")))
		_box(visual, Vector3(0.063, 0.064, 0.023), Vector3(x, 1.60, -0.216), eye_material)
		_box(visual, Vector3(0.022, 0.042, 0.01), Vector3(x, 1.60, -0.232), dark)
	_box(visual, Vector3(0.055, 0.066, 0.05), Vector3(0, 1.52, -0.205), skin_material)
	_box(visual, Vector3(0.09, 0.018, 0.015), Vector3(0, 1.455, -0.195), material(Color("81564f")))
	var shoulder: float = width/2.0 + 0.105
	left_arm = _limb(Vector3(-shoulder, 1.28, 0), Vector3(0.20, 0.60, 0.25), skin_material if data["top"] == 2 else body_material)
	right_arm = _limb(Vector3(shoulder, 1.28, 0), Vector3(0.20, 0.60, 0.25), skin_material if data["top"] == 2 else body_material)
	for limb in [left_arm, right_arm]:
		if data["top"] == 2:
			_box(limb, Vector3(0.23, 0.22, 0.27), Vector3(0, -0.10, 0), body_material)
		_box(limb, Vector3(0.18, 0.14, 0.22), Vector3(0, -0.64, 0), skin_material)
	var leg_width: float = 0.31 if data["bottom"] == 1 else 0.24
	left_leg = _limb(Vector3(-0.19, 0.7, 0), Vector3(leg_width, 0.66, 0.29), skin_material if data["bottom"] == 2 else pants)
	right_leg = _limb(Vector3(0.19, 0.7, 0), Vector3(leg_width, 0.66, 0.29), skin_material if data["bottom"] == 2 else pants)
	for limb in [left_leg, right_leg]:
		if data["bottom"] == 2:
			_box(limb, Vector3(0.28, 0.32, 0.32), Vector3(0, -0.16, 0), pants)
			_box(limb, Vector3(0.25, 0.23, 0.30), Vector3(0, -0.50, 0), dark)
		_box(limb, Vector3(0.25, 0.12, 0.38), Vector3(0, -0.64, -0.035), dark)
	_box(visual, Vector3(0.28, 0.10, 0.8), Vector3(0.19, 1.30, 0.42), material(Color("c55755")))
	hair_root = Node3D.new()
	visual.add_child(hair_root)
	var hair_mat: StandardMaterial3D = material(CharacterAppearance.HAIR_COLORS[data["hair_color"]])
	_box(hair_root, Vector3(0.44, 0.15, 0.41), Vector3(0, 1.82, 0.015), hair_mat)
	if data["hair"] == 1:
		for i in range(5):
			var spike := MeshInstance3D.new()
			var cone := CylinderMesh.new()
			cone.top_radius = 0
			cone.bottom_radius = 0.09
			cone.height = 0.24 + float(i%2)*0.08
			cone.radial_segments = 5
			spike.mesh = cone
			spike.material_override = hair_mat
			spike.position = Vector3(float(i-2)*0.095, 1.95, 0.025)
			spike.rotation.z = -float(i-2)*0.15
			hair_root.add_child(spike)
	elif data["hair"] == 2:
		for x in [-0.225, 0.225]:
			_box(hair_root, Vector3(0.095, 0.42, 0.34), Vector3(x, 1.64, 0.055), hair_mat)
		_box(hair_root, Vector3(0.43, 0.45, 0.12), Vector3(0, 1.61, 0.22), hair_mat)
	elif data["hair"] == 3:
		_box(hair_root, Vector3(0.19, 0.18, 0.18), Vector3(0, 1.83, 0.29), dark)
		_box(hair_root, Vector3(0.21, 0.58, 0.20), Vector3(0, 1.56, 0.36), hair_mat)

static func material(color: Color, unshaded: bool = false) -> StandardMaterial3D:
	var result := StandardMaterial3D.new()
	result.albedo_color = color
	result.roughness = 1.0
	result.diffuse_mode = BaseMaterial3D.DIFFUSE_TOON
	result.specular_mode = BaseMaterial3D.SPECULAR_DISABLED
	if unshaded:
		result.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	return result

func _box(parent: Node3D, dimensions: Vector3, point: Vector3, mat: Material) -> void:
	var part := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = dimensions
	part.mesh = mesh
	part.position = point
	part.material_override = mat
	parent.add_child(part)

func _limb(point: Vector3, dimensions: Vector3, mat: Material) -> Node3D:
	var pivot := Node3D.new()
	pivot.position = point
	visual.add_child(pivot)
	_box(pivot, dimensions, Vector3(0, -dimensions.y / 2.0, 0), mat)
	return pivot

func forward() -> Vector3:
	var heading: Vector3 = -visual.global_transform.basis.z
	heading.y = 0
	return heading.normalized()

func face(direction: Vector3, weight: float = 1.0) -> void:
	if Vector2(direction.x, direction.z).length() > 0.001:
		visual.rotation.y = lerp_angle(visual.rotation.y, atan2(-direction.x, -direction.z), clampf(weight, 0, 1))

func jump() -> bool:
	if is_on_floor() and health > 0.0:
		velocity.y = 6.4
		return true
	return false

func dodge(direction: Vector3) -> bool:
	if dodge_cooldown > 0.0 or health <= 0.0:
		return false
	dodge_direction = direction.normalized() if direction.length() > 0.1 else forward()
	dodge_direction.y = 0
	dodge_remaining = 0.36
	dodge_cooldown = 1.4
	return true

func take_damage(amount: float, push: Vector3 = Vector3.ZERO) -> bool:
	if health <= 0.0 or dodge_remaining > 0.10:
		return false
	health = maxf(0, health - amount)
	impulse += push
	flash_remaining = 0.12
	return true

func reset_at(point: Vector3) -> void:
	position = point
	velocity = Vector3.ZERO
	impulse = Vector3.ZERO
	health = maximum_health
	dodge_remaining = 0
	dodge_cooldown = 0
	strike_remaining = 0
	flash_remaining = 0
	visual.rotation = Vector3.ZERO
	left_arm.rotation = Vector3.ZERO
	right_arm.rotation = Vector3.ZERO
	left_leg.rotation = Vector3.ZERO
	right_leg.rotation = Vector3.ZERO

func simulate(delta: float, direction: Vector3, sprint: bool = false) -> void:
	dodge_cooldown = maxf(0.0, dodge_cooldown - delta)
	dodge_remaining = maxf(0.0, dodge_remaining - delta)
	strike_remaining = maxf(0.0, strike_remaining - delta)
	flash_remaining = maxf(0.0, flash_remaining - delta)
	var speed: float = 6.6 if sprint else 4.1
	var horizontal: Vector3 = direction.limit_length() * speed
	if dodge_remaining > 0.0:
		horizontal = dodge_direction * 11.5
	if health <= 0.0:
		horizontal = Vector3.ZERO
	velocity.x = horizontal.x + impulse.x
	velocity.z = horizontal.z + impulse.z
	impulse = impulse.move_toward(Vector3.ZERO, delta * 13.0)
	if not is_on_floor():
		velocity.y -= 18.0 * delta
	move_and_slide()
	if horizontal.length() > 0.1:
		face(horizontal, delta * 12.0)
	animation_time += delta * (13.0 if sprint else 9.0)
	var amplitude: float = minf(horizontal.length() / 5.0, 1.0) * 0.6
	left_leg.rotation.x = sin(animation_time) * amplitude
	right_leg.rotation.x = -sin(animation_time) * amplitude
	var ninja_running: bool = sprint and horizontal.length() > 0.5
	var blend: float = minf(1.0, delta * 15.0)
	# Characters face -Z. A down-pointing arm rotated around negative X trails +Z.
	var left_pose: float = -1.15 if ninja_running else -sin(animation_time) * amplitude
	var right_pose: float = -1.15 if ninja_running else sin(animation_time) * amplitude
	if strike_remaining > 0.0:
		right_pose = 1.65 # Punch forward, not backwards, including during a sprint.
	left_arm.rotation.x = lerpf(left_arm.rotation.x, left_pose, blend)
	right_arm.rotation.x = lerpf(right_arm.rotation.x, right_pose, blend)
	left_arm.rotation.z = lerpf(left_arm.rotation.z, -0.12 if ninja_running else 0.0, blend)
	right_arm.rotation.z = lerpf(right_arm.rotation.z, 0.12 if ninja_running else 0.0, blend)
	visual.rotation.x = lerpf(visual.rotation.x, -0.18 if ninja_running else 0.0, blend)
	visual.rotation.z = 0.22 if dodge_remaining > 0.0 else 0.0
	body_material.albedo_color = Color.WHITE if flash_remaining > 0 else base_color
