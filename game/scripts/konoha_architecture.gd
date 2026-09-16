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
var sanctuary_count: int = 0
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

func _block(dimensions: Vector3, point: Vector3, mat: Material) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = dimensions
	node.mesh = mesh
	node.position = point
	node.material_override = mat
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(node)
	return node

func _solid_box(dimensions: Vector3, point: Vector3, name: String) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.name = name
	body.position = point
	body.collision_layer = 1
	body.collision_mask = 0
	var shape := BoxShape3D.new()
	shape.size = dimensions
	var collision := CollisionShape3D.new()
	collision.shape = shape
	body.add_child(collision)
	add_child(body)
	return body

func _sphere_part(point: Vector3, scale: Vector3, mat: Material, segments: int = 16) -> MeshInstance3D:
	var sphere := SphereMesh.new()
	sphere.radius = 1.0
	sphere.height = 2.0
	sphere.radial_segments = segments
	sphere.rings = 8
	var node := MeshInstance3D.new()
	node.mesh = sphere
	node.position = point
	node.scale = scale
	node.material_override = mat
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

func compact_house(point: Vector3, roof: String = "tiles", height: float = 4.8) -> void:
	# Background homes use the same reference palette with fewer rings for mobile performance.
	house_count += 1
	var stretch := Vector2(1.0,0.9)
	_wall(2.8,0.0,height*0.58,point,stretch,materials["plaster"])
	var roof_material: Material = materials["gold"] if roof == "gold" else materials["tiles"]
	lathe([Vector2(2.72,height*0.54),Vector2(3.05,height*0.62),Vector2(3.15,height*0.76),Vector2(0,height)],point,stretch,roof_material,Vector2(5,1),false,20)
	_windows(point,2.8,stretch,height*0.34,8,Vector2(0.72,0.9),Vector2i(1,0),true)
	_panel(point+Vector3(0,0.92,2.5),Vector2(1.0,1.7),0,Vector2i(0,1))

func courtyard_house(point: Vector3, color: String = "plaster") -> void:
	# Low courtyard homes use two offset wings and a covered entrance, unlike the round houses.
	house_count += 1
	var wall_material: Material = materials["red"] if color == "red" else materials["plaster"]
	for side in [-1,1]:
		var wing := point+Vector3(side*2.25,0,0)
		_wall(2.15,0.0,3.25,wing,Vector2(0.9,0.72),wall_material)
		lathe([Vector2(2.1,3.05),Vector2(2.55,3.18),Vector2(2.65,3.35),Vector2(0,4.05)],wing,Vector2(0.9,0.72),materials["tiles"],Vector2(5,1))
		_windows(wing,2.15,Vector2(0.9,0.72),1.8,6,Vector2(0.7,1.0),Vector2i(1,0),true)
	_block(Vector3(2.4,0.18,1.6),point+Vector3(0,0.09,2.65),materials["wood"])
	for side in [-1,1]:
		_block(Vector3(0.16,2.7,0.16),point+Vector3(side*1.05,1.35,2.65),materials["wood"])
	_block(Vector3(2.6,0.16,0.18),point+Vector3(0,2.6,2.65),materials["wood"])
	_panel(point+Vector3(0,1.15,2.75),Vector2(1.15,2.2),0,Vector2i(0,1))

func stilt_house(point: Vector3, roof: String = "tiles") -> void:
	# Raised homes create a third silhouette and leave a visible shaded passage underneath.
	house_count += 1
	var stretch := Vector2(1.0,0.78)
	for x in [-2.2,2.2]:
		for z in [-1.7,1.7]:
			lathe([Vector2(0.19,0),Vector2(0.19,2.0)],point+Vector3(x,0,z),Vector2.ONE,materials["wood"],Vector2.ONE,true,10)
	_wall(3.65,1.65,4.65,point,stretch,materials["plaster"])
	var roof_material: Material = materials["gold"] if roof == "gold" else materials["tiles"]
	lathe([Vector2(3.55,4.48),Vector2(4.05,4.6),Vector2(4.15,4.82),Vector2(3.1,5.75),Vector2(0,6.35)],point,stretch,roof_material,Vector2(6,1.1))
	_windows(point,3.65,stretch,3.0,8,Vector2(0.78,1.05),Vector2i(1,0),true)
	_panel(point+Vector3(0,2.45,3.0),Vector2(1.25,2.25),0,Vector2i(0,1))

func _sanctuary_steps(point: Vector3, width: float = 7.0, count: int = 5) -> void:
	for i in range(count):
		var depth := 0.9*float(i+1)
		_block(Vector3(width,0.22*float(i+1),0.9), point+Vector3(0,0.11*float(i+1),5.0+depth), materials["stone"])

