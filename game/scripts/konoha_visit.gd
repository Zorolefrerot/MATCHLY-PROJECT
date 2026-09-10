class_name KonohaVisit
extends Control
## Separate world and avatar. Traversal is local; no combat, rewards or world sync.
signal closed
var account_profile: Dictionary = {}
var viewport: SubViewport
var world: KonohaMap
var player: TrainingFighter
var guide: TrainingFighter
var hud: KonohaHUD
var pivot: Node3D
var arm: SpringArm3D
var yaw: float = 0.0
var pitch: float = -0.24
var visited: Dictionary = {}
var guide_met: bool = false
var initialized: bool = false
var ending: bool = false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	if not CharacterAccountAPI.valid_profile(account_profile):
		call_deferred("finish")
		return
	var container := SubViewportContainer.new()
	container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	container.stretch = true
	container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(container)
	viewport = SubViewport.new()
	viewport.size = Vector2i(1280,720)
	viewport.own_world_3d = true
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	container.add_child(viewport)
	world = KonohaMap.new()
	viewport.add_child(world)
	world.build()
	player = TrainingFighter.new()
	world.add_child(player)
	player.configure(Color("385962"), 2, 120)
	var appearance: Variant = account_profile.get("appearance")
	player.apply_appearance(appearance if appearance is Dictionary else CharacterAppearance.DEFAULTS)
	player.reset_at(KonohaMap.SPAWN)
	guide = TrainingFighter.new()
	world.add_child(guide)
	guide.configure(Color("617b50"), 4, 120)
	guide.reset_at(KonohaMap.GUIDE)
	guide.face(KonohaMap.SPAWN-KonohaMap.GUIDE)
	var nameplate := Label3D.new()
	nameplate.text = "AOI · ACCUEIL\nApproche pour parler"
	nameplate.position = Vector3(0,2.4,0)
	nameplate.font_size = 28
	nameplate.pixel_size = 0.009
	nameplate.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	guide.add_child(nameplate)
	pivot = Node3D.new()
	world.add_child(pivot)
	arm = SpringArm3D.new()
	arm.spring_length = 6.2
	arm.margin = 0.2
	arm.collision_mask = 1
	var probe := SphereShape3D.new()
	probe.radius = 0.2
	arm.shape = probe
	pivot.add_child(arm)
	var camera := Camera3D.new()
	camera.fov = 67
	camera.far = 105
	arm.add_child(camera)
	camera.current = true
	hud = KonohaHUD.new()
	add_child(hud)
	var identity: Dictionary = account_profile["character"]
	hud.identity.text = "KONOHA · QUARTIER D’ACCUEIL\n%s · %s" % [identity["name"], identity["clan"]]
	hud.action_requested.connect(_action)
	hud.resume_requested.connect(resume_visit)
	if not InputMap.has_action("village_interact"):
		InputMap.add_action("village_interact")
		var key := InputEventKey.new()
		key.physical_keycode = KEY_E
		InputMap.action_add_event("village_interact", key)
	_update_camera()
	initialized = true

func _physics_process(delta: float) -> void:
	if not initialized or ending or hud.blocked:
		return
	var look: Vector2 = hud.consume_look()
	yaw -= look.x*0.004
	pitch = clampf(pitch-look.y*0.003, -0.85, -0.08)
	pivot.rotation.y = yaw
	var axes: Vector2 = (Input.get_vector("move_left", "move_right", "move_forward", "move_back")+hud.move_vector).limit_length()
	var direction: Vector3 = (pivot.basis.x*axes.x + pivot.basis.z*axes.y).limit_length()
	if Input.is_action_just_pressed("jump"):
		player.jump()
	player.simulate(delta, direction, hud.sprinting or Input.is_action_pressed("sprint"))
	if player.position.y < -5 or absf(player.position.x) > 31 or absf(player.position.z) > 35:
		player.reset_at(KonohaMap.SPAWN)
		hud.notice("Retour au point d’arrivée du quartier.")
	_update_camera()
	var nearest: int = nearest_interaction()
	hud.buttons["interact"].disabled = nearest == -2
	hud.buttons["interact"].text = "PARLER À AOI" if nearest == -1 else "LIRE LE PANNEAU" if nearest >= 0 else "APPROCHE-TOI"
	hud.objective.text = "Parle à Aoi près de la porte." if not guide_met else "Repérage : %d / 3 lieux · Exploration libre" % visited.size()
	hud.fps.text = "%d FPS · SOLO" % Engine.get_frames_per_second()
	if Input.is_action_just_pressed("village_interact"):
		interact()

