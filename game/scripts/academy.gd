class_name Academy
extends Node3D
## La grande Académie Ninja de Konoha : un bâtiment partagé, extérieur + intérieur,
## construit en coordonnées absolues du village (jamais une poche privée).
##
## Règles respectées :
## - Déblocage = état réel de la 2e mission de clan (secondary_manager.unlocked),
##   jamais une condition parallèle ni une sauvegarde séparée.
## - Transition physique : AcademyEntrance -> AcademyInteriorSpawn et
##   AcademyExit -> AcademyExteriorSpawn, avec anti-ré-déclenchement (verrou 0,9 s).
##   Les marqueurs ne servent QUE de repli de sécurité (chute, désync), jamais de
##   téléportation à coordonnées fixes pendant la marche normale.
## - Escaliers physiques entre le RDC et l'étage (aucun téléport entre étages).
## - Multijoueur : tout est dans le monde partagé du village ; aucun instancing.
## - Android : matériaux mis en cache, collisions simples (boîtes/cylindres),
##   3 OmniLight seulement, fenêtres et lanternes émissives (unshaded).

signal unlocked_now
signal entered
signal exited

# Emprise du bâtiment : x [-60,-32], z [-50,-18]. Cour au sud : z [-18,-6].
const WEST := -60.0
const EAST := -32.0
const SOUTH := -18.0
const NORTH := -50.0
const CENTER_X := -46.0
const DOOR_HALF := 3.0
const FLOOR_TOP := 0.16
const WALL_H := 4.4
const UPPER_Y := 4.7
const UPPER_WALL_H := 3.4
const STAIR_BASE := Vector3(-35.5, 0.16, -33.2)
const STAIR_TOP := Vector3(-35.5, 4.7, -44.12)
const HALL_POINT := Vector3(-46.0, 0.35, -24.0)

var built := false
var player: TrainingFighter
var unlocked := false
var inside := false
var transition_lock := 0.0
var pending_enter := false
var pending_exit := false
var materials := {}
var staff: Array[KonohaNPC] = []
var receptionist: KonohaNPC
var barrier_mesh: MeshInstance3D
var barrier_body: StaticBody3D
var barrier_labels: Array[Label3D] = []
var entrance_zone: Area3D
var exit_zone: Area3D
var reception_zone: Area3D
var interior_spawn: Marker3D
var exterior_spawn: Marker3D

func build() -> void:
	if built:
		return
	built = true
	name = "Academy"
	_build_ground_floor()
	_build_first_floor()
	_build_roof()
	_build_courtyard()
	_build_staff()
	_build_nodes()
	_build_lights()
	if not unlocked:
		_build_barrier()

# ---------------------------------------------------------------------------
# Primitives réutilisées (idiome hokage_interior.gd) + cache de matériaux.
# ---------------------------------------------------------------------------

func _mat(color: Color, unshaded: bool = false) -> StandardMaterial3D:
	var key := "%s%s" % [color.to_html(), "u" if unshaded else "s"]
	if not materials.has(key):
		materials[key] = TrainingFighter.material(color, unshaded)
	return materials[key]

func box(size: Vector3, point: Vector3, color: Color, solid: bool = true, rotation := Vector3.ZERO) -> MeshInstance3D:
	var part := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	part.mesh = mesh
	part.position = point
	part.rotation = rotation
	part.material_override = _mat(color)
	add_child(part)
	if solid:
		var body := StaticBody3D.new()
		body.name = "Solid"
		body.rotation = Vector3.ZERO
		body.collision_layer = 1
		body.collision_mask = 0
		var shape := CollisionShape3D.new()
		var prism := BoxShape3D.new()
		prism.size = size
		shape.shape = prism
		body.add_child(shape)
		part.add_child(body)
	return part

func cylinder(radius: float, height: float, point: Vector3, color: Color, segments: int = 10, solid: bool = true, rotation := Vector3.ZERO) -> MeshInstance3D:
	var part := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = segments
	part.mesh = mesh
	part.position = point
	part.rotation = rotation
	part.material_override = _mat(color)
	add_child(part)
	if solid:
		var body := StaticBody3D.new()
		body.name = "Solid"
		body.rotation = Vector3.ZERO
		body.collision_layer = 1
		body.collision_mask = 0
		var shape := CollisionShape3D.new()
		var prism := CylinderShape3D.new()
		prism.radius = radius
		prism.height = height
		shape.shape = prism
		body.add_child(shape)
		part.add_child(body)
	return part

func label_3d(text: String, point: Vector3, size: int, color: Color, angle := 0.0) -> Label3D:
	var sign := Label3D.new()
	sign.text = text
	sign.font_size = size
	sign.pixel_size = 0.008
	sign.modulate = color
	sign.outline_size = maxi(2, int(size * 0.14))
	sign.position = point
	sign.rotation.y = angle
	add_child(sign)
	return sign

func _wall(x1: float, x2: float, z: float, y: float, height: float, thickness := 0.4) -> void:
	# Mur nord-sud (épaisseur selon z) entre deux abscisses.
	box(Vector3(x2 - x1, height, thickness), Vector3((x1 + x2) * 0.5, y + height * 0.5, z), Color(0.93, 0.9, 0.83))

func _wall_z(z1: float, z2: float, x: float, y: float, height: float, thickness := 0.4) -> void:
	# Mur est-ouest (épaisseur selon x) entre deux cotes, dans n'importe quel ordre.
	box(Vector3(thickness, height, absf(z2 - z1)), Vector3(x, y + height * 0.5, (z1 + z2) * 0.5), Color(0.93, 0.9, 0.83))

func _stairs(point: Vector3, angle: float, width: float, count: int, rise: float, run: float) -> void:
	# Marches visuelles + UN seul collisionneur incliné (pente ~22°, marchable).
	var root := Node3D.new()
	root.position = point
	root.rotation.y = angle
	add_child(root)
	var wood := Color(0.47, 0.33, 0.2)
	var dark := Color(0.36, 0.22, 0.13)
	for index in count:
		var tread := MeshInstance3D.new()
		var mesh := BoxMesh.new()
		mesh.size = Vector3(width, rise, run)
		tread.mesh = mesh
		tread.position = Vector3(0, rise * (index + 0.5), -run * index - run * 0.5)
		tread.material_override = _mat(wood if index % 2 == 0 else dark)
		root.add_child(tread)
	var total_rise := rise * count
	var total_run := run * count
	var slope := atan2(total_rise, total_run)
	var length := sqrt(total_rise * total_rise + total_run * total_run)
	var ramp := StaticBody3D.new()
	ramp.name = "StairRamp"
	# Surface de la rampe alignée sur le nez des marches (pente ~22°, marchable).
	ramp.position = Vector3(0, total_rise * 0.5 + 0.05, -total_run * 0.5)
	ramp.rotation.x = slope
	ramp.collision_layer = 1
	ramp.collision_mask = 0
	var shape := CollisionShape3D.new()
	var prism := BoxShape3D.new()
	prism.size = Vector3(width + 0.2, 0.3, length + run)
	shape.shape = prism
	ramp.add_child(shape)
	root.add_child(ramp)
	# Limons latéraux visuels.
	for side in [-1.0, 1.0]:
		var stringer := MeshInstance3D.new()
		var beam := BoxMesh.new()
		beam.size = Vector3(0.16, 0.5, length + run)
		stringer.mesh = beam
		stringer.position = Vector3(side * (width * 0.5 + 0.1), total_rise * 0.5 + 0.1, -total_run * 0.5)
		stringer.rotation.x = slope
		stringer.material_override = _mat(dark)
		root.add_child(stringer)