func _sanctuary_torii(point: Vector3, color: Material = null, width: float = 8.0, height: float = 5.5) -> void:
	var post_material: Material = materials["red"] if color == null else color
	for side in [-1,1]:
		lathe([Vector2(0.28,0),Vector2(0.28,height),Vector2(0.38,height+0.2)], point+Vector3(side*width*0.42,0,5.0), Vector2.ONE, post_material, Vector2.ONE, true, 12)
	_block(Vector3(width,0.32,0.34), point+Vector3(0,height+0.15,5.0), post_material)
	_block(Vector3(width+0.8,0.22,0.30), point+Vector3(0,height+0.62,5.0), materials["gold"])

func _sanctuary_body(point: Vector3, wall: Material, roof: Material, width: float, height: float, stretch: Vector2 = Vector2(1.0,0.82)) -> void:
	_wall(width,0.0,height,point,stretch,wall)
	lathe([Vector2(width-0.1,height-0.25),Vector2(width+0.35,height),Vector2(width+0.55,height+0.25),Vector2(width*0.72,height+1.15),Vector2(0,height+1.55)], point, stretch, roof, Vector2(7,1.1))
	_windows(point,width,stretch,height*0.52,12,Vector2(0.72,1.1),Vector2i(1,0),true)
	_panel(point+Vector3(0,1.55,width*0.84),Vector2(2.0,3.0),0,Vector2i(0,1))

func _sanctuary_pagoda(point: Vector3, wall: Material, roof: Material, tiers: int = 3, scale: float = 1.0) -> void:
	for tier in range(tiers):
		var y := float(tier)*3.25*scale
		var width := (4.6-0.55*float(tier))*scale
		_wall(width, y, y+2.65*scale, point+Vector3(0,0,-1.2*float(tier)), Vector2(1,0.82), wall)
		lathe([Vector2(width+0.25*scale,y+2.45*scale),Vector2(width+0.72*scale,y+2.7*scale),Vector2(0,y+3.2*scale)], point+Vector3(0,0,-1.2*float(tier)), Vector2(1,0.82), roof, Vector2(6,1))
		_windows(point+Vector3(0,0,-1.2*float(tier)),width,Vector2(1,0.82),y+1.5*scale,8,Vector2(0.45,0.7),Vector2i(1,0))
	lathe([Vector2(0.22*scale,0),Vector2(0.22*scale,tiers*3.25*scale+2)],point+Vector3(0,0,-1.2*float(tiers-1)),Vector2.ONE,materials["gold"],Vector2.ONE,false,12)

func _sanctuary_courtyard(point: Vector3, wall: Material, roof: Material, scale: float = 1.0) -> void:
	for side in [-1,1]:
		var wing := point+Vector3(side*3.6*scale,0,-1.0)
		_sanctuary_body(wing,wall,roof,2.35*scale,3.7*scale,Vector2(0.92,0.72))
	_block(Vector3(11.0*scale,0.18,7.5*scale),point+Vector3(0,0.09,-0.7),materials["stone"])
	_sanctuary_torii(point,materials["red"],7.2*scale,5.0*scale)

func _sanctuary_cliff(point: Vector3, wall: Material, roof: Material, scale: float = 1.0) -> void:
	_block(Vector3(13*scale,1.0,9*scale),point+Vector3(0,0.5,-1),materials["stone"])
	_sanctuary_body(point+Vector3(0,1.0,-1.4),wall,roof,4.2*scale,5.1*scale,Vector2(1,0.8))
	for side in [-1,1]:
		_sanctuary_body(point+Vector3(side*5.4*scale,0,0),wall,roof,1.65*scale,3.5*scale,Vector2(1,0.7))
	_sanctuary_steps(point,8.0*scale,6)

