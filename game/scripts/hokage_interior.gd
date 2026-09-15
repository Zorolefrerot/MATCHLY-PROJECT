class_name HokageInterior
extends Node3D
## Visit-only Hokage residence interior. One lightweight procedural building,
## one player and one transition system; no scene change or teleport is owned here.

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
	"Tsunade Senju", "Kakashi Hatake", "Naruto Uzumaki"
]
const WAR_PANELS: Array[Dictionary] = [
	{"texture": preload("res://assets/konoha/hokage/war_01_alliance.png"), "title": "ALLIANCE SHINOBI", "caption": "Les villages unissent leurs forces."},
	{"texture": preload("res://assets/konoha/hokage/war_02_konoha_forces.png"), "title": "FORCES DE KONOHA", "caption": "La ligne de défense du village."},
	{"texture": preload("res://assets/konoha/hokage/war_03_naruto.png"), "title": "NARUTO · L’ÉTENDARD", "caption": "Le chakra qui rassemble les alliés."},
	{"texture": preload("res://assets/konoha/hokage/war_04_sasuke.png"), "title": "SASUKE · L’ÉCLAIR", "caption": "Un rival face au destin du monde."},
	{"texture": preload("res://assets/konoha/hokage/war_05_reanimated.png"), "title": "LES HOKAGE REVENUS", "caption": "Les anciens protègent les vivants."},
	{"texture": preload("res://assets/konoha/hokage/war_06_madara.png"), "title": "MADARA", "caption": "La menace qui domine le champ de bataille."},
	{"texture": preload("res://assets/konoha/hokage/war_07_obito.png"), "title": "OBITO · LE MASQUE", "caption": "L’ombre derrière la guerre."},
	{"texture": preload("res://assets/konoha/hokage/war_08_ten_tails.png"), "title": "JŪBI", "caption": "La bête à dix queues se lève."},
	{"texture": preload("res://assets/konoha/hokage/war_09_final_battle.png"), "title": "LE DERNIER DUEL", "caption": "Deux destins, une paix à reconstruire."},
	{"texture": preload("res://assets/konoha/hokage/war_10_peace.png"), "title": "APRÈS LA GUERRE", "caption": "Les armes se baissent à l’aube."},
]

const INTERIOR_SPAWN_LOCAL := Vector3(0, 0.25, 4.8)
const EXIT_TRIGGER_LOCAL := Vector3(0, 0.75, 10.15)
const OFFICE_POINT := Vector3(0, 4.65, -7.35)
const SECRETARY_POINT := Vector3(0, 0.0, 8.05)
const GUARD_LEFT_POINT := Vector3(-3.75, 0.0, 9.15)
const GUARD_RIGHT_POINT := Vector3(3.75, 0.0, 9.15)
const UPPER_FLOOR_Y := 4.0
const WALL_TOP_Y := 8.4

var active: bool = false
var built: bool = false
var interior_spawn: Marker3D
var exit_trigger: Area3D
var secretary_zone: Area3D
var guard_zones: Array[Area3D] = []
var static_bodies: Array[StaticBody3D] = []
var staff: Array[Node3D] = []
var secretary: KonohaNPC
var guards: Array[KonohaNPC] = []
var lights: Array[OmniLight3D] = []

func build() -> void:
	if built:
		return
	built = true
	_build_ground_floor()
	_build_first_floor()
	_build_staff()
	_build_transition_nodes()
	_build_lighting()
	set_active(false)

