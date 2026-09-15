class_name KonohaMap
extends TrainingArena
## Full Konoha district: a readable, explorable village built from the supplied map layout.
## The scenery combines bounded procedural collision with selected generated sky, earth and water textures.

const SKY_ART: Texture2D = preload("res://assets/konoha/sky_mountain_panorama.png")
const EARTH_ART: Texture2D = preload("res://assets/konoha/earth_ground_texture.png")
const RIVER_ART: Texture2D = preload("res://assets/konoha/river_water_texture.png")
# The replacement river tile is square; this keeps its texels proportional while
# repeating it along each long water segment rather than stretching it.
const RIVER_ASPECT: float = 1.0
const CLAN_EMBLEMS: Array[String] = [
	"UCH", "UZU", "SEN", "HYU", "AKI", "YAM", "ABU", "INU", "FUS", "ITA", "KUR", "SHU", "YEA", "ACK"
]
const CLAN_FLAG_COLORS: Array[Color] = [
	Color("6d3f9f"), Color("3a7ca5"), Color("6c9b61"), Color("ded1a0"),
	Color("b84b45"), Color("d48a62"), Color("34434a"), Color("76513b"),
	Color("8b2c35"), Color("bd4e3b"), Color("3d718c"), Color("bf6d87"),
	Color("8d4e3e"), Color("e5e4d2")
]
const CLAN_SANCTUARIES: Array[PackedScene] = [
	preload("res://assets/konoha/sanctuaries/01_uchiwa.glb"),
	preload("res://assets/konoha/sanctuaries/02_uzumaki.glb"),
	preload("res://assets/konoha/sanctuaries/03_senju.glb"),
	preload("res://assets/konoha/sanctuaries/04_hyuga.glb"),
	preload("res://assets/konoha/sanctuaries/05_akimichi.glb"),
	preload("res://assets/konoha/sanctuaries/06_yamanaka.glb"),
	preload("res://assets/konoha/sanctuaries/07_aburame.glb"),
	preload("res://assets/konoha/sanctuaries/08_inuzuka.glb"),
	preload("res://assets/konoha/sanctuaries/09_fushiguro.glb"),
	preload("res://assets/konoha/sanctuaries/10_itadori.glb"),
	preload("res://assets/konoha/sanctuaries/11_kurosaki.glb"),
	preload("res://assets/konoha/sanctuaries/12_shunsui.glb"),
	preload("res://assets/konoha/sanctuaries/13_yeager.glb"),
	preload("res://assets/konoha/sanctuaries/14_ackerman.glb")
]

