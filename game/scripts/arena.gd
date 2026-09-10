class_name TrainingArena
extends Node3D
## Low-poly scenery built in code: no ripped models and no online assets.

var sun: DirectionalLight3D

func build() -> void:
	var world := WorldEnvironment.new()
	var environment := Environment.new()
	var sky := Sky.new()
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color("607f82")
	sky_material.sky_horizon_color = Color("e9d9b8")
	sky_material.ground_bottom_color = Color("4d6359")
	sky_material.ground_horizon_color = Color("d6c6a5")
	sky.sky_material = sky_material
	environment.background_mode = Environment.BG_SKY
	environment.sky = sky
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("eee1c5")
	environment.ambient_light_energy = 0.55
	environment.reflected_light_source = Environment.REFLECTION_SOURCE_DISABLED
	world.environment = environment
	add_child(world)
	sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52, -28, 0)
	sun.light_color = Color("fff0d0")
	sun.light_energy = 1.2
	sun.shadow_enabled = false
	add_child(sun)
	box(Vector3(70, 0.4, 70), Vector3(0, -0.3, 0), Color("83926c"), true)
	box(Vector3(38, 0.14, 38), Vector3(0, -0.03, 0), Color("c9b18a"), true)
	# Octagonal practice ring and inlaid markers.
	cylinder(11.5, 0.08, Vector3(0, 0.05, 0), Color("d5bf9a"), 32)
	for i in range(32):
		var angle: float = float(i) * TAU / 32.0
		var mark: MeshInstance3D = box(Vector3(0.15, 0.02, 1.0), Vector3(sin(angle) * 10.8, 0.11, cos(angle) * 10.8), Color("b08b69"))
		mark.rotation.y = angle
	box(Vector3(0.12, 0.025, 3), Vector3(0, 0.12, 0), Color("af6655"))
	box(Vector3(3, 0.025, 0.12), Vector3(0, 0.12, 0), Color("af6655"))
	# Borders have collisions even where the decorative gate is open.
	for point in [Vector3(-20, 1, 0), Vector3(20, 1, 0)]:
		box(Vector3(0.7, 2.0, 41), point, Color("77877c"), true)
	for point in [Vector3(0, 1, -20), Vector3(0, 1, 20)]:
		box(Vector3(41, 2.0, 0.7), point, Color("77877c"), true)
	for side in [-1, 1]:
		for z in [-14, -6, 3, 13]:
			_tree(Vector3(side * 16.4, 0, z))
		for z in [-10, 8]:
			box(Vector3(1.6, 1.0, 2.2), Vector3(side * 12.9, 0.5, z), Color("8d9586"), true)
	# Gate, original pennants and non-interactive practice posts.
	for x in [-4.2, 4.2]:
		box(Vector3(0.55, 4.8, 0.6), Vector3(x, 2.4, 15.4), Color("7c4542"), true)
	box(Vector3(10.2, 0.5, 0.9), Vector3(0, 4.8, 15.4), Color("813f3d"))
	box(Vector3(11.0, 0.20, 1.0), Vector3(0, 5.12, 15.4), Color("354b4d"))
	for x in [-7.5, 7.5]:
		box(Vector3(0.15, 3.5, 0.15), Vector3(x, 1.75, -13), Color("5f5950"))
		box(Vector3(1.0, 1.55, 0.06), Vector3(x + 0.45, 2.55, -13), Color("aa5550"))
		box(Vector3(0.12, 0.75, 0.08), Vector3(x + 0.45, 2.55, -12.96), Color("e6d7b4"))
	for point in [Vector3(-9, 0, -8), Vector3(9, 0, -8), Vector3(-10, 0, 5)]:
		cylinder(0.28, 1.9, point + Vector3(0, 0.95, 0), Color("927154"), 8, true)
		box(Vector3(1.2, 0.17, 0.22), point + Vector3(0, 1.25, 0), Color("927154"))
		box(Vector3(0.30, 0.18, 0.31), point + Vector3(0, 1.75, 0), Color("b2574c"))
	# A few silhouettes imply a village without pretending to be a full Konoha map.
	for x in [-14, -5, 6, 15]:
		var height: float = 5.0 + fmod(absf(float(x)), 3.0)
		box(Vector3(6.0, height, 5.0), Vector3(x, height / 2.0, -25), Color("c1b18b"))
		box(Vector3(7.0, 0.65, 6.0), Vector3(x, height, -25), Color("47666a"))
		for level in range(2):
			box(Vector3(3.8, 0.85, 0.05), Vector3(x, 1.9 + level * 1.9, -22.46), Color("5f7370"))
	var arena_sign := Label3D.new()
	arena_sign.text = "TERRAIN D'ENTRAÎNEMENT"
	arena_sign.font_size = 40
	arena_sign.pixel_size = 0.014
	arena_sign.position = Vector3(0, 4.0, -19.4)
	arena_sign.modulate = Color("f4e6c5")
	add_child(arena_sign)

func box(dimensions: Vector3, point: Vector3, color: Color, solid: bool = false) -> MeshInstance3D:
	var result := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = dimensions
	result.mesh = mesh
	result.position = point
	result.material_override = TrainingFighter.material(color)
	add_child(result)
	if solid:
		var body := StaticBody3D.new()
		body.collision_layer = 1
		body.collision_mask = 0
		var shape := BoxShape3D.new()
		shape.size = dimensions
		var collision := CollisionShape3D.new()
		collision.shape = shape
		body.add_child(collision)
		result.add_child(body)
	return result

func cylinder(radius: float, height: float, point: Vector3, color: Color, segments: int = 12, solid: bool = false) -> MeshInstance3D:
	var result := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = segments
	result.mesh = mesh
	result.position = point
	result.material_override = TrainingFighter.material(color)
	add_child(result)
	if solid:
		var body := StaticBody3D.new()
		body.collision_layer = 1
		body.collision_mask = 0
		var shape := CylinderShape3D.new()
		shape.radius = radius
		shape.height = height
		var collision := CollisionShape3D.new()
		collision.shape = shape
		body.add_child(collision)
		result.add_child(body)
	return result

func _tree(point: Vector3) -> void:
	cylinder(0.3, 3.3, point + Vector3(0, 1.65, 0), Color("766047"), 6, true)
	for offset in [Vector3(0, 3.7, 0), Vector3(-0.9, 3.1, 0.3)]:
		var leaves := MeshInstance3D.new()
		var mesh := SphereMesh.new()
		mesh.radius = 1.8
		mesh.height = 3.0
		mesh.radial_segments = 7
		mesh.rings = 3
		leaves.mesh = mesh
		leaves.position = point + offset
		leaves.material_override = TrainingFighter.material(Color("557a61"))
		add_child(leaves)
