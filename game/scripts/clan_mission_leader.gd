class_name ClanMissionLeader
extends Node3D
## Fixed, non-blocking clan chief. Each data row supplies a different outfit,
## silhouette accessory, emblem and idle posture.
var data: Dictionary = {}
var fighter: TrainingFighter
var badge: Label3D
var accessory_root: Node3D
var animation_clock: float = 0.0

func configure(value: Dictionary) -> void:
	data = value.duplicate(true)
	fighter = TrainingFighter.new()
	fighter.name = "LeaderBody"
	add_child(fighter)
	fighter.configure(data["color"], 0, 120)
	fighter.collision_layer = 0
	fighter.collision_mask = 0
	fighter.apply_appearance(data["appearance"])
	fighter.scale = Vector3.ONE * float(data.get("scale", 1.0))
	_build_accessory()
	badge = Label3D.new()
	badge.name = "LeaderName"
	badge.text = "%s\n%s" % [data["leader"], data["clan"]]
	badge.position = Vector3(0, 2.65, 0)
	badge.font_size = 19
	badge.pixel_size = 0.008
	badge.modulate = Color("fff0c9")
	badge.outline_size = 5
	badge.outline_modulate = Color("263b35")
	badge.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(badge)

func _material(color: Color, emissive: bool = false) -> StandardMaterial3D:
	var mat := TrainingFighter.material(color, emissive)
	if emissive:
		mat.emission_enabled = true
		mat.emission = color
		mat.emission_energy_multiplier = 0.8
	return mat

func _part(mesh: PrimitiveMesh, size: Vector3, point: Vector3, color: Color, scale_value: Vector3 = Vector3.ONE) -> void:
	# Keep every chief recognisably human: the common ninja kit is built from
	# small fitted meshes, while the clan accessory only changes the silhouette.
	if mesh is BoxMesh:
		(mesh as BoxMesh).size = size
	elif mesh is CylinderMesh:
		(mesh as CylinderMesh).top_radius = size.x
		(mesh as CylinderMesh).bottom_radius = size.x
		(mesh as CylinderMesh).height = size.y
		(mesh as CylinderMesh).radial_segments = 8
	elif mesh is SphereMesh:
		(mesh as SphereMesh).radius = size.x
		(mesh as SphereMesh).height = size.y * 2.0
		(mesh as SphereMesh).radial_segments = 10
		(mesh as SphereMesh).rings = 5
	elif mesh is TorusMesh:
		(mesh as TorusMesh).inner_radius = size.x * 0.62
		(mesh as TorusMesh).outer_radius = size.x
		(mesh as TorusMesh).rings = 12
		(mesh as TorusMesh).ring_segments = 8
	var item := MeshInstance3D.new()
	item.mesh = mesh
	item.position = point
	item.scale = scale_value
	item.material_override = _material(color)
	accessory_root.add_child(item)