func _window(point: Vector3, size: Vector2, angle := 0.0) -> void:
	# Fenêtre shoji : cadre bois + panneau émissif (lumière du jour sans OmniLight).
	box(Vector3(size.x + 0.3, size.y + 0.3, 0.12), point, Color(0.36, 0.22, 0.13), false, Vector3(0, angle, 0))
	var pane := box(Vector3(size.x, size.y, 0.16), point + Vector3(0, 0, 0.02).rotated(Vector3.UP, angle), Color(1.0, 0.92, 0.72, 1.0), false, Vector3(0, angle, 0))
	pane.material_override = _mat(Color(1.0, 0.92, 0.72), true)
	# Montants croisés.
	box(Vector3(0.08, size.y, 0.2), point + Vector3(0, 0, 0.03).rotated(Vector3.UP, angle), Color(0.36, 0.22, 0.13), false, Vector3(0, angle, 0))
	box(Vector3(size.x, 0.08, 0.2), point + Vector3(0, 0, 0.03).rotated(Vector3.UP, angle), Color(0.36, 0.22, 0.13), false, Vector3(0, angle, 0))

func _lantern(point: Vector3) -> void:
	cylinder(0.03, 0.7, point + Vector3(0, 0.35, 0), Color(0.25, 0.16, 0.1), 6, false)
	var glow := cylinder(0.16, 0.38, point, Color(1.0, 0.8, 0.45), 8, false)
	glow.material_override = _mat(Color(1.0, 0.8, 0.45), true)
	cylinder(0.09, 0.06, point + Vector3(0, 0.22, 0), Color(0.25, 0.16, 0.1), 6, false)
	cylinder(0.09, 0.06, point + Vector3(0, -0.22, 0), Color(0.25, 0.16, 0.1), 6, false)

func _pillar(point: Vector3, height: float, radius := 0.22) -> void:
	cylinder(radius, height, point + Vector3(0, height * 0.5, 0), Color(0.63, 0.18, 0.14), 10)
	box(Vector3(radius * 3.0, 0.14, radius * 3.0), point + Vector3(0, 0.07, 0), Color(0.4, 0.4, 0.42))
	box(Vector3(radius * 2.6, 0.16, radius * 2.6), point + Vector3(0, height - 0.08, 0), Color(0.36, 0.22, 0.13))

func _bench(point: Vector3, angle := 0.0) -> void:
	var seat := box(Vector3(2.2, 0.12, 0.6), point + Vector3(0, 0.5, 0), Color(0.47, 0.33, 0.2), true, Vector3(0, angle, 0))
	seat.rotation = Vector3(0, angle, 0)
	for side in [-0.9, 0.9]:
		var leg := box(Vector3(0.12, 0.44, 0.5), Vector3(side, 0.22, 0), Color(0.36, 0.22, 0.13), true)
		leg.position = point + Vector3(side, 0.22, 0).rotated(Vector3.UP, angle)
	var back := box(Vector3(2.2, 0.5, 0.1), Vector3(0, 0.82, -0.28), Color(0.47, 0.33, 0.2), true)
	back.position = point + Vector3(0, 0.82, -0.28).rotated(Vector3.UP, angle)
	back.rotation = Vector3(0, angle, 0)

func _desk(point: Vector3, top_color := Color(0.55, 0.38, 0.22)) -> void:
	box(Vector3(1.15, 0.66, 0.75), point, top_color)
	box(Vector3(1.25, 0.08, 0.85), point + Vector3(0, 0.37, 0), Color(0.36, 0.22, 0.13))

func _chair(point: Vector3, angle := 0.0) -> void:
	var seat := box(Vector3(0.45, 0.45, 0.45), point + Vector3(0, 0.22, 0), Color(0.36, 0.22, 0.13), true)
	seat.rotation = Vector3(0, angle, 0)
	var back := box(Vector3(0.45, 0.5, 0.08), point + Vector3(0, 0.7, -0.2).rotated(Vector3.UP, angle), Color(0.36, 0.22, 0.13), true)
	back.rotation = Vector3(0, angle, 0)

func _board(point: Vector3, angle := 0.0) -> void:
	box(Vector3(3.2, 1.5, 0.08), point, Color(0.36, 0.22, 0.13), false, Vector3(0, angle, 0))
	box(Vector3(3.0, 1.3, 0.1), point + Vector3(0, 0, 0.02).rotated(Vector3.UP, angle), Color(0.13, 0.2, 0.16), false, Vector3(0, angle, 0))
	box(Vector3(3.0, 0.06, 0.16), point + Vector3(0, -0.72, 0.06).rotated(Vector3.UP, angle), Color(0.9, 0.88, 0.8), false, Vector3(0, angle, 0))

func _scroll_row(point: Vector3, count: int = 4) -> void:
	for index in count:
		cylinder(0.06, 0.5, point + Vector3(0.34 * index - 0.17 * (count - 1), 0.07, 0), Color(0.92, 0.88, 0.76), 6, false, Vector3(0, 0, PI * 0.5))

func _dummy(point: Vector3) -> void:
	cylinder(0.1, 1.5, point + Vector3(0, 0.75, 0), Color(0.55, 0.42, 0.26), 8)
	box(Vector3(1.2, 0.14, 0.14), point + Vector3(0, 1.24, 0), Color(0.47, 0.33, 0.2), false)
	cylinder(0.16, 0.3, point + Vector3(0, 1.62, 0), Color(0.85, 0.78, 0.62), 8, false)
	box(Vector3(0.5, 0.1, 0.5), point + Vector3(0, 0.05, 0), Color(0.4, 0.4, 0.42))

func _target(point: Vector3) -> void:
	cylinder(0.5, 0.1, point, Color(0.95, 0.93, 0.85), 12, false, Vector3(PI * 0.5, 0, 0))
	cylinder(0.24, 0.12, point + Vector3(0, 0, 0.02), Color(0.72, 0.15, 0.12), 12, false, Vector3(PI * 0.5, 0, 0))

func _banner(point: Vector3, height := 5.2) -> void:
	cylinder(0.07, height, point + Vector3(0, height * 0.5, 0), Color(0.3, 0.2, 0.12), 8)
	box(Vector3(0.9, 2.6, 0.07), point + Vector3(-0.52, height * 0.62, 0), Color(0.16, 0.33, 0.3), false)
	label_3d("学", point + Vector3(-0.52, height * 0.62, 0.06), 64, Color(0.95, 0.85, 0.45))
	cylinder(0.11, 0.14, point + Vector3(0, height + 0.07, 0), Color(0.72, 0.58, 0.24), 8, false)

func _tree(point: Vector3) -> void:
	cylinder(0.22, 2.6, point + Vector3(0, 1.3, 0), Color(0.33, 0.22, 0.13), 8)
	var crown := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 1.5
	sphere.height = 3.0
	crown.mesh = sphere
	crown.position = point + Vector3(0, 3.3, 0)
	crown.material_override = _mat(Color(0.22, 0.45, 0.22))
	add_child(crown)
	var tip := MeshInstance3D.new()
	var small := SphereMesh.new()
	small.radius = 1.0
	small.height = 2.0
	tip.mesh = small
	tip.position = point + Vector3(0.3, 4.4, -0.2)
	tip.material_override = _mat(Color(0.28, 0.52, 0.26))
	add_child(tip)

# ---------------------------------------------------------------------------
# RDC : hall, réception, informations, entraînement, administration, escalier.
# ---------------------------------------------------------------------------

