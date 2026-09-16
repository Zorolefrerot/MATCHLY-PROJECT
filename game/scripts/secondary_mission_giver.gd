class_name SecondaryMissionGiver
extends KonohaNPC
## Fixed village actor with a small red attention orb. It never walks or owns
## quest state; the manager updates the marker from the server snapshot.
var mission_marker: MeshInstance3D
var marker_material: StandardMaterial3D
var marker_enabled: bool = false
var pulse_clock: float = 0.0

func configure_giver(kind: String, title: String, start: Vector3, tint: Color) -> void:
	configure(kind, title, start, [start], tint, "discussion", 0.0)
	_build_marker()

func _build_marker() -> void:
	var mesh := SphereMesh.new()
	mesh.radius = 0.13
	mesh.height = 0.26
	mesh.radial_segments = 8
	mesh.rings = 4
	marker_material = StandardMaterial3D.new()
	marker_material.albedo_color = Color("f0444b")
	marker_material.emission_enabled = true
	marker_material.emission = Color("ff2f3d")
	marker_material.emission_energy_multiplier = 1.4
	marker_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	marker_material.albedo_color.a = 0.95
	mission_marker = MeshInstance3D.new()
	mission_marker.name = "SecondaryMissionRedMarker"
	mission_marker.mesh = mesh
	mission_marker.position = Vector3(0, 2.68, 0)
	mission_marker.material_override = marker_material
	mission_marker.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mission_marker.visibility_range_end = 96.0
	mission_marker.visibility_range_end_margin = 8.0
	mission_marker.visible = false
	add_child(mission_marker)

func set_mission_available(value: bool) -> void:
	marker_enabled = value
	if is_instance_valid(mission_marker):
		mission_marker.visible = value

func _process(delta: float) -> void:
	super(delta)
	pulse_clock += delta
	if not marker_enabled or not is_instance_valid(mission_marker):
		return
	var pulse := 1.0 + 0.10 * sin(pulse_clock * 3.0)
	mission_marker.scale = Vector3.ONE * pulse
	mission_marker.position.y = 2.68 + 0.035 * sin(pulse_clock * 2.2)