func _build_accessory() -> void:
	accessory_root = Node3D.new()
	accessory_root.name = "ClanSpecificSilhouette"
	fighter.add_child(accessory_root)
	var accent: Color = data["accent"]
	var dark: Color = data["dark"]
	var accessory: String = data["accessory"]
	# Shared headband, belt and shin guards establish a human ninja silhouette
	# for every clan. Colours and the accessory below remain clan-specific.
	_part(BoxMesh.new(), Vector3(0.48, 0.10, 0.055), Vector3(0, 1.72, -0.215), accent)
	_part(BoxMesh.new(), Vector3(0.09, 0.18, 0.06), Vector3(0.22, 1.72, -0.235), dark)
	_part(BoxMesh.new(), Vector3(0.62, 0.10, 0.42), Vector3(0, 0.73, 0), dark)
	_part(BoxMesh.new(), Vector3(0.10, 0.42, 0.12), Vector3(-0.23, 0.40, -0.18), accent)
	_part(BoxMesh.new(), Vector3(0.10, 0.42, 0.12), Vector3(0.23, 0.40, -0.18), accent)
	match accessory:
		"fan":
			_part(CylinderMesh.new(), Vector3(0.46, 0.10, 0.46), Vector3(0,1.25,0.33), accent, Vector3(1.0,1.0,0.35))
			_part(BoxMesh.new(), Vector3(0.08,0.95,0.08), Vector3(0,1.55,0.38), dark)
		"spiral":
			_part(TorusMesh.new(), Vector3(0.42,0.42,0.10), Vector3(0,1.27,-0.32), accent)
			_part(CylinderMesh.new(), Vector3(0.07,0.70,0.07), Vector3(0.0,1.32,0.28), dark)
		"wood":
			for x in [-0.28,0.28]:
				_part(CylinderMesh.new(), Vector3(0.09,1.35,0.09), Vector3(x,1.55,0.18), accent)
			_part(SphereMesh.new(), Vector3(0.24,0.24,0.24), Vector3(0,2.04,0.18), accent)
		"eyes":
			_part(SphereMesh.new(), Vector3(0.10,0.10,0.06), Vector3(-0.17,1.62,-0.28), accent, Vector3(1.0,1.0,0.6))
			_part(SphereMesh.new(), Vector3(0.10,0.10,0.06), Vector3(0.17,1.62,-0.28), accent, Vector3(1.0,1.0,0.6))
		"scroll":
			_part(CylinderMesh.new(), Vector3(0.18,0.72,0.18), Vector3(0.48,1.05,0), accent, Vector3(1.0,1.0,0.55))
			_part(CylinderMesh.new(), Vector3(0.08,0.82,0.08), Vector3(-0.44,1.10,0), dark)
		"flower":
			for angle in range(5):
				_part(SphereMesh.new(), Vector3(0.13,0.13,0.13), Vector3(cos(float(angle)*TAU/5.0)*0.22,1.94,sin(float(angle)*TAU/5.0)*0.22), accent)
		"visor":
			# Aburame distinction is a human tactical visor and shoulder kit,
			# never an insect body or antenna silhouette.
			_part(BoxMesh.new(), Vector3(0.56,0.08,0.06), Vector3(0,1.66,-0.30), accent)
			_part(BoxMesh.new(), Vector3(0.10,0.34,0.16), Vector3(-0.34,1.22,-0.10), dark)
			_part(BoxMesh.new(), Vector3(0.10,0.34,0.16), Vector3(0.34,1.22,-0.10), dark)
		"fangs":
			_part(CylinderMesh.new(), Vector3(0.10,0.50,0.10), Vector3(-0.23,1.56,-0.31), accent)
			_part(CylinderMesh.new(), Vector3(0.10,0.50,0.10), Vector3(0.23,1.56,-0.31), accent)
		"shadow":
			_part(SphereMesh.new(), Vector3(0.72,0.95,0.42), Vector3(0,1.30,0.20), dark)
		"tattoo":
			_part(BoxMesh.new(), Vector3(0.08,0.62,0.04), Vector3(0.22,1.55,-0.31), accent)
			_part(BoxMesh.new(), Vector3(0.08,0.36,0.04), Vector3(0.06,1.42,-0.33), accent)
		"moon":
			_part(TorusMesh.new(), Vector3(0.29,0.29,0.08), Vector3(0,1.28,-0.34), accent)
		"mask":
			_part(BoxMesh.new(), Vector3(0.62,0.50,0.08), Vector3(0,1.52,-0.31), accent)
			_part(BoxMesh.new(), Vector3(0.08,0.44,0.10), Vector3(0,1.52,-0.38), dark)
		"armor":
			_part(BoxMesh.new(), Vector3(1.00,0.48,0.48), Vector3(0,1.14,0.20), dark)
			_part(BoxMesh.new(), Vector3(0.10,0.78,0.12), Vector3(0,1.55,-0.18), accent)
		"blades":
			for side in [-1.0,1.0]:
				_part(BoxMesh.new(), Vector3(0.08,1.05,0.16), Vector3(float(side)*0.60,1.12,0.08), accent, Vector3(1.0,1.0,0.35))

func _process(delta: float) -> void:
	animation_clock += delta
	if not is_instance_valid(fighter):
		return
	var sway := sin(animation_clock * 1.6) * 0.045
	fighter.visual.position.y = sway
	fighter.left_arm.rotation.z = sin(animation_clock * 1.3) * 0.06
	fighter.right_arm.rotation.z = -sin(animation_clock * 1.3) * 0.06
	accessory_root.rotation.y = sin(animation_clock * 0.7) * 0.035
