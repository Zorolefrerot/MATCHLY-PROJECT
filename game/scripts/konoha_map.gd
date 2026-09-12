class_name KonohaMap
extends TrainingArena
## Full Konoha district: a readable, explorable village built from the supplied map layout.
## The scenery is procedural and uses the prepared reference-derived textures.

const BOUNDS := Vector2(86.0, 92.0)
const SPAWN := Vector3(0, 0.25, 78)
const GUIDE := Vector3(-4.0, -0.05, 65)
const LANDMARKS: Array[Dictionary] = [
	{"name": "Académie", "point": Vector3(-34, 0, 2), "text": "L’Académie de Konoha accueille les jeunes ninjas. Les terrains d’examen s’étendent derrière les salles de cours."},
	{"name": "Marché", "point": Vector3(-7, 0, 25), "text": "Le marché central rassemble les marchands, les familles et les voyageurs. Les habitants négocient ici leurs achats quotidiens."},
	{"name": "Résidence du Hokage", "point": Vector3(0, 0, -46), "text": "La résidence du Hokage domine l’axe central, face aux visages sculptés dans la montagne."}
]
const DISTRICTS: Array[Dictionary] = [
	{"name":"FORÊT DE LA MORT", "point":Vector3(-58,0,-64), "kind":"forest"},
	{"name":"CLAN SHUN", "point":Vector3(-67,0,-43), "kind":"clan"},
	{"name":"CLAN HATTORI", "point":Vector3(-69,0,-12), "kind":"clan"},
	{"name":"CLAN HYŪGA", "point":Vector3(-65,0,47), "kind":"clan"},
	{"name":"CLAN UZUMAKI", "point":Vector3(-43,0,43), "kind":"clan"},
	{"name":"CLAN UCHIWA", "point":Vector3(-16,0,58), "kind":"clan"},
	{"name":"CLAN NARA", "point":Vector3(-25,0,-31), "kind":"clan"},
	{"name":"CLAN AKIMICHI", "point":Vector3(-45,0,-16), "kind":"clan"},
	{"name":"CLAN YAMANAKA", "point":Vector3(-10,0,-8), "kind":"clan"},
	{"name":"CLAN INUZUKA", "point":Vector3(27,0,-63), "kind":"clan"},
	{"name":"CLAN ABURAME", "point":Vector3(38,0,44), "kind":"clan"},
	{"name":"CLAN HATAKE", "point":Vector3(59,0,15), "kind":"clan"},
	{"name":"POSTE DE POLICE", "point":Vector3(23,0,30), "kind":"public"},
	{"name":"HÔPITAL", "point":Vector3(-8,0,17), "kind":"public"},
	{"name":"STADE", "point":Vector3(43,0,-7), "kind":"public"},
	{"name":"MÉMORIAL DE KONOHA", "point":Vector3(53,0,-42), "kind":"memorial"}
]

var architecture: KonohaArchitecture
var npcs: Array[KonohaNPC] = []
var npc_count: int = 0
var moving_npc_count: int = 0
var animal_count: int = 0
var discussion_count: int = 0
var shopping_count: int = 0

func build() -> void:
	architecture = KonohaArchitecture.new()
	add_child(architecture)
	_build_environment()
	_build_ground_and_walls()
	_build_roads_and_water()
	_build_landmarks()
	_build_districts()
	_build_trees_and_gardens()
	_build_village_life()
	architecture.finish()

func _build_environment() -> void:
	var world := WorldEnvironment.new()
	var env := Environment.new()
	var sky := Sky.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color("2d6bb1")
	sky_mat.sky_horizon_color = Color("f4d9b1")
	sky_mat.ground_horizon_color = Color("b8c994")
	sky_mat.ground_bottom_color = Color("3d654f")
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("f6e7c8")
	env.ambient_light_energy = 0.62
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.glow_enabled = true
	env.glow_intensity = 0.55
	world.environment = env
	add_child(world)
	sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-47, -32, 0)
	sun.light_color = Color("fff1d0")
	sun.light_energy = 1.1
	sun.shadow_enabled = false
	add_child(sun)