func _build_ground_floor() -> void:
	var wood := Color(0.47, 0.33, 0.2)
	var dark := Color(0.36, 0.22, 0.13)
	# Dalle du bâtiment (sommet 0,16) et dalles de sol travaillées.
	box(Vector3(28.0, 0.32, 32.0), Vector3(CENTER_X, 0.0, -34.0), Color(0.42, 0.42, 0.44))
	box(Vector3(27.6, 0.04, 31.6), Vector3(CENTER_X, FLOOR_TOP + 0.02, -34.0), wood, false)
	for index in 8:
		box(Vector3(3.2, 0.02, 31.4), Vector3(WEST + 1.8 + 3.4 * index, FLOOR_TOP + 0.045, -34.0), Color(0.52, 0.37, 0.23), false)
	# Murs extérieurs du RDC (ouverture de porte 6 m au sud : x [-49,-43]).
	_wall(WEST, CENTER_X - DOOR_HALF, SOUTH, 0.0, WALL_H)
	_wall(CENTER_X + DOOR_HALF, EAST, SOUTH, 0.0, WALL_H)
	_wall(WEST, EAST, NORTH, 0.0, WALL_H)
	_wall_z(SOUTH, NORTH, WEST, 0.0, WALL_H)
	_wall_z(SOUTH, NORTH, EAST, 0.0, WALL_H)
	# Poteaux vermillon de façade et montants de la grande porte.
	for x in [WEST + 0.4, -53.0, CENTER_X - DOOR_HALF - 0.2, CENTER_X + DOOR_HALF + 0.2, -39.0, EAST - 0.4]:
		box(Vector3(0.35, WALL_H + 0.3, 0.35), Vector3(x, (WALL_H + 0.3) * 0.5, SOUTH), Color(0.63, 0.18, 0.14))
	# Linteau, enseigne et emblème au-dessus de la grande porte.
	box(Vector3(7.4, 0.5, 0.55), Vector3(CENTER_X, 4.62, SOUTH), dark)
	label_3d("ACADÉMIE NINJA", Vector3(CENTER_X, 5.85, SOUTH + 0.3), 60, Color(0.95, 0.85, 0.45))
	cylinder(1.0, 0.14, Vector3(CENTER_X, 6.95, SOUTH + 0.28), Color(0.72, 0.58, 0.24), 16, false, Vector3(PI * 0.5, 0, 0))
	label_3d("学", Vector3(CENTER_X, 6.95, SOUTH + 0.38), 92, Color(0.2, 0.1, 0.05))
	# Bandeaux de poutres extérieures.
	box(Vector3(28.8, 0.35, 0.5), Vector3(CENTER_X, 4.45, SOUTH - 0.05), dark)
	box(Vector3(28.8, 0.35, 0.5), Vector3(CENTER_X, 4.45, NORTH + 0.05), dark)
	box(Vector3(0.5, 0.35, 32.4), Vector3(WEST - 0.05, 4.45, -34.0), dark)
	box(Vector3(0.5, 0.35, 32.4), Vector3(EAST + 0.05, 4.45, -34.0), dark)
	# Fenêtres larges du RDC (façades sud, ouest, est).
	for x in [-57.0, -52.0, -40.0, -35.0]:
		_window(Vector3(x, 2.5, SOUTH + 0.24), Vector2(2.6, 2.1))
	for z in [-24.0, -31.0, -38.0, -45.0]:
		_window(Vector3(WEST - 0.24, 2.5, z), Vector2(2.6, 2.1), PI * 0.5)
		_window(Vector3(EAST + 0.24, 2.5, z), Vector2(2.6, 2.1), PI * 0.5)
	# Portique d'entrée : deux poteaux + auvent à double pente.
	_pillar(Vector3(-50.2, 0.0, -16.2), 5.0, 0.18)
	_pillar(Vector3(-41.8, 0.0, -16.2), 5.0, 0.18)
	box(Vector3(10.6, 0.25, 3.8), Vector3(CENTER_X, 5.1, -16.3), Color(0.216, 0.396, 0.353), true, Vector3(0.12, 0, 0))
	box(Vector3(10.8, 0.28, 0.3), Vector3(CENTER_X, 5.0, -14.55), dark, false, Vector3(0.12, 0, 0))
	_lantern(Vector3(-49.4, 4.55, -16.0))
	_lantern(Vector3(-42.6, 4.55, -16.0))
	# marches décoratives encadrant l'entrée.
	box(Vector3(1.6, 0.2, 1.4), Vector3(-49.9, 0.1, SOUTH + 0.6), Color(0.5, 0.5, 0.52))
	box(Vector3(1.6, 0.2, 1.4), Vector3(-42.1, 0.1, SOUTH + 0.6), Color(0.5, 0.5, 0.52))
	# Cloison centrale z = -30 : hall au sud, entraînement/administration au nord.
	_wall(WEST, -56.0, -30.0, 0.0, WALL_H, 0.3)
	_wall(-50.0, -42.0, -30.0, 0.0, WALL_H, 0.3)
	_wall(-36.0, EAST, -30.0, 0.0, WALL_H, 0.3)
	_build_hall()
	_build_reception()
	_build_information()
	_build_training()
	_build_administration()

func _build_hall() -> void:
	var gold := Color(0.72, 0.58, 0.24)
	# Tapis central bordé d'or et tapis latéraux.
	box(Vector3(5.0, 0.02, 11.6), Vector3(CENTER_X, FLOOR_TOP + 0.06, -24.0), gold, false)
	box(Vector3(4.4, 0.025, 11.2), Vector3(CENTER_X, FLOOR_TOP + 0.07, -24.0), Color(0.55, 0.12, 0.12), false)
	box(Vector3(5.4, 0.02, 6.4), Vector3(-37.5, FLOOR_TOP + 0.06, -22.8), Color(0.16, 0.33, 0.3), false)
	box(Vector3(5.4, 0.02, 6.4), Vector3(-54.5, FLOOR_TOP + 0.06, -22.8), Color(0.16, 0.33, 0.3), false)
	# Colonnes du hall.
	for point in [Vector3(-50.5, 0, -23.0), Vector3(-41.5, 0, -23.0), Vector3(-50.5, 0, -27.5), Vector3(-41.5, 0, -27.5)]:
		_pillar(point, WALL_H)
	# Poutres de plafond.
	for z in [-21.0, -24.0, -27.0]:
		box(Vector3(27.6, 0.3, 0.35), Vector3(CENTER_X, 4.38, z), Color(0.36, 0.22, 0.13), false)
	for x in [-53.0, CENTER_X, -39.0]:
		box(Vector3(0.35, 0.3, 11.6), Vector3(x, 4.2, -24.0), Color(0.42, 0.27, 0.16), false)
	# Lanternes suspendues.
	for point in [Vector3(-48.5, 3.85, -21.5), Vector3(-43.5, 3.85, -21.5), Vector3(-48.5, 3.85, -26.5), Vector3(-43.5, 3.85, -26.5)]:
		_lantern(point)
	# Bancs d'attente et emblème au-dessus du passage central.
	_bench(Vector3(-48.8, FLOOR_TOP, -20.2), PI * 0.5)
	_bench(Vector3(-43.2, FLOOR_TOP, -20.2), -PI * 0.5)
	cylinder(0.9, 0.1, Vector3(CENTER_X, 3.2, -29.75), gold, 16, false, Vector3(PI * 0.5, 0, 0))
	label_3d("忍", Vector3(CENTER_X, 3.2, -29.62), 80, Color(0.25, 0.12, 0.06))
	label_3d("HALL D'ACCUEIL", Vector3(CENTER_X, 2.15, -29.7), 26, Color(0.95, 0.9, 0.8))
	# Panneau d'affichage près de la porte (face intérieure du mur sud).
	box(Vector3(1.8, 1.2, 0.1), Vector3(-44.2, 1.9, SOUTH - 0.32), Color(0.95, 0.93, 0.85), false)
	box(Vector3(2.0, 1.4, 0.08), Vector3(-44.2, 1.9, SOUTH - 0.36), Color(0.36, 0.22, 0.13), false)
	label_3d("AVIS AUX VISITEURS", Vector3(-44.2, 2.3, SOUTH - 0.24), 16, Color(0.25, 0.2, 0.15))
	label_3d("Silence · Respect · Entraînement", Vector3(-44.2, 1.75, SOUTH - 0.24), 13, Color(0.3, 0.25, 0.2))