func _sanctuary_geometry(point: Vector3, variant: int) -> void:
	# Fourteen reference images from main are translated into fourteen low-poly silhouettes:
	# pagodas, courtyards, cliff halls, torii gates, towers and garden compounds.
	_block(Vector3(13.5,0.22,10.5),point+Vector3(0,0.11,-0.8),materials["stone"])
	_sanctuary_steps(point,7.0,5)
	match variant:
		0: # Uchiwa — purple forest pagoda
			_sanctuary_pagoda(point,materials["wood"],materials["gold"],3,1.12); _sanctuary_torii(point,materials["red"],8.0,6.0)
		1: # Uzumaki — blue courtyard estate
			_sanctuary_courtyard(point,materials["plaster"],materials["tiles"],1.1)
		2: # Senju — tall mountain palace
			_sanctuary_pagoda(point,materials["plaster"],materials["gold"],4,1.12)
		3: # Hyūga — elevated garden pavilion
			_sanctuary_cliff(point,materials["plaster"],materials["tiles"],1.0)
		4: # Akimichi — broad multi-wing hall
			_sanctuary_courtyard(point,materials["red"],materials["gold"],1.35); _sanctuary_body(point,materials["red"],materials["gold"],3.4,4.4)
		5: # Yamanaka — flowering five-level tower
			_sanctuary_pagoda(point,materials["wood"],materials["tiles"],5,0.9); _sanctuary_torii(point,materials["red"],7.5,5.2)
		6: # Aburame — dark fog gate and compact hall
			_sanctuary_torii(point,materials["wood"],9.0,6.4); _sanctuary_body(point+Vector3(0,0,-2.0),materials["stone"],materials["tiles"],4.0,4.0)
		7: # Inuzuka — wooded raised compound
			_sanctuary_cliff(point,materials["wood"],materials["tiles"],1.12)
		8: # Fushiguro — red mountain gate
			_sanctuary_torii(point,materials["red"],10.0,7.0); _sanctuary_pagoda(point,materials["red"],materials["red"],3,1.0)
		9: # Itadori — sunset stair temple
			_sanctuary_body(point,materials["red"],materials["gold"],4.7,5.0,Vector2(1,0.78)); _sanctuary_torii(point,materials["red"],8.5,6.2)
		10: # Kurosaki — blue waterfall tower
			_sanctuary_pagoda(point,materials["plaster"],materials["gold"],4,1.0); _block(Vector3(2.2,7.0,0.7),point+Vector3(6,3.5,-2),materials["glass"])
		11: # Shunsui — pink circular garden
			_sanctuary_courtyard(point,materials["plaster"],materials["gold"],1.0); _block(Vector3(11,0.16,11),point+Vector3(0,0.08,-1),materials["green"])
		12: # Yeager — fortified estate
			_sanctuary_cliff(point,materials["stone"],materials["tiles"],1.2); _sanctuary_torii(point,materials["wood"],9.5,5.8)
		13: # Ackerman — snow court and central torii
			_sanctuary_courtyard(point,materials["plaster"],materials["tiles"],1.2); _sanctuary_torii(point,materials["red"],8.8,6.3)

func residential_hall(point: Vector3, variant: int = 0) -> void:
	# Legacy halls remain as varied houses after the fourteen true clan sanctuaries move away.
	house_count += 1
	_hall_geometry(point, variant)

func clan_sanctuary(point: Vector3, variant: int = 0) -> void:
	# Legacy procedural fallback retained for editor recovery and old exports.
	sanctuary_count += 1
	house_count += 1
	_sanctuary_geometry(point, variant)

func register_external_sanctuary() -> void:
	# Blender sanctuaries are real imported geometry; keep the architecture
	# counters authoritative for the village diagnostics and smoke tests.
	sanctuary_count += 1
	house_count += 1

func _hall_geometry(point: Vector3, variant: int = 0) -> void:
	var wall_palette: Array[Material] = [materials["red"],materials["plaster"],materials["green"],materials["wood"],materials["stone"],materials["red"]]
	var wall_material: Material = wall_palette[clampi(variant,0,wall_palette.size()-1)]
	var stretch := Vector2(1.2,0.88)
	_wall(5.2,0.0,4.8,point,stretch,wall_material)
	lathe([Vector2(5.1,4.55),Vector2(5.7,4.75),Vector2(5.9,5.0),Vector2(4.6,6.3),Vector2(0,7.0)],point,stretch,materials["gold"] if variant%2 == 0 else materials["tiles"],Vector2(8,1.2))
	_windows(point,5.2,stretch,2.75,12,Vector2(0.78,1.15),Vector2i(1,0),true)
	_panel(point+Vector3(0,1.75,4.6),Vector2(2.1,3.1),0,Vector2i(0,1))
	for side in [-1,1]:
		lathe([Vector2(0.28,0),Vector2(0.28,3.7),Vector2(0.36,3.7),Vector2(0.36,4.8)],point+Vector3(side*2.25,0,5.0),Vector2.ONE,materials["wood"],Vector2.ONE,true,12)
	_block(Vector3(6.8,0.16,2.0),point+Vector3(0,0.08,5.0),materials["stone"])
	_block(Vector3(7.5,0.18,0.22),point+Vector3(0,4.3,5.0),materials["wood"])

