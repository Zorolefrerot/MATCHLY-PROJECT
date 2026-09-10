class_name TrainingVFX
extends Node3D
## Short world-space meshes: no full-screen flashes, lights, or expensive emitters.
const MAX_GROUPS: int = 14
var standard: bool = false
var random := RandomNumberGenerator.new()

func _ready() -> void:
	random.seed = 73021

func clear() -> void:
	for child in get_children():
		child.queue_free()

func _group(point: Vector3, lifetime: float) -> Node3D:
	if get_child_count() >= MAX_GROUPS:
		return null
	var group := Node3D.new()
	group.position = point
	add_child(group)
	var cleanup := create_tween().bind_node(group)
	cleanup.tween_interval(lifetime)
	cleanup.tween_callback(group.queue_free)
	return group

func _mesh(group: Node3D, shape: Mesh, color: Color) -> MeshInstance3D:
	var item := MeshInstance3D.new()
	item.mesh = shape
	item.material_override = TrainingFighter.material(color, true)
	item.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	group.add_child(item)
	return item

func _segment(group: Node3D, a: Vector3, b: Vector3, color: Color, width: float) -> void:
	if a.distance_to(b) < 0.001:
		return
	var mesh := CylinderMesh.new()
	mesh.top_radius = width * 0.6
	mesh.bottom_radius = width
	mesh.height = a.distance_to(b)
	mesh.radial_segments = 5
	var item := _mesh(group, mesh, color)
	item.position = (a + b) * 0.5
	item.quaternion = Quaternion(Vector3.UP, (b-a).normalized())

func _ring(group: Node3D, radius: float, color: Color) -> MeshInstance3D:
	var mesh := TorusMesh.new()
	mesh.inner_radius = radius * 0.95
	mesh.outer_radius = radius
	mesh.rings = 24
	mesh.ring_segments = 4
	return _mesh(group, mesh, color)

func impact(point: Vector3, color: Color, radius: float = 1.0) -> void:
	var group := _group(point, 0.38)
	if group == null:
		return
	for i in range(7 if standard else 4):
		var shape := BoxMesh.new()
		shape.size = Vector3(0.065, 0.065, 0.24)
		var spark := _mesh(group, shape, color)
		var direction := Vector3(random.randf_range(-1,1), random.randf_range(-0.3,1), random.randf_range(-1,1)).normalized()
		spark.rotation = Vector3(random.randf()*PI, random.randf()*PI, 0)
		var motion := create_tween().bind_node(group).set_parallel(true)
		motion.tween_property(spark, "position", direction * minf(radius, 1.5), 0.32)
		motion.tween_property(spark, "scale", Vector3.ONE * 0.02, 0.32)

func fireball(point: Vector3, direction: Vector3) -> TrainingFlame:
	# Attached to the projectile container by the caller. Its lifetime/collision
	# remain controlled by the unchanged gameplay projectile, not by this visual.
	var flame := TrainingFlame.new()
	flame.position = point
	flame.direction = direction
	flame.style = TrainingFlame.Style.PROJECTILE
	return flame

func fire_trail(point: Vector3, direction: Vector3) -> void:
	var group := _group(point, 0.31)
	if group == null:
		return
	var flame := TrainingFlame.new()
	flame.direction = direction
	flame.style = TrainingFlame.Style.TRAIL
	group.add_child(flame)

func fire_impact(point: Vector3, direction: Vector3) -> void:
	var group := _group(point, 0.60)
	if group == null:
		return
	var flame := TrainingFlame.new()
	flame.style = TrainingFlame.Style.IMPACT
	flame.direction = direction
	group.add_child(flame)
	impact(point, Color("ffb447"), 1.1)

func lightning(from: Vector3, to: Vector3, _color: Color) -> void:
	if from.distance_squared_to(to) < 0.0001:
		return
	var group := _group(from, TrainingBolt.LIFETIME + 0.02)
	if group == null:
		return
	var bolt := TrainingBolt.new()
	bolt.endpoint = to-from
	bolt.standard = standard
	bolt.seed_value = random.randi()
	group.add_child(bolt)

func wind(point: Vector3, direction: Vector3, color: Color) -> void:
	var group := _group(point, 0.45)
	if group == null:
		return
	group.quaternion = Quaternion(Vector3.UP, direction.normalized())
	for i in range(3):
		var ring := _ring(group, 0.42 + i*0.22, color)
		ring.position.y = float(i)*0.8
		var motion := create_tween().bind_node(group).set_parallel(true)
		motion.tween_property(ring, "position:y", 3.5 + i*0.8, 0.40)
		motion.tween_property(ring, "scale", Vector3.ONE * 1.8, 0.40)

func earth(point: Vector3) -> void:
	var group := _group(point, 0.75)
	if group == null:
		return
	var ring := _ring(group, 0.6, Color("f2ce88"))
	ring.position.y = 0.03
	var expansion := create_tween().bind_node(group)
	expansion.tween_property(ring, "scale", Vector3(5, 1, 5), 0.3)
	expansion.tween_property(ring, "scale", Vector3(5, 0.01, 5), 0.25)
	var count: int = 8 if standard else 5
	for i in range(count):
		var shape := CylinderMesh.new()
		shape.top_radius = 0.04
		shape.bottom_radius = 0.32
		shape.height = random.randf_range(0.6, 1.1)
		shape.radial_segments = 5
		var rock := _mesh(group, shape, Color("ba9065"))
		var angle: float = float(i)*TAU/float(count)
		rock.position = Vector3(sin(angle)*1.6, -0.6, cos(angle)*1.6)
		var motion := create_tween().bind_node(group)
		motion.tween_property(rock, "position:y", 0.35, 0.12).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		motion.tween_interval(0.2)
		motion.tween_property(rock, "scale", Vector3.ONE * 0.02, 0.3)

func slash(point: Vector3, forward: Vector3) -> void:
	var group := _group(point, 0.18)
	if group == null:
		return
	var side: Vector3 = forward.cross(Vector3.UP).normalized()
	var last: Vector3 = forward * 0.35 - side * 0.55
	for i in range(1, 6):
		var angle: float = lerpf(-1.0, 1.0, float(i)/5.0)
		var next: Vector3 = forward * cos(angle)*0.9 + side * sin(angle)*0.65
		_segment(group, last, next, Color("e3eacb"), 0.025)
		last = next
