class_name KonohaVisit
extends Control
## Separate world and personal mission, with ephemeral shared presence and duel.
signal closed
var account_profile: Dictionary = {}
var api: CharacterAccountAPI
var mission: Dictionary = {}
var clan_mission: Dictionary = ClanMission.blank()
var clan_manager: ClanMissionManager
var secondary_manager: SecondaryMissionManager
var team_manager: TeamManager
var academy: Academy
var menu_event: String = ""
var request_kind: String = ""
var clan_pending_event: String = ""
var sync_error: String = ""
var journal_open: bool = false
var viewport: SubViewport
var world: KonohaMap
var hokage_interior: HokageInterior
var hokage_exterior_spawn: Marker3D
var hokage_entry_trigger: Area3D
var inside_hokage: bool = false
var transition_lock: float = 0.0
# The residence is a private pocket of this SubViewport, deliberately outside
# the playable Konoha ground and every exterior collider. It is not a second
# scene or a second teleport system: the same player is moved between these
# named spawn nodes.
const HOKAGE_INTERIOR_ORIGIN := Vector3(220.0, 0.0, -220.0)
const HOKAGE_EXTERIOR_DOOR := Vector3(0, 0.25, -72.0)
const HOKAGE_PORTAL_POINT := Vector3(0, 0.25, -70.45)
const HOKAGE_PORTAL_RADIUS := 1.55
const HOKAGE_PORTAL_HOLD_SECONDS := 3.0
const HOKAGE_TELEPORT_DEBOUNCE_SECONDS := 0.85
const HOKAGE_NETWORK_RELEASE_SECONDS := 0.9
var hokage_portal_hold: float = 0.0
var hokage_loading: bool = false
var hokage_network_paused: bool = false
var hokage_network_release: float = -1.0
var hokage_network_release_origin: Vector3 = Vector3.ZERO
var hokage_network_release_target: Vector3 = Vector3.ZERO
var loading_overlay: ColorRect
var loading_image: TextureRect
var loading_progress: ProgressBar
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
var combat_effects: Node3D
var combat_vfx: TrainingVFX
var combat_state: Dictionary = {}
var combat_level: int = 1
var presence_count: int = 1
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
	# The interior is already provided by hokage_interior.gd. Keep one world and
	# one player, but place this virtual pocket outside Konoha's ground/wall
	# colliders so it cannot look like a hidden building in another district.
	hokage_interior = HokageInterior.new()
	hokage_interior.name = "HokageInterior"
	hokage_interior.position = HOKAGE_INTERIOR_ORIGIN
	world.add_child(hokage_interior)
	hokage_interior.build()
	_build_hokage_transition_nodes()
	combat_vfx = TrainingVFX.new()
	world.add_child(combat_vfx)
	combat_effects = Node3D.new()
	world.add_child(combat_effects)
	player = TrainingFighter.new()
	world.add_child(player)
	player.configure(Color("385962"), 2, 120)
	# The residence ramp is a 31-degree physical slope; retain a generous
	# walkable floor angle so CharacterBody3D follows it on Android as well.
	player.floor_max_angle = deg_to_rad(65.0)
	var appearance: Variant = account_profile.get("appearance")
	player.apply_appearance(appearance if appearance is Dictionary else CharacterAppearance.DEFAULTS)
	player.reset_at(KonohaMap.SPAWN)
	var local_nameplate := Label3D.new()
	local_nameplate.name = "LocalNameplate"
	local_nameplate.text = account_profile["character"]["name"]
	local_nameplate.position = Vector3(0,2.35,0)
	local_nameplate.font_size = 30
	local_nameplate.pixel_size = 0.008
	local_nameplate.modulate = Color("fff0c9")
	local_nameplate.outline_size = 8
	local_nameplate.outline_modulate = Color("16272b")
	local_nameplate.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	player.add_child(local_nameplate)
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
	camera.far = 235
	arm.add_child(camera)
	camera.current = true
	hud = KonohaHUD.new()
	add_child(hud)
	var identity: Dictionary = account_profile["character"]
	var account_progress: Dictionary = account_profile.get("progress", {})
	hud.set_account_progress(int(account_progress.get("idremGold", 0)), int(account_progress.get("level", 0)))
	hud.set_clan_techniques(ClanTechniques.for_clan(str(identity["clan"])))
	hud.action_requested.connect(_action)
	hud.resume_requested.connect(resume_visit)
	clan_manager = ClanMissionManager.new()
	clan_manager.name = "ClanMissionManager"
	world.add_child(clan_manager)
	clan_manager.configure(player, hud, account_profile)
	clan_manager.expiration_requested.connect(_clan_expiration_requested)
	clan_manager.collection_feedback.connect(func(text: String) -> void: hud.notice(text))
	secondary_manager = SecondaryMissionManager.new()
	secondary_manager.name = "SecondaryMissionManager"
	world.add_child(secondary_manager)
	secondary_manager.configure(player, hud)
	# La grande Académie Ninja : espace partagé extérieur + intérieur, construit
	# dans les coordonnées absolues du village (jamais une poche privée).
	academy = Academy.new()
	world.add_child(academy)
	academy.player = player
	academy.build()
	academy.unlocked_now.connect(func() -> void: hud.notice("🏫 L’Académie Ninja est maintenant accessible."))
	academy.entered.connect(func() -> void: hud.notice("Académie Ninja · hall d’accueil partagé."))
	academy.exited.connect(func() -> void: hud.notice("Tu quittes l’Académie Ninja."))
	# Candidatures et équipes de trois : présentation uniquement, le serveur
	# valide tout (comptoir de la réception, composition, numéro, Sensei).
	team_manager = TeamManager.new()
	team_manager.name = "TeamManager"
	world.add_child(team_manager)
	team_manager.configure(player, hud)
	team_manager.focus_requested.connect(_close_chat)
	_build_loading_overlay()
	if not InputMap.has_action("village_interact"):
		InputMap.add_action("village_interact")
		var key := InputEventKey.new()
		key.physical_keycode = KEY_E
		InputMap.action_add_event("village_interact", key)
	var combat_bindings: Dictionary = {"melee":KEY_F,"skill_0":KEY_1,"skill_1":KEY_2,"skill_2":KEY_3,"skill_3":KEY_4,"ultimate":KEY_R}
	for action: String in combat_bindings:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
			var combat_key := InputEventKey.new()
			combat_key.physical_keycode = combat_bindings[action]
			InputMap.action_add_event(action, combat_key)
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
		secondary_manager.set_link(village_link)
		if is_instance_valid(team_manager):
			team_manager.set_link(village_link)
		add_child(village_link)

