class_name KonohaExterior
extends Node3D
## Première région extérieure partagée d'IDREM ZENKAI.
##
## Cette zone reste dans le même World3D que Konoha : sortir par la porte est
## une marche continue, pas une scène privée ni un téléporteur. Les volumes de
## mission sont des repères neutres pour les futures missions d'équipe.
##
## Android : quelques matériaux partagés, végétation procédurale déterministe,
## collisions de terrain/rochers simplifiées et LOD des troncs éloignés.

signal left_konoha
signal returned_to_konoha

const REGION_MIN_X: float = -126.0
const REGION_MAX_X: float = 126.0
const REGION_START_Z: float = 158.0
const REGION_FAR_Z: float = 428.0
const GATE_LANE_HALF_WIDTH: float = 7.0
const GATE_Z: float = 160.5
const EXTERIOR_SPAWN := Vector3(0.0, 0.35, 169.0)
const KONOHA_RETURN_SPAWN := Vector3(0.0, 0.35, 158.8)
const INTERIOR_KONOHA_SPAWN := Vector3(0.0, 0.35, 154.0)
const PLAIN_ZONE := Vector3(0.0, 0.3, 218.0)
const FOREST_ZONE := Vector3(0.0, 0.3, 276.0)
const AMBUSH_ZONE := Vector3(0.0, 0.3, 315.0)
const CONTINUATION_ZONE := Vector3(0.0, 0.3, 395.0)
const MISSION_ZONE_RADIUS: float = 18.0
const LOD_NEAR_DISTANCE: float = 62.0
const LOD_FAR_DISTANCE: float = 82.0

const EARTH_ART: Texture2D = preload("res://assets/konoha/earth_ground_texture.png")
const RIVER_ART: Texture2D = preload("res://assets/konoha/river_water_texture.png")

var built: bool = false
var player: TrainingFighter
var outside: bool = false
var transition_lock: float = 0.0
var pending_exit: bool = false
var pending_return: bool = false
var materials: Dictionary = {}
var collision_lod_bodies: Array[StaticBody3D] = []
var collision_lod_clock: float = 0.0
var mission_markers: Dictionary = {}
var exit_trigger: Area3D
var return_trigger: Area3D
var interior_spawn: Marker3D
var exterior_spawn: Marker3D
var return_spawn: Marker3D

func build() -> void:
	if built:
		return
	built = true
	name = "KonohaExterior"
	_build_ground()
	_build_path()
	_build_plain()
	_build_stream_and_bridge()
	_build_forest()
	_build_ambush_clearing()
	_build_distant_mountains()
	_build_boundaries()
	_build_mission_zones()
	_build_spawns_and_triggers()
	_cache_collision_bodies()

func set_player(value: TrainingFighter) -> void:
	player = value
	_update_collision_lod(true)

func _mat(color: Color, unshaded: bool = false) -> StandardMaterial3D:
	var key: String = "%s|%s" % [color.to_html(), "u" if unshaded else "s"]
	if not materials.has(key):
		materials[key] = TrainingFighter.material(color, unshaded)
	return materials[key] as StandardMaterial3D

func _box(size: Vector3, point: Vector3, color: Color, solid: bool = false, rotation: Vector3 = Vector3.ZERO, lod: bool = false) -> MeshInstance3D:
	var item := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	item.mesh = mesh
	item.position = point
	item.rotation = rotation
	item.material_override = _mat(color)
	item.visibility_range_end = 430.0 if not lod else 150.0
	item.visibility_range_end_margin = 10.0
	add_child(item)
	if solid:
		var body := StaticBody3D.new()
		body.name = "Solid"
		body.collision_layer = 1
		body.collision_mask = 0
		var shape := CollisionShape3D.new()
		var prism := BoxShape3D.new()
		prism.size = size
		shape.shape = prism
		body.add_child(shape)
		item.add_child(body)
		if lod:
			body.set_meta("exterior_distance_lod", true)
			collision_lod_bodies.append(body)
	return item

func _cylinder(radius: float, height: float, point: Vector3, color: Color, segments: int = 10, solid: bool = false, lod: bool = false) -> MeshInstance3D:
	var item := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = segments
	item.mesh = mesh
	item.position = point
	item.material_override = _mat(color)
	item.visibility_range_end = 430.0 if not lod else 150.0
	item.visibility_range_end_margin = 10.0
	add_child(item)
	if solid:
		var body := StaticBody3D.new()
		body.name = "Solid"
		body.collision_layer = 1
		body.collision_mask = 0
		var shape := CollisionShape3D.new()
		var cylinder_shape := CylinderShape3D.new()
		cylinder_shape.radius = radius
		cylinder_shape.height = height
		shape.shape = cylinder_shape
		body.add_child(shape)
		item.add_child(body)
		if lod:
			body.set_meta("exterior_distance_lod", true)
			collision_lod_bodies.append(body)
	return item

