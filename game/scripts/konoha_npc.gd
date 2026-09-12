class_name KonohaNPC
extends Node3D
## Lightweight, non-combat village life actor: pedestrians, shoppers and animals.
## Routes are local to Konoha and never touch the account or online combat state.

var category: String = "man"
var role: String = "Habitant"
var activity: String = "walking"
var route: Array[Vector3] = []
var route_index: int = 0
var speed: float = 1.7
var wait_seconds: float = 0.0
var animation_clock: float = 0.0
var actor: Node3D
var fighter: TrainingFighter
var activity_label: Label3D
var actor_material: StandardMaterial3D
var direction: Vector3 = Vector3.FORWARD

func configure(kind: String, title: String, start: Vector3, points: Array, tint: Color, behavior: String = "walking", pace: float = 1.7) -> void:
	category = kind
	role = title
	activity = behavior
	speed = pace
	position = start
	for point: Variant in points:
		if point is Vector3:
			route.append(point)
	if route.is_empty():
		route.append(start)
	if category in ["dog", "cat", "pig", "chicken"]:
		_build_animal()
	else:
		_build_person(tint)
	if activity in ["discussion", "merchant"] or category in ["elder"]:
		_add_label(title)

func _build_person(tint: Color) -> void:
	fighter = TrainingFighter.new()
	add_child(fighter)
	fighter.configure(tint, 0, 100)
	var look: Dictionary = CharacterAppearance.DEFAULTS.duplicate()
	look["model"] = 1 if category in ["woman", "girl"] else 0
	look["hair"] = {"woman": 2, "girl": 1, "elder": 3, "man": 0, "boy": 1}.get(category, 0)
	look["hair_color"] = absi(role.hash()) % CharacterAppearance.HAIR_COLORS.size()
	look["eyes"] = absi((role + category).hash()) % CharacterAppearance.EYE_COLORS.size()
	look["skin"] = absi((category + role).hash()) % CharacterAppearance.SKIN_COLORS.size()
	look["top"] = 1 if category in ["elder", "merchant"] else 0
	look["top_color"] = absi((role + "top").hash()) % CharacterAppearance.CLOTH_COLORS.size()
	look["bottom_color"] = absi((role + "bottom").hash()) % CharacterAppearance.CLOTH_COLORS.size()
	fighter.apply_appearance(look)
	var scale_value: float = 0.68 if category in ["girl", "boy"] else 0.88 if category == "elder" else 1.0
	fighter.scale = Vector3.ONE * scale_value
	fighter.collision_layer = 0
	fighter.collision_mask = 0
	actor = fighter

func _build_animal() -> void:
	actor = Node3D.new()
	add_child(actor)
	var fur: Color = {"dog":Color("a36e4c"), "cat":Color("d29c68"), "pig":Color("e5a5a2"), "chicken":Color("eee1bb")}.get(category, Color.WHITE)
	actor_material = TrainingFighter.material(fur)
	var dark := TrainingFighter.material(Color("47382f"))
	if category == "chicken":
		_mesh(actor, SphereMesh.new(), Vector3(0.28,0.32,0.42), Vector3(0,0.48,0), actor_material)
		_mesh(actor, SphereMesh.new(), Vector3(0.20,0.22,0.22), Vector3(0,0.78,-0.23), actor_material)
		var beak_material := TrainingFighter.material(Color("cd8c42"))
		_mesh(actor, CylinderMesh.new(), Vector3(0.04,0.18,0.04), Vector3(-0.08,0.16,-0.03), beak_material)
		_mesh(actor, CylinderMesh.new(), Vector3(0.04,0.18,0.04), Vector3(0.08,0.16,-0.03), beak_material)
		_mesh(actor, SphereMesh.new(), Vector3(0.035,0.035,0.035), Vector3(0.08,0.82,-0.39), dark)
	else:
		var body_scale := Vector3(0.48,0.36,0.78) if category == "pig" else Vector3(0.42,0.38,0.82)
		_mesh(actor, SphereMesh.new(), body_scale, Vector3(0,0.48,0), actor_material)
		_mesh(actor, SphereMesh.new(), Vector3(0.32,0.30,0.34), Vector3(0,0.68,-0.55), actor_material)
		for x in [-0.18,0.18]:
			_mesh(actor, CylinderMesh.new(), Vector3(0.08,0.30,0.08), Vector3(x,0.20,-0.18), dark)
			_mesh(actor, CylinderMesh.new(), Vector3(0.08,0.30,0.08), Vector3(x,0.20,0.18), dark)
		if category == "cat":
			_mesh(actor, PrismMesh.new(), Vector3(0.18,0.24,0.12), Vector3(-0.18,0.94,-0.55), actor_material)
			_mesh(actor, PrismMesh.new(), Vector3(0.18,0.24,0.12), Vector3(0.18,0.94,-0.55), actor_material)
		elif category == "pig":
			_mesh(actor, SphereMesh.new(), Vector3(0.18,0.12,0.07), Vector3(0,0.68,-0.86), dark)
		else:
			_mesh(actor, CylinderMesh.new(), Vector3(0.08,0.65,0.08), Vector3(0,0.82,0.47), actor_material)