func _build_hokage_transition_nodes() -> void:
	# Explicit points are the only destinations used by the transition.
	hokage_exterior_spawn = Marker3D.new()
	hokage_exterior_spawn.name = "HokageExteriorSpawn"
	hokage_exterior_spawn.position = HOKAGE_EXTERIOR_DOOR + Vector3(0,0,4.0)
	world.add_child(hokage_exterior_spawn)

	# Entry and exit are separate triggers. They are detection-only: neither
	# trigger moves the player directly or owns a second transition routine.
	hokage_entry_trigger = Area3D.new()
	hokage_entry_trigger.name = "HokageExteriorEntryTrigger"
	hokage_entry_trigger.position = HOKAGE_PORTAL_POINT
	hokage_entry_trigger.collision_layer = 0
	hokage_entry_trigger.collision_mask = 2
	hokage_entry_trigger.monitorable = false
	var entry_shape := CollisionShape3D.new()
	var entry_volume := CylinderShape3D.new()
	entry_volume.radius = HOKAGE_PORTAL_RADIUS
	entry_volume.height = 1.2
	entry_shape.shape = entry_volume
	hokage_entry_trigger.add_child(entry_shape)
	world.add_child(hokage_entry_trigger)
	_set_hokage_entry_trigger(false)

func _set_hokage_entry_trigger(value: bool) -> void:
	if is_instance_valid(hokage_entry_trigger):
		hokage_entry_trigger.monitoring = value and not inside_hokage and not hokage_loading

