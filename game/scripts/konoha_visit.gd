class_name KonohaVisit
extends Control
## Separate world/avatar. Only orientation checkpoints sync, never live positions or rewards.
signal closed
var account_profile: Dictionary = {}
var api: CharacterAccountAPI
var mission: Dictionary = {}
var menu_event: String = ""
var request_kind: String = ""
var sync_error: String = ""
var journal_open: bool = false
var viewport: SubViewport
var world: KonohaMap
var player: TrainingFighter
var guide: TrainingFighter
var hud: KonohaHUD
var pivot: Node3D
var arm: SpringArm3D
var yaw: float = 0.0
var pitch: float = -0.06
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
	if api != null:
		api.completed.connect(_mission_response)
	_sync_mission()
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
	hud.objective.text = WelcomeMission.objective(mission)
	if not request_kind.is_empty():
		hud.objective.text = "Connexion en cours · Ne ferme pas l’application pour confirmer l’étape."
	elif not sync_error.is_empty():
		hud.objective.text = "Mission non confirmée · Ouvre le JOURNAL pour actualiser."
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
		match mission.get("status", ""):
			"available":
				_dialogue("Aoi · Ta première mission", "Bienvenue à Konoha, %s !\nPour t’orienter, lis les panneaux de l’académie à droite, du marché à gauche et de la résidence du Hokage au nord. Reviens ensuite me faire ton rapport.\nLe JOURNAL suit tes étapes enregistrées sur le compte. Cette mission solo n’accorde pas encore de récompense." % account_profile["character"]["name"], "accept")
			"active":
				if mission["visited"].size() == 3:
					_dialogue("Aoi · Ton compte rendu", "Tu as repéré les trois lieux. L’académie sert à apprendre, le marché à rencontrer les habitants, et la résidence à retrouver les responsables du village.\nRemets ton rapport pour terminer cette mission d’accueil sur ton compte.", "report")
				else:
					_dialogue("Aoi · Continue ton repérage", "Il te reste %d panneau(x) à lire et valider. Le journal indique lesquels.\nAcadémie à droite, marché à gauche, résidence au bout de l’allée. Reviens ensuite me voir." % (3-mission["visited"].size()))
			"completed":
				_dialogue("Aoi · Bienvenue chez toi", "Ta mission d’accueil est terminée et enregistrée sur ton compte. Tu peux continuer à explorer Konoha.\nIl n’y a pas encore de nouvelle mission, d’intérieur accessible ni de récompense à récupérer.")
			_:
				_dialogue("Aoi · Accueil des genin", "Bienvenue à Konoha ! Repère le marché à gauche, l’académie à droite et la résidence au bout de l’allée.\nTu peux visiter les extérieurs. La mission sauvegardée nécessite la mise à jour du serveur ; consulte le JOURNAL.")
	else:
		var data: Dictionary = KonohaMap.LANDMARKS[nearest]
		var event: String = ""
		var text: String = data["text"]
		if mission.is_empty():
			visited[nearest] = true # Legacy server: orientation only, explicitly unsaved.
		elif mission["status"] == "available":
			text += "\nMission : parle d’abord à Aoi pour accepter le repérage."
		elif mission["status"] == "active" and WelcomeMission.PLACES[nearest] not in mission["visited"]:
			event = "read_" + WelcomeMission.PLACES[nearest]
			text += "\nValide ta lecture pour enregistrer cette étape sur ton compte."
		else:
			text += "\nCette lecture est déjà enregistrée sur ton compte."
		_dialogue(data["name"], text, event)

func _dialogue(title: String, text: String, event: String = "") -> void:
	journal_open = false
	menu_event = event
	hud.primary.disabled = not request_kind.is_empty()
	hud.mission_refresh.hide()
	hud.text_scroll.scroll_vertical = 0
	var button: String = "ACCEPTER LA MISSION" if event == "accept" else "REMETTRE MON RAPPORT" if event == "report" else "VALIDER LA LECTURE" if not event.is_empty() else "CONTINUER LA VISITE"
	hud.show_menu(title,text,button,true)

func _sync_mission() -> void:
	var profile: Dictionary = api.profile if api != null else account_profile
	mission = {}
	if profile.get("character", {}).get("id") != account_profile["character"]["id"]:
		return
	var value: Variant = profile.get("welcomeMission")
	if WelcomeMission.valid_state(value):
		mission = value.duplicate(true)
		guide_met = mission["status"] != "available"
		visited.clear()
		for i in range(WelcomeMission.PLACES.size()):
			if WelcomeMission.PLACES[i] in mission["visited"]:
				visited[i] = true

func open_journal() -> void:
	if not initialized or ending:
		return
	_clear_inputs()
	journal_open = true
	menu_event = ""
	var text: String = WelcomeMission.journal(mission)
	if api != null and api.profile.is_empty():
		text = "Session expirée ou accès indisponible. Reviens à MON COMPTE pour te reconnecter. Les étapes déjà confirmées restent sur ton compte."
	if not request_kind.is_empty():
		text = "Enregistrement / actualisation en cours. Attends la confirmation.\n\n" + text
	elif not sync_error.is_empty():
		text = sync_error + "\nActualise avant de valider à nouveau une étape.\n\n" + text
	hud.show_menu("Journal · Mission d’accueil",text,"CONTINUER LA VISITE",true)
	hud.primary.disabled = false
	hud.mission_refresh.show()
	hud.mission_refresh.disabled = api == null or api.busy or api.profile.is_empty() or not request_kind.is_empty()
	hud.text_scroll.scroll_vertical = 0

func _confirm_mission() -> void:
	if menu_event.is_empty():
		resume_visit()
		return
	if api == null or api.busy or not request_kind.is_empty():
		return
	if not sync_error.is_empty():
		open_journal()
		return
	# No free checkpoint buttons in the journal: remain at the actual interaction.
	var nearest: int = nearest_interaction()
	var expected: int = -1 if menu_event in ["accept", "report"] else WelcomeMission.PLACES.find(menu_event.trim_prefix("read_"))
	if nearest != expected or mission.is_empty() or api.profile.is_empty():
		sync_error = "Approche du bon interlocuteur ou panneau avec une session active."
		open_journal()
		return
	request_kind = "mission"
	sync_error = ""
	hud.primary.disabled = true
	hud.primary.text = "ENREGISTREMENT…"
	api.mission_event(menu_event)

func _refresh_mission() -> void:
	if api == null or api.busy or api.profile.is_empty():
		return
	request_kind = "refresh"
	open_journal()
	api.refresh()

func _mission_response(operation: String, success: bool, message: String) -> void:
	if ending or operation != request_kind:
		return
	request_kind = ""
	_sync_mission()
	sync_error = "" if success else message
	menu_event = ""
	if hud.blocked:
		open_journal()
	else:
		hud.notice("Mission actualisée sur ton compte." if success else "Mission non confirmée : consulte le JOURNAL.")

func _action(action: String) -> void:
	match action:
		"pause": toggle_pause()
		"leave": finish()
		"interact": interact()
		"journal": open_journal()
		"mission_confirm": _confirm_mission()
		"mission_refresh": _refresh_mission()
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
		_dialogue("Une pause à Konoha", "Quartier d’accueil · visite solo avec l’apparence de ton compte.\nLe combat de l’entraînement reste dans sa propre zone. Seules les étapes confirmées dans le journal sont sauvegardées. Ta position ne l’est pas.\nTu peux reprendre la visite ou revenir à ton compte.", "")

func resume_visit() -> void:
	if not initialized or ending:
		return
	_clear_inputs()
	menu_event = ""
	journal_open = false
	hud.primary.disabled = false
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