func _build_ground_floor() -> void:
	# Wood floor, restrained tatami inlays and a clear central sightline from
	# the threshold to the reception and the stair on the right.
	box(Vector3(20, 0.22, 22), Vector3(0, -0.11, 0), Color("74513d"), true)
	for z in [-9.6, -7.2, -4.8, -2.4, 0.0, 2.4, 4.8, 7.2, 9.6]:
		box(Vector3(19.2, 0.028, 0.075), Vector3(0, 0.025, z), Color("a67a55"))
	# Entry, hall and waiting carpets are visual only: the player never catches on them.
	box(Vector3(5.4, 0.035, 2.2), Vector3(0, 0.035, 9.55), Color("9b3f43"))
	box(Vector3(5.0, 0.04, 5.8), Vector3(0, 0.04, 4.25), Color("294d55"))
	box(Vector3(4.3, 0.045, 0.9), Vector3(0, 0.045, 1.0), Color("bd925a"))

	# Closed exterior-side envelope with a deliberately open central entrance.
	_wall(Vector3(0, 2.2, -10.8), Vector3(20, 4.4, 0.35), Color("c9b18c"))
	_wall(Vector3(-9.8, 2.2, 0), Vector3(0.35, 4.4, 22), Color("c9b18c"))
	_wall(Vector3(9.8, 2.2, 0), Vector3(0.35, 4.4, 22), Color("c9b18c"))
	_wall(Vector3(-7.3, 2.2, 10.8), Vector3(5.0, 4.4, 0.35), Color("c9b18c"))
	_wall(Vector3(7.3, 2.2, 10.8), Vector3(5.0, 4.4, 0.35), Color("c9b18c"))
	for x in [-8.6, -6.1, -3.6, 3.6, 6.1, 8.6]:
		box(Vector3(0.16, 4.4, 0.16), Vector3(x, 2.2, 10.45), Color("5b3b31"))
	box(Vector3(20, 0.28, 0.22), Vector3(0, 4.1, 10.35), Color("5b3b31"))
	box(Vector3(20, 0.28, 0.22), Vector3(0, 4.1, -10.35), Color("5b3b31"))
	box(Vector3(0.22, 0.28, 21), Vector3(-9.35, 4.1, 0), Color("5b3b31"))
	box(Vector3(0.22, 0.28, 21), Vector3(9.35, 4.1, 0), Color("5b3b31"))

	# Shallow side windows create depth without opening the private pocket to physics.
	_window(Vector3(-9.58, 2.35, -5.8), Vector2(2.7, 2.0), true)
	_window(Vector3(9.58, 2.35, -5.8), Vector2(2.7, 2.0), true)
	_window(Vector3(-9.58, 2.35, 3.0), Vector2(2.7, 2.0), true)
	_window(Vector3(9.58, 2.35, 3.0), Vector2(2.7, 2.0), true)

	# Administrative reception: solid counter, but a wide approach remains free.
	box(Vector3(5.6, 1.12, 1.0), Vector3(0, 0.56, 7.05), Color("56372e"), true)
	box(Vector3(5.9, 0.12, 1.15), Vector3(0, 1.15, 7.05), Color("c28c4e"))
	box(Vector3(5.25, 0.10, 0.12), Vector3(0, 1.22, 6.50), Color("f0d38c"))
	label_3d("ACCUEIL · MISSIONS", Vector3(0, 1.48, 6.38), 16, 0.0)
	_shelf(Vector3(-6.7, 1.35, 7.25), Vector3(2.2, 2.7, 0.45), Color("6e4939"))
	_mission_board(Vector3(-6.0, 2.0, 8.95))
	_waiting_bench(Vector3(-5.3, 0.0, 4.5), PI / 2.0)
	_waiting_bench(Vector3(5.1, 0.0, 4.5), -PI / 2.0)
	_emblem(Vector3(0, 2.55, 10.45), "木", 48)
	label_3d("HALL ADMINISTRATIF", Vector3(0, 3.55, 10.42), 21, PI)
	label_3d("ENTRÉE", Vector3(0, 2.3, 10.05), 13, PI)

	# Staircase is physical geometry; no code path changes when it is climbed.
	_stairs(Vector3(7.0, 0, 7.8), PI, 3.2, 8, 0.50, 0.82)
	for x in [5.35, 8.65]:
		for i in range(4):
			var z := 6.9 - float(i) * 1.65
			cylinder(0.075, 1.15, Vector3(x, 0.6 + float(i) * 0.50, z), Color("b98b50"), 8, true)
		box(Vector3(0.10, 0.10, 5.3), Vector3(x, 2.35, 4.25), Color("b98b50"))
	label_3d("PREMIER NIVEAU", Vector3(7.0, 3.7, 1.0), 14, 0.0)