func _build_ground_and_walls() -> void:
	box(Vector3(178, 0.4, 188), Vector3(0, -0.25, 0), Color("7f9f70"), true)
	# The thick outer ring follows the circular village wall visible on the map.
	for side in [-1, 1]:
		for z in [-70, -27, 27, 70]:
			box(Vector3(1.3, 5.2, 38), Vector3(side*87, 2.45, z), Color("778f78"), true)
	for x in [-62, -20, 20, 62]:
		box(Vector3(38, 5.2, 1.3), Vector3(x, 2.45, -91), Color("778f78"), true)
		box(Vector3(38, 5.2, 1.3), Vector3(x, 2.45, 91), Color("778f78"), true)
	# Gate towers mark the main entrance on the eastern side and three smaller exits.
	_gate(Vector3(84.7, 0, 2), 0.0, "PORTE PRINCIPALE")
	_gate(Vector3(-84.7, 0, 2), PI, "PORTE OUEST")
	_gate(Vector3(0, 0, 88.5), PI/2, "PORTE SUD")
	_gate(Vector3(0, 0, -88.5), -PI/2, "PORTE NORD")

func _gate(point: Vector3, angle: float, title: String) -> void:
	var side := Vector3(cos(angle), 0, -sin(angle))
	for offset in [-4.7, 4.7]:
		box(Vector3(1.25, 7.5, 1.4), point + side*offset + Vector3.UP*3.75, Color("725344"), true)
		box(Vector3(0.75, 5.8, 0.8), point + side*offset + Vector3.UP*3.0, Color("b86450"))
	box(Vector3(11.0, 0.85, 2.0), point + Vector3.UP*7.4, Color("3d706b"))
	_sign(title, point + Vector3.UP*6.1, 24, angle + PI/2)

func _build_roads_and_water() -> void:
	# Yellow road network interpreted from the supplied overhead map.
	_road(Vector3(0, 0, 0), Vector2(9, 164), 0)
	_road(Vector3(0, 0, 2), Vector2(9, 164), PI/2)
	for end in [Vector3(-58,0,-64),Vector3(-67,0,-43),Vector3(-65,0,47),Vector3(27,0,-63),Vector3(59,0,15),Vector3(53,0,-42)]:
		var midpoint := Vector3(end.x*0.48, 0.015, end.z*0.48)
		var length := Vector2(end.x, end.z).length()*0.98
		_road(midpoint, Vector2(6.2,length), atan2(end.x,end.z))
	for point in [Vector3(-43,0,43),Vector3(-45,0,-16),Vector3(23,0,30),Vector3(-8,0,17),Vector3(43,0,-7)]:
		_road(point, Vector2(18, 5.5), 0)
	# Blue river around the northern wall and a branch by the memorial.
	for segment in [
		[Vector3(-82,0,-73),Vector3(-57,0,-79)], [Vector3(-57,0,-79),Vector3(-30,0,-72)],
		[Vector3(-30,0,-72),Vector3(3,0,-80)], [Vector3(3,0,-80),Vector3(36,0,-69)],
		[Vector3(36,0,-69),Vector3(73,0,-74)], [Vector3(48,0,-74),Vector3(57,0,-40)]
	]:
		_water(segment[0], segment[1])
	for point in [Vector3(-30,0,-76),Vector3(4,0,-76),Vector3(48,0,-71),Vector3(54,0,-54)]:
		_bridge(point, 10.0 if point.z < -70 else 7.0, 0)
	# A small hot spring pool and a market plaza add the color blocks seen on the map.
	cylinder(7.0, 0.18, Vector3(-58,0.08,20), Color("73b9c1"), 32)
	cylinder(5.7, 0.19, Vector3(-58,0.18,20), Color("a8d6cc"), 32)
	box(Vector3(26,0.12,18), Vector3(-7,0.06,25), Color("d4ba91"))

func _road(point: Vector3, size: Vector2, angle: float) -> void:
	var road := box(Vector3(size.x, 0.08, size.y), point, Color("d9c58b"))
	road.rotation.y = angle
	var border := box(Vector3(size.x+0.55, 0.035, size.y+0.2), point+Vector3.UP*0.045, Color("baa879"))
	border.rotation.y = angle