func _sphere(point: Vector3, radius: float, height: float, color: Color, lod: bool = false) -> MeshInstance3D:
	var item := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = height
	mesh.radial_segments = 8
	mesh.rings = 4
	item.mesh = mesh
	item.position = point
	item.material_override = _mat(color)
	item.visibility_range_end = 430.0 if not lod else 150.0
	item.visibility_range_end_margin = 10.0
	add_child(item)
	return item

func _ground_patch(point: Vector3, size: Vector3, color: Color, rotation_y: float = 0.0) -> void:
	var patch := _box(size, point, color, false, Vector3(0, rotation_y, 0), false)
	patch.visibility_range_end = 430.0

func _build_ground() -> void:
	# The external floor touches the south wall and ends at a visible mountain
	# ridge. Konoha's existing floor remains untouched under the first meters.
	var ground := _box(Vector3(252.0, 0.4, REGION_FAR_Z - REGION_START_Z + 8.0), Vector3(0, -0.25, (REGION_START_Z + REGION_FAR_Z) * 0.5), Color.WHITE, true)
	var earth := _mat(Color.WHITE)
	earth.albedo_texture = EARTH_ART
	earth.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	earth.texture_repeat = true
	earth.uv1_scale = Vector3(12.0, 12.0, 12.0)
	ground.material_override = earth
	# Mild color blocks break the flat floor without adding terrain meshes or
	# hundreds of collision shapes.
	_ground_patch(Vector3(-64, 0.015, 202), Vector3(94, 0.035, 58), Color("8a9d68"), -0.08)
	_ground_patch(Vector3(64, 0.018, 246), Vector3(96, 0.04, 72), Color("7f9663"), 0.12)
	_ground_patch(Vector3(0, 0.02, 349), Vector3(172, 0.04, 92), Color("6f8658"), -0.04)

func _path_segment(from: Vector3, to: Vector3, width: float = 8.0) -> void:
	var delta := to - from
	var middle := (from + to) * 0.5 + Vector3(0, 0.025, 0)
	var length := delta.length() + 2.0
	var yaw := atan2(delta.x, delta.z)
	_ground_patch(middle, Vector3(width, 0.08, length), Color("c7a66e"), yaw)
	# A darker, narrower center keeps the route readable from the gate without
	# looking like a straight paved road.
	_ground_patch(middle + Vector3(0, 0.045, 0), Vector3(width * 0.72, 0.025, length - 0.8), Color("b8905c"), yaw)

func _build_path() -> void:
	var points: Array[Vector3] = [
		Vector3(0, 0, 164), Vector3(0, 0, 187), Vector3(8, 0, 211),
		Vector3(3, 0, 237), Vector3(-8, 0, 262), Vector3(-5, 0, 286),
		Vector3(1, 0, 312), Vector3(14, 0, 338), Vector3(7, 0, 367),
		Vector3(-5, 0, 395), Vector3(0, 0, 418),
	]
	for index in range(points.size() - 1):
		_path_segment(points[index], points[index + 1], 8.4 if index < 5 else 9.2)
	# Small side trails branch toward the woods and the future mission areas.
	_path_segment(Vector3(4, 0, 238), Vector3(48, 0, 270), 5.0)
	_path_segment(Vector3(-7, 0, 278), Vector3(-55, 0, 300), 5.0)
	_path_segment(Vector3(3, 0, 335), Vector3(-52, 0, 350), 4.5)

func _build_plain() -> void:
	# Low vegetation is instanced through a bounded deterministic list: enough
	# life near the path, never a repetitive grid.
	var shrubs: Array[Vector3] = [
		Vector3(-42, 0, 178), Vector3(38, 0, 182), Vector3(-58, 0, 207),
		Vector3(53, 0, 219), Vector3(-36, 0, 232), Vector3(45, 0, 242),
		Vector3(-68, 0, 251), Vector3(72, 0, 258), Vector3(-42, 0, 270),
		Vector3(61, 0, 286), Vector3(-76, 0, 294), Vector3(76, 0, 307),
	]
	for point in shrubs:
		_sphere(point + Vector3(0, 0.25, 0), 0.75, 0.7, Color("496b42"), true)
		_cylinder(0.045, 0.5, point + Vector3(0, 0.25, 0), Color("436139"), 6, false, true)
	# Natural stones and small rises around the open zone.
	for data: Array in [
		[Vector3(-83, 0.2, 190), Vector3(2.2, 0.8, 1.5)],
		[Vector3(69, 0.25, 202), Vector3(2.6, 0.9, 1.8)],
		[Vector3(-72, 0.18, 238), Vector3(1.8, 0.7, 1.2)],
		[Vector3(82, 0.2, 274), Vector3(2.5, 1.0, 1.7)],
		[Vector3(-69, 0.25, 318), Vector3(3.0, 1.1, 2.0)],
	]:
		var point: Vector3 = data[0]
		var dimensions: Vector3 = data[1]
		_box(dimensions, point, Color("756b5b"), true, Vector3(0, float(point.x) * 0.03, 0), true)
	# A few rural silhouettes remain far from the mission path.
	for point in [Vector3(-98, 0, 186), Vector3(99, 0, 227), Vector3(-103, 0, 283)]:
		_tree(point, 1.0, false)