func _build_first_floor() -> void:
	# The upper floor sits on top of the same stair wedge. It has a compact
	# central corridor, side doors and a wider official office at the back.
	box(Vector3(20, 0.22, 17), Vector3(0, UPPER_FLOOR_Y, -1.8), Color("8b6248"), true)
	for z in [-9.4, -7.4, -5.4, -3.4, -1.4, 0.6, 2.6, 4.6]:
		box(Vector3(19.2, 0.028, 0.07), Vector3(0, UPPER_FLOOR_Y + 0.14, z), Color("b3845a"))
	# Upper envelope and roof beams.
	_wall(Vector3(-9.8, 6.2, -1.8), Vector3(0.35, 4.4, 17), Color("c9b18c"))
	_wall(Vector3(9.8, 6.2, -1.8), Vector3(0.35, 4.4, 17), Color("c9b18c"))
	_wall(Vector3(0, 6.2, -10.0), Vector3(20, 4.4, 0.35), Color("c9b18c"))
	for x in [-9.2, -4.6, 0, 4.6, 9.2]:
		box(Vector3(0.20, 0.26, 16.2), Vector3(x, 8.28, -1.8), Color("5b3b31"))
	box(Vector3(19.2, 0.24, 0.20), Vector3(0, 8.22, 6.05), Color("5b3b31"))
	box(Vector3(19.2, 0.24, 0.20), Vector3(0, 8.22, -10.0), Color("5b3b31"))

	# Corridor walls stop before the grand office entrance; their open ends read as doors.
	_wall(Vector3(-4.2, 6.2, -1.2), Vector3(0.28, 4.4, 7.0), Color("c9b18c"))
	# The right wall has a deliberate landing opening at the top of the stair;
	# the player can enter the corridor without a jump or an invisible blocker.
	_wall(Vector3(4.2, 6.2, -3.45), Vector3(0.28, 4.4, 2.5), Color("c9b18c"))
	_wall(Vector3(4.2, 6.2, 1.95), Vector3(0.28, 4.4, 0.7), Color("c9b18c"))
	box(Vector3(0.12, 3.0, 2.5), Vector3(-4.02, 6.0, 1.95), Color("5c3a30"))
	box(Vector3(0.12, 3.0, 2.5), Vector3(4.02, 6.0, 1.95), Color("5c3a30"))
	label_3d("COULOIR DU CONSEIL", Vector3(0, 5.0, 2.75), 14, 0.0)
	label_3d("SALLE DU CONSEIL", Vector3(-3.65, 5.0, 1.95), 12, PI / 2.0)

	_window(Vector3(-9.58, 6.25, 1.8), Vector2(2.8, 2.0), true)
	_window(Vector3(9.58, 6.25, 1.8), Vector2(2.8, 2.0), true)
	_window(Vector3(-9.58, 6.25, -5.6), Vector2(2.8, 2.0), true)
	_window(Vector3(9.58, 6.25, -5.6), Vector2(2.8, 2.0), true)
	# Small first-floor balcony: visual depth and a safe, collidable overlook,
	# without opening the virtual pocket to the exterior physics world.
	box(Vector3(8.0, 0.18, 1.6), Vector3(0, 4.15, 6.55), Color("6a4738"), true)
	for x in [-3.8, 3.8]:
		box(Vector3(0.18, 1.15, 0.18), Vector3(x, 4.75, 7.15), Color("6a4738"), true)
	box(Vector3(8.0, 0.18, 0.18), Vector3(0, 5.25, 7.15), Color("d1aa62"))
	label_3d("BALCON · VUE SUR KONOHA", Vector3(0, 5.75, 7.05), 13, PI)

	# Historic gallery: five separate frames per side, evenly spaced along the corridor.
	label_3d("GALERIE · 4e GRANDE GUERRE NINJA", Vector3(0, 7.55, 2.45), 15, 0.0)
	var gallery_z := [2.0, 0.15, -1.7, -3.55, -4.65]
	for i in range(5):
		_war_frame(i, Vector3(-4.04, 6.35, gallery_z[i]), true)
		_war_frame(i + 5, Vector3(4.04, 6.35, gallery_z[i]), false)

	# Open official door: strong frame and emblem, with a clear central passage.
	_office_door(Vector3(0, 4.0, -5.35))
	box(Vector3(5.2, 0.10, 1.15), Vector3(0, 4.16, -3.9), Color("8f3f3e"))
	box(Vector3(1.7, 0.08, 4.8), Vector3(0, 4.19, -4.8), Color("b68a54"))
	label_3d("◎ BUREAU DU HOKAGE", Vector3(0, 7.85, -5.32), 18, 0.0)
	label_3d("PALAIS ADMINISTRATIF · ACCÈS AUTORISÉ", Vector3(0, 5.0, -5.0), 11, 0.0)

	# Office walls, furniture and the seven-Hokage historical gallery.
	_wall(Vector3(-6.6, 6.2, -7.0), Vector3(0.25, 4.4, 6.0), Color("b89d7c"))
	_wall(Vector3(6.6, 6.2, -7.0), Vector3(0.25, 4.4, 6.0), Color("b89d7c"))
	box(Vector3(13.2, 0.22, 0.25), Vector3(0, 4.0, -9.7), Color("5b3b31"), true)
	_window(Vector3(-3.8, 6.35, -9.52), Vector2(2.5, 2.1), false)
	_window(Vector3(3.8, 6.35, -9.52), Vector2(2.5, 2.1), false)
	box(Vector3(4.8, 1.20, 1.65), OFFICE_POINT, Color("4f332d"), true)
	box(Vector3(5.15, 0.12, 1.85), OFFICE_POINT + Vector3(0, 0.66, 0), Color("c59653"))
	box(Vector3(2.8, 0.12, 1.5), OFFICE_POINT + Vector3(0, 0.76, -0.7), Color("496d7a"))
	_chair(Vector3(0, 4.0, -5.75), 0.0)
	_shelf(Vector3(-5.45, 5.35, -7.35), Vector3(1.6, 3.4, 0.55), Color("694638"))
	_shelf(Vector3(5.45, 5.35, -7.35), Vector3(1.6, 3.4, 0.55), Color("694638"))
	_scroll(Vector3(-4.4, 5.0, -6.8), 0.36)
	_scroll(Vector3(4.4, 5.0, -6.9), 0.30)
	_emblem(Vector3(0, 7.65, -9.48), "木", 42)
	label_3d("BUREAU DU HOKAGE", Vector3(0, 8.12, -9.4), 19, 0.0)
	label_3d("CONSEIL · ARCHIVES · PROTECTION DU VILLAGE", Vector3(0, 4.55, -8.85), 11, 0.0)
	for i in range(PORTRAITS.size()):
		var x := -5.4 + float(i) * 1.8
		_portrait_card(i, Vector3(x, 6.55, -9.42))