const BOUNDS := Vector2(150.0, 160.0)
# Shared sanctuary layout data is consumed by ClanMissionManager rather than
# duplicated coordinate checks. The gate opens onto a real walled courtyard.
const SANCTUARY_HALF_DEPTH: float = 17.0
const CLAN_SANCTUARY_OFFSET := Vector3(0, 0, -18.0)
const CLAN_GATE_WIDTH: float = 6.0
const SPAWN := Vector3(0, 0.25, 78)
const GUIDE := Vector3(-4.0, -0.05, 65)
# Périmètre réservé à la grande Académie Ninja : bâtiment x [-60,-32] z [-50,-18],
# cour x [-61,-40] z [-18,-6] et raccord vers la route transversale z = 0.
const ACADEMY_CLEAR := Rect2(Vector2(-62.5, -53.0), Vector2(33.0, 49.5))
const LANDMARKS: Array[Dictionary] = [
	{"name": "Académie", "point": Vector3(-46, 0, -13), "text": "La grande Académie Ninja forme les shinobi de Konoha : hall d’accueil, réception, salle des informations, zone d’entraînement, salles de cours et grande salle des équipes à l’étage."},
	{"name": "Marché", "point": Vector3(-20, 0, 17), "text": "Le marché central rassemble les marchands, les familles et les voyageurs. Les habitants négocient ici leurs achats quotidiens."},
	{"name": "Résidence du Hokage", "point": Vector3(0, 0, -68), "text": "La résidence agrandie du Hokage domine l’axe central, face aux grands visages de la montagne."}
]
const DISTRICTS: Array[Dictionary] = [
	{"name":"FORÊT DE LA MORT", "point":Vector3(-125,0,-125), "kind":"forest"},
	# Former sanctuary volumes stay together in two inner housing rings, away from the main roads.
	{"name":"QUARTIER SHUN", "point":Vector3(-70,0,68), "kind":"residential"},
	{"name":"QUARTIER HATTORI", "point":Vector3(-42,0,68), "kind":"residential"},
	{"name":"QUARTIER HYŪGA", "point":Vector3(-14,0,68), "kind":"residential"},
	{"name":"QUARTIER UZUMAKI", "point":Vector3(14,0,68), "kind":"residential"},
	{"name":"QUARTIER UCHIWA", "point":Vector3(42,0,68), "kind":"residential"},
	{"name":"QUARTIER NARA", "point":Vector3(70,0,68), "kind":"residential"},
	{"name":"QUARTIER AKIMICHI", "point":Vector3(-70,0,38), "kind":"residential"},
	{"name":"QUARTIER YAMANAKA", "point":Vector3(-70,0,8), "kind":"residential"},
	{"name":"QUARTIER INUZUKA", "point":Vector3(-70,0,-22), "kind":"residential"},
	{"name":"QUARTIER ABURAME", "point":Vector3(-70,0,-52), "kind":"residential"},
	{"name":"QUARTIER HATAKE", "point":Vector3(70,0,38), "kind":"residential"},
	{"name":"QUARTIER SENJU", "point":Vector3(70,0,8), "kind":"residential"},
	{"name":"QUARTIER FUSHIGURO", "point":Vector3(70,0,-22), "kind":"residential"},
	{"name":"QUARTIER ITADORI", "point":Vector3(70,0,-52), "kind":"residential"},
	{"name":"QUARTIER KUROSAKI", "point":Vector3(-70,0,-68), "kind":"residential"},
	{"name":"QUARTIER SHUNSUI", "point":Vector3(-42,0,-68), "kind":"residential"},
	{"name":"QUARTIER YEAGER", "point":Vector3(42,0,-68), "kind":"residential"},
	{"name":"QUARTIER ACKERMAN", "point":Vector3(70,0,-68), "kind":"residential"},
	# Four calm outer rows hold the fourteen clans; each domain has a clear access road and plaza.
	{"name":"CLAN UCHIWA", "point":Vector3(-84,0,110), "kind":"clan"},
	{"name":"CLAN UZUMAKI", "point":Vector3(-28,0,110), "kind":"clan"},
	{"name":"CLAN SENJU", "point":Vector3(28,0,110), "kind":"clan"},
	{"name":"CLAN HYŪGA", "point":Vector3(84,0,110), "kind":"clan"},
	{"name":"CLAN AKIMICHI", "point":Vector3(-110,0,52), "kind":"clan"},
	{"name":"CLAN YAMANAKA", "point":Vector3(-110,0,-4), "kind":"clan"},
	{"name":"CLAN ABURAME", "point":Vector3(-110,0,-60), "kind":"clan"},
	{"name":"CLAN INUZUKA", "point":Vector3(-110,0,-110), "kind":"clan"},
	{"name":"CLAN FUSHIGURO", "point":Vector3(110,0,52), "kind":"clan"},
	{"name":"CLAN ITADORI", "point":Vector3(110,0,-4), "kind":"clan"},
	{"name":"CLAN KUROSAKI", "point":Vector3(110,0,-60), "kind":"clan"},
	# Keep the southern clan domains outside the Hokage image and rock shelf.
	{"name":"CLAN SHUNSUI", "point":Vector3(-84,0,-110), "kind":"clan"},
	{"name":"CLAN YEAGER", "point":Vector3(84,0,-110), "kind":"clan"},
	{"name":"CLAN ACKERMAN", "point":Vector3(112,0,-110), "kind":"clan"},
	{"name":"POSTE DE POLICE", "point":Vector3(26,0,30), "kind":"public"},
	{"name":"HÔPITAL", "point":Vector3(-24,0,28), "kind":"public"},
	{"name":"STADE", "point":Vector3(42,0,-22), "kind":"public"},
	{"name":"MÉMORIAL DE KONOHA", "point":Vector3(76,0,-52), "kind":"memorial"}
]