func _build_stream_and_bridge() -> void:
	var stream_points: Array[Vector3] = [
		Vector3(-31, 0.08, 184), Vector3(-23, 0.08, 207), Vector3(-12, 0.08, 229),
		Vector3(-18, 0.08, 252), Vector3(-29, 0.08, 276),
	]
	var water_material := _mat(Color.WHITE, true)
	water_material.albedo_texture = RIVER_ART
	water_material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	water_material.texture_repeat = true
	for index in range(stream_points.size() - 1):
		var from := stream_points[index]
		var to := stream_points[index + 1]
		var delta := to - from
		var water := MeshInstance3D.new()
		var quad := QuadMesh.new()
		quad.size = Vector2(3.2, delta.length() + 1.6)
		water.mesh = quad
		water.position = (from + to) * 0.5
		water.rotation = Vector3(-PI * 0.5, atan2(delta.x, delta.z), 0)
		water.material_override = water_material
		water.visibility_range_end = 180.0
		water.visibility_range_end_margin = 12.0
		add_child(water)
	# The main route crosses the stream around z=229. The deck is solid while
	# the water underneath remains a visual plane over the walkable ground.
	var deck := _box(Vector3(7.0, 0.28, 5.2), Vector3(-10, 0.25, 229), Color("9a6648"), true, Vector3(0, 0.45, 0))
	for side in [-1.0, 1.0]:
		_box(Vector3(0.14, 0.75, 5.4), Vector3(-10 + side * 3.0, 0.7, 229), Color("644332"), false, Vector3(0, 0.45, 0))
	_ground_patch(Vector3(-10, 0.015, 229), Vector3(5.0, 0.04, 2.6), Color("a77752"), 0.45)
	deck.visibility_range_end = 180.0

func _tree(point: Vector3, scale_value: float = 1.0, solid: bool = false) -> void:
	var trunk := _cylinder(0.28 * scale_value, 3.1 * scale_value, point + Vector3(0, 1.55 * scale_value, 0), Color("4b3827"), 8, solid, true)
	var body := trunk.get_node_or_null("Solid") as StaticBody3D
	if body != null:
		body.set_meta("exterior_distance_lod", true)
	var crown := _sphere(point + Vector3(0, 3.55 * scale_value, 0), 1.75 * scale_value, 3.5 * scale_value, Color("426b43"), true)
	_sphere(point + Vector3(0.48 * scale_value, 4.6 * scale_value, -0.2), 1.15 * scale_value, 2.3 * scale_value, Color("527b49"), true)
	crown.visibility_range_end = 170.0

func _build_forest() -> void:
	# The forest grows denser away from the gate but leaves several readable
	# passages and a broad central clearing for future team combat.
	var trees: Array[Array] = [
		[Vector3(-91, 0, 247), 1.15, true], [Vector3(-73, 0, 259), 0.9, true],
		[Vector3(-102, 0, 276), 1.25, false], [Vector3(-58, 0, 281), 1.0, true],
		[Vector3(-86, 0, 302), 1.3, true], [Vector3(-64, 0, 319), 0.95, true],
		[Vector3(-96, 0, 337), 1.2, false], [Vector3(-73, 0, 348), 1.1, true],
		[Vector3(-103, 0, 371), 1.3, false], [Vector3(-78, 0, 389), 1.0, true],
		[Vector3(86, 0, 242), 1.15, true], [Vector3(69, 0, 256), 0.95, true],
		[Vector3(104, 0, 272), 1.25, false], [Vector3(54, 0, 286), 1.0, true],
		[Vector3(91, 0, 303), 1.3, true], [Vector3(68, 0, 326), 1.0, true],
		[Vector3(101, 0, 344), 1.25, false], [Vector3(78, 0, 360), 1.1, true],
		[Vector3(105, 0, 383), 1.3, false], [Vector3(72, 0, 397), 1.0, true],
	]
	for item: Array in trees:
		_tree(item[0] as Vector3, float(item[1]), bool(item[2]))
	# Roots and rocks make the forest readable without closing every passage.
	for data: Array in [
		[Vector3(-45, 0.3, 292), Vector3(3.2, 0.7, 1.1)],
		[Vector3(46, 0.25, 292), Vector3(2.8, 0.8, 1.3)],
		[Vector3(-38, 0.3, 344), Vector3(3.5, 0.8, 1.4)],
		[Vector3(43, 0.3, 355), Vector3(3.3, 0.9, 1.5)],
	]:
		var point: Vector3 = data[0]
		var dimensions: Vector3 = data[1]
		_box(dimensions, point, Color("665b4c"), true, Vector3(0, point.z * 0.02, 0), true)