func _update_camera() -> void:
	pivot.position = player.position + Vector3.UP*1.4
	pivot.rotation.y = yaw
	arm.rotation.x = pitch

func _reachable(point: Vector3) -> bool:
	if player.position.distance_to(point) > 3.4:
		return false
	var ray := PhysicsRayQueryParameters3D.create(player.position+Vector3.UP*1.3, point+Vector3.UP*1.3, 1)
	return world.get_world_3d().direct_space_state.intersect_ray(ray).is_empty()

func nearest_interaction() -> int:
	if _reachable(guide.position):
		return -1
	for i in range(KonohaMap.LANDMARKS.size()):
		if _reachable(KonohaMap.LANDMARKS[i]["point"]):
			return i
	return -2

func interact() -> void:
	if not initialized or ending or hud.blocked:
		return
	var nearest: int = nearest_interaction()
	if nearest == -2:
		hud.notice("Approche-toi d’Aoi ou d’un panneau pour interagir.")
		return
	_clear_inputs()
	if nearest == -1:
		guide_met = true
		guide.face(player.position-guide.position)
		var text: String = "Bienvenue à Konoha, %s ! Voici notre quartier d’accueil.\nRepère le marché à gauche, l’académie à droite et la résidence du Hokage au bout de l’allée. Lis leurs panneaux en t’approchant.\nCette première visite est solo ; les intérieurs, missions et autres joueurs viendront ensuite." % account_profile["character"]["name"]
		if visited.size() == 3:
			text = "Tu as repéré les trois lieux du quartier. Bienvenue chez toi !\nTu peux continuer à explorer. Ce repérage reste limité à cette visite : il n’accorde ni objet, ni expérience, ni récompense enregistrée."
		hud.show_menu("Aoi · Accueil des genin", text, "CONTINUER LA VISITE", true)
	else:
		var data: Dictionary = KonohaMap.LANDMARKS[nearest]
		visited[nearest] = true
		hud.show_menu(data["name"], data["text"], "CONTINUER LA VISITE", true)

func _action(action: String) -> void:
	match action:
		"pause": toggle_pause()
		"leave": finish()
		"interact": interact()
		"jump":
			if not hud.blocked: player.jump()

func _clear_inputs() -> void:
	if is_instance_valid(hud):
		hud.reset_input()
	for action in ["move_left", "move_right", "move_forward", "move_back", "sprint", "jump", "village_interact"]:
		if InputMap.has_action(action):
			Input.action_release(action)

func pause_visit() -> void:
	if not initialized or ending:
		return
	_clear_inputs()
	if not hud.blocked:
		hud.show_menu("Une pause à Konoha", "Quartier d’accueil · visite solo avec l’apparence de ton compte.\nLe combat de l’entraînement reste dans sa propre zone. Ta position et ton repérage ne sont pas sauvegardés.\nTu peux reprendre la visite ou revenir à ton compte.", "REPRENDRE LA VISITE", true)

func resume_visit() -> void:
	if not initialized or ending:
		return
	_clear_inputs()
	hud.hide_menu()

func toggle_pause() -> void:
	if not initialized or ending:
		return
	if hud.blocked: resume_visit()
	else: pause_visit()

func finish() -> void:
	if ending:
		return
	ending = true
	_clear_inputs()
	if is_instance_valid(viewport):
		viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
	if is_instance_valid(hud):
		hud.set_process_input(false)
	hide()
	closed.emit()