func _build_reception() -> void:
	var dark := Color(0.36, 0.22, 0.13)
	# Comptoir solide + dessus sombre + documents et registres.
	box(Vector3(4.8, 1.05, 0.8), Vector3(-37.5, FLOOR_TOP + 0.52, -22.6), Color(0.55, 0.38, 0.22))
	box(Vector3(5.0, 0.1, 1.0), Vector3(-37.5, FLOOR_TOP + 1.1, -22.6), dark)
	box(Vector3(0.4, 0.03, 0.3), Vector3(-38.6, FLOOR_TOP + 1.17, -22.6), Color(0.95, 0.93, 0.85), false)
	box(Vector3(0.4, 0.03, 0.3), Vector3(-37.8, FLOOR_TOP + 1.17, -22.5), Color(0.95, 0.93, 0.85), false)
	_scroll_row(Vector3(-36.4, FLOOR_TOP + 1.2, -22.6), 3)
	_chair(Vector3(-37.5, FLOOR_TOP, -23.6), 0.0)
	# Rayonnage des registres contre le mur est.
	box(Vector3(0.5, 2.2, 3.4), Vector3(EAST + 0.6, FLOOR_TOP + 1.1, -25.0), dark)
	_scroll_row(Vector3(EAST + 0.6, FLOOR_TOP + 1.9, -25.0), 4)
	_scroll_row(Vector3(EAST + 0.6, FLOOR_TOP + 1.2, -25.0), 4)
	# Pupitre d'information (place physique des candidatures actives).
	box(Vector3(0.14, 1.5, 0.9), Vector3(-40.6, FLOOR_TOP + 0.75, -21.0), dark)
	box(Vector3(0.08, 1.1, 0.7), Vector3(-40.5, FLOOR_TOP + 1.5, -21.0), Color(0.95, 0.93, 0.85), false, Vector3(0, -0.35, 0))
	label_3d("CANDIDATURES", Vector3(-40.4, FLOOR_TOP + 1.75, -21.0), 14, Color(0.3, 0.25, 0.2), -0.35)
	label_3d("· COMPTOIR ACTIF ·", Vector3(-40.4, FLOOR_TOP + 1.45, -21.0), 12, Color(0.25, 0.45, 0.35), -0.35)
	label_3d("RÉCEPTION DE L'ACADÉMIE", Vector3(-37.5, 3.1, SOUTH - 0.3), 22, Color(0.95, 0.9, 0.8))

func _build_information() -> void:
	var paper := Color(0.95, 0.93, 0.85)
	var dark := Color(0.36, 0.22, 0.13)
	# Grande carte du village sur table + carte murale.
	box(Vector3(3.0, 0.12, 2.0), Vector3(-54.5, FLOOR_TOP + 0.85, -24.0), dark)
	box(Vector3(2.8, 0.03, 1.8), Vector3(-54.5, FLOOR_TOP + 0.92, -24.0), Color(0.62, 0.7, 0.5), false)
	for corner in [Vector2(-1.3, -0.8), Vector2(1.3, -0.8), Vector2(-1.3, 0.8), Vector2(1.3, 0.8)]:
		cylinder(0.07, 0.8, Vector3(-54.5 + corner.x, FLOOR_TOP + 0.4, -24.0 + corner.y), dark, 6)
	box(Vector3(0.12, 2.4, 3.6), Vector3(WEST + 0.3, 2.1, -26.5), dark)
	box(Vector3(0.06, 2.1, 3.3), Vector3(WEST + 0.4, 2.1, -26.5), paper, false)
	label_3d("CARTE\nDE KONAHA", Vector3(WEST + 0.46, 2.1, -26.5), 22, Color(0.25, 0.3, 0.2), PI * 0.5)
	# Règlement de l'Académie sur la cloison.
	box(Vector3(3.2, 2.0, 0.12), Vector3(-54.5, 2.0, -29.75), paper, false)
	box(Vector3(3.4, 2.2, 0.08), Vector3(-54.5, 2.0, -29.8), dark, false)
	label_3d("RÈGLEMENT DE L'ACADÉMIE", Vector3(-54.5, 2.55, -29.65), 18, Color(0.25, 0.2, 0.15))
	label_3d("Ponctualité · Tenue · Entraînement\nrespect du village", Vector3(-54.5, 1.85, -29.65), 13, Color(0.35, 0.3, 0.22))
	# Portraits des shinobi importants.
	for z in [-22.2, -20.8]:
		box(Vector3(0.06, 1.0, 0.8), Vector3(WEST + 0.32, 2.3, z), Color(0.72, 0.58, 0.24), false)
		box(Vector3(0.05, 0.8, 0.6), Vector3(WEST + 0.38, 2.3, z), Color(0.85, 0.78, 0.66), false)
	# Tableau des équipes : le détail opérationnel reste dans le menu de
	# réception, mais le bâtiment indique clairement que le système est actif.
	box(Vector3(2.0, 1.4, 0.1), Vector3(-50.8, 2.0, -29.72), paper, false)
	box(Vector3(2.2, 1.6, 0.07), Vector3(-50.8, 2.0, -29.77), dark, false)
	label_3d("ÉQUIPES · ACTIVITÉS", Vector3(-50.8, 2.35, -29.62), 15, Color(0.3, 0.25, 0.18))
	label_3d("réception · équipes actives", Vector3(-50.8, 1.75, -29.62), 12, Color(0.25, 0.45, 0.35))
	# Étagère à parchemins.
	box(Vector3(2.4, 1.0, 0.5), Vector3(-57.5, FLOOR_TOP + 0.5, -20.4), dark)
	_scroll_row(Vector3(-57.5, FLOOR_TOP + 1.05, -20.4), 5)
	label_3d("SALLE DES INFORMATIONS", Vector3(-54.5, 3.1, SOUTH - 0.3), 20, Color(0.95, 0.9, 0.8))

func _build_training() -> void:
	var wood := Color(0.47, 0.33, 0.2)
	# Tatamis, mannequins, cibles, râtelier d'armes : circulation libre, aucun combat.
	for point in [Vector3(-56.5, FLOOR_TOP + 0.03, -46.5), Vector3(-52.0, FLOOR_TOP + 0.03, -46.5), Vector3(-56.5, FLOOR_TOP + 0.03, -41.5), Vector3(-52.0, FLOOR_TOP + 0.03, -36.5)]:
		box(Vector3(3.6, 0.06, 4.2), point, Color(0.42, 0.5, 0.28), false)
	for point in [Vector3(-58.3, FLOOR_TOP, -35.0), Vector3(-54.0, FLOOR_TOP, -33.6), Vector3(-50.0, FLOOR_TOP, -35.5), Vector3(-58.3, FLOOR_TOP, -47.8), Vector3(-48.6, FLOOR_TOP, -47.8)]:
		_dummy(point)
	for x in [-57.0, -53.5, -50.0]:
		_target(Vector3(x, 1.9, NORTH + 0.35))
	# Râtelier d'armes décoratives.
	box(Vector3(2.6, 0.8, 0.5), Vector3(-47.2, FLOOR_TOP + 0.4, -42.0), wood)
	for x in [-48.1, -47.2, -46.3]:
		cylinder(0.04, 2.2, Vector3(x, FLOOR_TOP + 1.3, -42.0), Color(0.3, 0.2, 0.12), 6, false)
	box(Vector3(2.8, 0.1, 0.6), Vector3(-47.2, FLOOR_TOP + 2.35, -42.0), wood, false)
	label_3d("ZONE D'ENTRAÎNEMENT", Vector3(-58.0, 3.5, -30.2), 20, Color(0.95, 0.9, 0.8), PI)
	label_3d("ZONE D'ENTRAÎNEMENT", Vector3(-48.0, 3.5, -29.8), 20, Color(0.95, 0.9, 0.8))