func _water(from: Vector3, to: Vector3) -> void:
	var middle := (from+to)*0.5 + Vector3.UP*0.06
	var delta := to-from
	var river := box(Vector3(3.0,0.08,delta.length()+1.5), middle, Color("2d9fc2"))
	river.rotation.y = atan2(delta.x,delta.z)

func _bridge(point: Vector3, length: float, angle: float) -> void:
	var deck := box(Vector3(5.2,0.35,length), point+Vector3.UP*0.25, Color("a76f4e"), true)
	deck.rotation.y = angle
	for side in [-1,1]:
		var rail := box(Vector3(0.18,0.7,length), point+Vector3(side*2.15,0.7,0), Color("6e4b3e"))
		rail.rotation.y = angle

func _build_landmarks() -> void:
	# Four close-up buildings preserve the detailed round-house silhouette from the arrival view.
	_house(Vector3(-34,0,2), "ACADÉMIE")
	_house(Vector3(-7,0,25), "MARCHÉ")
	_house(Vector3(-35,0,-12), "QUARTIER RÉSIDENTIEL")
	_house(Vector3(29,0,20), "MAISON DU QUARTIER")
	architecture.palace(Vector3(0,0,-46))
	_sign("RÉSIDENCE DU HOKAGE", Vector3(0,3.8,-39.0), 28)
	architecture.monument()
	# Public buildings have taller silhouettes to orient the player from every road.
	architecture.tower(Vector3(-8,0,17), "plaster", 10.0)
	_sign("HÔPITAL", Vector3(-8,10.5,17), 24)
	architecture.tower(Vector3(23,0,30), "red", 8.5)
	_sign("POLICE", Vector3(23,9.1,30), 22)
	architecture.tower(Vector3(43,0,-7), "gold", 8.0)
	_sign("STADE", Vector3(43,8.8,-7), 24)
	# Memorial stones and an academy training yard.
	for x in [-7.0,0.0,7.0]:
		box(Vector3(2.4,2.8,0.7), Vector3(53+x*0.3,1.4,-48+absf(x)*0.15), Color("9f9e91"), true)
		_sign("✦", Vector3(53+x*0.3,3.0,-47.5), 28)
	for x in [-42,-34,-26]:
		box(Vector3(0.35,2.8,0.35), Vector3(x,1.4,10), Color("76523d"), true)
		box(Vector3(0.9,1.3,0.12), Vector3(x,2.5,10), Color("c76755"))
	# Market awnings and buying counters.
	for i in range(7):
		var x := -24.0 + float(i)*5.7
		box(Vector3(4.7,0.18,3.2), Vector3(x,3.0,21.5), Color("bd604f") if i%2==0 else Color("e5d6ad"))
		for side in [-1,1]:
			box(Vector3(0.14,2.7,0.14), Vector3(x+side*1.8,1.35,22.5), Color("755541"), true)
		box(Vector3(3.8,0.3,1.8), Vector3(x,1.0,22.0), Color("a47b4f"), true)

func _build_districts() -> void:
	for data: Dictionary in DISTRICTS:
		var point: Vector3 = data["point"]
		var kind: String = data["kind"]
		_sign(str(data["name"]), point+Vector3(0,4.2,0), 20)
		if kind == "forest":
			for i in range(18):
				var angle := float(i)*TAU/18.0
				_tree(point+Vector3(cos(angle)*(8.0+float(i%3)*2.2),0,sin(angle)*(8.0+float(i%4)*1.6)))
			continue
		if kind == "memorial":
			for i in range(4):
				box(Vector3(1.6,2.2,0.7), point+Vector3(float(i-1)*3.0,1.1,2.5), Color("999b91"), true)
			continue
		for i in range(2):
			var angle := float(i)*PI + 0.4
			var home := point + Vector3(cos(angle)*7.0,0,sin(angle)*6.0)
			architecture.compact_house(home, "gold" if i == 0 else "tiles", 4.5+float(i%2)*0.8)
		if kind == "clan":
			box(Vector3(5.2,0.13,1.5), point+Vector3(0,0.07,-3.1), Color("b55d4c"))
			_sign("✦", point+Vector3(0,0.2,-3.8), 24)

