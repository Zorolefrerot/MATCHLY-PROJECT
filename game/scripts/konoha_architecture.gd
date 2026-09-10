class_name KonohaArchitecture
extends Node3D
## Curved shared-material architecture; owner images are prepared offline.
const TEXTURES: Dictionary = {
	"plaster": preload("res://assets/konoha/plaster.png"),
	"red": preload("res://assets/konoha/palace_red.png"),
	"tiles": preload("res://assets/konoha/roof_tiles.png"),
	"gold": preload("res://assets/konoha/roof_gold.png"),
	"stone": preload("res://assets/konoha/stone.png"),
	"details": preload("res://assets/konoha/details_atlas.png"),
	"faces": preload("res://assets/konoha/hokage_cliff.png")
}
var materials: Dictionary = {}
var house_count: int = 0
var palace_built: bool = false
var cliff: MeshInstance3D
var curved_meshes: int = 0
var details: MeshInstance3D
var detail_vertices := PackedVector3Array()
var detail_normals := PackedVector3Array()
var detail_uv := PackedVector2Array()

func _ready() -> void:
	for key: String in TEXTURES:
		var mat := TrainingFighter.material(Color.WHITE, key == "faces")
		mat.albedo_texture = TEXTURES[key]
		mat.diffuse_mode = BaseMaterial3D.DIFFUSE_LAMBERT
		mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		if key in ["details", "faces"]:
			mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
			mat.alpha_scissor_threshold = 0.45
			mat.texture_repeat = false
			mat.cull_mode = BaseMaterial3D.CULL_DISABLED
		materials[key] = mat
	materials["green"] = materials["plaster"].duplicate()
	materials["green"].albedo_color = Color(0.76,0.85,0.66)
	materials["red"].albedo_color = Color(0.94,0.85,0.84)
	materials["wood"] = TrainingFighter.material(Color("716047"))
	materials["trim"] = TrainingFighter.material(Color("dbd1b3"))
	materials["glass"] = TrainingFighter.material(Color("304e50"))

func _mesh(vertices: PackedVector3Array, normals: PackedVector3Array, uv: PackedVector2Array, mat: Material, point: Vector3 = Vector3.ZERO) -> MeshInstance3D:
	var arrays: Array = []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_NORMAL] = normals
	arrays[Mesh.ARRAY_TEX_UV] = uv
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.material_override = mat
	node.position = point
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(node)
	return node

func _point(radius: float, height: float, angle: float, stretch: Vector2) -> Vector3:
	return Vector3(sin(angle)*radius*stretch.x, height, cos(angle)*radius*stretch.y)

func _normal(profile: Array[Vector2], ring: int, angle: float, stretch: Vector2) -> Vector3:
	var slope: Vector2 = profile[mini(ring+1,profile.size()-1)] - profile[maxi(0,ring-1)]
	return Vector3(sin(angle)*slope.y/stretch.x, -slope.x, cos(angle)*slope.y/stretch.y).normalized()

func lathe(profile: Array[Vector2], point: Vector3, stretch: Vector2, mat: Material, repeat: Vector2 = Vector2(4,1), solid: bool = false, segments: int = 32) -> MeshInstance3D:
	var vertices := PackedVector3Array()
	var normals := PackedVector3Array()
	var uv := PackedVector2Array()
	var distances: Array[float] = [0.0]
	for j in range(1,profile.size()):
		distances.append(distances[-1] + profile[j].distance_to(profile[j-1]))
	for j in range(profile.size()-1):
		for i in range(segments):
			var a: float = float(i)*TAU/segments
			var b: float = float(i+1)*TAU/segments
			var quad: Array[Vector3] = [_point(profile[j].x,profile[j].y,a,stretch),_point(profile[j+1].x,profile[j+1].y,a,stretch),_point(profile[j+1].x,profile[j+1].y,b,stretch),_point(profile[j].x,profile[j].y,b,stretch)]
			var norms: Array[Vector3] = [_normal(profile,j,a,stretch),_normal(profile,j+1,a,stretch),_normal(profile,j+1,b,stretch),_normal(profile,j,b,stretch)]
			var u0: float = float(i)/segments*repeat.x
			var u1: float = float(i+1)/segments*repeat.x
			var v0: float = (1.0-distances[j]/distances[-1])*repeat.y
			var v1: float = (1.0-distances[j+1]/distances[-1])*repeat.y
			var tex: Array[Vector2] = [Vector2(u0,v0),Vector2(u0,v1),Vector2(u1,v1),Vector2(u1,v0)]
			for index in [0,1,2,0,2,3]:
				vertices.append(quad[index]); normals.append(norms[index]); uv.append(tex[index])
	var node: MeshInstance3D = _mesh(vertices,normals,uv,mat,point)
	curved_meshes += 1
	if solid:
		var hull := PackedVector3Array()
		for ring in profile:
			for i in range(16):
				hull.append(_point(ring.x,ring.y,float(i)*TAU/16,stretch))
		var shape := ConvexPolygonShape3D.new()
		shape.points = hull
		var collision := CollisionShape3D.new()
		collision.shape = shape
		var body := StaticBody3D.new()
		body.collision_layer = 1
		body.collision_mask = 0
		body.add_child(collision)
		node.add_child(body)
	return node