func _build_administration() -> void:
	var wood := Color(0.47, 0.33, 0.2)
	var dark := Color(0.36, 0.22, 0.13)
	# Escalier physique RDC -> étage (pente ~22°), le long du mur est.
	_stairs(STAIR_BASE, 0.0, 3.2, 14, 0.3243, 0.78)
	# Garde-corps de l'escalier : poteaux suivant la pente + mains courantes solides.
	for index in 5:
		var t: float = float(index) / 4.0
		var z: float = lerpf(-34.2, -42.8, t)
		var base_y: float = FLOOR_TOP + (STAIR_BASE.z - z) * 0.3243 / 0.78
		for side in [-37.4, -33.6]:
			cylinder(0.05, 1.0, Vector3(side, base_y + 0.5, z), dark, 6, false)
	box(Vector3(0.12, 0.14, 11.4), Vector3(-37.4, 3.55, -38.6), wood, true, Vector3(0.394, 0, 0))
	box(Vector3(0.12, 0.14, 11.4), Vector3(-33.6, 3.55, -38.6), wood, true, Vector3(0.394, 0, 0))
	# Bureaux administratifs + registres.
	_desk(Vector3(-42.0, FLOOR_TOP + 0.37, -36.5))
	_desk(Vector3(-42.0, FLOOR_TOP + 0.37, -40.0))
	_chair(Vector3(-42.0, FLOOR_TOP, -35.4), PI)
	_chair(Vector3(-42.0, FLOOR_TOP, -38.9), PI)
	box(Vector3(0.5, 2.4, 4.0), Vector3(EAST + 0.6, FLOOR_TOP + 1.2, -47.0), dark)
	_scroll_row(Vector3(EAST + 0.6, FLOOR_TOP + 2.0, -47.0), 4)
	_scroll_row(Vector3(EAST + 0.6, FLOOR_TOP + 1.0, -47.0), 4)
	label_3d("ADMINISTRATION", Vector3(-44.0, 3.4, -30.2), 20, Color(0.95, 0.9, 0.8), PI)
	label_3d("ESCALIER · PREMIER ÉTAGE", Vector3(-35.5, 2.6, -32.4), 16, Color(0.9, 0.85, 0.7))

# ---------------------------------------------------------------------------
# Étage : couloir, 3 salles de cours, salle des équipes, salle des professeurs.
# ---------------------------------------------------------------------------

func _build_first_floor() -> void:
	var dark := Color(0.36, 0.22, 0.13)
	# Dalles de l'étage autour de la trémie d'escalier x [-37,6,-33,4] z [-44,-33,2].
	box(Vector3(28.0, 0.3, 15.2), Vector3(CENTER_X, 4.55, -25.6), Color(0.42, 0.42, 0.44))
	box(Vector3(28.0, 0.3, 6.0), Vector3(CENTER_X, 4.55, -47.0), Color(0.42, 0.42, 0.44))
	box(Vector3(22.4, 0.3, 10.8), Vector3(-48.8, 4.55, -38.6), Color(0.42, 0.42, 0.44))
	box(Vector3(1.4, 0.3, 10.8), Vector3(-32.7, 4.55, -38.6), Color(0.42, 0.42, 0.44))
	box(Vector3(27.6, 0.04, 31.6), Vector3(CENTER_X, UPPER_Y + 0.02, -34.0), Color(0.52, 0.37, 0.23), false)
	# Murs périphériques de l'étage.
	_wall(WEST, EAST, SOUTH, UPPER_Y, UPPER_WALL_H, 0.35)
	_wall(WEST, EAST, NORTH, UPPER_Y, UPPER_WALL_H, 0.35)
	_wall_z(SOUTH, NORTH, WEST, UPPER_Y, UPPER_WALL_H, 0.35)
	_wall_z(SOUTH, NORTH, EAST, UPPER_Y, UPPER_WALL_H, 0.35)
	# Garde-corps solides autour de la trémie.
	box(Vector3(0.14, 1.0, 10.8), Vector3(-37.6, UPPER_Y + 0.5, -38.6), dark)
	box(Vector3(0.14, 1.0, 10.8), Vector3(-33.4, UPPER_Y + 0.5, -38.6), dark)
	box(Vector3(4.2, 1.0, 0.14), Vector3(-35.5, UPPER_Y + 0.5, -33.2), dark)
	label_3d("PREMIER ÉTAGE", Vector3(-35.5, 6.4, NORTH + 0.3), 24, Color(0.95, 0.9, 0.8))
	label_3d("ESCALIER · PASSER AU NORD", Vector3(-35.5, 6.2, -33.0), 16, Color(0.9, 0.85, 0.7))
	# Fenêtres de l'étage (la travée centrale sud porte l'emblème de façade).
	for x in [-57.0, -52.0, -40.0, -35.0]:
		_window(Vector3(x, 6.3, SOUTH + 0.22), Vector2(2.4, 1.9))
	for z in [-23.0, -28.0, -38.0, -46.0]:
		_window(Vector3(WEST - 0.22, 6.3, z), Vector2(2.4, 1.9), PI * 0.5)
		_window(Vector3(EAST + 0.22, 6.3, z), Vector2(2.4, 1.9), PI * 0.5)
	# Bandeaux de poutres de l'étage.
	box(Vector3(28.8, 0.3, 0.45), Vector3(CENTER_X, 8.05, SOUTH - 0.05), dark)
	box(Vector3(28.8, 0.3, 0.45), Vector3(CENTER_X, 8.05, NORTH + 0.05), dark)
	_build_corridor()
	_build_classrooms()
	_build_team_area()
	_build_teachers_room()

func _build_corridor() -> void:
	box(Vector3(26.0, 0.03, 2.2), Vector3(CENTER_X, UPPER_Y + 0.05, -31.6), Color(0.16, 0.33, 0.3), false)
	# Cloison nord du couloir (z = -33,2) : portes salle des équipes, professeurs,
	# et passage d'escalier x [-37,6,-33,4].
	_wall(WEST, -56.0, -33.2, UPPER_Y, UPPER_WALL_H, 0.3)
	_wall(-50.0, -45.0, -33.2, UPPER_Y, UPPER_WALL_H, 0.3)
	_wall(-41.0, -37.6, -33.2, UPPER_Y, UPPER_WALL_H, 0.3)
	_wall(-33.4, EAST, -33.2, UPPER_Y, UPPER_WALL_H, 0.3)
	# Linteaux au-dessus des portes.
	for x in [-53.0, -43.0]:
		box(Vector3(6.3, 0.6, 0.34), Vector3(x, UPPER_Y + 3.1, -33.2), Color(0.36, 0.22, 0.13))
	label_3d("GRANDE SALLE DES ÉQUIPES", Vector3(-53.0, UPPER_Y + 2.95, -33.0), 18, Color(0.95, 0.9, 0.8))
	label_3d("SALLE DES PROFESSEURS", Vector3(-43.0, UPPER_Y + 2.95, -33.0), 18, Color(0.95, 0.9, 0.8))
	# Cloison sud du couloir (z = -30) : trois portes de salles de cours.
	_wall(WEST, -56.05, -30.0, UPPER_Y, UPPER_WALL_H, 0.3)
	_wall(-54.45, -46.55, -30.0, UPPER_Y, UPPER_WALL_H, 0.3)
	_wall(-44.95, -37.3, -30.0, UPPER_Y, UPPER_WALL_H, 0.3)
	_wall(-35.7, EAST, -30.0, UPPER_Y, UPPER_WALL_H, 0.3)
	for x in [-55.25, -45.75, -36.5]:
		box(Vector3(1.9, 0.6, 0.34), Vector3(x, UPPER_Y + 3.1, -30.0), Color(0.36, 0.22, 0.13))
	label_3d("SALLE 1", Vector3(-55.25, UPPER_Y + 2.95, -29.8), 17, Color(0.95, 0.9, 0.8))
	label_3d("SALLE 2", Vector3(-45.75, UPPER_Y + 2.95, -29.8), 17, Color(0.95, 0.9, 0.8))
	label_3d("SALLE 3", Vector3(-36.5, UPPER_Y + 2.95, -29.8), 17, Color(0.95, 0.9, 0.8))
	# Lanternes murales du couloir (émissives, pas d'OmniLight supplémentaire).
	_lantern(Vector3(-52.0, 6.6, -32.8))
	_lantern(Vector3(-40.0, 6.6, -32.8))