func _build_loading_overlay() -> void:
	loading_overlay = ColorRect.new()
	loading_overlay.color = Color(0.01,0.035,0.09,0.97)
	loading_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	loading_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	loading_overlay.z_index = 100
	add_child(loading_overlay)
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	loading_overlay.add_child(center)
	var column := VBoxContainer.new()
	column.custom_minimum_size = Vector2(340,390)
	column.add_theme_constant_override("separation", 12)
	column.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(column)
	loading_image = TextureRect.new()
	loading_image.texture = preload("res://assets/konoha/hokage/loading_portal.png")
	loading_image.custom_minimum_size = Vector2(240,240)
	loading_image.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	loading_image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	loading_image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	loading_image.pivot_offset = Vector2(120,120)
	column.add_child(loading_image)
	var title := Label.new()
	title.text = "CHARGEMENT DE LA RÉSIDENCE"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", Color("b9f5ff"))
	column.add_child(title)
	var subtitle := Label.new()
	subtitle.text = "Le passage s’ouvre…"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 15)
	subtitle.add_theme_color_override("font_color", Color("8bc8d8"))
	column.add_child(subtitle)
	loading_progress = ProgressBar.new()
	loading_progress.custom_minimum_size = Vector2(300,20)
	loading_progress.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	loading_progress.show_percentage = false
	loading_progress.max_value = 100.0
	column.add_child(loading_progress)
	loading_overlay.hide()

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
	if not initialized or ending or hud.blocked or not app_active or hokage_loading:
		return
	transition_lock = maxf(0.0, transition_lock-delta)
	_set_hokage_entry_trigger(transition_lock <= 0.0)
	var look: Vector2 = hud.consume_look()
	yaw -= look.x*0.004
	pitch = clampf(pitch-look.y*0.003, -0.85, -0.08)
	pivot.rotation.y = yaw
	var axes: Vector2 = (Input.get_vector("move_left", "move_right", "move_forward", "move_back")+hud.move_vector).limit_length()
	var direction: Vector3 = (pivot.basis.x*axes.x + pivot.basis.z*axes.y).limit_length()
	if Input.is_action_just_pressed("jump"):
		player.jump()
	if Input.is_action_just_pressed("melee"): _combat_action("melee")
	for i in range(4):
		if Input.is_action_just_pressed("skill_%d" % i): _combat_action("skill_%d" % i)
	if Input.is_action_just_pressed("ultimate"): _combat_action("ultimate")
	player.simulate(delta, direction, hud.sprinting or Input.is_action_pressed("sprint"))
	_update_hokage_portal(delta)
	if is_instance_valid(academy) and not inside_hokage:
		# Le déblocage suit l'état réel des missions : la 2e mission de clan
		# récompensée ouvre secondary_manager.unlocked, aucune condition parallèle.
		academy.set_unlocked(is_instance_valid(secondary_manager) and secondary_manager.unlocked)
		academy.update(player.position, delta)
	# Crossing the outer ring must stop at the wall, not silently teleport the player
	# back to the arrival point. Horizontal travel stays continuous across districts.
	# Only a genuine fall through the world respawns.
	if player.position.y < -5.0:
		player.reset_at(KonohaMap.SPAWN)
		if is_instance_valid(village_link): village_link.respawn()
		hud.notice("Retour au point d’arrivée du quartier après une chute.")
	else:
		if not inside_hokage:
			var edge_x: float = KonohaMap.BOUNDS.x - 2.0
			var edge_z: float = KonohaMap.BOUNDS.y - 2.0
			if absf(player.position.x) > edge_x:
				player.position.x = clampf(player.position.x, -edge_x, edge_x)
				player.velocity.x = 0.0
			if absf(player.position.z) > edge_z:
				player.position.z = clampf(player.position.z, -edge_z, edge_z)
				player.velocity.z = 0.0
	_update_camera()
	var nearest: int = nearest_interaction()
	hud.buttons["interact"].disabled = nearest == -2
	hud.buttons["interact"].text = "PARLER À AOI" if nearest == -1 else "PARLER AU CHEF" if nearest == -5 else "AIDER · MISSION" if nearest == -6 else "PARLER À LA RÉCEPTION" if nearest == -7 else "LIRE LE PANNEAU" if nearest >= 0 else "APPROCHE-TOI"
	if is_instance_valid(secondary_manager):
		# The guidance arrow belongs to the exterior village only: the private
		# residence pocket and the menus must not display a world direction.
		secondary_manager.arrow_allowed = not inside_hokage and not hokage_loading and not hud.blocked
		secondary_manager.update_hud(delta)
	# The residence has no entry or exit control: crossing its open hall moves
	# the player between the exterior and the virtual interior automatically.
	var clan_status := str(clan_mission.get("status", "NOT_STARTED"))
	var clan_available: bool = mission.get("status", "") == "completed" or clan_status != "NOT_STARTED"
	hud.objective.text = ClanMission.objective(clan_mission) if clan_available else WelcomeMission.objective(mission)
	if clan_status in ["IN_PROGRESS", "TIME_EXPIRED", "REPORT_PENDING"]:
		hud.objective.text = ClanMission.objective(clan_mission)
	if not request_kind.is_empty():
		hud.objective.text = "Connexion en cours · Ne ferme pas l’application pour confirmer l’étape."
	elif not sync_error.is_empty():
		hud.objective.text = "Mission non confirmée · Ouvre le JOURNAL pour actualiser."
	hud.fps.text = "%d FPS · %s" % [Engine.get_frames_per_second(), "EN LIGNE" if is_instance_valid(village_link) and village_link.connected else "LOCAL"]
	if Input.is_action_just_pressed("village_interact"):
		interact()

func _update_hokage_portal(delta: float) -> void:
	if transition_lock > 0.0 or hokage_loading or not is_instance_valid(hokage_interior):
		return
	if inside_hokage:
		# The exit trigger is local to HokageInterior and cannot overlap the
		# exterior entry trigger or the interior spawn.
		if hokage_interior.exit_trigger_overlaps(player):
			_exit_hokage_residence()
		return
	var in_entry_trigger := is_instance_valid(hokage_entry_trigger) and hokage_entry_trigger.get_overlapping_bodies().has(player)
	var horizontal_speed := Vector2(player.velocity.x, player.velocity.z).length()
	if in_entry_trigger and horizontal_speed <= 0.35:
		hokage_portal_hold = minf(HOKAGE_PORTAL_HOLD_SECONDS, hokage_portal_hold+delta)
	else:
		hokage_portal_hold = 0.0
	if hokage_portal_hold >= HOKAGE_PORTAL_HOLD_SECONDS:
		_begin_hokage_loading()

func _begin_hokage_loading() -> void:
	if hokage_loading or inside_hokage:
		return
	hokage_loading = true
	hokage_portal_hold = 0.0
	transition_lock = 9.0
	_set_hokage_entry_trigger(false)
	# Keep the authenticated village presence at its last exterior pose. The
	# server cannot know about this local virtual pocket and would otherwise
	# send an anti-teleport correction during the scene transition.
	hokage_network_paused = true
	hokage_network_release = -1.0
	_clear_inputs()
	loading_progress.value = 0.0
	loading_image.rotation = 0.0
	loading_overlay.show()
	var progress_tween := create_tween().bind_node(loading_overlay)
	progress_tween.tween_property(loading_progress, "value", 100.0, 1.35)
	var rotation_tween := create_tween().bind_node(loading_image)
	rotation_tween.tween_property(loading_image, "rotation", TAU, 1.35)
	get_tree().create_timer(1.45).timeout.connect(_finish_hokage_loading)

