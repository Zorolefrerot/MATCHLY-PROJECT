class_name TrainingVFX
extends Node3D
## Textured world-space attacks; bounded layers, no screen flashes or emitters.
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

func textured(group: Node3D, cell: int, color: Color, lifetime: float, scale_factor: float = 1.0) -> void:
	if group == null: return
	var effect := TrainingSpectacle.new()
	effect.motif = cell
	effect.tint = color
	effect.accent = color.lightened(0.35)
	effect.duration = lifetime
	effect.magnitude = scale_factor
	group.add_child(effect)

func impact(point: Vector3, color: Color, radius: float = 1.0) -> void:
	var group := _group(point, 1.85)
	if group == null:
		return
	textured(group,9,color,1.8,clampf(radius,0.35,1.1))
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

func clan_technique(point: Vector3, target: Vector3, direction: Vector3, element: String, motif: int, color: Color) -> void:
	var group := _group(point, 2.15)
	if group == null:
		return
	textured(group, motif, color, 2.0, 0.95)
	if element == "Mokuton":
		var root := _ring(group, 0.35, color)
		root.position.y = 0.05
		var growth := create_tween().bind_node(group)
		growth.tween_property(root, "scale", Vector3(4.0, 1.0, 4.0), 0.48)
		for i in range(4):
			_segment(group, Vector3.ZERO, Vector3(cos(float(i))*1.3, 0.35, sin(float(i))*1.3), color, 0.10)
	elif element in ["Fūinjutsu", "Jūken", "Esprit"]:
		var seal := _ring(group, 0.52, color)
		seal.position.y = 0.08
		var seal_motion := create_tween().bind_node(group)
		seal_motion.tween_property(seal, "scale", Vector3(3.2, 1.0, 3.2), 0.42)
	elif element in ["Expansion", "Titan"]:
		var shock := _ring(group, 0.42, color)
		shock.position.y = 0.12
		var shock_motion := create_tween().bind_node(group)
		shock_motion.tween_property(shock, "scale", Vector3(3.8, 1.0, 3.8), 0.36)
	elif element in ["Lames", "Énergie spirituelle"]:
		slash(point, direction)
	elif element in ["Kikaichū", "Bestial", "Ombre", "Impact", "Jeu d’ombres"]:
		wind(point, Vector3(direction.x, 0, direction.z).normalized(), color)
		var marker := Node3D.new()
		marker.position = target - point
		group.add_child(marker)
		textured(marker, motif, color.lightened(0.2), 1.2, 0.5)

func fire_trail(point: Vector3, direction: Vector3) -> void:
	var group := _group(point, 0.31)
	if group == null:
		return
	var flame := TrainingFlame.new()
	flame.direction = direction
	flame.style = TrainingFlame.Style.TRAIL
	group.add_child(flame)

func fire_impact(point: Vector3, direction: Vector3) -> void:
	var group := _group(point, 2.0)
	if group == null:
		return
	var flame := TrainingFlame.new()
	textured(group,9,Color("ff7d46"),1.95,1.1)
	flame.style = TrainingFlame.Style.IMPACT
	flame.direction = direction
	group.add_child(flame)
	impact(point, Color("ffb447"), 1.1)

func lightning(from: Vector3, to: Vector3, _color: Color) -> void:
	if from.distance_squared_to(to) < 0.0001:
		return
	var group := _group(from, 1.85)
	if group == null:
		return
	var bolt := TrainingBolt.new()
	bolt.endpoint = to-from
	bolt.standard = standard
	bolt.seed_value = random.randi()
	group.add_child(bolt)
	var endpoint := Node3D.new()
	endpoint.position = to-from
	group.add_child(endpoint)
	textured(endpoint,14,Color("96d9ff"),1.8,0.95)

func wind(point: Vector3, direction: Vector3, color: Color) -> void:
	var group := _group(point, 1.95)
	if group == null:
		return
	textured(group,15,color,1.9,1.15)
	group.quaternion = Quaternion(Vector3.UP, direction.normalized())
	for i in range(3):
		var ring := _ring(group, 0.42 + i*0.22, color)
		ring.position.y = float(i)*0.8
		var motion := create_tween().bind_node(group).set_parallel(true)
		motion.tween_property(ring, "position:y", 3.5 + i*0.8, 0.40)
		motion.tween_property(ring, "scale", Vector3.ONE * 1.8, 0.40)

func earth(point: Vector3) -> void:
	var group := _group(point, 2.25)
	if group == null:
		return
	textured(group,2,Color("d2b48a"),2.2,1.35)
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
	var group := _group(point, 0.8)
	if group == null:
		return
	textured(group,13,Color("dfecda"),0.75,0.42)
	var side: Vector3 = forward.cross(Vector3.UP).normalized()
	var last: Vector3 = forward * 0.35 - side * 0.55
	for i in range(1, 6):
		var angle: float = lerpf(-1.0, 1.0, float(i)/5.0)
		var next: Vector3 = forward * cos(angle)*0.9 + side * sin(angle)*0.65
		_segment(group, last, next, Color("e3eacb"), 0.025)
		last = next
