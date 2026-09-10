class_name KonohaMap
extends TrainingArena
## Original mobile-sized village block, NOT the training arena or the full map.
const SPAWN := Vector3(0, 0.25, 22)
const GUIDE := Vector3(-2.2, -0.05, 15)
const LANDMARKS: Array[Dictionary] = [
	{"name": "Académie", "point": Vector3(15, 0, -0.5), "text": "Voici l’académie de Konoha. Les futurs entraînements et examens prendront place ici.\nPour cette première visite, seul l’extérieur est accessible."},
	{"name": "Marché", "point": Vector3(-14, 0, 6), "text": "Le marché du quartier. Les boutiques et l’économie arriveront avec leurs systèmes dédiés.\nAucun achat ni objet n’est attribué pendant cette visite."},
	{"name": "Résidence du Hokage", "point": Vector3(0, 0, -17), "text": "La résidence du Hokage domine le quartier. Les missions et l’accès du dirigeant viendront plus tard.\nTu peux explorer la place, mais pas encore entrer dans le bâtiment."}
]

func build() -> void:
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
	env.ambient_light_energy = 0.65
	env.reflected_light_source = Environment.REFLECTION_SOURCE_DISABLED
	world.environment = env
	add_child(world)
	sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -32, 0)
	sun.light_color = Color("fff0d2")
	sun.light_energy = 1.1
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
	_house(Vector3(-15, 0, 0), Color("d4b887"), Color("467d78"), "MARCHÉ")
	_house(Vector3(15, 0, -5), Color("e6cfa4"), Color("b65545"), "ACADÉMIE")
	_house(Vector3(-17, 0, -15), Color("d1c2a0"), Color("666c91"), "QUARTIER RÉSIDENTIEL")
	_house(Vector3(17, 0, 15), Color("dec2a0"), Color("4d7979"), "MAISON DU QUARTIER")
	# Market stalls, striped awning, crates. No fake shop transactions.
	for i in range(5):
		box(Vector3(1.6, 0.14, 3), Vector3(-18.2+i*1.6, 2.7, 4.6), Color("ac584d") if i%2==0 else Color("e9dbb4"))
	for x in [-19, -11]:
		box(Vector3(0.14, 2.7, 0.14), Vector3(x, 1.35, 5.8), Color("795644"), true)
	box(Vector3(7.7, 0.9, 1.1), Vector3(-15, 0.45, 4.8), Color("9c7953"), true)
	for x in [-17, -14, -12]:
		box(Vector3(1.1, 0.35, 0.85), Vector3(x, 1.07, 4.8), Color("819349") if x%2==0 else Color("bd6b43"))
	# The red circular residence is the visible northern landmark.
	cylinder(5.4, 9.5, Vector3(0, 4.7, -24), Color("d2b28b"), 12, true)
	for height in [3.3, 6.6, 9.6]:
		cylinder(5.9, 0.30, Vector3(0, height, -24), Color("ac4f44"), 12)
	cylinder(5.5, 1.0, Vector3(0, 10.1, -24), Color("b64d41"), 12)
	cylinder(3.3, 1.2, Vector3(0, 11.1, -24), Color("b64d41"), 12)
	cylinder(1.0, 1.0, Vector3(0, 12.1, -24), Color("407470"), 8)
	for x in [-2.7, 0, 2.7]:
		for y in [4.5, 7.8]:
			box(Vector3(1.2, 1.3, 0.15), Vector3(x, y, -18.8), Color("48696b"))
	box(Vector3(2.2, 2.7, 0.2), Vector3(0, 1.3, -18.55), Color("75503f"))
	_sign("RÉSIDENCE DU HOKAGE", Vector3(0, 3.0, -18.3), 32)
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
	for x in [-22, -11, 11, 22]:
		box(Vector3(7, 11 + absf(x)*0.1, 4), Vector3(x, 5, -38), Color("a4a48c"))

func _house(point: Vector3, color: Color, roof_color: Color, title: String) -> void:
	box(Vector3(8, 4.6, 7), point + Vector3(0, 2.25, 0), color, true)
	box(Vector3(8.3, 0.35, 7.3), point + Vector3(0, 0.13, 0), Color("938a73"))
	for side in [-1, 1]:
		var roof: MeshInstance3D = box(Vector3(5, 0.3, 8.2), point + Vector3(side*2.15, 5.0, 0), roof_color)
		roof.rotation.z = -side*0.27
	box(Vector3(0.4, 0.35, 8.3), point+Vector3(0,5.7,0), roof_color)
	for x in [-2.7, 2.7]:
		box(Vector3(1.65, 1.6, 0.15), point+Vector3(x,2.15,3.55), Color("596b69"))
		box(Vector3(0.10, 1.6, 0.05), point+Vector3(x,2.15,3.66), Color("e1cea4"))
	box(Vector3(1.4, 2.5, 0.16), point+Vector3(0,1.22,3.56), Color("7d5944"))
	box(Vector3(6, 0.75, 0.18), point+Vector3(0,3.65,3.57), Color("f0ddb4"))
	_sign(title, point+Vector3(0,3.65,3.72), 28)

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