var architecture: KonohaArchitecture
var npcs: Array[KonohaNPC] = []
var npc_count: int = 0
var moving_npc_count: int = 0
var animal_count: int = 0
var discussion_count: int = 0
var shopping_count: int = 0
var environment_texture_count: int = 0

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
	var sky_mat := PanoramaSkyMaterial.new()
	sky_mat.panorama = SKY_ART
	sky_mat.energy_multiplier = 0.78
	sky.sky_material = sky_mat
	environment_texture_count += 1
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
	var ground := box(Vector3(308, 0.4, 328), Vector3(0, -0.25, 0), Color.WHITE, true)
	var earth_material := TrainingFighter.material(Color.WHITE)
	earth_material.albedo_texture = EARTH_ART
	earth_material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	earth_material.texture_repeat = true
	earth_material.uv1_scale = Vector3(13.0, 13.0, 13.0)
	ground.material_override = earth_material
	environment_texture_count += 1
	# The thick outer ring follows the circular village wall visible on the map.
	for side in [-1, 1]:
		for z in [-120, -60, 0, 60, 120]:
			box(Vector3(1.3, 5.2, 54), Vector3(side*151, 2.45, z), Color("778f78"), true)
	for x in [-120, -60, 0, 60, 120]:
		box(Vector3(54, 5.2, 1.3), Vector3(x, 2.45, -161), Color("778f78"), true)
		box(Vector3(54, 5.2, 1.3), Vector3(x, 2.45, 161), Color("778f78"), true)
	# Four closed Konoha gates define the cardinal boundary. They are visual,
	# solid architectural landmarks only: no exterior transition is connected.
	_gate(Vector3(148.7, 0, 2), 0.0, "PORTE EST DE KONOHA")
	_gate(Vector3(-148.7, 0, 2), PI, "PORTE OUEST DE KONOHA")
	_gate(Vector3(0, 0, 158.5), PI/2, "PORTE SUD DE KONOHA")
	_gate(Vector3(0, 0, -158.5), -PI/2, "PORTE NORD DE KONOHA")

func _gate_box(size: Vector3, point: Vector3, yaw: float, color: Color, solid: bool = false) -> MeshInstance3D:
	var node := box(size, point, color, solid)
	node.rotation.y = yaw
	return node

