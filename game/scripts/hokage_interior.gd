class_name HokageInterior
extends Node3D
## A compact, visitable Hokage residence interior: hall, portrait gallery,
## stair, council room and office. The exterior remains a separate collision set.

const PORTRAITS: Array[Texture2D] = [
	preload("res://assets/konoha/hokage/01_portrait.png"),
	preload("res://assets/konoha/hokage/02_portrait.png"),
	preload("res://assets/konoha/hokage/03_portrait.png"),
	preload("res://assets/konoha/hokage/04_portrait.png"),
	preload("res://assets/konoha/hokage/05_portrait.png"),
	preload("res://assets/konoha/hokage/06_portrait.png"),
	preload("res://assets/konoha/hokage/07_portrait.png")
]
const HOKAGE_NAMES: Array[String] = [
	"Hashirama Senju", "Tobirama Senju", "Hiruzen Sarutobi", "Minato Namikaze",
	"Tsunade", "Kakashi Hatake", "Naruto Uzumaki"
]
const EXIT_POINT := Vector3(0, 0.25, 9.3)
const OFFICE_POINT := Vector3(0, 4.65, -5.0)

var active: bool = false
var built: bool = false
var static_bodies: Array[StaticBody3D] = []

func build() -> void:
	if built:
		return
	built = true
	# Ground floor: entrance, reception and the full-width Hokage gallery.
	box(Vector3(20,0.22,22), Vector3(0,-0.11,0), Color("b99a70"), true)
	_wall(Vector3(0,2.2,-10.8), Vector3(20,4.4,0.35))
	_wall(Vector3(-9.8,2.2,0), Vector3(0.35,4.4,22))
	_wall(Vector3(9.8,2.2,0), Vector3(0.35,4.4,22))
	# The front is deliberately open at the centre: this is the real entrance.
	_wall(Vector3(-7.3,2.2,10.8), Vector3(5.0,4.4,0.35))
	_wall(Vector3(7.3,2.2,10.8), Vector3(5.0,4.4,0.35))
	box(Vector3(5.3,0.18,0.8), Vector3(0,0.09,10.8), Color("6a4738"))
	label_3d("RÉSIDENCE DU HOKAGE", Vector3(0,3.7,10.45), 22, PI)
	box(Vector3(2.7,2.7,0.12), Vector3(0,2.65,10.52), Color("4d7469"))
	label_3d("木", Vector3(0,2.55,10.40), 48, PI)
	label_3d("ACCUEIL", Vector3(0,2.7,8.7), 18, PI)
	# Reception desk and mission display.
	box(Vector3(4.0,1.05,1.0), Vector3(0,0.52,6.9), Color("684431"), true)
	box(Vector3(3.5,0.08,1.1), Vector3(0,1.1,6.9), Color("d1aa62"))
	label_3d("ACCUEIL · CONSEIL", Vector3(0,1.35,6.35), 14, PI)
	box(Vector3(2.8,2.2,0.12), Vector3(-5.6,1.45,8.9), Color("76503d"))
	label_3d("MISSIONS", Vector3(-5.6,2.0,8.78), 15, PI)
	# The portrait wall uses internet-sourced cropped image cards, resized for mobile.
	for i in range(PORTRAITS.size()):
		var x := -7.8 + float(i)*2.6
		_portrait_card(i, Vector3(x,2.0,-10.55))
	# Central stair: solid block treads plus a wedge close every gap.
	_stairs(Vector3(7.0,0,7.8), PI, 3.2, 8, 0.50, 0.82)
	# Upper floor and council/office walls.
	box(Vector3(20,0.22,17), Vector3(0,4.0,-1.8), Color("a47d58"), true)
	_wall(Vector3(-9.8,6.2,-1.8), Vector3(0.35,4.4,17))
	_wall(Vector3(9.8,6.2,-1.8), Vector3(0.35,4.4,17))
	_wall(Vector3(0,6.2,-10.0), Vector3(20,4.4,0.35))
	# Council room at the top of the stairs.
	box(Vector3(7.0,0.25,2.4), Vector3(-4.8,4.25,-1.6), Color("684431"), true)
	for x in [-7.2,-4.8,-2.4,2.4,4.8,7.2]:
		box(Vector3(0.65,0.45,0.65), Vector3(x,4.48,-1.6), Color("7f5a3f"), true)
	label_3d("SALLE DU CONSEIL", Vector3(-4.8,5.0,-2.95), 16, 0)
	# Office in the rear, with a clear central opening from the council room.
	_wall(Vector3(-6.6,6.2,-5.8), Vector3(0.25,4.4,8.0))
	_wall(Vector3(6.6,6.2,-5.8), Vector3(0.25,4.4,8.0))
	_wall(Vector3(0,6.2,-9.7), Vector3(13.2,4.4,0.25))
	box(Vector3(4.2,1.1,1.5), OFFICE_POINT, Color("563728"), true)
	box(Vector3(4.0,0.08,1.45), OFFICE_POINT+Vector3(0,0.58,0), Color("d9b66e"))
	box(Vector3(2.5,0.18,2.0), OFFICE_POINT+Vector3(0,0.68,-1.2), Color("4f7890"))
	label_3d("CARTE DE KONOHA", OFFICE_POINT+Vector3(0,1.0,-1.8), 13, 0)
	label_3d("BUREAU DU HOKAGE", Vector3(0,8.0,-9.35), 20, 0)
	# A front balcony opens over the village direction without adding a second world.
	box(Vector3(8.0,0.18,1.8), Vector3(0,4.2,10.8), Color("6a4738"), true)
	for x in [-3.8,3.8]:
		box(Vector3(0.18,1.15,0.18), Vector3(x,4.75,11.55), Color("6a4738"), true)
	box(Vector3(8.0,0.18,0.18), Vector3(0,5.25,11.55), Color("d1aa62"), true)
	label_3d("BALCON · VUE SUR KONOHA", Vector3(0,5.75,11.42), 13, PI)
	set_active(false)