func _finish_hokage_loading() -> void:
	if ending or not hokage_loading:
		return
	hokage_loading = false
	loading_overlay.hide()
	_enter_hokage_residence()

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
	# The residence remains a physical walk-through. Only its existing staff
	# zones are interaction targets; they do not own any transition logic.
	if transition_lock > 0.0:
		return -2
	if inside_hokage:
		if is_instance_valid(hokage_interior) and hokage_interior.secretary_overlaps(player):
			return -3
		if is_instance_valid(hokage_interior) and hokage_interior.guard_overlaps(player):
			return -4
		return -2
	if is_instance_valid(hokage_entry_trigger) and hokage_entry_trigger.get_overlapping_bodies().has(player):
		return -2
	if is_instance_valid(clan_manager) and clan_manager.is_near_own_leader():
		return -5
	if is_instance_valid(secondary_manager) and secondary_manager.interaction_available():
		return -6
	if is_instance_valid(academy) and academy.reception_overlaps(player):
		return -7
	if _reachable(guide.position):
		return -1
	for i in range(KonohaMap.LANDMARKS.size()):
		if _reachable(KonohaMap.LANDMARKS[i]["point"]):
			return i
	return -2

func interact() -> void:
	if not initialized or ending or hud.blocked:
		return
	if is_instance_valid(team_manager) and team_manager.panel_open():
		team_manager.close_panel()
		return
	var nearest: int = nearest_interaction()
	if nearest == -2:
		hud.notice("Approche-toi d’un interlocuteur ou d’un panneau pour interagir.")
		return
	_clear_inputs()
	if nearest == -6:
		secondary_manager.interact()
		return
	if nearest == -7:
		# La réceptionniste ouvre le menu des candidatures : déposer, consulter
		# les candidats (portraits), suivre son groupe ou son équipe officielle.
		if is_instance_valid(team_manager):
			team_manager.interact()
		else:
			_dialogue("Réception de l’Académie", "Bienvenue à l’Académie Ninja, %s.\nLe hall dessert la réception, la salle des informations et la zone d’entraînement au nord." % account_profile["character"]["name"])
		return
	if nearest == -5:
		var clan_event := clan_manager.interaction_event()
		_dialogue(clan_manager.interaction_title(), clan_manager.interaction_text(), clan_event)
		return
	if nearest == -3:
		open_journal("Secrétaire des Missions · Tableau", "Bonjour, shinobi. Que puis-je faire pour toi ?")
		return
	if nearest == -4:
		_dialogue("Garde de la Résidence", "Bienvenue à la Résidence du Hokage.\nGarde le passage libre et respecte les archives du village.")
		return
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

func _enter_hokage_residence() -> void:
	if not is_instance_valid(hokage_interior) or not is_instance_valid(hokage_interior.interior_spawn):
		return
	_close_team_panel()
	inside_hokage = true
	hokage_interior.set_active(true)
	# HokageInteriorSpawn is inside the hall, well behind the distinct exit
	# trigger. It is never placed on the doorway collider.
	player.reset_at(hokage_interior.interior_spawn.global_position)
	player.face(Vector3(0,0,-1))
	yaw = 0.0
	pitch = -0.10
	transition_lock = HOKAGE_TELEPORT_DEBOUNCE_SECONDS
	_set_hokage_entry_trigger(false)
	hud.notice("Bienvenue dans la résidence du Hokage. Explore le hall, la galerie et l’étage du conseil.")

func _exit_hokage_residence() -> void:
	if not is_instance_valid(hokage_interior) or not is_instance_valid(hokage_exterior_spawn):
		return
	hokage_interior.set_active(false)
	# HokageExteriorSpawn is outside the closed façade and outside the entry
	# trigger, so the return cannot start a second transition.
	player.reset_at(hokage_exterior_spawn.global_position)
	player.face(Vector3(0,0,1))
	yaw = 0.0
	pitch = -0.06
	inside_hokage = false
	transition_lock = HOKAGE_TELEPORT_DEBOUNCE_SECONDS
	_set_hokage_entry_trigger(false)
	# Resume only after the local placement. The server sees a short interpolated
	# movement from the remembered exterior pose, never the private pocket jump.
	hokage_network_release_origin = _village_pose_position()
	hokage_network_release_target = player.position
	hokage_network_release = 0.0
	hokage_network_paused = false
	hud.notice("Te voilà devant la porte principale de la résidence.")

func _dialogue(title: String, text: String, event: String = "") -> void:
	_close_chat()
	_close_team_panel()
	journal_open = false
	menu_event = event
	hud.primary.disabled = not request_kind.is_empty()
	hud.mission_refresh.hide()
	hud.text_scroll.scroll_vertical = 0
	var button: String = "ACCEPTER LA MISSION" if event in ["accept", "clan_accept"] else "FAIRE LE RAPPORT" if event == "clan_report" else "REMETTRE MON RAPPORT" if event == "report" else "VALIDER LA LECTURE" if not event.is_empty() else "CONTINUER LA VISITE"
	hud.show_menu(title,text,button,true)