func _gate(point: Vector3, angle: float, title: String) -> void:
	# `angle` remains part of the gate description for the four cardinal
	# placements; the point itself gives the exact outward normal on the ring.
	var normal := Vector3.ZERO
	if absf(point.x) > absf(point.z):
		normal = Vector3(signf(point.x), 0, 0)
	else:
		normal = Vector3(0, 0, signf(point.z))
	var tangent := Vector3(-normal.z, 0, normal.x)
	var yaw := atan2(normal.x, normal.z)
	var inner := point - normal * 0.65
	var up := Vector3.UP
	var tower_color := Color("b57645")
	var plaster_color := Color("dbc89e")
	var roof_color := Color("c27a32")
	var roof_dark := Color("75462d")
	var door_color := Color("527f68")
	var door_trim := Color("315847")

	# Two heavy timber towers and the white plaster lintel echo the reference
	# image while remaining simple, shared-material Android geometry.
	for side in [-1.0, 1.0]:
		var tower_point: Vector3 = inner + tangent * float(side) * 4.75
		_gate_box(Vector3(1.15, 6.2, 1.55), tower_point + up * 3.1, yaw, tower_color, true)
		_gate_box(Vector3(0.78, 5.25, 0.92), tower_point + up * 3.0 - normal * 0.10, yaw, plaster_color)
		_gate_box(Vector3(1.55, 0.26, 1.95), tower_point + up * 6.25 - normal * 0.08, yaw, roof_dark)

	# Broad roof with stepped eaves, a ridge and warm tile tones.
	_gate_box(Vector3(12.4, 0.34, 3.35), inner - normal * 0.70 + up * 6.85, yaw, roof_dark)
	_gate_box(Vector3(11.7, 0.38, 3.00), inner - normal * 0.80 + up * 7.15, yaw, roof_color)
	_gate_box(Vector3(10.2, 0.34, 2.35), inner - normal * 0.88 + up * 7.48, yaw, Color("d18a36"))
	_gate_box(Vector3(6.2, 0.30, 1.20), inner - normal * 0.95 + up * 7.78, yaw, Color("9a5a2c"))
	_gate_box(Vector3(12.9, 0.16, 0.22), inner - normal * 1.02 + up * 6.63, yaw, Color("e0a04d"))

	# White signboard above a closed double door.
	_gate_box(Vector3(8.0, 1.35, 0.38), inner - normal * 0.15 + up * 5.35, yaw, plaster_color, true)
	_gate_box(Vector3(8.35, 0.18, 0.52), inner - normal * 0.38 + up * 6.08, yaw, roof_dark)
	_gate_box(Vector3(8.35, 0.18, 0.52), inner - normal * 0.38 + up * 4.63, yaw, roof_dark)

	# The two green leaves meet in the middle and are collidable: the outside
	# is intentionally not accessible yet, even though the gate reads clearly.
	for side in [-1.0, 1.0]:
		var leaf: Vector3 = inner + tangent * float(side) * 1.78 - normal * 0.38 + up * 2.25
		_gate_box(Vector3(3.45, 4.25, 0.20), leaf, yaw, door_color, true)
		_gate_box(Vector3(3.52, 4.34, 0.08), leaf - normal * 0.12, yaw, door_trim)
		_sign("木", leaf - normal * 0.20 + up * 0.10, 56, yaw + PI)
	_gate_box(Vector3(0.12, 4.25, 0.28), inner - normal * 0.55 + up * 2.25, yaw, Color("243b31"), true)

	_sign("◎  KONOHA  ◎", inner - normal * 0.42 + up * 5.38, 22, yaw + PI)
	_sign(title, inner - normal * 0.44 + up * 4.78, 13, yaw + PI)
	_sign("ACCÈS EXTÉRIEUR FERMÉ", inner - normal * 0.45 + up * 0.45, 11, yaw + PI)

func _build_roads_and_water() -> void:
	# A clean central cross and a wide outer ring leave every house plot off the asphalt.
	_road(Vector3(0, 0, 0), Vector2(8, 292), 0)
	_road(Vector3(0, 0, 0), Vector2(8, 292), PI/2)
	for x in [-92.0,92.0]:
		_road(Vector3(x,0,0), Vector2(5.2,250), 0)
	for z in [-92.0,92.0]:
		_road(Vector3(0,0,z), Vector2(250,5.2), PI/2)
	# Each clan gets one short access street from the ring to its own forecourt.
	for data: Dictionary in DISTRICTS:
		if data["kind"] == "clan":
			_district_access(data["point"])
	# Blue river around the northern wall and a branch by the memorial.
	for segment in [
		[Vector3(-145,0,-132),Vector3(-100,0,-143)], [Vector3(-100,0,-143),Vector3(-50,0,-136)],
		[Vector3(-50,0,-136),Vector3(4,0,-148)], [Vector3(4,0,-148),Vector3(60,0,-137)],
		[Vector3(60,0,-137),Vector3(122,0,-143)], [Vector3(84,0,-143),Vector3(92,0,-88)]
	]:
		_water(segment[0], segment[1])
	for point in [Vector3(-50,0,-140),Vector3(4,0,-143),Vector3(84,0,-138),Vector3(90,0,-110)]:
		_bridge(point, 10.0 if point.z < -130 else 7.0, 0)
	# Only a few street-to-street connectors use real short stair runs; most roads stay level.
	_steps(Vector3(-40,0,36), 0.0, 5.0, 6, 0.22, 1.1)
	_steps(Vector3(40,0,40), PI/2, 4.5, 5, 0.20, 1.0)
	_steps(Vector3(-80,0,-40), 0.55, 5.0, 7, 0.18, 1.0)
	_steps(Vector3(76,0,-78), PI, 4.5, 6, 0.20, 1.0)
	# A small hot spring pool and a market plaza add the color blocks seen on the map.
	cylinder(7.0, 0.18, Vector3(-58,0.08,20), Color("73b9c1"), 32)
	cylinder(5.7, 0.19, Vector3(-58,0.18,20), Color("a8d6cc"), 32)
	box(Vector3(26,0.12,18), Vector3(-7,0.06,25), Color("d4ba91"))