func _portrait_card(index: int, point: Vector3) -> void:
	box(Vector3(1.05,3.05,0.14), point+Vector3(0,0,-0.08), Color("684431"))
	var image := MeshInstance3D.new()
	var quad := QuadMesh.new()
	quad.size = Vector2(0.72,2.72)
	image.mesh = quad
	image.position = point
	var material := StandardMaterial3D.new()
	material.albedo_texture = PORTRAITS[index]
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	image.material_override = material
	add_child(image)
	label_3d(HOKAGE_NAMES[index], point+Vector3(0,-1.78,0.05), 11, PI)

func _wall(point: Vector3, size: Vector3) -> void:
	box(size, point, Color("6c5140"), true)

func box(size: Vector3, point: Vector3, color: Color, solid: bool = false) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.position = point
	node.material_override = TrainingFighter.material(color)
	add_child(node)
	if solid:
		var body := StaticBody3D.new()
		body.collision_layer = 1
		body.collision_mask = 0
		var shape := BoxShape3D.new()
		shape.size = size
		var collision := CollisionShape3D.new()
		collision.shape = shape
		body.add_child(collision)
		node.add_child(body)
		static_bodies.append(body)
	return node

func _stairs(point: Vector3, angle: float, width: float, count: int, rise: float, run: float) -> void:
	var forward := Vector3(sin(angle),0,cos(angle))
	for i in range(count):
		var height := rise*float(i+1)
		var tread := box(Vector3(width,height,run), point+forward*(run*(float(i)+0.5))+Vector3.UP*(height*0.5), Color("8e684c"), true)
		tread.rotation.y = angle
	# A convex wedge keeps the side gaps closed, just like the village stairs.
	var wedge := ConvexPolygonShape3D.new()
	var length := run*float(count)
	var total_height := rise*float(count)
	wedge.points = PackedVector3Array([
		Vector3(-width*0.5,0,0), Vector3(width*0.5,0,0),
		Vector3(-width*0.5,0,length), Vector3(width*0.5,0,length),
		Vector3(-width*0.5,total_height,length), Vector3(width*0.5,total_height,length)
	])
	var body := StaticBody3D.new()
	body.position = point
	body.rotation.y = angle
	body.collision_layer = 1
	body.collision_mask = 0
	var collision := CollisionShape3D.new()
	collision.shape = wedge
	body.add_child(collision)
	add_child(body)
	static_bodies.append(body)

func label_3d(text: String, point: Vector3, size: int, angle: float = 0.0) -> void:
	var label := Label3D.new()
	label.text = text
	label.position = point
	label.rotation.y = angle
	label.font_size = size
	label.pixel_size = 0.010
	label.modulate = Color("f3dfb0")
	label.outline_size = 4
	label.outline_modulate = Color("2f211d")
	add_child(label)

func set_active(value: bool) -> void:
	active = value
	visible = value
	for body in static_bodies:
		if is_instance_valid(body):
			body.collision_layer = 1 if value else 0
			body.collision_mask = 0

func near_exit(player_position: Vector3) -> bool:
	return active and player_position.distance_to(global_position + EXIT_POINT) < 3.6

func near_office(player_position: Vector3) -> bool:
	return active and player_position.distance_to(global_position + OFFICE_POINT) < 3.8