func _build_staff() -> void:
	# KonohaNPC already supplies the lightweight idle pose and appearance logic.
	# Its collision layer is zero, so staff never becomes a physical gate.
	secretary = _staff_actor("HokageSecretary", "Secrétaire des Missions", SECRETARY_POINT, Color("5a7180"), true)
	guards.append(_staff_actor("HokageGuardLeft", "Garde de la résidence", GUARD_LEFT_POINT, Color("3d5961"), false))
	guards.append(_staff_actor("HokageGuardRight", "Garde de la résidence", GUARD_RIGHT_POINT, Color("3d5961"), false))
	for guard in guards:
		staff.append(guard)
	staff.append(secretary)
	secretary_zone = _interaction_zone("HokageSecretaryInteraction", Vector3(0, 0.75, 5.75), Vector3(4.8, 1.6, 1.35))
	guard_zones.append(_interaction_zone("HokageGuardLeftInteraction", GUARD_LEFT_POINT + Vector3(0, 0.75, -0.35), Vector3(1.8, 1.6, 1.8)))
	guard_zones.append(_interaction_zone("HokageGuardRightInteraction", GUARD_RIGHT_POINT + Vector3(0, 0.75, -0.35), Vector3(1.8, 1.6, 1.8)))
	staff_badge(secretary, Color("d6ad62"), "📋")
	for guard in guards:
		staff_badge(guard, Color("8db6bd"), "守")