func _district_access(point: Vector3) -> void:
	var anchor := point
	if absf(point.x) > absf(point.z):
		anchor = Vector3(92.0 if point.x > 0 else -92.0, 0, point.z)
	else:
		anchor = Vector3(point.x, 0, 92.0 if point.z > 0 else -92.0)
	var delta := point-anchor
	var midpoint := (point+anchor)*0.5 + Vector3(0,0.015,0)
	_road(midpoint, Vector2(5.2,delta.length()+4.0), atan2(delta.x,delta.z))

func _road(point: Vector3, size: Vector2, angle: float) -> void:
	var road := box(Vector3(size.x, 0.08, size.y), point, Color("d9c58b"))
	road.rotation.y = angle
	var border := box(Vector3(size.x+0.55, 0.035, size.y+0.2), point+Vector3.UP*0.045, Color("baa879"))
	border.rotation.y = angle

func _water(from: Vector3, to: Vector3) -> void:
	# The water texture repeats along the stream: it keeps its aspect instead of being stretched over each segment.
	var middle := (from+to)*0.5 + Vector3.UP*0.075
	var delta := to-from
	var width := 4.2
	var length := delta.length()+1.5
	var river := MeshInstance3D.new()
	var quad := QuadMesh.new()
	quad.size = Vector2(width, length)
	river.mesh = quad
	river.position = middle
	river.rotation = Vector3(-PI/2, atan2(delta.x,delta.z), 0)
	var material := TrainingFighter.material(Color.WHITE)
	material.albedo_texture = RIVER_ART
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	material.texture_repeat = true
	material.uv1_scale = Vector3(1.0, maxf(1.0, length*RIVER_ASPECT/width), 1.0)
	river.material_override = material
	add_child(river)
	environment_texture_count += 1

func _bridge(point: Vector3, length: float, angle: float) -> void:
	var deck := box(Vector3(5.2,0.35,length), point+Vector3.UP*0.25, Color("a76f4e"), true)
	deck.rotation.y = angle
	for side in [-1,1]:
		var rail := box(Vector3(0.18,0.7,length), point+Vector3(side*2.15,0.7,0), Color("6e4b3e"))
		rail.rotation.y = angle

func _steps(point: Vector3, angle: float, width: float, count: int, rise: float, run: float) -> void:
	var forward := Vector3(sin(angle),0,cos(angle))
	for i in range(count):
		var height := rise*float(i+1)
		var step_point := point + forward*(run*(float(i)+0.5)) + Vector3.UP*(height*0.5)
		var step := box(Vector3(width,height,run), step_point, Color("9b795b"), true)
		step.rotation.y = angle
		var lip := box(Vector3(width+0.16,0.08,0.10), point + forward*(run*(float(i)+0.95)) + Vector3.UP*height, Color("d5b983"), true)
		lip.rotation.y = angle
	# The individual steps provide the visible treads; this convex wedge closes
	# the side gaps and makes the whole stair run a real climbable collider.
	var wedge := ConvexPolygonShape3D.new()
	var total_run := run*float(count)
	var total_height := rise*float(count)
	wedge.points = PackedVector3Array([
		Vector3(-width*0.5,0,0), Vector3(width*0.5,0,0),
		Vector3(-width*0.5,0,total_run), Vector3(width*0.5,0,total_run),
		Vector3(-width*0.5,total_height,total_run), Vector3(width*0.5,total_height,total_run)
	])
	var stair_body := StaticBody3D.new()
	stair_body.name = "SolidStairRun"
	stair_body.position = point
	stair_body.rotation.y = angle
	stair_body.collision_layer = 1
	stair_body.collision_mask = 0
	var stair_collision := CollisionShape3D.new()
	stair_collision.shape = wedge
	stair_body.add_child(stair_collision)
	add_child(stair_body)