func _sync_mission() -> void:
	var profile: Dictionary = api.profile if api != null else account_profile
	mission = {}
	if profile.get("character", {}).get("id") != account_profile["character"]["id"]:
		return
	var account_progress: Dictionary = profile.get("progress", {})
	if is_instance_valid(hud):
		hud.set_account_progress(int(account_progress.get("idremGold", 0)), int(account_progress.get("level", 0)))
	var value: Variant = profile.get("welcomeMission")
	if WelcomeMission.valid_state(value):
		mission = value.duplicate(true)
		guide_met = mission["status"] != "available"
		if is_instance_valid(clan_manager):
			clan_manager.set_welcome_completed(mission["status"] == "completed")
		visited.clear()
		for i in range(WelcomeMission.PLACES.size()):
			if WelcomeMission.PLACES[i] in mission["visited"]:
				visited[i] = true
	var clan_value: Variant = profile.get("clanMission")
	if ClanMission.valid_state(clan_value):
		clan_mission = clan_value.duplicate(true)
		if is_instance_valid(clan_manager):
			clan_manager.sync_state(clan_mission)
		if clan_mission.get("status") == "TIME_EXPIRED" and api != null and not api.busy and request_kind.is_empty():
			request_kind = "clanMission"
			clan_pending_event = "report_pending"
			api.clan_mission_event("report_pending")
	var secondary_value: Variant = profile.get("secondaryMissions")
	if is_instance_valid(secondary_manager) and secondary_value is Dictionary:
		secondary_manager.apply_state(secondary_value)
	var team_value: Variant = profile.get("team")
	if is_instance_valid(team_manager) and team_value is Dictionary:
		team_manager.apply_profile(team_value)

func open_journal(title: String = "Journal · Mission d’accueil", introduction: String = "") -> void:
	_close_chat()
	_close_team_panel()
	if not initialized or ending:
		return
	_clear_inputs()
	journal_open = true
	menu_event = ""
	var text: String = WelcomeMission.journal(mission)
	if not introduction.is_empty():
		text = introduction + "\n\n" + text
	if api != null and api.profile.is_empty():
		text = "Session expirée ou accès indisponible. Reviens à MON COMPTE pour te reconnecter. Les étapes déjà confirmées restent sur ton compte."
	if not request_kind.is_empty():
		text = "Enregistrement / actualisation en cours. Attends la confirmation.\n\n" + text
	elif not sync_error.is_empty():
		text = sync_error + "\nActualise avant de valider à nouveau une étape.\n\n" + text
	hud.show_menu(title,text,"CONTINUER LA VISITE",true)
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
	if menu_event in ["clan_accept", "clan_report"]:
		if not is_instance_valid(clan_manager) or not clan_manager.is_near_own_leader() or api.profile.is_empty():
			sync_error = "Approche de ton propre chef de clan avec une session active."
			open_journal("Mission de clan")
			return
		clan_pending_event = "accept" if menu_event == "clan_accept" else "report"
		request_kind = "clanMission"
		hud.primary.disabled = true
		hud.primary.text = "ENREGISTREMENT…"
		api.clan_mission_event(clan_pending_event)
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
	if operation == "clanMission":
		var event := clan_pending_event
		if not success:
			request_kind = ""
			clan_pending_event = ""
			sync_error = message
			_sync_mission()
			if hud.blocked: open_journal("Mission de clan")
			else: hud.notice("Mission de clan non confirmée : consulte le JOURNAL.")
			return
		_sync_mission()
		if event == "accept":
			# ACCEPTED and IN_PROGRESS are separate persisted states. The start
			# request immediately follows the accepted response, never on village entry.
			clan_pending_event = "start"
			api.clan_mission_event("start")
			return
		if event == "start":
			request_kind = ""
			clan_pending_event = ""
			menu_event = ""
			# _sync_mission already activated the local stars from the server timestamp.
			hud.hide_menu()
			hud.notice("Mission lancée · 5:00 · 10 étoiles privées apparaissent dans le village.")
			return
		if event == "expire":
			clan_pending_event = "report_pending"
			api.clan_mission_event("report_pending")
			return
		if event == "report_pending":
			request_kind = ""
			clan_pending_event = ""
			menu_event = ""
			_sync_mission()
			hud.notice("Retourne voir ton chef pour faire ton rapport.")
			return
		if event == "report":
			request_kind = ""
			clan_pending_event = ""
			menu_event = ""
			_sync_mission()
			hud.hide_menu()
			var reward: Dictionary = clan_mission.get("reward", {})
			hud.notice("Mission terminée · %d étoile(s) · récompense enregistrée : %d IDREM GOLD, niveau %d." % [int(clan_mission.get("score", 0)), int(reward.get("idremGold", 0)), int(reward.get("level", 0))])
			return
		return
	request_kind = ""
	_sync_mission()
	sync_error = "" if success else message
	menu_event = ""
	if hud.blocked:
		open_journal()
	else:
		hud.notice("Mission actualisée sur ton compte." if success else "Mission non confirmée : consulte le JOURNAL.")