func apartment_block(point: Vector3, color: String = "plaster") -> void:
	# Three-story curved apartment houses make the residential rings feel occupied without spawning interiors.
	house_count += 1
	var wall_material: Material = materials["red"] if color == "red" else materials["plaster"]
	var stretch := Vector2(1.0, 0.82)
	_wall(4.25,0.0,9.4,point,stretch,wall_material)
	for y in [2.1,5.0,7.9]:
		_windows(point,4.25,stretch,y,12,Vector2(0.62,1.02),Vector2i(1,0))
		for side in [-1,1]:
			var balcony := MeshInstance3D.new()
			var balcony_mesh := BoxMesh.new()
			balcony_mesh.size = Vector3(1.75,0.16,0.95)
			balcony.mesh = balcony_mesh
			balcony.position = point + Vector3(side*2.25,y-0.5,0)
			balcony.material_override = materials["wood"]
			add_child(balcony)
	lathe([Vector2(4.2,9.2),Vector2(4.65,9.45),Vector2(4.8,9.7),Vector2(3.2,10.8),Vector2(0,11.15)],point,stretch,materials["tiles"],Vector2(7,1.1))
	_panel(point+Vector3(0,1.35,3.48),Vector2(1.6,2.7),0,Vector2i(0,1))

func tower(point: Vector3, color: String = "red", height: float = 12.0) -> void:
	var wall_material: Material = materials["red"] if color == "red" else materials["plaster"]
	_wall(3.0,0.0,height,point,Vector2.ONE,wall_material)
	lathe([Vector2(3.0,height-0.3),Vector2(3.5,height),Vector2(0,height+2.6)],point,Vector2.ONE,materials["gold"],Vector2(6,1),false,24)
	_windows(point,3.0,Vector2.ONE,height*0.42,12,Vector2(0.5,0.9),Vector2i(1,0))

func palace(point: Vector3) -> void:
	palace_built = true
	# Lower rounded wings frame the central red drum, matching the reference.
	for x in [-7.0,7.0]:
		var wing: Vector3 = point+Vector3(x,0,-1.3)
		_wall(3.0,0,3.4,wing,Vector2(1,1.2),materials["red"])
		lathe([Vector2(2.96,3.2),Vector2(3.45,3.3),Vector2(3.6,3.48),Vector2(2.45,4.35),Vector2(0,4.35)],wing,Vector2(1,1.2),materials["gold"],Vector2(5,1))
		_windows(wing,3.0,Vector2(1,1.2),2.15,10,Vector2(0.42,0.85),Vector2i(1,0))
	# Keep the exterior drum continuous: the hall is represented by a closed
	# entrance façade and the visit is handled by the blue floor portal below.
	_wall(5.4,-0.03,9.15,point,Vector2.ONE,materials["red"])
	lathe([Vector2(5.4,2.9),Vector2(5.75,2.94),Vector2(6.05,3.12),Vector2(5.45,3.88)],point,Vector2.ONE,materials["gold"],Vector2(10,0.8))
	lathe([Vector2(5.4,8.8),Vector2(5.8,8.85),Vector2(6.05,9.05),Vector2(5.45,9.42),Vector2(4.6,10.10)],point,Vector2.ONE,materials["gold"],Vector2(10,1.1))
	_wall(4.57,9.9,11.2,point,Vector2.ONE,materials["red"])
	lathe([Vector2(4.58,11.12),Vector2(4.8,11.20),Vector2(4.8,11.42),Vector2(0,11.42)],point,Vector2.ONE,materials["trim"])
	for y in [6.65,7.65]:
		_windows(point,5.4,Vector2.ONE,y,28,Vector2(0.31,0.65),Vector2i(1,0))
	# No front door panel: the hall opening remains visually empty and walkable.
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