func _build_landmarks() -> void:
	# Four close-up buildings preserve the detailed round-house silhouette from the arrival view.
	# La grande Académie Ninja (academy.gd) occupe désormais le site nord-ouest ;
	# l'ancienne bâtisse devient l'internat des élèves, près de la cour.
	_house(Vector3(-34,0,2), "INTERNAT DES ÉLÈVES")
	_house(Vector3(-7,0,25), "MARCHÉ")
	_house(Vector3(-35,0,-12), "QUARTIER RÉSIDENTIEL")
	_house(Vector3(29,0,20), "MAISON DU QUARTIER")
	# The Hokage volumes overlap into one glued compound instead of three isolated houses.
	architecture.palace(Vector3(-7,0,-78))
	architecture.palace(Vector3(7,0,-78))
	architecture.palace(Vector3(0,0,-87))
	architecture.main_door(Vector3(0,0,-78))
	_sign("RÉSIDENCE DU HOKAGE · GRAND COMPOUND", Vector3(0,4.2,-66.0), 30)
	_sign("PORTE FERMÉE · SCEAU BLEU", Vector3(0,2.25,-66.0), 15)
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
	var clan_variant: int = 0
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
		if kind == "residential":
			# Preserve one former sanctuary volume as a house; do not add a second
			# sanctuary or a duplicate four-home ring at the same legacy plot.
			var legacy_point := point+Vector3(0,0,-9.5)
			box(Vector3(14.0,0.12,14.0), legacy_point+Vector3.UP*0.05, Color("c7b084"))
			architecture.residential_hall(legacy_point, int(absf(point.x+point.z))%6)
			_sign("MAISON DU QUARTIER "+str(data["name"]), legacy_point+Vector3(0,5.0,0), 15)
			continue
		if kind == "clan":
			# The sanctuary owns the rear half of the domain. Homes stay on the
			# opposite side so no former plot or house cuts through the Blender asset.
			var sanctuary_point: Vector3 = point + CLAN_SANCTUARY_OFFSET
			_sanctuary_domain(sanctuary_point, str(data["name"]), clan_variant)
			for i in range(4):
				var angle := float(i)*TAU/4.0 + 0.4
				var home_center := point + Vector3(0,0,12.0)
				var home := home_center + Vector3(cos(angle)*(7.0+float(i%3)*1.8),0,sin(angle)*(5.0+float(i%2)*1.2))
				if i == 0:
					architecture.compact_house(home, "gold", 4.4)
				elif i == 1:
					architecture.courtyard_house(home, "red" if int(absf(point.x))%2 == 0 else "plaster")
				elif i == 2:
					architecture.stilt_house(home, "tiles")
				else:
					architecture.compact_house(home, "tiles", 5.8)
			architecture.apartment_block(point+Vector3(0,0,26.0), "red" if int(absf(point.x))%2 == 0 else "plaster")
			# The true Blender sanctuary is large, solid and separated from the homes.
			_build_blender_sanctuary(sanctuary_point, clan_variant)
			clan_variant += 1
			_sign("SANCTUAIRE "+str(data["name"]), sanctuary_point+Vector3(0,8.0,0), 16)
			_sign("DOMAINE DU "+str(data["name"]), sanctuary_point+Vector3(0,1.5,17.8), 14)
			# The approach stays open: the old solid welcome block at this point
			# trapped the player in front of every courtyard gate.
			_sign("✦", point+Vector3(0,0.2,-3.8), 24)