func _build_ambush_clearing() -> void:
	# A natural open glade, not an arena: the forest ring and minor obstacles
	# leave several approaches and a broad space for three players plus enemies.
	_cylinder(21.0, 0.05, AMBUSH_ZONE + Vector3(0, -0.02, 0), Color("6f8d55"), 24, false, false)
	_ground_patch(AMBUSH_ZONE + Vector3(0, 0.02, 0), Vector3(31, 0.035, 23), Color("7e9b61"), 0.08)
	for point in [Vector3(-27, 0.2, 309), Vector3(26, 0.25, 322), Vector3(-30, 0.2, 329), Vector3(30, 0.2, 300)]:
		_box(Vector3(2.6, 0.8, 1.8), point, Color("716657"), true, Vector3(0, point.x * 0.04, 0), true)
	for point in [Vector3(-34, 0, 296), Vector3(35, 0, 301), Vector3(-41, 0, 327), Vector3(40, 0, 334)]:
		_tree(point, 0.92, true)
	# A neutral center marker remains available to future mission systems.
	_mission_marker("AmbushCenter", AMBUSH_ZONE)

func _build_distant_mountains() -> void:
	var ridges: Array[Array] = [
		[Vector3(-104, 0, 416), 24.0, 26.0], [Vector3(-61, 0, 425), 31.0, 34.0],
		[Vector3(-10, 0, 434), 37.0, 40.0], [Vector3(42, 0, 426), 29.0, 32.0],
		[Vector3(91, 0, 414), 23.0, 25.0],
	]
	for item: Array in ridges:
		var point: Vector3 = item[0]
		var radius: float = float(item[1])
		var height: float = float(item[2])
		var mountain := MeshInstance3D.new()
		var mesh := CylinderMesh.new()
		mesh.top_radius = radius * 0.18
		mesh.bottom_radius = radius
		mesh.height = height
		mesh.radial_segments = 7
		mountain.mesh = mesh
		mountain.position = point + Vector3(0, height * 0.5, 0)
		mountain.material_override = _mat(Color("657260"))
		mountain.visibility_range_end = 430.0
		mountain.visibility_range_end_margin = 18.0
		add_child(mountain)
	# Far foothills close the playable region with a visible, collidable ridge.
	_box(Vector3(248, 14, 5), Vector3(0, 6.8, REGION_FAR_Z + 1.0), Color("5f6c59"), true)

func _build_boundaries() -> void:
	# Side cliffs and a rear ridge look like natural terrain rather than invisible
	# map walls. The player remains inside the first, deliberately bounded region.
	_box(Vector3(5, 12, 256), Vector3(REGION_MIN_X - 1.0, 6, 292), Color("64715d"), true)
	_box(Vector3(5, 12, 256), Vector3(REGION_MAX_X + 1.0, 6, 292), Color("64715d"), true)
	# A few foreground rock faces blend the side limits into the forest edge.
	for point in [Vector3(-124, 2, 228), Vector3(124, 2, 252), Vector3(-124, 3, 337), Vector3(124, 3, 367)]:
		_box(Vector3(4.0, 4.5, 11.0), point, Color("6a7461"), true, Vector3(0, point.x * 0.01, 0), false)

func _mission_marker(name: String, point: Vector3) -> Marker3D:
	var marker := Marker3D.new()
	marker.name = name
	marker.position = point
	marker.set_meta("mission_zone", name)
	add_child(marker)
	mission_markers[name] = marker
	return marker

func _mission_zone(name: String, point: Vector3, radius: float) -> void:
	var area := Area3D.new()
	area.name = name
	area.position = point
	area.collision_layer = 0
	area.collision_mask = 2
	area.monitorable = false
	var shape := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = radius
	shape.shape = sphere
	area.add_child(shape)
	add_child(area)
	_mission_marker(name + "Spawn", point)