func _clan_expiration_requested(value: int) -> void:
	if ending or api == null or api.busy or not clan_pending_event.is_empty():
		return
	request_kind = "clanMission"
	clan_pending_event = "expire"
	api.clan_mission_event("expire", value)

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
		"mission_confirm":
			if not secondary_manager.confirm_pending(): _confirm_mission()
		"secondary_decline":
			secondary_manager.decline_pending()
		"secondary_abandon":
			secondary_manager.abandon_active()
		"mission_refresh": _refresh_mission()
		"combat_join":
			if is_instance_valid(village_link): village_link.combat_join()
			if is_instance_valid(hud): hud.set_combat_message("DUEL EN PRÉPARATION · Recherche d’un deuxième joueur…")
		"combat_leave":
			if is_instance_valid(village_link): village_link.combat_leave()
		"combat_level":
			combat_level = 1 if combat_level >= 50 else 10 if combat_level < 10 else 25 if combat_level < 25 else 50
			if is_instance_valid(village_link): village_link.combat_level(combat_level)
			if is_instance_valid(hud): hud.set_combat_message("Niveau de test demandé : %d · réglable avant le lancement" % combat_level)
		"combat_melee": _combat_action("melee")
		"combat_skill_0": _combat_action("skill_0")
		"combat_skill_1": _combat_action("skill_1")
		"combat_skill_2": _combat_action("skill_2")
		"combat_skill_3": _combat_action("skill_3")
		"combat_ultimate": _combat_action("ultimate")
		"jump":
			if not hud.blocked: player.jump()

func _combat_action(kind: String) -> void:
	if ending or hud.blocked or not is_instance_valid(village_link) or not village_link.connected:
		return
	var target_point := player.position + player.forward() * 6.0
	for fighter: Dictionary in combat_state.get("players", []):
		if int(fighter.get("id", -1)) == int(account_profile["character"]["id"]):
			continue
		var other_id := int(fighter.get("id", -1))
		if remote_avatars.has(other_id):
			target_point = remote_avatars[other_id].position
			break
	var aim: Vector3 = target_point - player.position
	if aim.length_squared() < 0.01: aim = player.forward()
	var sent: int = village_link.combat_action(kind, aim.normalized())
	if sent >= 0 and is_instance_valid(hud):
		hud.notice("%s envoyé · résolution serveur" % kind.to_upper())

func _clear_inputs() -> void:
	if is_instance_valid(hud):
		hud.reset_input()
	for action in ["move_left", "move_right", "move_forward", "move_back", "sprint", "jump", "village_interact", "melee", "skill_0", "skill_1", "skill_2", "skill_3", "ultimate"]:
		if InputMap.has_action(action):
			Input.action_release(action)

func pause_visit() -> void:
	if not initialized or ending:
		return
	_clear_inputs()
	if not hud.blocked:
		_dialogue("Une pause à Konoha", "Quartier d’accueil · apparence du compte et présence partagée si connecté.\nLe duel en ligne de test est optionnel : deux joueurs admis rejoignent le même quartier, choisissent un niveau de test, puis utilisent leurs jutsu. Les dégâts sont décidés par le serveur et rien n’est écrit dans la progression.\nTu peux reprendre la visite ou revenir à ton compte.", "")

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
	hokage_loading = false
	if is_instance_valid(loading_overlay):
		loading_overlay.hide()
	if is_instance_valid(hokage_interior):
		hokage_interior.set_active(false)
	inside_hokage = false
	_close_chat()
	if is_instance_valid(village_link): village_link.stop()
	if is_instance_valid(music):
		music.stop()
		music.stream = null
	_clear_inputs()
	if is_instance_valid(viewport):
		viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
	if is_instance_valid(hud):
		hud.set_process_input(false)
	hide()
	closed.emit()


func _village_pose_position() -> Vector3:
	if not is_instance_valid(village_link) or not village_link.pose.get("p") is Array or village_link.pose["p"].size() != 3:
		return player.position
	return Vector3(float(village_link.pose["p"][0]),float(village_link.pose["p"][1]),float(village_link.pose["p"][2]))

func _process(delta: float) -> void:
	if not initialized or ending or not is_instance_valid(village_link):
		return
	if hokage_network_paused:
		return
	var network_position := player.position
	if hokage_network_release >= 0.0:
		hokage_network_release = minf(HOKAGE_NETWORK_RELEASE_SECONDS, hokage_network_release+delta)
		network_position = hokage_network_release_origin.lerp(hokage_network_release_target, hokage_network_release/HOKAGE_NETWORK_RELEASE_SECONDS)
		if hokage_network_release >= HOKAGE_NETWORK_RELEASE_SECONDS:
			hokage_network_release = -1.0
	var motion: String = "idle"
	if not hud.blocked and app_active:
		motion = "jump" if not player.is_on_floor() else "run" if player.velocity.length() > 4.5 else "walk" if player.velocity.length() > 0.1 else "idle"
	village_link.pose = {"p":[network_position.x,network_position.y,network_position.z],"yaw":wrapf(player.visual.rotation.y,-PI,PI),"motion":motion}