func _classroom(center_x: float, room_title: String, board_title: String) -> void:
	var dark := Color(0.36, 0.22, 0.13)
	# Tableau + bureau du professeur au sud, pupitres des élèves au nord.
	_board(Vector3(center_x, 6.1, SOUTH - 0.3))
	label_3d(board_title, Vector3(center_x, 6.1, SOUTH - 0.22), 15, Color(0.85, 0.85, 0.75))
	box(Vector3(1.8, 0.75, 0.9), Vector3(center_x, UPPER_Y + 0.38, -19.9), Color(0.55, 0.38, 0.22))
	_chair(Vector3(center_x, UPPER_Y, -18.9), PI)
	for row in range(3):
		for side in [-1.9, 1.9]:
			var point := Vector3(center_x + side, UPPER_Y, -23.0 - row * 2.2)
			_desk(point + Vector3(0, 0.37, 0))
			_chair(point + Vector3(0, 0, -0.8))
	# Étagère à parchemins contre la cloison est de la salle.
	box(Vector3(0.4, 1.6, 1.8), Vector3(center_x + 4.3, UPPER_Y + 0.8, -27.0), dark)
	_scroll_row(Vector3(center_x + 4.3, UPPER_Y + 1.65, -27.0), 3)
	label_3d(room_title, Vector3(center_x, 7.5, SOUTH - 0.3), 16, Color(0.95, 0.9, 0.8))

func _build_classrooms() -> void:
	# Cloisons séparatives des trois salles.
	_wall_z(-30.0, SOUTH, -50.5, UPPER_Y, UPPER_WALL_H, 0.3)
	_wall_z(-30.0, SOUTH, -41.0, UPPER_Y, UPPER_WALL_H, 0.3)
	_classroom(-55.25, "SALLE 1 · FONDAMENTS", "Taijutsu : gardes et appuis")
	_classroom(-45.75, "SALLE 2 · HISTOIRE SHINOBI", "Les grandes guerres ninja")
	_classroom(-36.5, "SALLE 3 · LIBRE", "Étude autonome")

func _build_team_area() -> void:
	var teal := Color(0.16, 0.33, 0.3)
	var gold := Color(0.72, 0.58, 0.24)
	# Cloison est-ouest séparant la salle des équipes (x < -46).
	_wall_z(NORTH, -33.2, -46.0, UPPER_Y, UPPER_WALL_H, 0.3)
	# Grande salle des équipes : estrade d'enregistrement et panneaux d'annonce.
	# Les candidatures se déposent au comptoir de la réception (rez-de-chaussée) ;
	# cette salle affiche le décor officiel du système d'équipes de trois.
	box(Vector3(7.0, 0.3, 3.0), Vector3(-53.0, UPPER_Y + 0.15, -47.5), Color(0.55, 0.38, 0.22))
	box(Vector3(7.0, 2.6, 0.15), Vector3(-53.0, UPPER_Y + 1.6, -49.6), teal)
	cylinder(0.7, 0.1, Vector3(-53.0, UPPER_Y + 2.35, -49.45), gold, 14, false, Vector3(PI * 0.5, 0, 0))
	label_3d("忍", Vector3(-53.0, UPPER_Y + 2.35, -49.35), 62, Color(0.9, 0.82, 0.5))
	label_3d("ENREGISTREMENT DES ÉQUIPES", Vector3(-53.0, UPPER_Y + 1.35, -49.45), 24, Color(0.95, 0.9, 0.8))
	label_3d("CANDIDATURES À LA RÉCEPTION", Vector3(-53.0, UPPER_Y + 0.75, -49.45), 17, Color(0.8, 0.72, 0.5))
	# Panneaux d'annonce (listes de candidats, équipes officielles).
	box(Vector3(0.1, 2.0, 3.0), Vector3(WEST + 0.3, UPPER_Y + 1.6, -43.0), Color(0.95, 0.93, 0.85), false)
	label_3d("LISTE DES CANDIDATS\n· OUVERTE À LA RÉCEPTION ·", Vector3(WEST + 0.38, UPPER_Y + 1.6, -43.0), 15, Color(0.3, 0.25, 0.2), PI * 0.5)
	box(Vector3(0.1, 2.0, 3.0), Vector3(WEST + 0.3, UPPER_Y + 1.6, -38.0), Color(0.95, 0.93, 0.85), false)
	label_3d("ÉQUIPES OFFICIELLES\n· TROIS MEMBRES · UN SENSEI ·", Vector3(WEST + 0.38, UPPER_Y + 1.6, -38.0), 15, Color(0.3, 0.25, 0.2), PI * 0.5)
	# Bancs d'attente latéraux : l'allée centrale porte→estrade reste libre.
	for z in [-36.0, -39.0]:
		_bench(Vector3(-58.0, UPPER_Y, z), PI * 0.5)
		_bench(Vector3(-48.0, UPPER_Y, z), -PI * 0.5)
	_banner(Vector3(-59.0, UPPER_Y, -48.5), 3.0)
	_banner(Vector3(-47.2, UPPER_Y, -48.5), 3.0)
	label_3d("GRANDE SALLE DES ÉQUIPES", Vector3(-53.0, UPPER_Y + 2.9, -33.4), 20, Color(0.95, 0.9, 0.8), PI)

func _build_teachers_room() -> void:
	var dark := Color(0.36, 0.22, 0.13)
	# Salle des professeurs : bureaux, bibliothèque, table de travail.
	box(Vector3(4.0, 2.2, 0.5), Vector3(-41.5, UPPER_Y + 1.1, -49.5), dark)
	_scroll_row(Vector3(-41.5, UPPER_Y + 2.25, -49.5), 6)
	box(Vector3(0.05, 1.6, 0.6), Vector3(-41.5, UPPER_Y + 1.5, -49.2), Color(0.95, 0.93, 0.85), false)
	for point in [Vector3(-43.5, UPPER_Y, -46.0), Vector3(-39.5, UPPER_Y, -46.0), Vector3(-43.5, UPPER_Y, -42.0)]:
		box(Vector3(1.8, 0.75, 0.9), point + Vector3(0, 0.38, 0), Color(0.55, 0.38, 0.22))
		_chair(point + Vector3(0, 0, 1.0), PI)
	box(Vector3(2.2, 0.1, 1.4), Vector3(-39.5, UPPER_Y + 0.78, -42.0), dark, false)