func _build_transition_nodes() -> void:
	# These nodes are destinations/detection only. KonohaVisit remains the sole
	# owner of the exterior/interior transition state machine.
	interior_spawn = Marker3D.new()
	interior_spawn.name = "HokageInteriorSpawn"
	interior_spawn.position = INTERIOR_SPAWN_LOCAL
	add_child(interior_spawn)
	exit_trigger = Area3D.new()
	exit_trigger.name = "HokageInteriorExitTrigger"
	exit_trigger.position = EXIT_TRIGGER_LOCAL
	exit_trigger.collision_layer = 0
	exit_trigger.collision_mask = 2
	exit_trigger.monitorable = false
	var exit_shape := CollisionShape3D.new()
	var exit_volume := BoxShape3D.new()
	exit_volume.size = Vector3(3.1, 1.5, 1.4)
	exit_shape.shape = exit_volume
	exit_trigger.add_child(exit_shape)
	add_child(exit_trigger)

func _build_lighting() -> void:
	_add_light(Vector3(0, 3.0, 7.0), Color("ffd49b"), 0.75, 8.0)
	_add_light(Vector3(-6.0, 3.0, 1.0), Color("ffcf93"), 0.55, 7.0)
	_add_light(Vector3(7.0, 5.8, 1.0), Color("ffe3b6"), 0.72, 8.5)
	_add_light(Vector3(0, 6.0, -5.0), Color("ffe7bd"), 0.82, 9.0)
	_add_light(Vector3(0, 6.2, -8.8), Color("f1c37c"), 0.62, 7.0)
	_lantern(Vector3(-7.9, 2.55, 9.95), Color("f6bc6d"))
	_lantern(Vector3(7.9, 2.55, 9.95), Color("f6bc6d"))
	_lantern(Vector3(-3.2, 6.2, -5.0), Color("ffd38e"))
	_lantern(Vector3(3.2, 6.2, -5.0), Color("ffd38e"))

func _staff_actor(node_name: String, title: String, point: Vector3, tint: Color, female: bool) -> KonohaNPC:
	var npc := KonohaNPC.new()
	npc.name = node_name
	add_child(npc)
	npc.configure("woman" if female else "man", title, point, [point], tint, "idle", 0.0)
	npc.rotation.y = PI
	return npc

func staff_badge(npc: KonohaNPC, tint: Color, symbol: String) -> void:
	var badge := Label3D.new()
	badge.text = symbol
	badge.position = Vector3(0, 1.95, -0.30)
	badge.font_size = 18
	badge.pixel_size = 0.008
	badge.modulate = tint
	badge.outline_size = 4
	badge.outline_modulate = Color("1e2c31")
	badge.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	npc.add_child(badge)
	var nameplate := Label3D.new()
	nameplate.text = npc.role
	nameplate.position = Vector3(0, 2.35, 0)
	nameplate.font_size = 14
	nameplate.pixel_size = 0.007
	nameplate.modulate = Color("f3dfb0")
	nameplate.outline_size = 5
	nameplate.outline_modulate = Color("263b35")
	nameplate.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	npc.add_child(nameplate)

func _interaction_zone(node_name: String, point: Vector3, size: Vector3) -> Area3D:
	var area := Area3D.new()
	area.name = node_name
	area.position = point
	area.collision_layer = 0
	area.collision_mask = 2
	area.monitorable = false
	var shape := CollisionShape3D.new()
	var volume := BoxShape3D.new()
	volume.size = size
	shape.shape = volume
	area.add_child(shape)
	add_child(area)
	return area

