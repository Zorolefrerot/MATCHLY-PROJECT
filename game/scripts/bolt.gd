class_name TrainingBolt
extends Node3D
## Three batched ribbon meshes: blue halo, cyan channel, white-hot core.
## All branching is cosmetic; the gameplay ray determines the real endpoint.
const LIFETIME: float = 0.85
var endpoint: Vector3 = Vector3.FORWARD
var standard: bool = false
var seed_value: int = 1
var age: float = 0.0
var redraws: int = 0
var layers: Array[MeshInstance3D] = []
var strokes: Array[PackedVector3Array] = []
var widths: Array[float] = []
var rng := RandomNumberGenerator.new()

func _ready() -> void:
	rng.seed = seed_value
	for i in range(3):
		var layer := MeshInstance3D.new()
		var material := StandardMaterial3D.new()
		material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		material.cull_mode = BaseMaterial3D.CULL_DISABLED
		material.blend_mode = BaseMaterial3D.BLEND_MODE_ADD if i < 2 else BaseMaterial3D.BLEND_MODE_MIX
		material.no_depth_test = false
		material.render_priority = i
		layer.material_override = material
		layer.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(layer)
		layers.append(layer)
	_rebuild()
	_fade()

func _process(delta: float) -> void:
	age += delta
	# Three shapes per bolt maximum, not continuous geometry allocation.
	if redraws < 3 and age >= float(redraws)*0.065:
		_rebuild()
	_fade()

func _basis_side(direction: Vector3) -> Vector3:
	var side := direction.cross(Vector3.UP)
	if side.length_squared() < 0.01:
		side = direction.cross(Vector3.RIGHT)
	return side.normalized()

func _jagged(a: Vector3, b: Vector3, count: int, jitter: float) -> PackedVector3Array:
	var points := PackedVector3Array([a])
	var direction: Vector3 = (b-a).normalized()
	var side: Vector3 = _basis_side(direction)
	var up: Vector3 = side.cross(direction).normalized()
	for i in range(1, count):
		var t: float = float(i)/float(count)
		points.append(a.lerp(b,t) + side*rng.randf_range(-jitter,jitter) + up*rng.randf_range(-jitter,jitter))
	points.append(b)
	return points

func _rebuild() -> void:
	redraws += 1
	strokes.clear()
	widths.clear()
	if endpoint.length_squared() < 0.0001:
		return
	var direction := endpoint.normalized()
	var side: Vector3 = _basis_side(direction)
	var up: Vector3 = side.cross(direction).normalized()
	var count: int = 16 if standard else 11
	var main: PackedVector3Array = _jagged(Vector3.ZERO, endpoint, count, 0.22)
	strokes.append(main)
	widths.append(1.0)
	var branch_count: int = 5 if standard else 3
	for i in range(branch_count):
		var index: int = 2 + int(float(i+1)/float(branch_count+1)*float(count-3))
		var start: Vector3 = main[index]
		var sign_side: float = -1.0 if i % 2 == 0 else 1.0
		var end: Vector3 = start + side*sign_side*rng.randf_range(0.5,0.9) + up*rng.randf_range(-0.55,0.55) + direction*0.4
		strokes.append(_jagged(start, end, 4, 0.13))
		widths.append(0.5)
	# Small electrical coronas at the casting hand and the endpoint, not a big flash.
	for anchor in [Vector3.ZERO, endpoint]:
		for i in range(4 if standard else 3):
			var angle: float = float(i)*TAU/3.0 + rng.randf()
			var radius: float = 0.3 if anchor == Vector3.ZERO else 0.6
			var tip: Vector3 = anchor + side*cos(angle)*radius + up*sin(angle)*radius
			strokes.append(_jagged(anchor, tip, 3, 0.07))
			widths.append(0.45)
	for i in range(layers.size()):
		layers[i].mesh = _ribbon_mesh([0.14, 0.070, 0.024][i])

func _ribbon_mesh(width: float) -> ArrayMesh:
	var vertices := PackedVector3Array()
	for j in range(strokes.size()):
		var points: PackedVector3Array = strokes[j]
		for i in range(points.size()-1):
			var a: Vector3 = points[i]
			var b: Vector3 = points[i+1]
			var direction: Vector3 = (b-a).normalized()
			var side: Vector3 = _basis_side(direction)
			var up: Vector3 = side.cross(direction).normalized()
			# Crossed ribbons stay visible even when the camera looks along the ray.
			for normal in [side, up]:
				var offset: Vector3 = normal * width * widths[j]
				vertices.append_array(PackedVector3Array([a-offset,a+offset,b+offset,a-offset,b+offset,b-offset]))
	var arrays: Array = []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	var result := ArrayMesh.new()
	if not vertices.is_empty():
		result.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return result

func _fade() -> void:
	var fade: float = 1.0-smoothstep(0.18, LIFETIME, age)
	var colors: Array[Color] = [Color(0.12,0.37,1,0.18), Color(0.28,0.8,1,0.65), Color(0.91,0.98,1,0.98)]
	for i in range(layers.size()):
		var color: Color = colors[i]
		color.a *= fade
		var material: StandardMaterial3D = layers[i].material_override
		material.albedo_color = color