func _wall(radius: float, low: float, high: float, point: Vector3, stretch: Vector2, mat: Material) -> MeshInstance3D:
	return lathe([Vector2(radius,low),Vector2(radius,high)],point,stretch,mat,Vector2(4,1),true)

func _panel(point: Vector3, size: Vector2, angle: float, cell: Vector2i) -> void:
	var right := Vector3(cos(angle),0,-sin(angle))
	var up := Vector3.UP
	var normal := Vector3(sin(angle),0,cos(angle))
	var corners: Array[Vector3] = [-right*size.x/2-up*size.y/2, -right*size.x/2+up*size.y/2, right*size.x/2+up*size.y/2, right*size.x/2-up*size.y/2]
	var rect := Rect2(Vector2(cell)*0.5,Vector2(0.5,0.5))
	var coords: Array[Vector2] = [rect.position+Vector2(0,rect.size.y),rect.position,rect.end-Vector2(0,rect.size.y),rect.end]
	for i in [0,1,2,0,2,3]:
		detail_vertices.append(corners[i]+point)
		detail_normals.append(normal)
		detail_uv.append(coords[i])

func finish() -> void:
	# All facade details share one mesh/draw surface instead of 154 objects.
	details = _mesh(detail_vertices,detail_normals,detail_uv,materials["details"])
	detail_vertices.clear(); detail_normals.clear(); detail_uv.clear()

func _windows(point: Vector3, radius: float, stretch: Vector2, height: float, count: int, size: Vector2, cell: Vector2i, omit_door: bool = false) -> void:
	for i in range(count):
		if omit_door and i == 0:
			continue
		var angle: float = float(i)*TAU/count
		var normal := Vector3(sin(angle)/stretch.x,0,cos(angle)/stretch.y).normalized()
		var position: Vector3 = point + _point(radius,height,angle,stretch) + normal*0.06
		_panel(position,size,atan2(normal.x,normal.z),cell)

func house(point: Vector3, upper_green: bool = true) -> void:
	house_count += 1
	var stretch := Vector2(1,0.875)
	_wall(4.0,-0.04,3.12,point,stretch,materials["plaster"])
	lathe([Vector2(3.98,0.05),Vector2(4.13,0.10),Vector2(4.13,0.28),Vector2(3.98,0.32)],point,stretch,materials["stone"])
	lathe([Vector2(3.96,3.03),Vector2(4.28,3.07),Vector2(4.48,3.22),Vector2(4.20,3.40),Vector2(3.15,4.25)],point,stretch,materials["tiles"],Vector2(7,1.2))
	_wall(3.13,3.98,6.03,point,stretch,materials["green"] if upper_green else materials["plaster"])
	lathe([Vector2(3.10,5.92),Vector2(3.50,6.02),Vector2(3.66,6.18),Vector2(3.36,6.36),Vector2(2.55,7.02),Vector2(0,7.02)],point,stretch,materials["tiles"],Vector2(6,1.1))
	lathe([Vector2(3.18,4.01),Vector2(3.18,4.16)],point,stretch,materials["wood"])
	_windows(point,4.0,stretch,1.85,10,Vector2(1.15,1.38),Vector2i(1,0),true)
	_windows(point,3.13,stretch,5.03,9,Vector2(1.08,1.20),Vector2i(0,0))
	_panel(point+Vector3(0,1.17,3.57),Vector2(1.55,2.42),0,Vector2i(0,1))
	for offset in [Vector3(-0.8,0,0.4),Vector3(0.6,0,-0.2)]:
		lathe([Vector2(0.27,6.7),Vector2(0.27,7.85),Vector2(0.33,7.85),Vector2(0.33,7.99)],point+offset,Vector2.ONE,materials["stone"],Vector2.ONE,false,12)