func _window(point: Vector3, size: Vector2, side: bool) -> void:
	var backing_size := Vector3(0.10, size.y, size.x) if side else Vector3(size.x, size.y, 0.10)
	box(backing_size, point, Color("253e4e"))
	var frame_color := Color("6b4637")
	if side:
		for z in [-size.x * 0.5, size.x * 0.5]:
			box(Vector3(0.18, size.y + 0.18, 0.12), point + Vector3(0, 0, z), frame_color)
		box(Vector3(0.18, 0.12, size.x + 0.24), point + Vector3(0, -size.y * 0.5, 0), frame_color)
		box(Vector3(0.18, 0.12, size.x + 0.24), point + Vector3(0, size.y * 0.5, 0), frame_color)
		box(Vector3(0.18, size.y + 0.10, 0.08), point + Vector3(0, 0, 0), frame_color)
	else:
		for x in [-size.x * 0.5, size.x * 0.5]:
			box(Vector3(0.12, size.y + 0.18, 0.18), point + Vector3(x, 0, 0), frame_color)
		box(Vector3(size.x + 0.24, 0.12, 0.18), point + Vector3(0, -size.y * 0.5, 0), frame_color)
		box(Vector3(size.x + 0.24, 0.12, 0.18), point + Vector3(0, size.y * 0.5, 0), frame_color)
		box(Vector3(0.08, size.y + 0.10, 0.18), point, frame_color)
	label_3d("窗", point + Vector3(0, -size.y * 0.5 - 0.25, 0), 10, 0.0)

func _mission_board(point: Vector3) -> void:
	box(Vector3(3.0, 2.45, 0.16), point, Color("59392f"))
	box(Vector3(2.55, 1.95, 0.04), point + Vector3(0, 0, -0.10), Color("e2c58c"))
	label_3d("TABLEAU DES MISSIONS", point + Vector3(0, 0.62, -0.20), 11, PI)
	for x in [-0.72, 0, 0.72]:
		box(Vector3(0.48, 0.62, 0.025), point + Vector3(x, -0.18, -0.14), Color("c78362"))
	label_3d("RANG · RAPPORT · DÉPART", point + Vector3(0, -0.75, -0.20), 9, PI)

func _waiting_bench(point: Vector3, angle: float) -> void:
	var seat := box(Vector3(2.4, 0.18, 0.62), point + Vector3(0, 0.72, 0), Color("684431"))
	seat.rotation.y = angle
	for x in [-0.9, 0.9]:
		var leg := box(Vector3(0.16, 0.72, 0.16), point + Vector3(x, 0.35, 0), Color("4f332c"), true)
		leg.rotation.y = angle

func _shelf(point: Vector3, size: Vector3, tint: Color) -> void:
	box(Vector3(size.x, 0.18, size.z), point + Vector3(0, -size.y * 0.5, 0), tint)
	box(Vector3(size.x, 0.18, size.z), point + Vector3(0, size.y * 0.5, 0), tint)
	box(Vector3(0.16, size.y, size.z), point + Vector3(-size.x * 0.5, 0, 0), tint)
	box(Vector3(0.16, size.y, size.z), point + Vector3(size.x * 0.5, 0, 0), tint)
	for row in range(2):
		var y := point.y - 0.35 + float(row) * 0.72
		for i in range(4):
			var book := box(Vector3(0.16, 0.48, 0.28), Vector3(point.x - 0.7 + float(i) * 0.43, y, point.z - 0.04), Color("8f4f46" if (i + row) % 2 == 0 else "3f6870"))
			book.rotation.z = 0.03 * float(i - 1)

func _scroll(point: Vector3, scale_value: float) -> void:
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.16 * scale_value
	mesh.bottom_radius = 0.16 * scale_value
	mesh.height = 0.8 * scale_value
	mesh.radial_segments = 8
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.position = point
	node.rotation.z = PI / 2.0
	node.material_override = TrainingFighter.material(Color("e6cb8c"))
	add_child(node)

func _chair(point: Vector3, angle: float) -> void:
	var seat := box(Vector3(1.25, 0.18, 1.15), point + Vector3(0, 0.75, 0), Color("644237"))
	seat.rotation.y = angle
	var back := box(Vector3(1.25, 1.35, 0.18), point + Vector3(0, 1.38, 0.48), Color("644237"))
	back.rotation.y = angle
	for x in [-0.45, 0.45]:
		box(Vector3(0.12, 0.75, 0.12), point + Vector3(x, 0.37, 0), Color("4a302b"))

