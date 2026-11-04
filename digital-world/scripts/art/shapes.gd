class_name DigitalArt
extends RefCounted
## Shared unit meshes/materials. City decoration is subsequently GPU-instanced.
static var materials: Dictionary = {}
static var meshes: Dictionary = {}
const INK := Color("152b46")
const BLUE := Color("284d72")
const TEAL := Color("45d9c5")
const GOLD := Color("ffcd75")
const CORAL := Color("f89477")
const PALE := Color("d9eeeb")
const NULL_COLOR := Color("ae63e9")

static func material(color: Color, glow: bool = false) -> StandardMaterial3D:
	var key := color.to_html() + str(glow)
	if not materials.has(key):
		var mat := StandardMaterial3D.new()
		mat.albedo_color = color
		mat.roughness = 0.85
		if glow:
			mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
			mat.emission_enabled = true
			mat.emission = color
		materials[key] = mat
	return materials[key]

static func unit(kind: String) -> PrimitiveMesh:
	if not meshes.has(kind):
		var mesh: PrimitiveMesh
		match kind:
			"sphere":
				var sphere := SphereMesh.new()
				sphere.radius = 0.5
				sphere.height = 1.0
				sphere.radial_segments = 12
				sphere.rings = 6
				mesh = sphere
			"cylinder":
				var cylinder := CylinderMesh.new()
				cylinder.top_radius = 0.5
				cylinder.bottom_radius = 0.5
				cylinder.height = 1.0
				cylinder.radial_segments = 12
				mesh = cylinder
			_:
				mesh = BoxMesh.new()
		meshes[kind] = mesh
	return meshes[kind]

static func shape(parent: Node3D, kind: String, pos: Vector3, size: Vector3, color: Color, glow := false) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.mesh = unit(kind)
	node.material_override = material(color, glow)
	node.position = pos
	node.scale = size
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF if glow else GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	parent.add_child(node)
	return node

static func box(parent: Node3D, pos: Vector3, size: Vector3, color: Color, glow := false) -> MeshInstance3D:
	return shape(parent, "box", pos, size, color, glow)

static func solid(parent: Node3D, pos: Vector3, size: Vector3, color: Color) -> StaticBody3D:
	box(parent, pos, size, color)
	return collider(parent, pos, size)

static func collider(parent: Node3D, pos: Vector3, size: Vector3) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.position = pos
	var collision := CollisionShape3D.new()
	var shape_resource := BoxShape3D.new()
	shape_resource.size = size
	collision.shape = shape_resource
	body.add_child(collision)
	parent.add_child(body)
	return body

static func sign_text(parent: Node3D, pos: Vector3, text: String, color := PALE, size := 32) -> Label3D:
	var label := Label3D.new()
	label.text = text
	label.position = pos
	label.font_size = size
	label.pixel_size = 0.012
	label.modulate = color
	label.outline_size = 3
	label.no_depth_test = false
	parent.add_child(label)
	return label

static func batch(root: Node3D) -> void:
	# All meshes below this static-only root use unit primitives and shared materials.
	var groups: Dictionary = {}
	for child in root.get_children():
		if not child is MeshInstance3D:
			continue
		var key := str(child.mesh.get_instance_id()) + ":" + str(child.material_override.get_instance_id())
		if not groups.has(key):
			groups[key] = []
		groups[key].append(child)
	for group: Array in groups.values():
		var multi := MultiMesh.new()
		multi.transform_format = MultiMesh.TRANSFORM_3D
		multi.mesh = group[0].mesh
		multi.instance_count = group.size()
		var instance := MultiMeshInstance3D.new()
		instance.multimesh = multi
		instance.material_override = group[0].material_override
		instance.cast_shadow = group[0].cast_shadow
		root.add_child(instance)
		for i in group.size():
			multi.set_instance_transform(i, group[i].transform)
			group[i].free()