func _build_roof() -> void:
	var teal := Color(0.216, 0.396, 0.353)
	var dark := Color(0.36, 0.22, 0.13)
	var gold := Color(0.72, 0.58, 0.24)
	# Toiture traditionnelle à deux pentes + faîtière, débords généreux.
	var slope := atan2(2.9, 17.4)
	box(Vector3(30.4, 0.28, 17.64), Vector3(CENTER_X, 9.45, -25.3), teal, true, Vector3(slope, 0, 0))
	box(Vector3(30.4, 0.28, 17.64), Vector3(CENTER_X, 9.45, -42.7), teal, true, Vector3(-slope, 0, 0))
	box(Vector3(30.8, 0.4, 0.6), Vector3(CENTER_X, 11.05, -34.0), gold)
	# Chevrons sous les débords.
	for x in range(6):
		box(Vector3(0.18, 0.22, 33.0), Vector3(WEST - 0.6 + x * 5.7, 8.05, -34.0), dark, false)
	# Fascias de rive et redressements de coins.
	box(Vector3(30.8, 0.35, 0.3), Vector3(CENTER_X, 8.05, -16.6), dark)
	box(Vector3(30.8, 0.35, 0.3), Vector3(CENTER_X, 8.05, -51.4), dark)
	box(Vector3(0.3, 0.35, 35.2), Vector3(-61.2, 8.0, -34.0), dark)
	box(Vector3(0.3, 0.35, 35.2), Vector3(-30.8, 8.0, -34.0), dark)
	for corner in [Vector2(-60.9, -16.9), Vector2(-31.1, -16.9), Vector2(-60.9, -51.1), Vector2(-31.1, -51.1)]:
		box(Vector3(1.8, 0.3, 1.8), Vector3(corner.x, 8.35, corner.y), dark, false, Vector3(0.2, 0, 0.25))
	# Pignons est/ouest.
	for x in [WEST - 0.35, EAST + 0.35]:
		box(Vector3(0.35, 1.2, 0.35), Vector3(x, 10.4, -34.0), dark, false)
		box(Vector3(0.3, 0.25, 17.64), Vector3(x, 9.45, -25.3), dark, false, Vector3(slope, 0, 0))
		box(Vector3(0.3, 0.25, 17.64), Vector3(x, 9.45, -42.7), dark, false, Vector3(-slope, 0, 0))

# ---------------------------------------------------------------------------
# Cour : parvis, allée, arbres, bancs, postes d'entraînement, bannières.
# ---------------------------------------------------------------------------

func _build_courtyard() -> void:
	var stone := Color(0.5, 0.5, 0.52)
	# Parvis dallé x [-61,-40] (la maison du quartier résidentiel reste à l'écart)
	# et allée principale jusqu'à la route transversale z = 0.
	box(Vector3(21.0, 0.12, 12.0), Vector3(-50.5, 0.06, -12.0), Color(0.76, 0.71, 0.6))
	box(Vector3(4.6, 0.02, 11.0), Vector3(CENTER_X, 0.13, -12.4), stone, false)
	box(Vector3(5.0, 0.1, 2.2), Vector3(CENTER_X, 0.05, -4.9), Color(0.76, 0.71, 0.6))
	# Arbres d'angle.
	for point in [Vector3(-59.0, 0, -7.5), Vector3(-42.0, 0, -7.5), Vector3(-59.0, 0, -16.5), Vector3(-42.0, 0, -16.5)]:
		_tree(point)
	# Bancs de part et d'autre de l'allée.
	_bench(Vector3(-53.0, 0.12, -9.5))
	_bench(Vector3(-53.0, 0.12, -14.5), PI)
	_bench(Vector3(-44.0, 0.12, -9.5))
	_bench(Vector3(-44.0, 0.12, -14.5), PI)
	# Petit espace d'entraînement extérieur : poteaux et cibles (coin ouest).
	for point in [Vector3(-57.0, 0.12, -12.0), Vector3(-57.0, 0.12, -14.5), Vector3(-57.0, 0.12, -17.0)]:
		cylinder(0.09, 1.4, point + Vector3(0, 0.7, 0), Color(0.55, 0.42, 0.26), 8)
		_target(point + Vector3(0.15, 1.35, 0))
	# Lanternes de pierre décoratives.
	for x in [-56.5, -43.5]:
		box(Vector3(0.55, 0.3, 0.55), Vector3(x, 0.27, -10.0), stone)
		cylinder(0.12, 1.0, Vector3(x, 0.9, -10.0), stone, 8)
		var glow := box(Vector3(0.4, 0.35, 0.4), Vector3(x, 1.6, -10.0), Color(1.0, 0.85, 0.5), false)
		glow.material_override = _mat(Color(1.0, 0.85, 0.5), true)
		cylinder(0.35, 0.15, Vector3(x, 1.9, -10.0), stone, 8, false)
	# Bannières de l'Académie encadrant l'entrée.
	_banner(Vector3(-50.8, 0.12, -17.2))
	_banner(Vector3(-41.2, 0.12, -17.2))
	# Panneau d'information extérieur (point de lecture LANDMARKS du village).
	for x in [-47.4, -44.6]:
		cylinder(0.07, 1.6, Vector3(x, 0.9, -14.0), Color(0.36, 0.22, 0.13), 6)
	box(Vector3(3.0, 1.1, 0.12), Vector3(CENTER_X, 1.45, -14.0), Color(0.55, 0.38, 0.22), false)
	box(Vector3(2.8, 0.9, 0.06), Vector3(CENTER_X, 1.45, -13.9), Color(0.95, 0.93, 0.85), false)
	label_3d("ACADÉMIE NINJA", Vector3(CENTER_X, 1.62, -13.82), 24, Color(0.25, 0.2, 0.15))
	label_3d("Forme les shinobi de Konoha", Vector3(CENTER_X, 1.22, -13.82), 14, Color(0.35, 0.3, 0.22))
	# Enseigne côté route.
	label_3d("COUR DE L'ACADÉMIE", Vector3(CENTER_X, 2.3, -5.6), 20, Color(0.95, 0.9, 0.8))

# ---------------------------------------------------------------------------
# Personnel et élèves : KonohaNPC en pose fixe, apparences variées.
# ---------------------------------------------------------------------------

func _staff_actor(kind: String, role: String, point: Vector3, tint: Color, angle := 0.0) -> KonohaNPC:
	var npc := KonohaNPC.new()
	add_child(npc)
	npc.configure(kind, role, point, [point], tint, "discussion", 0.0)
	npc.rotation.y = angle
	staff.append(npc)
	return npc

func _build_staff() -> void:
	receptionist = _staff_actor("woman", "Réceptionniste de l'Académie", Vector3(-37.5, FLOOR_TOP + 0.1, -23.8), Color(0.75, 0.55, 0.8), PI)
	_staff_actor("man", "Instructeur · Kenjutsu", Vector3(-52.0, FLOOR_TOP + 0.1, -38.0), Color(0.35, 0.45, 0.6), PI)
	_staff_actor("elder", "Administrateur de l'Académie", Vector3(-42.0, FLOOR_TOP + 0.1, -37.8), Color(0.6, 0.5, 0.35), PI)
	_staff_actor("man", "Professeur · Fondaments", Vector3(-55.25, UPPER_Y + 0.1, -20.6), Color(0.3, 0.5, 0.4))
	_staff_actor("woman", "Professeure · Histoire Shinobi", Vector3(-45.75, UPPER_Y + 0.1, -20.6), Color(0.6, 0.35, 0.3))
	# Élève en salle 1 (pose fixe devant son pupitre) et élève dans la cour.
	_staff_actor("girl", "Élève · Promotion 127", Vector3(-57.15, UPPER_Y + 0.1, -23.8), Color(0.5, 0.55, 0.7), PI)
	_staff_actor("boy", "Élève · Promotion 128", Vector3(-47.5, 0.22, -10.5), Color(0.55, 0.5, 0.3))

# ---------------------------------------------------------------------------
# Zones de transition, marqueurs, barrière de scellement et lumières.
# ---------------------------------------------------------------------------

func _zone(zone_name: String, point: Vector3, size: Vector3) -> Area3D:
	var area := Area3D.new()
	area.name = zone_name
	area.position = point
	area.collision_layer = 0
	area.collision_mask = 2
	var shape := CollisionShape3D.new()
	var prism := BoxShape3D.new()
	prism.size = size
	shape.shape = prism
	area.add_child(shape)
	add_child(area)
	return area

