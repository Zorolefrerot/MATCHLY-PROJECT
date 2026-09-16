class_name TeamSensei
extends Node3D
## Le Sensei de la cérémonie officielle : il entre à pied dans l'Académie,
## rejoint l'équipe, puis le TeamManager affiche sa présentation et ses
## répliques. Scène légère et non bloquante : un corps TrainingFighter réutilisé
## (apparence validée envoyée par le serveur), un gilet vert de Konoha ajouté
## par-dessus, un bandeau déjà dessiné par le personnage, et une étiquette.
## Aucune logique de compte : tout l'état vient du serveur.

signal arrived

var data: Dictionary = {}
var target_point: Vector3 = Vector3.ZERO
var walking: bool = true
var speed: float = 1.3
var animation_clock: float = 0.0
var fighter: TrainingFighter
var name_label: Label3D
var speech_bubble: Label3D
var vest_root: Node3D

func configure(sensei: Dictionary, from: Vector3, to: Vector3) -> void:
	data = sensei
	position = from
	target_point = to
	_build()
	# Convention du village : le nœud reste sans rotation, le yaw vit sur
	# TrainingFighter.visual (comme les avatars distants et les PNJ joueurs).
	fighter.face(to - from)

func _build() -> void:
	fighter = TrainingFighter.new()
	add_child(fighter)
	fighter.configure(Color("536b48"), 0, 100)
	fighter.collision_layer = 0
	fighter.collision_mask = 0
	var appearance: Dictionary = {}
	if data.get("senseiAppearance") is Dictionary:
		appearance = data["senseiAppearance"]
	fighter.apply_appearance(appearance)
	_dress_vest()
	name_label = Label3D.new()
	name_label.text = "%s\n%s" % [str(data.get("senseiName", "Sensei")), str(data.get("senseiTitle", "Sensei de Konoha"))]
	name_label.position = Vector3(0, 2.5, 0)
	name_label.font_size = 17
	name_label.pixel_size = 0.007
	name_label.modulate = Color("f4dfb0")
	name_label.outline_size = 5
	name_label.outline_modulate = Color("263b35")
	name_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(name_label)
	speech_bubble = Label3D.new()
	speech_bubble.name = "DialogueBubble"
	speech_bubble.position = Vector3(0, 3.55, 0)
	speech_bubble.font_size = 20
	speech_bubble.pixel_size = 0.0055
	speech_bubble.modulate = Color("fff0c9")
	speech_bubble.outline_size = 10
	speech_bubble.outline_modulate = Color(0.07, 0.12, 0.13, 0.96)
	speech_bubble.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	speech_bubble.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	speech_bubble.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	speech_bubble.visible = false
	add_child(speech_bubble)

func show_dialogue(text: String) -> void:
	if not is_instance_valid(speech_bubble):
		return
	var clean := text.replace("\n", " ").strip_edges()
	if clean.length() > 180:
		clean = clean.left(177) + "…"
	speech_bubble.text = "❝ %s ❞" % clean
	speech_bubble.visible = not clean.is_empty()

func _dress_vest() -> void:
	# Gilet vert de Konoha (Jonin) : torse, sangle centrale, col et poches.
	# Matériaux partagés via TrainingFighter.material, jamais un matériau par boîte.
	if not is_instance_valid(fighter) or not is_instance_valid(fighter.visual):
		return
	vest_root = Node3D.new()
	fighter.visual.add_child(vest_root)
	var vest := TrainingFighter.material(Color("536b48"))
	var vest_dark := TrainingFighter.material(Color("3b4f36"))
	var cream := TrainingFighter.material(Color("d8d2bd"))
	var scroll := TrainingFighter.material(Color("c9b98f"))
	_box(Vector3(0.64, 0.52, 0.40), Vector3(0, 1.06, 0), vest)
	_box(Vector3(0.10, 0.52, 0.42), Vector3(0, 1.06, 0), vest_dark)
	_box(Vector3(0.70, 0.09, 0.44), Vector3(0, 1.33, 0), vest_dark)
	_box(Vector3(0.20, 0.16, 0.10), Vector3(-0.20, 1.16, -0.18), cream)
	_box(Vector3(0.18, 0.14, 0.09), Vector3(0.21, 0.98, -0.18), cream)
	_box(Vector3(0.07, 0.30, 0.07), Vector3(-0.30, 0.95, 0.10), scroll)

func _box(size: Vector3, point: Vector3, material: StandardMaterial3D) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = size
	var item := MeshInstance3D.new()
	item.mesh = mesh
	item.position = point
	item.material_override = material
	vest_root.add_child(item)
	return item

func _process(delta: float) -> void:
	animation_clock += delta * 6.5
	if walking:
		var offset := target_point - position
		offset.y = 0.0
		if offset.length() < 0.5:
			walking = false
			_set_pose("talking")
			arrived.emit()
			return
		var direction := offset.normalized()
		position += direction * speed * delta
		if is_instance_valid(fighter):
			fighter.face(direction, 0.35)
		_set_pose("walking")
	else:
		_set_pose("talking")

func _set_pose(state: String) -> void:
	if not is_instance_valid(fighter):
		return
	var amplitude: float = 0.46 if state == "walking" else 0.10
	if is_instance_valid(fighter.left_leg):
		fighter.left_leg.rotation.x = sin(animation_clock) * amplitude
		fighter.right_leg.rotation.x = -sin(animation_clock) * amplitude
	if is_instance_valid(fighter.left_arm):
		fighter.left_arm.rotation.x = -sin(animation_clock) * amplitude
		fighter.right_arm.rotation.x = sin(animation_clock) * amplitude
	fighter.visual.position.y = 0.035 * sin(animation_clock * 0.9) if state == "walking" else 0.0
	if name_label != null:
		name_label.text = "%s\n%s" % [str(data.get("senseiName", "Sensei")), "rejoint votre équipe…" if walking else str(data.get("senseiTitle", "Sensei de Konoha"))]

func _exit_tree() -> void:
	if is_instance_valid(fighter):
		fighter.queue_free()
