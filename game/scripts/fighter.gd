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
	visual = Node3D.new()
	add_child(visual)
	body_material = material(color)
	_box(visual, Vector3(0.66, 0.67, 0.36), Vector3(0, 1.03, 0), body_material)
	_box(visual, Vector3(0.72, 0.12, 0.4), Vector3(0, 0.72, 0), material(Color("bb5153")))
	_box(visual, Vector3(0.40, 0.40, 0.40), Vector3(0, 1.6, 0), material(Color("d2ac89")))
	_box(visual, Vector3(0.47, 0.20, 0.44), Vector3(0, 1.81, 0.02), material(Color("252e39")))
	_box(visual, Vector3(0.44, 0.10, 0.025), Vector3(0, 1.66, -0.215), material(Color("acbfc0")))
	_box(visual, Vector3(0.09, 0.055, 0.035), Vector3(-0.10, 1.56, -0.22), material(Color("172b30")))
	_box(visual, Vector3(0.09, 0.055, 0.035), Vector3(0.10, 1.56, -0.22), material(Color("172b30")))
	left_arm = _limb(Vector3(-0.43, 1.28, 0), Vector3(0.22, 0.60, 0.25), body_material)
	right_arm = _limb(Vector3(0.43, 1.28, 0), Vector3(0.22, 0.60, 0.25), body_material)
	left_leg = _limb(Vector3(-0.20, 0.7, 0), Vector3(0.24, 0.68, 0.29), material(Color("27303a")))
	right_leg = _limb(Vector3(0.20, 0.7, 0), Vector3(0.24, 0.68, 0.29), material(Color("27303a")))
	# A short scarf makes the two training characters identifiable at a distance.
	_box(visual, Vector3(0.28, 0.10, 0.8), Vector3(0.19, 1.30, 0.42), material(Color("c55755")))
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