func _set_presence(count: int) -> void:
	presence_count = maxi(1,count)
	if is_instance_valid(hud) and is_instance_valid(village_link) and village_link.connected:
		hud.footer.text = "EN LIGNE · %d joueur(s) dans le quartier · Chat RP / HRP de proximité" % presence_count

func _network_status(message: String) -> void:
	if ending or not is_instance_valid(chat_panel):
		return
	var online: bool = is_instance_valid(village_link) and village_link.connected
	chat_panel.set_network(online,message)
	if online:
		_set_presence(presence_count)
	else:
		hud.footer.text = "VISITE LOCALE · Ouvre le CHAT pour l’état de connexion"

func _clear_remote() -> void:
	for avatar: VillageAvatar in remote_avatars.values():
		avatar.queue_free()
	remote_avatars.clear()
	presence_count = 1
	combat_state.clear()
	if is_instance_valid(hud):
		hud.set_combat_state({})
		hud.footer.text = "VISITE LOCALE · Ouvre le CHAT pour l’état de connexion"
	if is_instance_valid(chat_panel):
		chat_panel.set_network(false,"Hors ligne · Aucun message renvoyé automatiquement.")

func _combat_color(kind: String) -> Color:
	return {"skill_0":Color("ff864d"),"skill_1":Color("85d7ee"),"skill_2":Color("b6ddad"),"skill_3":Color("e2b36c"),"ultimate":Color("ef7470"),"melee":Color("e3eacb")}.get(kind,Color("ffe2a3"))

func _technique_color(element: String) -> Color:
	return {"Katon":Color("ff7045"),"Mokuton":Color("8bcf78"),"Fūinjutsu":Color("ffa95c"),"Jūken":Color("a9dcff"),"Expansion":Color("ef957d"),"Esprit":Color("d6a3ef"),"Kikaichū":Color("9aac78"),"Bestial":Color("91d6e0"),"Ombre":Color("9b98d3"),"Impact":Color("d65872"),"Énergie spirituelle":Color("66b9f2"),"Jeu d’ombres":Color("b88acd"),"Titan":Color("e2b271"),"Lames":Color("94cabb")}.get(element,Color("ef7470"))

func _combat_actor_position(id: int) -> Vector3:
	if id == int(account_profile["character"]["id"]): return player.position + Vector3.UP
	if remote_avatars.has(id): return remote_avatars[id].position + Vector3.UP
	return player.position + Vector3.UP

func _ultimate_color(clan: String) -> Color:
	return {"Uchiwa":Color("ff7045"),"Uzumaki":Color("ffa95c"),"Senju":Color("caa16c"),"Hyūga":Color("a9dcff"),"Akimichi":Color("ef957d"),"Yamanaka":Color("d6a3ef"),"Aburame":Color("9aac78"),"Inuzuka":Color("91d6e0"),"Fushiguro":Color("9b98d3"),"Itadori":Color("d65872"),"Kurosaki":Color("66b9f2"),"Shunsui":Color("b88acd"),"Yeager":Color("e2b271"),"Ackerman":Color("94cabb")}.get(clan,Color("ef7470"))

func _spawn_online_projectile(origin: Vector3, target: Vector3, direction: Vector3, kind: String) -> void:
	var orb: TrainingFlame = combat_vfx.fireball(origin, direction)
	combat_effects.add_child(orb)
	var travel := create_tween().bind_node(orb)
	travel.tween_property(orb, "position", target, 0.42)
	travel.tween_callback(func() -> void:
		if is_instance_valid(combat_vfx): combat_vfx.fire_impact(target, direction)
		if is_instance_valid(orb): orb.queue_free()
	)

func _render_combat_action(event: Dictionary) -> void:
	var kind: String = event["kind"]
	var origin := Vector3(float(event["origin"][0]),float(event["origin"][1]),float(event["origin"][2]))
	var target := Vector3(float(event["target"][0]),float(event["target"][1]),float(event["target"][2]))
	var aim := Vector3(float(event["direction"][0]),float(event["direction"][1]),float(event["direction"][2])).normalized()
	var data: Dictionary = event.get("ultimate", {})
	var technique: Dictionary = event.get("technique", {})
	var element: String = str(technique.get("element", ""))
	var motif: int = int(technique.get("motif", 9))
	var color := _ultimate_color(str(data.get("clan", ""))) if kind == "ultimate" else _technique_color(element)
	if kind == "melee":
		combat_vfx.slash(origin, aim)
	elif kind in ["skill_0", "skill_1", "skill_2", "skill_3"]:
		if element == "Katon":
			combat_vfx.impact(origin, color, 0.65)
			_spawn_online_projectile(origin, target + Vector3.UP, aim, kind)
		else:
			combat_vfx.clan_technique(origin, target + Vector3.UP, aim, element, motif, color)
	elif kind == "ultimate":

		var visual := TrainingSpectacle.new()
		visual.monumental = true
		visual.standard = true
		visual.motif = int(data.get("motif",9))
		visual.tint = color
		visual.accent = color.lightened(0.35)
		visual.magnitude = 0.85 + 0.45 * float(int(data.get("level",1))-1) / 49.0
		visual.position = target
		combat_effects.add_child(visual)
		combat_vfx.impact(target + Vector3.UP, color, 1.1)
	if is_instance_valid(hud):
		var label: String = str(data.get("name", kind.to_upper())) if kind == "ultimate" else str(technique.get("name", kind.to_upper()))
		hud.notice(label)