func _sanctuary_domain(point: Vector3, title: String, variant: int) -> void:
	# Every sanctuary gets its own walled courtyard. The front is split into
	# two solid fence sections so the central gate remains genuinely passable.
	var half_width := 13.5
	var half_depth: float = SANCTUARY_HALF_DEPTH
	var wall_height := 2.7
	var wall_color := Color("80624d")
	var trim_color := Color("b98a55")
	box(Vector3(0.55,wall_height,half_depth*2.0), point+Vector3(-half_width,wall_height*0.5,0), wall_color, true)
	box(Vector3(0.55,wall_height,half_depth*2.0), point+Vector3(half_width,wall_height*0.5,0), wall_color, true)
	box(Vector3(half_width*2.0,wall_height,0.55), point+Vector3(0,wall_height*0.5,-half_depth), wall_color, true)
	var gate_gap: float = CLAN_GATE_WIDTH
	var segment_width := (half_width*2.0-gate_gap)*0.5
	for side in [-1,1]:
		box(Vector3(segment_width,wall_height,0.55), point+Vector3(side*(gate_gap*0.5+segment_width*0.5),wall_height*0.5,half_depth), wall_color, true)
	for side in [-1,1]:
		box(Vector3(0.8,4.6,0.8), point+Vector3(side*gate_gap*0.5,2.3,half_depth), trim_color, true)
	box(Vector3(gate_gap+1.0,0.45,0.9), point+Vector3(0,4.55,half_depth), trim_color, true)
	box(Vector3(half_width*2.0-1.5,0.16,0.18), point+Vector3(0,wall_height+0.18,-half_depth+0.2), trim_color)
	# A visible stone court and a short approach make the entrance readable.
	box(Vector3(half_width*2.0-1.2,0.10,half_depth*2.0-1.2), point+Vector3(0,0.05,0), Color("cdbb91"))
	box(Vector3(gate_gap,0.08,half_depth+3.0), point+Vector3(0,0.10,half_depth*0.5+1.0), Color("d8c28e"))
	_sanctuary_flag(point+Vector3(0,0,11.5), variant)
	_sign("PORTE DU "+title, point+Vector3(0,3.8,half_depth+0.5), 13)

func _sanctuary_flag(point: Vector3, variant: int) -> void:
	var safe_variant := clampi(variant, 0, CLAN_EMBLEMS.size()-1)
	var cloth_color: Color = CLAN_FLAG_COLORS[safe_variant]
	cylinder(0.13,5.8,point+Vector3(0,2.9,0),Color("6e4a34"),10,true)
	box(Vector3(3.6,1.9,0.10),point+Vector3(1.55,4.35,0),cloth_color)
	var emblem := Label3D.new()
	emblem.name = "ClanEmblem_%02d" % (safe_variant+1)
	emblem.text = CLAN_EMBLEMS[safe_variant]
	emblem.position = point+Vector3(1.58,4.33,0.08)
	emblem.font_size = 42
	emblem.pixel_size = 0.012
	emblem.modulate = Color("fff0ce")
	emblem.outline_size = 6
	emblem.outline_modulate = Color("271d1a")
	emblem.rotation.y = PI
	add_child(emblem)
	box(Vector3(0.48,0.48,0.14),point+Vector3(0,5.9,0),Color("d5ac5d"))

func _build_blender_sanctuary(point: Vector3, variant: int) -> void:
	var scene: PackedScene = CLAN_SANCTUARIES[clampi(variant, 0, CLAN_SANCTUARIES.size()-1)]
	var sanctuary := scene.instantiate()
	sanctuary.name = "BlenderSanctuary_%02d" % (variant+1)
	# The GLBs were authored with their lowest mesh vertices at about y=0.18
	# after the Blender object translation. This small correction puts every
	# variant on the same courtyard floor instead of floating it.
	sanctuary.position = point + Vector3(0, -0.24, 0)
	# The source preview is intentionally enlarged for the game: the entrance,
	# torii and roof levels must read as a destination from the outer road.
	sanctuary.scale = Vector3.ONE * 1.35
	add_child(sanctuary)
	architecture.register_external_sanctuary()
	# Use the same simple Godot block collider as the other exterior houses.
	# It sits behind the open courtyard gate, so the player can physically enter
	# the court while the rear hall remains closed by one simple collider.
	var body := StaticBody3D.new()
	body.name = "SanctuaryFootprint_%02d" % (variant+1)
	body.position = point + Vector3(0,3.7,4.5)
	body.collision_layer = 1
	body.collision_mask = 0
	var shape := BoxShape3D.new()
	shape.size = Vector3(18.0,7.4,9.0)
	var collision := CollisionShape3D.new()
	collision.shape = shape
	body.add_child(collision)
	add_child(body)

