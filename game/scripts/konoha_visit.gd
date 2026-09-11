class_name KonohaVisit
extends Control
## Separate world and personal mission, with ephemeral shared presence. No network combat.
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
var music: AudioStreamPlayer
var music_enabled: bool = true
var app_active: bool = true
var village_link: VillageLink
var chat_panel: VillageChat
var remote_avatars: Dictionary = {}
var unread: int = 0

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
	music = AudioStreamPlayer.new()
	var stream: AudioStreamOggVorbis = preload("res://assets/village_audio/village_loop.ogg").duplicate()
	stream.loop = true
	music.stream = stream
	music.bus = TrainingAudio.BUS if AudioServer.get_bus_index(TrainingAudio.BUS) >= 0 else "Master"
	music.volume_db = -12.0
	add_child(music)
	_update_music()
	chat_panel = VillageChat.new()
	hud.overlay.add_child(chat_panel)
	chat_panel.closed.connect(resume_visit)
	chat_panel.send_requested.connect(_send_chat)
	if api != null:
		village_link = create_village_link()
		village_link.api = api
		village_link.status_changed.connect(_network_status)
		village_link.received.connect(_network_event)
		village_link.disconnected.connect(_clear_remote)
		add_child(village_link)

func create_village_link() -> VillageLink:
	return VillageLink.new()

func _update_music() -> void:
	if not is_instance_valid(music):
		return
	if ending or not music_enabled:
		music.stop()
	elif not music.playing:
		music.play()
	music.stream_paused = not app_active
	if is_instance_valid(hud):
		hud.buttons["music"].text = "MUSIQUE : OUI" if music_enabled else "MUSIQUE : NON"

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		app_active = false
		_clear_inputs()
		if is_instance_valid(village_link): village_link.set_active(false)
		_update_music()
	elif what == NOTIFICATION_APPLICATION_FOCUS_IN:
		app_active = true
		if is_instance_valid(village_link): village_link.set_active(true)
		_update_music()

func _physics_process(delta: float) -> void:
	if not initialized or ending or hud.blocked or not app_active:
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
		if is_instance_valid(village_link): village_link.respawn()
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
	hud.fps.text = "%d FPS · %s" % [Engine.get_frames_per_second(), "EN LIGNE" if is_instance_valid(village_link) and village_link.connected else "LOCAL"]
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
	_close_chat()
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
	_close_chat()
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
		"chat": open_chat()
		"music":
			music_enabled = not music_enabled
			_update_music()
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
		_dialogue("Une pause à Konoha", "Quartier d’accueil · apparence du compte et présence partagée si connecté.\nLe combat de l’entraînement reste dans sa propre zone. Mission personnelle sauvegardée. Ni position ni chat conservés après la visite. Le chat ne déclenche aucune action de combat.\nTu peux reprendre la visite ou revenir à ton compte.", "")

func resume_visit() -> void:
	_close_chat()
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
	_close_chat()
	if is_instance_valid(village_link): village_link.stop()
	if is_instance_valid(music):
		music.stop()
	_clear_inputs()
	if is_instance_valid(viewport):
		viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
	if is_instance_valid(hud):
		hud.set_process_input(false)
	hide()
	closed.emit()


func _process(_delta: float) -> void:
	if not initialized or ending or not is_instance_valid(village_link):
		return
	var motion: String = "idle"
	if not hud.blocked and app_active:
		motion = "jump" if not player.is_on_floor() else "run" if player.velocity.length() > 4.5 else "walk" if player.velocity.length() > 0.1 else "idle"
	village_link.pose = {"p":[player.position.x,player.position.y,player.position.z],"yaw":wrapf(player.visual.rotation.y,-PI,PI),"motion":motion}

func _network_status(message: String) -> void:
	if ending or not is_instance_valid(chat_panel):
		return
	var online: bool = is_instance_valid(village_link) and village_link.connected
	chat_panel.set_network(online,message)
	hud.footer.text = "DEV RÉSEAU · Village partagé · Mission personnelle" if online else "DEV RÉSEAU · Visite locale · Ouvre le CHAT pour l’état de connexion"

func _clear_remote() -> void:
	for avatar: VillageAvatar in remote_avatars.values():
		avatar.queue_free()
	remote_avatars.clear()
	if is_instance_valid(chat_panel):
		chat_panel.set_network(false,"Hors ligne · Aucun message renvoyé automatiquement.")

func _network_event(event: Dictionary) -> void:
	if ending:
		return
	match event["type"]:
		"welcome", "correction":
			var point: Array = event["spawn"] if event["type"] == "welcome" else event["p"]
			_clear_inputs()
			player.reset_at(Vector3(float(point[0]),float(point[1]),float(point[2])))
			var facing: float = float(event.get("yaw",0))
			player.visual.rotation.y = facing
			_update_camera()
			# Send the correction, never the stale position cached before this frame.
			village_link.pose = {"p":point.duplicate(),"yaw":facing,"motion":"idle"}
		"roster":
			var present: Dictionary = {}
			for data: Dictionary in event["players"]:
				var id: int = int(data["id"])
				if id == int(account_profile["character"]["id"]): continue
				present[id] = true
				if not remote_avatars.has(id):
					var avatar := VillageAvatar.new()
					world.add_child(avatar)
					remote_avatars[id] = avatar
				remote_avatars[id].configure(data)
			for id: int in remote_avatars.keys():
				if not present.has(id):
					remote_avatars[id].queue_free()
					remote_avatars.erase(id)
		"snapshot":
			var present: Dictionary = {}
			for data: Dictionary in event["players"]:
				var id: int = int(data["id"])
				present[id] = true
				if remote_avatars.has(id): remote_avatars[id].update_pose(data)
			for id: int in remote_avatars.keys():
				if not present.has(id):
					remote_avatars[id].queue_free()
					remote_avatars.erase(id)
		"chat":
			chat_panel.add_message(event)
			if not chat_panel.visible:
				unread = mini(unread+1,50)
				hud.buttons["chat"].text = "CHAT RP / HRP (%d)" % unread
		"chat_ack": chat_panel.acknowledge(int(event["seq"]))
		"error":
			chat_panel.uncertain()
			chat_panel.status.text = event["error"]

func _send_chat(channel: String, text: String) -> void:
	if is_instance_valid(village_link):
		chat_panel.mark_pending(village_link.chat(channel,text))

func open_chat() -> void:
	if ending or not initialized:
		return
	_clear_inputs()
	unread = 0
	hud.buttons["chat"].text = "CHAT RP / HRP"
	hud.show_menu("", "", "", false)
	hud.menu_panel.hide()
	chat_panel.open()

func _close_chat() -> void:
	if is_instance_valid(chat_panel): chat_panel.close_panel()
	if is_instance_valid(hud): hud.menu_panel.show()