func palace(point: Vector3) -> void:
	palace_built = true
	# Lower rounded wings frame the central red drum, matching the reference.
	for x in [-7.0,7.0]:
		var wing: Vector3 = point+Vector3(x,0,-1.3)
		_wall(3.0,0,3.4,wing,Vector2(1,1.2),materials["red"])
		lathe([Vector2(2.96,3.2),Vector2(3.45,3.3),Vector2(3.6,3.48),Vector2(2.45,4.35),Vector2(0,4.35)],wing,Vector2(1,1.2),materials["gold"],Vector2(5,1))
		_windows(wing,3.0,Vector2(1,1.2),2.15,10,Vector2(0.42,0.85),Vector2i(1,0))
	_wall(5.4,-0.03,9.15,point,Vector2.ONE,materials["red"])
	lathe([Vector2(5.4,2.9),Vector2(5.75,2.94),Vector2(6.05,3.12),Vector2(5.45,3.88)],point,Vector2.ONE,materials["gold"],Vector2(10,0.8))
	lathe([Vector2(5.4,8.8),Vector2(5.8,8.85),Vector2(6.05,9.05),Vector2(5.45,9.42),Vector2(4.6,10.10)],point,Vector2.ONE,materials["gold"],Vector2(10,1.1))
	_wall(4.57,9.9,11.2,point,Vector2.ONE,materials["red"])
	lathe([Vector2(4.58,11.12),Vector2(4.8,11.20),Vector2(4.8,11.42),Vector2(0,11.42)],point,Vector2.ONE,materials["trim"])
	for y in [6.65,7.65]:
		_windows(point,5.4,Vector2.ONE,y,28,Vector2(0.31,0.65),Vector2i(1,0))
	_panel(point+Vector3(0,1.40,5.48),Vector2(2.6,2.9),0,Vector2i(0,1))
	_panel(point+Vector3(0,10.61,4.65),Vector2(1.7,1.5),0,Vector2i(1,1))
	# Entry canopy and supports (only the exterior is accessible).
	for x in [-2.0,2.0]:
		lathe([Vector2(0.23,0),Vector2(0.23,3.1)],point+Vector3(x,0,6.0),Vector2.ONE,materials["trim"],Vector2.ONE,true,12)
	var canopy := MeshInstance3D.new()
	var canopy_mesh := PrismMesh.new()
	canopy_mesh.size = Vector3(5.1,0.9,2.4)
	canopy.mesh = canopy_mesh
	canopy.position = point+Vector3(0,3.32,5.95)
	canopy.material_override = materials["gold"]
	add_child(canopy)
	for x in [-2.8,2.8]:
		for z in [-2.8,2.8]:
			lathe([Vector2(0.18,11.35),Vector2(0.15,12.65),Vector2(0.08,13.75)],point+Vector3(x,0,z),Vector2.ONE,materials["trim"],Vector2.ONE,false,12)

func monument() -> void:
	# A shallow fixed world-space ribbon, not a camera-facing billboard or a sky photo.
	# Its proportions restore the 382x225 source crop stored as a square texture.
	var vertices := PackedVector3Array(); var normals := PackedVector3Array(); var uv := PackedVector2Array()
	var width: float = 52.0
	var height: float = width*225.0/382.0
	for i in range(8):
		var u0: float = float(i)/8
		var u1: float = float(i+1)/8
		var x0: float = (u0-0.5)*width
		var x1: float = (u1-0.5)*width
		var z0: float = -56.0 - absf(x0)*0.065
		var z1: float = -56.0 - absf(x1)*0.065
		var corners: Array[Vector3] = [Vector3(x0,11,z0),Vector3(x0,11+height,z0),Vector3(x1,11+height,z1),Vector3(x1,11,z1)]
		var coords: Array[Vector2] = [Vector2(u0,1),Vector2(u0,0),Vector2(u1,0),Vector2(u1,1)]
		for index in [0,1,2,0,2,3]:
			vertices.append(corners[index]); normals.append(Vector3.BACK); uv.append(coords[index])
	cliff = _mesh(vertices,normals,uv,materials["faces"])
	# Rock volumes hide the card's lower and side edges, without claiming sculpted faces.
	lathe([Vector2(27,0),Vector2(27,12),Vector2(25,17),Vector2(0,18)],Vector3(0,0,-61.5),Vector2(1,0.12),materials["stone"],Vector2(7,2),false,24)
	for x in [-29.0,29.0]:
		lathe([Vector2(4.5,0),Vector2(5.2,14),Vector2(4.3,27),Vector2(2.1,33),Vector2(0,34)],Vector3(x,0,-59.5),Vector2(1,0.6),materials["stone"],Vector2(3,4),false,9)