func _build_trees_and_gardens() -> void:
	for point in [
		Vector3(-78,0,-23),Vector3(-75,0,22),Vector3(-55,0,70),Vector3(-25,0,73),Vector3(29,0,73),Vector3(70,0,65),
		Vector3(74,0,38),Vector3(73,0,-20),Vector3(68,0,-61),Vector3(31,0,-84),Vector3(-8,0,-84),Vector3(-39,0,-80),
		Vector3(-75,0,-75),Vector3(-52,0,8),Vector3(15,0,-28),Vector3(15,0,52),Vector3(-20,0,30)
	]:
		_tree(point)
	for i in range(14):
		var angle := float(i)*TAU/14.0
		_tree(Vector3(cos(angle)*76.0,0,sin(angle)*76.0))

func _build_village_life() -> void:
	# Main roads: adults and elders make long circuits through the districts.
	var walkers: Array = [
		["woman","Mika · habitante",Vector3(-2,0,54),[Vector3(-2,0,54),Vector3(-2,0,18),Vector3(-34,0,2),Vector3(-44,0,42)],Color("b86d65"),"walking",2.0],
		["man","Daichi · messager",Vector3(8,0,56),[Vector3(8,0,56),Vector3(8,0,-42),Vector3(58,0,15),Vector3(23,0,30)],Color("547d86"),"walking",2.5],
		["elder","Hana · ancienne",Vector3(-48,0,30),[Vector3(-48,0,30),Vector3(-8,0,30),Vector3(-8,0,17)],Color("92715e"),"walking",1.1],
		["woman","Sora · botaniste",Vector3(38,0,42),[Vector3(38,0,42),Vector3(59,0,15),Vector3(43,0,-7),Vector3(27,0,-63)],Color("6f9b72"),"walking",1.6],
		["man","Ren · garde",Vector3(74,0,2),[Vector3(74,0,2),Vector3(42,0,-7),Vector3(0,0,-46),Vector3(23,0,30)],Color("41616e"),"walking",2.2],
		["woman","Aya · couturière",Vector3(-60,0,8),[Vector3(-60,0,8),Vector3(-45,0,-16),Vector3(-25,0,-31),Vector3(-7,0,25)],Color("c5845e"),"walking",1.7],
		["man","Taro · livreur",Vector3(27,0,-63),[Vector3(27,0,-63),Vector3(0,0,0),Vector3(-34,0,2),Vector3(-7,0,25)],Color("7c6b9d"),"walking",2.3],
		["woman","Emi · archiviste",Vector3(53,0,-42),[Vector3(53,0,-42),Vector3(0,0,-46),Vector3(-8,0,17)],Color("8a6e9c"),"walking",1.4]
	]
	for data: Array in walkers:
		_spawn_npc(data)
	# Pairs and trios pause together at crossroads: they visibly converse, then resume.
	var talkers: Array = [
		["woman","Yui · vendeuse",Vector3(-20,0,26),[Vector3(-20,0,26),Vector3(-13,0,27)],Color("d07b65"),"discussion",1.2],
		["man","Kenta · artisan",Vector3(-13,0,27),[Vector3(-13,0,27),Vector3(-20,0,26)],Color("557a8d"),"discussion",1.2],
		["elder","Momo · conteuse",Vector3(-29,0,-4),[Vector3(-29,0,-4),Vector3(-24,0,-3)],Color("ad8460"),"discussion",0.9],
		["woman","Rika · professeure",Vector3(-24,0,-3),[Vector3(-24,0,-3),Vector3(-29,0,-4)],Color("6e8e76"),"discussion",0.9],
		["man","Hiro · pêcheur",Vector3(48,0,-37),[Vector3(48,0,-37),Vector3(54,0,-35)],Color("63899a"),"discussion",1.0],
		["woman","Nami · voyageuse",Vector3(54,0,-35),[Vector3(54,0,-35),Vector3(48,0,-37)],Color("c0828d"),"discussion",1.0]
	]
	for data: Array in talkers:
		_spawn_npc(data)
		discussion_count += 1
	# Market shoppers stop at successive stalls; they are deliberately distinct from vendors.
	var shoppers: Array = [
		["woman","Lina · achats",Vector3(-23,0,28),[Vector3(-23,0,28),Vector3(-12,0,28),Vector3(-1,0,28),Vector3(-12,0,23)],Color("d08b82"),"shopping",1.25],
		["man","Seki · achats",Vector3(-17,0,30),[Vector3(-17,0,30),Vector3(-6,0,30),Vector3(5,0,30),Vector3(-17,0,23)],Color("5d7d91"),"shopping",1.45],
		["elder","Oji · panier",Vector3(-5,0,22),[Vector3(-5,0,22),Vector3(-17,0,22),Vector3(-23,0,26)],Color("a67b60"),"shopping",0.9],
		["girl","Mia · goûter",Vector3(-1,0,25),[Vector3(-1,0,25),Vector3(10,0,25),Vector3(10,0,20),Vector3(-1,0,20)],Color("e3a85f"),"shopping",1.7],
		["boy","Jun · curieux",Vector3(-28,0,23),[Vector3(-28,0,23),Vector3(-18,0,19),Vector3(-8,0,23)],Color("7197a5"),"shopping",1.8]
	]
	for data: Array in shoppers:
		_spawn_npc(data)
		shopping_count += 1
	# Merchants stay behind their counters and animate their hands/head while shoppers pass.
	var merchants: Array = [
		["woman","Marchande · fruits",Vector3(-23,0,22),[Vector3(-23,0,22),Vector3(-22.6,0,22)],Color("b96755"),"merchant",0.35],
		["man","Marchand · ramen",Vector3(-12,0,22),[Vector3(-12,0,22),Vector3(-11.6,0,22)],Color("567b69"),"merchant",0.35],
		["woman","Marchande · tissus",Vector3(-1,0,22),[Vector3(-1,0,22),Vector3(-0.6,0,22)],Color("9b6a9b"),"merchant",0.35],
		["elder","Marchand · thé",Vector3(10,0,22),[Vector3(10,0,22),Vector3(10.4,0,22)],Color("9b795c"),"merchant",0.35]
	]
	for data: Array in merchants:
		_spawn_npc(data)
	# Domestic animals wander around homes, the market and the hot springs.
	var animals: Array = [
		["dog","Chien de garde",Vector3(-62,0,11),[Vector3(-62,0,11),Vector3(-51,0,16),Vector3(-55,0,24)],Color("a36e4c"),"walking",2.2],
		["cat","Chat du marché",Vector3(-4,0,20),[Vector3(-4,0,20),Vector3(8,0,18),Vector3(5,0,29)],Color("d29c68"),"walking",1.1],
		["pig","Porc de la ferme",Vector3(25,0,52),[Vector3(25,0,52),Vector3(36,0,54),Vector3(43,0,47)],Color("e5a5a2"),"walking",0.8],
		["chicken","Poule",Vector3(36,0,51),[Vector3(36,0,51),Vector3(41,0,48),Vector3(32,0,45)],Color("eee1bb"),"walking",1.0],
		["dog","Chien ninja",Vector3(26,0,-57),[Vector3(26,0,-57),Vector3(18,0,-64),Vector3(34,0,-66)],Color("765b50"),"walking",2.0],
		["cat","Chat des bains",Vector3(-54,0,18),[Vector3(-54,0,18),Vector3(-62,0,21),Vector3(-57,0,28)],Color("c88669"),"walking",1.0]
	]
	for data: Array in animals:
		_spawn_npc(data)
		animal_count += 1

func _spawn_npc(data: Array) -> void:
	var npc := KonohaNPC.new()
	add_child(npc)
	npc.configure(str(data[0]),str(data[1]),data[2],data[3],data[4],str(data[5]),float(data[6]))
	npcs.append(npc)
	npc_count += 1
	if npc.route.size() > 1:
		moving_npc_count += 1

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
	label_node.outline_size = 3
	label_node.outline_modulate = Color("e8d7ac")
	add_child(label_node)