func _build_trees_and_gardens() -> void:
	for point in [
		Vector3(-138,0,-28),Vector3(-136,0,38),Vector3(-112,0,132),Vector3(-48,0,138),Vector3(28,0,140),Vector3(102,0,132),
		Vector3(138,0,70),Vector3(140,0,-12),Vector3(136,0,-70),Vector3(96,0,-138),Vector3(24,0,-145),Vector3(-48,0,-142),
		Vector3(-118,0,-132),Vector3(-138,0,0),Vector3(18,0,-30),Vector3(20,0,64),Vector3(-70,0,70)
	]:
		_tree(point)
	for i in range(22):
		var angle := float(i)*TAU/22.0
		_tree(Vector3(cos(angle)*137.0,0,sin(angle)*137.0))
	# Several very large forest pockets leave quiet green routes between the separated domains.
	_forest_pocket(Vector3(-112,0,-112), 25.0, 36)
	_forest_pocket(Vector3(112,0,-112), 24.0, 34)
	_forest_pocket(Vector3(-112,0,105), 22.0, 32)
	_forest_pocket(Vector3(108,0,98), 22.0, 32)
	_forest_pocket(Vector3(-72,0,-8), 20.0, 28)
	_forest_pocket(Vector3(72,0,8), 20.0, 28)

func _forest_pocket(center: Vector3, radius: float, count: int) -> void:
	for i in range(count):
		var angle := float(i)*TAU/float(count)
		var local_radius := radius*(0.55+float((i*7)%10)/20.0)
		var spot := center+Vector3(cos(angle)*local_radius,0,sin(angle)*local_radius)
		# La grande Académie Ninja (academy.gd) garde son emprise et sa cour libres :
		# aucun tronc ni rocher de poche forestière ne pousse dans ce périmètre.
		if ACADEMY_CLEAR.has_point(Vector2(spot.x,spot.z)):
			continue
		_tree(spot)
		if i%4 == 0:
			var rock := center+Vector3(cos(angle)*local_radius*0.72,0.18,sin(angle)*local_radius*0.72)
			if not ACADEMY_CLEAR.has_point(Vector2(rock.x,rock.z)):
				box(Vector3(1.2,0.35,0.8), rock, Color("777564"))

func _build_village_life() -> void:
	# Main roads: adults and elders make long circuits through the districts.
	var walkers: Array = [
		["woman","Mika · habitante",Vector3(-2,0,54),[Vector3(-2,0,54),Vector3(-2,0,18),Vector3(-34,0,2),Vector3(-44,0,42)],Color("b86d65"),"walking",2.0],
		["man","Daichi · messager",Vector3(8,0,56),[Vector3(8,0,56),Vector3(8,0,-42),Vector3(58,0,15),Vector3(23,0,30)],Color("547d86"),"walking",2.5],
		["elder","Hana · ancienne",Vector3(-48,0,30),[Vector3(-48,0,30),Vector3(-8,0,30),Vector3(-8,0,17)],Color("92715e"),"walking",1.1],
		["woman","Sora · botaniste",Vector3(38,0,42),[Vector3(38,0,42),Vector3(59,0,15),Vector3(43,0,-7),Vector3(27,0,-63)],Color("6f9b72"),"walking",1.6],
		["man","Ren · garde",Vector3(74,0,2),[Vector3(74,0,2),Vector3(42,0,-7),Vector3(0,0,-46),Vector3(23,0,30)],Color("41616e"),"walking",2.2],
		["woman","Aya · couturière",Vector3(-60,0,8),[Vector3(-60,0,8),Vector3(-38,0,2),Vector3(-25,0,-31),Vector3(-7,0,25)],Color("c5845e"),"walking",1.7],
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
