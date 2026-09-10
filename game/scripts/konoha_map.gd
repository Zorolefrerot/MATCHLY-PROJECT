class_name KonohaMap
extends TrainingArena
## Mobile-sized solo quarter, NOT the training arena or the full village.
var architecture: KonohaArchitecture
const SPAWN := Vector3(0, 0.25, 22)
const GUIDE := Vector3(-2.2, -0.05, 15)
const LANDMARKS: Array[Dictionary] = [
	{"name": "Académie", "point": Vector3(15, 0, -0.5), "text": "Voici l’académie de Konoha. Les futurs entraînements et examens prendront place ici.\nPour cette première visite, seul l’extérieur est accessible."},
	{"name": "Marché", "point": Vector3(-14, 0, 6), "text": "Le marché du quartier. Les boutiques et l’économie arriveront avec leurs systèmes dédiés.\nAucun achat ni objet n’est attribué pendant cette visite."},
	{"name": "Résidence du Hokage", "point": Vector3(0, 0, -17), "text": "La résidence du Hokage domine le quartier. Les missions et l’accès du dirigeant viendront plus tard.\nTu peux explorer la place, mais pas encore entrer dans le bâtiment."}
]

func build() -> void:
	architecture = KonohaArchitecture.new()
	add_child(architecture)
	var world := WorldEnvironment.new()
	var env := Environment.new()
	var sky := Sky.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color("588dba")
	sky_mat.sky_horizon_color = Color("d7e7d9")
	sky_mat.ground_horizon_color = Color("d7e7d9")
	sky_mat.ground_bottom_color = Color("637958")
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("f5e8cc")
	env.ambient_light_energy = 0.48
	env.reflected_light_source = Environment.REFLECTION_SOURCE_DISABLED
	world.environment = env
	add_child(world)
	sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -32, 0)
	sun.light_color = Color("fff0d2")
	sun.light_energy = 0.95
	sun.shadow_enabled = false
	add_child(sun)
	box(Vector3(70, 0.4, 78), Vector3(0, -0.25, 0), Color("8eaa72"), true)
	box(Vector3(12, 0.06, 61), Vector3(0, -0.015, 0), Color("d8c39d"))
	box(Vector3(51, 0.06, 10), Vector3(0, -0.012, -5), Color("d8c39d"))
	box(Vector3(50, 0.06, 8), Vector3(0, -0.014, 12), Color("d8c39d"))
	# Raised stone road edges; too low to obstruct walking.
	for x in [-6.2, 6.2]:
		box(Vector3(0.3, 0.08, 50), Vector3(x, 0.015, 2), Color("c1b697"))
	for x in [-29, 29]:
		box(Vector3(0.8, 5, 66), Vector3(x, 2.45, 0), Color("85967c"), true)
	for z in [-33, 33]:
		box(Vector3(59, 5, 0.8), Vector3(0, 2.45, z), Color("85967c"), true)
	# Southern gate. The area behind it remains closed for this small first block.
	for x in [-5, 5]:
		box(Vector3(1.1, 7, 1.1), Vector3(x, 3.45, 28), Color("705243"), true)
		box(Vector3(0.75, 5.3, 0.8), Vector3(x, 2.65, 27.8), Color("ac6350"))
	box(Vector3(12.8, 0.7, 2.1), Vector3(0, 7, 28), Color("42776f"))
	box(Vector3(10, 1, 0.35), Vector3(0, 5.9, 28), Color("eee0b6"))
	_sign("KONOHA", Vector3(0, 5.9, 27.75), 44, PI)
	_house(Vector3(-15, 0, 0), "MARCHÉ")
	_house(Vector3(15, 0, -5), "ACADÉMIE")
	_house(Vector3(-17, 0, -15), "QUARTIER RÉSIDENTIEL")
	_house(Vector3(17, 0, 15), "MAISON DU QUARTIER")
	# Market stalls, striped awning, crates. No fake shop transactions.
	for i in range(5):
		box(Vector3(1.6, 0.14, 3), Vector3(-18.2+i*1.6, 2.7, 4.6), Color("ac584d") if i%2==0 else Color("e9dbb4"))
	for x in [-19, -11]:
		box(Vector3(0.14, 2.7, 0.14), Vector3(x, 1.35, 5.8), Color("795644"), true)
	box(Vector3(7.7, 0.9, 1.1), Vector3(-15, 0.45, 4.8), Color("9c7953"), true)
	for x in [-17, -14, -12]:
		box(Vector3(1.1, 0.35, 0.85), Vector3(x, 1.07, 4.8), Color("819349") if x%2==0 else Color("bd6b43"))
	architecture.palace(Vector3(0,0,-24))
	_sign("RÉSIDENCE DU HOKAGE", Vector3(0,3.8,-17.0), 28)
	architecture.monument()
	architecture.finish()
	# Bulletin boards at approachable points, not invisible proximity triggers.
	for data in LANDMARKS:
		var point: Vector3 = data["point"] + Vector3(1.8, 0, 0)
		box(Vector3(0.14, 1.7, 0.14), point + Vector3.UP*0.8, Color("775941"), true)
		box(Vector3(1.7, 0.95, 0.16), point + Vector3.UP*1.45, Color("f1dfb2"))
		_sign(data["name"], point + Vector3(0, 1.5, 0.10), 24)
	for point in [Vector3(-8,0,19),Vector3(8,0,19),Vector3(-8,0,-13),Vector3(8,0,-13),Vector3(-25,0,-25),Vector3(25,0,-25),Vector3(-24,0,22),Vector3(24,0,3)]:
		_tree(point)
	for x in [-8, 8]:
		box(Vector3(2.6, 0.18, 0.75), Vector3(x, 0.55, 10), Color("95704e"), true)
		for dx in [-0.9, 0.9]:
			box(Vector3(0.2, 0.6, 0.6), Vector3(x+dx, 0.25, 10), Color("695644"))

func _house(point: Vector3, title: String) -> void:
	architecture.house(point, title != "ACADÉMIE")
	box(Vector3(3.7,0.55,0.14),point+Vector3(0,2.72,3.67),Color("e9d6ac"))
	_sign(title,point+Vector3(0,2.72,3.77),22)

func _sign(text: String, point: Vector3, font_size: int, angle: float = 0) -> void:
	var label_node := Label3D.new()
	label_node.text = text
	label_node.position = point
	label_node.rotation.y = angle
	label_node.font_size = font_size
	label_node.pixel_size = 0.012
	label_node.modulate = Color("392f29")
	label_node.outline_size = 0
	add_child(label_node)