func _build_nodes() -> void:
	# Détection uniquement : aucune zone ne déplace directement le joueur.
	entrance_zone = _zone("AcademyEntrance", Vector3(CENTER_X, 1.5, -18.7), Vector3(6.0, 2.6, 0.8))
	exit_zone = _zone("AcademyExit", Vector3(CENTER_X, 1.5, -17.3), Vector3(6.0, 2.6, 0.8))
	entrance_zone.body_entered.connect(_on_entrance_body)
	exit_zone.body_entered.connect(_on_exit_body)
	interior_spawn = Marker3D.new()
	interior_spawn.name = "AcademyInteriorSpawn"
	interior_spawn.position = Vector3(CENTER_X, 0.35, -20.5)
	add_child(interior_spawn)
	exterior_spawn = Marker3D.new()
	exterior_spawn.name = "AcademyExteriorSpawn"
	exterior_spawn.position = Vector3(CENTER_X, 0.3, -16.2)
	add_child(exterior_spawn)
	# Zone d'interaction côté visiteurs du comptoir (jamais côté réceptionniste).
	reception_zone = _zone("AcademyReception", Vector3(-37.5, 1.2, -21.4), Vector3(4.6, 2.0, 1.8))
	# Repères nommés pour les systèmes futurs (aucune logique activée).
	var future: Dictionary = {
		"AcademyClassroom1": Vector3(-55.25, UPPER_Y + 0.2, -30.0),
		"AcademyClassroom2": Vector3(-45.75, UPPER_Y + 0.2, -30.0),
		"AcademyClassroom3": Vector3(-36.5, UPPER_Y + 0.2, -30.0),
		"AcademyTrainingArea": Vector3(-53.0, FLOOR_TOP + 0.2, -40.0),
		"AcademyInformationBoard": Vector3(-54.5, 1.6, -29.4),
		"AcademyTeamRegistrationArea": Vector3(-53.0, UPPER_Y + 0.2, -45.5),
		"AcademyTeamArea": Vector3(-53.0, UPPER_Y + 0.2, -40.0),
	}
	for marker_name: String in future:
		var marker := Marker3D.new()
		marker.name = marker_name
		marker.position = future[marker_name]
		add_child(marker)

func _build_barrier() -> void:
	barrier_mesh = box(Vector3(6.4, 3.4, 0.35), Vector3(CENTER_X, 1.86, SOUTH), Color(0.3, 0.19, 0.12))
	barrier_body = barrier_mesh.get_node("Solid") as StaticBody3D
	box(Vector3(6.0, 0.18, 0.4), Vector3(CENTER_X, 3.3, SOUTH + 0.05), Color(0.72, 0.58, 0.24), false)
	box(Vector3(6.0, 0.18, 0.4), Vector3(CENTER_X, 0.4, SOUTH + 0.05), Color(0.72, 0.58, 0.24), false)
	cylinder(0.55, 0.1, Vector3(CENTER_X, 1.9, SOUTH + 0.22), Color(0.72, 0.58, 0.24), 14, false, Vector3(PI * 0.5, 0, 0))
	label_3d("忍", Vector3(CENTER_X, 1.9, SOUTH + 0.3), 54, Color(0.35, 0.18, 0.08))
	barrier_labels.append(label_3d("ACADÉMIE SCELLÉE", Vector3(CENTER_X, 2.9, SOUTH + 0.35), 30, Color(0.95, 0.85, 0.45)))
	barrier_labels.append(label_3d("2e mission de clan : fais ton\nrapport à ton chef de clan", Vector3(CENTER_X, 0.95, SOUTH + 0.35), 16, Color(0.9, 0.85, 0.75)))

func _build_lights() -> void:
	# Budget Android : exactement 3 OmniLight (hall, entraînement, couloir).
	var hall := OmniLight3D.new()
	hall.position = Vector3(CENTER_X, 3.8, -24.0)
	hall.light_color = Color(1.0, 0.92, 0.75)
	hall.light_energy = 0.85
	hall.omni_range = 13.0
	add_child(hall)
	var training := OmniLight3D.new()
	training.position = Vector3(-53.0, 3.8, -40.0)
	training.light_color = Color(1.0, 0.94, 0.8)
	training.light_energy = 0.55
	training.omni_range = 11.0
	add_child(training)
	var corridor := OmniLight3D.new()
	corridor.position = Vector3(CENTER_X, 7.0, -31.6)
	corridor.light_color = Color(1.0, 0.92, 0.78)
	corridor.light_energy = 0.5
	corridor.omni_range = 11.0
	add_child(corridor)

# ---------------------------------------------------------------------------
# Déblocage (état réel de la 2e mission de clan) et transitions.
# ---------------------------------------------------------------------------

func set_unlocked(value: bool) -> void:
	if value == unlocked:
		return
	unlocked = value
	if not built:
		return
	if value:
		if is_instance_valid(barrier_mesh):
			barrier_mesh.queue_free()
		barrier_mesh = null
		barrier_body = null
		for sign in barrier_labels:
			if is_instance_valid(sign):
				sign.queue_free()
		barrier_labels.clear()
		unlocked_now.emit()
	else:
		_build_barrier()

func barrier_visible() -> bool:
	return barrier_mesh != null and is_instance_valid(barrier_mesh) and barrier_mesh.visible

func door_point() -> Vector3:
	return Vector3(CENTER_X, 0.3, SOUTH)

func hall_point() -> Vector3:
	return HALL_POINT

func reception_overlaps(body: Node3D) -> bool:
	return unlocked and reception_zone != null and is_instance_valid(reception_zone) and reception_zone.overlaps_body(body)

func _on_entrance_body(body: Node3D) -> void:
	if body == player:
		pending_enter = true

func _on_exit_body(body: Node3D) -> void:
	if body == player:
		pending_exit = true

func _deep_inside(point: Vector3) -> bool:
	# Zone profonde du bâtiment : le bandeau de porte z [-18,6,-17,6] reste neutre
	# pour qu'un appui contre la porte ne déclenche jamais de bascule parasite.
	return point.x > WEST and point.x < EAST and point.z > NORTH and point.z < SOUTH - 0.6 and point.y > -0.6 and point.y < 9.0

func _deep_outside(point: Vector3) -> bool:
	return point.x < WEST - 1.0 or point.x > EAST + 1.0 or point.z < NORTH - 1.0 or point.z > SOUTH + 0.6

func update(point: Vector3, delta: float) -> void:
	if not built:
		return
	transition_lock = maxf(0.0, transition_lock - delta)
	if pending_enter and not inside and transition_lock <= 0.0 and unlocked:
		_set_inside(true)
	elif pending_exit and inside and transition_lock <= 0.0:
		_set_inside(false)
	elif transition_lock <= 0.0:
		# Filet de sécurité rectangulaire : chute, respawn ou correction réseau.
		# Les marqueurs AcademyInteriorSpawn / AcademyExteriorSpawn ne servent
		# qu'à rattraper une position invalide, jamais la marche normale.
		if not inside and unlocked and _deep_inside(point):
			_set_inside(true)
			if is_instance_valid(player) and (point.y < 0.0 or point.y > 8.6):
				player.reset_at(interior_spawn.position)
		elif inside and _deep_outside(point):
			_set_inside(false)
	pending_enter = false
	pending_exit = false
	if is_instance_valid(player) and inside and player.position.y < -0.5:
		player.reset_at(interior_spawn.position)

func _set_inside(value: bool) -> void:
	inside = value
	transition_lock = 0.9
	pending_enter = false
	pending_exit = false
	if value:
		entered.emit()
	else:
		exited.emit()