func _office_door(point: Vector3) -> void:
	# Posts and lintel are solid at the sides only. The centre is intentionally
	# open, so the official door is readable but never blocks the office route.
	box(Vector3(0.38, 4.1, 0.42), point + Vector3(-2.65, 2.05, 0), Color("5d392f"), true)
	box(Vector3(0.38, 4.1, 0.42), point + Vector3(2.65, 2.05, 0), Color("5d392f"), true)
	box(Vector3(5.7, 0.42, 0.42), point + Vector3(0, 4.0, 0), Color("b68a54"), true)
	box(Vector3(1.55, 3.25, 0.10), point + Vector3(-1.55, 2.0, 0.12), Color("8d4141"))
	box(Vector3(1.55, 3.25, 0.10), point + Vector3(1.55, 2.0, 0.12), Color("8d4141"))
	_emblem(point + Vector3(0, 2.45, 0.18), "火", 32)

func _war_frame(index: int, point: Vector3, side: bool) -> void:
	var data: Dictionary = WAR_PANELS[index]
	var back_size := Vector3(0.12, 1.34, 2.10) if side else Vector3(2.10, 1.34, 0.12)
	box(back_size, point, Color("4f342d"))
	var image := MeshInstance3D.new()
	var quad := QuadMesh.new()
	quad.size = Vector2(1.78, 0.98)
	image.mesh = quad
	image.position = point + (Vector3(-0.08, 0, 0) if side and point.x < 0 else Vector3(0.08, 0, 0) if side else Vector3(0, 0, 0.08))
	image.rotation.y = PI / 2.0 if side else 0.0
	var material := TrainingFighter.material(Color.WHITE, true)
	material.albedo_texture = data["texture"]
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	image.material_override = material
	add_child(image)
	label_3d(str(data["title"]), point + (Vector3(0, -0.76, 0) if side else Vector3(0, -0.76, 0.08)), 9, 0.0)
	label_3d(str(data["caption"]), point + (Vector3(0, -0.98, 0) if side else Vector3(0, -0.98, 0.08)), 7, 0.0)

func _portrait_card(index: int, point: Vector3) -> void:
	box(Vector3(1.12, 2.62, 0.14), point, Color("5a3a31"))
	var image := MeshInstance3D.new()
	var quad := QuadMesh.new()
	quad.size = Vector2(0.76, 2.24)
	image.mesh = quad
	image.position = point + Vector3(0, 0, 0.09)
	var material := TrainingFighter.material(Color.WHITE, true)
	material.albedo_texture = PORTRAITS[index]
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	image.material_override = material
	add_child(image)
	label_3d(HOKAGE_NAMES[index], point + Vector3(0, -1.53, 0.12), 9, 0.0)

func _lantern(point: Vector3, tint: Color) -> void:
	box(Vector3(0.50, 0.10, 0.50), point + Vector3(0, 0.48, 0), Color("5b3b31"))
	var body := box(Vector3(0.34, 0.58, 0.34), point, tint)
	body.material_override = TrainingFighter.material(tint, true)
	box(Vector3(0.50, 0.10, 0.50), point + Vector3(0, -0.35, 0), Color("5b3b31"))

func _emblem(point: Vector3, text: String, size: int) -> void:
	var ring := Label3D.new()
	ring.text = "◎"
	ring.position = point
	ring.font_size = size + 12
	ring.pixel_size = 0.010
	ring.modulate = Color("d6ad62")
	ring.outline_size = 4
	ring.outline_modulate = Color("4c3029")
	ring.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(ring)
	label_3d(text, point + Vector3(0, -0.03, 0.01), size, 0.0)

func _add_light(point: Vector3, tint: Color, energy: float, radius: float) -> void:
	var light := OmniLight3D.new()
	light.position = point
	light.light_color = tint
	light.light_energy = energy
	light.omni_range = radius
	light.shadow_enabled = false
	add_child(light)
	lights.append(light)

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
		body.name = "InteriorSolid_%03d" % static_bodies.size()
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