func _network_event(event: Dictionary) -> void:
	if ending:
		return
	match event["type"]:
		"secondary_state", "secondary_action_ack":
			if is_instance_valid(secondary_manager): secondary_manager.handle_network_event(event)
		"team_state", "team_action_ack":
			if is_instance_valid(team_manager): team_manager.handle_network_event(event)
		"welcome", "correction":
			# The server only knows the exterior village coordinate space. While
			# loading or inside the private pocket, its spawn/correction must never
			# pull the local player through the residence transition.
			if hokage_loading or inside_hokage or transition_lock > 0.0:
				return
			var point: Array = event["spawn"] if event["type"] == "welcome" else event["p"]
			_clear_inputs()
			player.reset_at(Vector3(float(point[0]),float(point[1]),float(point[2])))
			var facing: float = float(event.get("yaw",0))
			player.visual.rotation.y = facing
			_update_camera()
			# Send the correction, never the stale position cached before this frame.
			village_link.pose = {"p":point.duplicate(),"yaw":facing,"motion":"idle"}
		"combat_waiting":
			hud.set_combat_message("DUEL EN PRÉPARATION · %d joueur(s) · Invite le deuxième joueur à appuyer sur DÉFIER EN DUEL" % event.get("players",[]).size())
		"combat_started":
			hud.set_combat_message("DUEL LANCÉ · Les dégâts et les niveaux sont contrôlés par le serveur")
		"combat_state":
			combat_state = event.duplicate(true)
			hud.set_combat_state(combat_state)
			var local_id := int(account_profile["character"]["id"])
			for fighter: Dictionary in event["players"]:
				var fighter_id := int(fighter.get("id", -1))
				if fighter_id == local_id:
					player.health = float(fighter.get("health", player.health))
					hud.set_clan_techniques(fighter.get("techniques", []))
					hud.set_combat_health(local_id,event)
				elif remote_avatars.has(fighter_id):
					remote_avatars[fighter_id].set_combat_health(int(fighter.get("health",120)),event.get("status") == "active")
		"combat_action":
			_render_combat_action(event)
		"combat_hit":
			var hit_point := Vector3(float(event["position"][0]),float(event["position"][1]),float(event["position"][2]))
			var hit_technique: Dictionary = event.get("technique", {})
			var hit_color := _ultimate_color(str(event.get("ultimate",{}).get("clan",""))) if event["kind"] == "ultimate" else _technique_color(str(hit_technique.get("element", "")))
			combat_vfx.impact(hit_point + Vector3.UP * 0.4,hit_color,1.0 if event["kind"] == "ultimate" else 0.6)
			if int(event["target"]) == int(account_profile["character"]["id"]):
				player.health = float(event["health"])
				hud.notice("Touché · %d dégâts" % int(event["damage"]))
		"combat_evaded":
			hud.notice("Ultime esquivée · éloigne-toi pendant la concentration")
		"combat_result":
			var victory: bool = int(event["winner"]) == int(account_profile["character"]["id"])
			hud.set_combat_message("VICTOIRE DE TEST" if victory else "DÉFAITE DE TEST")
			hud.notice("%s · aucun gain enregistré" % ("Victoire" if victory else "Défaite"))
		"combat_end":
			combat_state.clear()
			for avatar: VillageAvatar in remote_avatars.values(): avatar.set_combat_health(120,false)
			hud.set_combat_state({})
			hud.set_combat_message("Duel terminé · le bouton DÉFIER EN DUEL relance un test")
		"roster":
			_set_presence(event["players"].size())
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
			# Refus serveur du système d'équipes : explication visible immédiate.
			if str(event.get("code","")).begins_with("TEAM_") and is_instance_valid(team_manager):
				team_manager.notify_error(str(event["error"]))

func _send_chat(channel: String, text: String) -> void:
	if is_instance_valid(village_link):
		chat_panel.mark_pending(village_link.chat(channel,text))

func open_chat() -> void:
	if ending or not initialized:
		return
	_clear_inputs()
	_close_team_panel()
	unread = 0
	hud.buttons["chat"].text = "CHAT RP / HRP"
	hud.show_menu("", "", "", false)
	hud.menu_panel.hide()
	chat_panel.open()

func _close_chat() -> void:
	if is_instance_valid(chat_panel): chat_panel.close_panel()
	if is_instance_valid(hud): hud.menu_panel.show()

func _close_team_panel() -> void:
	# Jamais appelé depuis focus_requested (le panneau d'équipes vient de
	# s'ouvrir) : seulement des autres menus, du journal, du chat et des
	# transitions, pour qu'aucune interface ne se superpose.
	if is_instance_valid(team_manager): team_manager.close_panel()