func _mesh(parent: Node3D, shape: PrimitiveMesh, dimensions: Vector3, point: Vector3, material: Material) -> MeshInstance3D:
	if shape is SphereMesh:
		shape.radius = dimensions.x
		shape.height = dimensions.y * 2.0
		shape.radial_segments = 8
		shape.rings = 4
	elif shape is CylinderMesh:
		shape.top_radius = dimensions.x
		shape.bottom_radius = dimensions.x * 1.15
		shape.height = dimensions.y
		shape.radial_segments = 6
	elif shape is PrismMesh:
		shape.size = dimensions
	var item := MeshInstance3D.new()
	item.mesh = shape
	item.position = point
	item.material_override = material
	parent.add_child(item)
	return item

func _add_label(text: String) -> void:
	activity_label = Label3D.new()
	activity_label.text = text
	activity_label.position = Vector3(0,2.35,0)
	activity_label.font_size = 18
	activity_label.pixel_size = 0.007
	activity_label.modulate = Color("f4dfb0")
	activity_label.outline_size = 5
	activity_label.outline_modulate = Color("263b35")
	activity_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(activity_label)

func _process(delta: float) -> void:
	animation_clock += delta * (10.0 if speed > 2.0 else 7.0)
	if wait_seconds > 0.0:
		wait_seconds -= delta
		_set_pose("talking" if activity == "discussion" else "idle")
		return
	if route.size() > 1:
		var target: Vector3 = route[route_index]
		var offset := target - position
		if offset.length() < 0.45:
			route_index = (route_index + 1) % route.size()
			wait_seconds = 2.4 if activity == "discussion" else 1.35 if activity in ["shopping", "merchant"] else 0.3
			_set_pose("talking" if activity == "discussion" else "shopping" if activity in ["shopping", "merchant"] else "idle")
			return
		direction = offset.normalized()
		position += direction * speed * delta
		rotation.y = atan2(-direction.x, -direction.z)
		_set_pose("walking")
	else:
		_set_pose("talking" if activity == "discussion" else "idle")

func _set_pose(state: String) -> void:
	if fighter == null:
		if actor != null:
			actor.position.y = 0.025 * sin(animation_clock * 0.8)
		return
	var amplitude: float = 0.52 if state == "walking" else 0.12 if state == "talking" else 0.04
	fighter.left_leg.rotation.x = sin(animation_clock) * amplitude
	fighter.right_leg.rotation.x = -sin(animation_clock) * amplitude
	fighter.left_arm.rotation.x = -sin(animation_clock) * amplitude
	fighter.right_arm.rotation.x = sin(animation_clock) * amplitude
	fighter.visual.rotation.y = rotation.y
	fighter.visual.position.y = 0.035 * sin(animation_clock * 0.9) if state == "walking" else 0.0
	if activity_label != null:
		var action := "..." if state == "talking" else "en mouvement" if state == "walking" else "au comptoir" if activity == "merchant" else "achète" if state == "shopping" else "en attente"
		activity_label.text = "%s · %s" % [role, action]

func _exit_tree() -> void:
	if is_instance_valid(fighter):
		fighter.queue_free()