func main_door(point: Vector3) -> void:
	# The exterior is a complete, closed façade again. The blue portal is
	# deliberately placed in front of this solid entrance instead of cutting a
	# hole through the building or leaving visual gaps in the compound.
	_block(Vector3(8.4,4.6,0.34),point+Vector3(0,2.30,5.45),materials["red"])
	_solid_box(Vector3(8.4,4.6,0.34),point+Vector3(0,2.30,5.45),"HokageMainFacadeCollision")
	_block(Vector3(4.2,4.1,0.30),point+Vector3(0,2.05,5.57),materials["trim"])
	_block(Vector3(3.35,3.45,0.14),point+Vector3(0,1.73,5.78),materials["glass"])
	_solid_box(Vector3(3.35,3.45,0.14),point+Vector3(0,1.73,5.78),"HokageMainDoorCollision")
	_block(Vector3(3.55,0.22,0.20),point+Vector3(0,3.52,5.88),materials["gold"])
	for x in [-0.24,0.24]:
		_block(Vector3(0.10,0.36,0.10),point+Vector3(x,1.65,5.91),materials["gold"])
	var entrance_label := Label3D.new()
	entrance_label.text = "RÉSIDENCE DU HOKAGE"
	entrance_label.position = point+Vector3(0,4.15,5.90)
	entrance_label.rotation.y = PI
	entrance_label.font_size = 18
	entrance_label.pixel_size = 0.010
	entrance_label.modulate = Color("fff0c9")
	entrance_label.outline_size = 4
	entrance_label.outline_modulate = Color("39271f")
	add_child(entrance_label)
	# A compact cyan landing seal marks the exact place where the player must
	# remain still for three seconds before the virtual visit is loaded.
	var pad := MeshInstance3D.new()
	var pad_mesh := CylinderMesh.new()
	pad_mesh.top_radius = 1.65
	pad_mesh.bottom_radius = 1.65
	pad_mesh.height = 0.06
	pad_mesh.radial_segments = 32
	pad.mesh = pad_mesh
	pad.position = point+Vector3(0,0.05,7.55)
	var pad_material := TrainingFighter.material(Color("1cc9ff"), true)
	pad_material.emission_enabled = true
	pad_material.emission = Color("0b9dff")
	pad_material.emission_energy_multiplier = 2.6
	pad.material_override = pad_material
	add_child(pad)
	var ring := MeshInstance3D.new()
	var ring_mesh := TorusMesh.new()
	ring_mesh.inner_radius = 1.48
	ring_mesh.outer_radius = 1.58
	ring_mesh.rings = 32
	ring_mesh.ring_segments = 8
	ring.mesh = ring_mesh
	ring.position = point+Vector3(0,0.10,7.55)
	ring.material_override = pad_material
	add_child(ring)
	var portal_light := OmniLight3D.new()
	portal_light.light_color = Color("35d8ff")
	portal_light.light_energy = 2.8
	portal_light.omni_range = 5.5
	portal_light.shadow_enabled = false
	portal_light.position = point+Vector3(0,1.25,7.55)
	add_child(portal_light)
	var portal_label := Label3D.new()
	portal_label.text = "RESTER SUR LE SCEAU"
	portal_label.position = point+Vector3(0,0.55,7.55)
	portal_label.font_size = 13
	portal_label.pixel_size = 0.008
	portal_label.modulate = Color("b9f5ff")
	portal_label.outline_size = 3
	portal_label.outline_modulate = Color("09283b")
	add_child(portal_label)

func monument() -> void:
	# Keep the supplied Hokage image as the only face representation. The image
	# is large and readable; the rock shelf and wall below it remain physical.
	var vertices := PackedVector3Array(); var normals := PackedVector3Array(); var uv := PackedVector2Array()
	var width: float = 124.0
	var height: float = width*225.0/382.0
	for i in range(8):
		var u0: float = float(i)/8
		var u1: float = float(i+1)/8
		var x0: float = (u0-0.5)*width
		var x1: float = (u1-0.5)*width
		# Put the large source texture in front of the rock shelf so it remains
		# clearly readable behind the new relief geometry.
		var z0: float = -101.5 - absf(x0)*0.065
		var z1: float = -101.5 - absf(x1)*0.065
		var corners: Array[Vector3] = [Vector3(x0,7,z0),Vector3(x0,7+height,z0),Vector3(x1,7+height,z1),Vector3(x1,7,z1)]
		var coords: Array[Vector2] = [Vector2(u0,1),Vector2(u0,0),Vector2(u1,0),Vector2(u1,1)]
		for index in [0,1,2,0,2,3]:
			vertices.append(corners[index]); normals.append(Vector3.BACK); uv.append(coords[index])
	cliff = _mesh(vertices,normals,uv,materials["faces"])
	# The rock shelf stays a visible 3D base, while a hidden solid wall prevents
	# the player from walking through the image or the shelf at ground level.
	lathe([Vector2(62,0),Vector2(62,52),Vector2(56,68),Vector2(0,74)],Vector3(0,0,-111.0),Vector2(1,0.12),materials["stone"],Vector2(8,3),false,28)
	for x in [-68.0,68.0]:
		lathe([Vector2(10,0),Vector2(11,30),Vector2(9,56),Vector2(4,72),Vector2(0,78)],Vector3(x,0,-110.0),Vector2(1,0.6),materials["stone"],Vector2(4,5),false,10)
	_solid_box(Vector3(124,7.0,14.0),Vector3(0,3.5,-106.5),"HokageRockBaseCollision")
	_solid_box(Vector3(width,74.0,1.4),Vector3(0,7.0+height*0.5,-102.0),"HokageImageWallCollision")