func _build_mission_zones() -> void:
	_mission_zone("ZoneA_KonohaExit", Vector3(0, 0.3, 164), 8.0)
	_mission_zone("ZoneB_MainPath", PLAIN_ZONE, 16.0)
	_mission_zone("ZoneC_Forest", FOREST_ZONE, 23.0)
	_mission_zone("ZoneD_Ambush", AMBUSH_ZONE, 21.0)
	_mission_zone("ZoneE_Continuation", CONTINUATION_ZONE, 20.0)

func _zone_trigger(name: String, point: Vector3, size: Vector3) -> Area3D:
	var area := Area3D.new()
	area.name = name
	area.position = point
	area.collision_layer = 0
	area.collision_mask = 2
	area.monitorable = false
	var shape := CollisionShape3D.new()
	var prism := BoxShape3D.new()
	prism.size = size
	shape.shape = prism
	area.add_child(shape)
	add_child(area)
	return area

func _build_spawns_and_triggers() -> void:
	# Markers are fallback points only. Normal travel across the gate is
	# continuous and never assigns one of these positions.
	interior_spawn = _mission_marker("KonohaInteriorSpawn", INTERIOR_KONOHA_SPAWN)
	exterior_spawn = _mission_marker("KonohaExteriorSpawn", EXTERIOR_SPAWN)
	return_spawn = _mission_marker("KonohaReturnSpawn", KONOHA_RETURN_SPAWN)
	exit_trigger = _zone_trigger("KonohaExitTrigger", Vector3(0, 1.0, 160.2), Vector3(11.5, 2.2, 0.7))
	return_trigger = _zone_trigger("KonohaReturnTrigger", Vector3(0, 1.0, 165.2), Vector3(11.5, 2.2, 0.7))
	exit_trigger.body_entered.connect(_on_exit_body)
	return_trigger.body_entered.connect(_on_return_body)

func _on_exit_body(body: Node3D) -> void:
	if body == player and not outside:
		pending_exit = true

func _on_return_body(body: Node3D) -> void:
	if body == player and outside:
		pending_return = true

func update(point: Vector3, delta: float) -> void:
	if not built:
		return
	transition_lock = maxf(0.0, transition_lock - delta)
	if transition_lock <= 0.0:
		if not outside and pending_exit and point.z >= GATE_Z:
			_set_outside(true)
		elif outside and pending_return and point.z <= GATE_Z:
			_set_outside(false)
		elif not outside and point.z > REGION_START_Z and absf(point.x) <= GATE_LANE_HALF_WIDTH:
			_set_outside(true)
		elif outside and point.z < GATE_Z and absf(point.x) <= GATE_LANE_HALF_WIDTH:
			_set_outside(false)
	pending_exit = false
	if not outside:
		pending_return = false

func _set_outside(value: bool) -> void:
	outside = value
	transition_lock = 0.75
	pending_exit = false
	pending_return = false
	if value:
		left_konoha.emit()
	else:
		returned_to_konoha.emit()

func _cache_collision_bodies() -> void:
	collision_lod_bodies.clear()
	for node: Node in find_children("*", "StaticBody3D", true, false):
		var body := node as StaticBody3D
		if body != null and body.has_meta("exterior_distance_lod"):
			collision_lod_bodies.append(body)

func _process(delta: float) -> void:
	if not is_instance_valid(player):
		return
	collision_lod_clock += delta
	if collision_lod_clock < 0.45:
		return
	collision_lod_clock = 0.0
	_update_collision_lod(false)

func _update_collision_lod(force: bool) -> void:
	if not is_instance_valid(player):
		return
	var focus := player.global_position
	for body: StaticBody3D in collision_lod_bodies:
		if not is_instance_valid(body):
			continue
		if not force and body.global_position.distance_squared_to(focus) > LOD_FAR_DISTANCE * LOD_FAR_DISTANCE:
			body.collision_layer = 0
		elif body.global_position.distance_squared_to(focus) < LOD_NEAR_DISTANCE * LOD_NEAR_DISTANCE:
			body.collision_layer = 1

func clamp_player(body: TrainingFighter) -> void:
	if not is_instance_valid(body) or not outside:
		return
	if absf(body.position.x) > REGION_MAX_X - 3.0:
		body.position.x = clampf(body.position.x, REGION_MIN_X + 3.0, REGION_MAX_X - 3.0)
		body.velocity.x = 0.0
	if body.position.z > REGION_FAR_Z - 3.0:
		body.position.z = REGION_FAR_Z - 3.0
		body.velocity.z = 0.0