func cylinder(radius: float, height: float, point: Vector3, color: Color, segments: int = 12, solid: bool = false) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = segments
	node.mesh = mesh
	node.position = point
	node.material_override = TrainingFighter.material(color)
	add_child(node)
	if solid:
		var body := StaticBody3D.new()
		body.collision_layer = 1
		body.collision_mask = 0
		var shape := CylinderShape3D.new()
		shape.radius = radius
		shape.height = height
		var collision := CollisionShape3D.new()
		collision.shape = shape
		body.add_child(collision)
		node.add_child(body)
		static_bodies.append(body)
	return node

func _wall(point: Vector3, size: Vector3, color: Color = Color("6c5140")) -> void:
	box(size, point, color, true)

func _stairs(point: Vector3, angle: float, width: float, count: int, rise: float, run: float) -> void:
	var forward := Vector3(sin(angle), 0, cos(angle))
	for i in range(count):
		var height := rise * float(i + 1)
		var tread := box(Vector3(width, height, run), point + forward * (run * (float(i) + 0.5)) + Vector3.UP * (height * 0.5), Color("8e684c"), true)
		tread.rotation.y = angle
	var wedge := ConvexPolygonShape3D.new()
	var length := run * float(count)
	var total_height := rise * float(count)
	wedge.points = PackedVector3Array([
		Vector3(-width * 0.5, 0, 0), Vector3(width * 0.5, 0, 0),
		Vector3(-width * 0.5, 0, length), Vector3(width * 0.5, 0, length),
		Vector3(-width * 0.5, total_height, length), Vector3(width * 0.5, total_height, length)
	])
	var body := StaticBody3D.new()
	body.name = "InteriorStairRamp"
	body.position = point
	body.rotation.y = angle
	body.collision_layer = 1
	body.collision_mask = 0
	var collision := CollisionShape3D.new()
	collision.shape = wedge
	body.add_child(collision)
	add_child(body)
	static_bodies.append(body)

	# A thin sloped box is kept alongside the convex wedge. CharacterBody3D
	# follows this continuous physical surface reliably on desktop and Android,
	# while the visible treads above preserve the Japanese stair silhouette.
	var ramp_root := Node3D.new()
	ramp_root.name = "InteriorStairSlope"
	ramp_root.position = point
	ramp_root.rotation.y = angle
	add_child(ramp_root)
	var slope_body := StaticBody3D.new()
	slope_body.name = "InteriorStairSlopeCollision"
	var hypotenuse := sqrt(length * length + total_height * total_height)
	slope_body.position = Vector3(0, total_height * 0.5, hypotenuse * 0.5)
	slope_body.rotation.x = -atan2(total_height, length)
	slope_body.collision_layer = 1
	slope_body.collision_mask = 0
	var slope_shape := BoxShape3D.new()
	slope_shape.size = Vector3(width, 0.24, hypotenuse)
	var slope_collision := CollisionShape3D.new()
	slope_collision.shape = slope_shape
	slope_body.add_child(slope_collision)
	ramp_root.add_child(slope_body)
	static_bodies.append(slope_body)

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
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(label)

func set_active(value: bool) -> void:
	active = value
	visible = value
	if is_instance_valid(exit_trigger):
		exit_trigger.monitoring = value
	if is_instance_valid(secretary_zone):
		secretary_zone.monitoring = value
	for zone in guard_zones:
		if is_instance_valid(zone):
			zone.monitoring = value
	for body in static_bodies:
		if is_instance_valid(body):
			body.collision_layer = 1 if value else 0
			body.collision_mask = 0

func exit_trigger_overlaps(body: Node3D) -> bool:
	return active and is_instance_valid(exit_trigger) and exit_trigger.get_overlapping_bodies().has(body)

func secretary_overlaps(body: Node3D) -> bool:
	return active and is_instance_valid(secretary_zone) and secretary_zone.get_overlapping_bodies().has(body)

func guard_overlaps(body: Node3D) -> bool:
	if not active:
		return false
	for zone in guard_zones:
		if is_instance_valid(zone) and zone.get_overlapping_bodies().has(body):
			return true
	return false
