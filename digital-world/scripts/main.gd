extends Node3D
## Composition root: world, player, mission and UI communicate through signals.
@onready var world: SystemCity = $SystemCity
@onready var player: ByteController = $BYTE
@onready var camera: OrbitCamera = $OrbitCamera
@onready var hud: GameHUD = $UI/GameHUD
@onready var menu: GameMenu = $UI/Menu
var scanner := InteractionScanner.new()
var dialogue := DialogueSystem.new()
var marker: Node3D
var scan_cooldown := 0.0
var playing := false
var closing := false

func _ready() -> void:
	get_tree().auto_accept_quit = false
	camera.target = player
	camera.arm.add_excluded_object(player.get_rid())
	player.camera_rig = camera
	player.position = Vector3(0, 0.2, 14)
	player.hide()
	scanner.process_mode = Node.PROCESS_MODE_PAUSABLE
	scanner.player = player
	add_child(scanner)
	scanner.focus_changed.connect(hud.focus)
	scanner.activated.connect(_interact)
	hud.joystick.changed.connect(func(value: Vector2): player.joystick = value)
	hud.jump_requested.connect(func(): player.touch_jump = true)
	hud.interact_requested.connect(_activate)
	hud.scan_requested.connect(_scan)
	hud.pause_requested.connect(_pause)
	player.health_changed.connect(func(value: int): hud.health.value = value)
	player.respawn_requested.connect(_respawn)
	menu.new_requested.connect(_start_new)
	menu.continue_requested.connect(_continue)
	menu.resume_requested.connect(_resume)
	menu.main_requested.connect(_main_menu)
	menu.quit_requested.connect(_quit)
	dialogue.line_changed.connect(_dialogue_line)
	dialogue.closed.connect(_dialogue_closed)
	GameState.saved.connect(func(success: bool):
		if playing and not success:
			hud.toast("Échec de sauvegarde : espace de stockage ou accès indisponible."))
	marker = Node3D.new()
	add_child(marker)
	var diamond := DigitalArt.box(marker, Vector3(0, 3.4, 0), Vector3.ONE * 0.28, DigitalArt.GOLD, true)
	diamond.rotation.z = PI / 4
	var label := DigitalArt.sign_text(marker, Vector3(0, 3.9, 0), "OBJECTIF", DigitalArt.GOLD, 16)
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	marker.hide()
	hud.hide()
	world.sync_mission()

func _start_new() -> void:
	GameState.new_game()
	_begin()

func _continue() -> void:
	if GameState.continue_game():
		_begin()
	else:
		menu.show_home()

func _begin() -> void:
	playing = true
	GameState.mission.changed.connect(_mission_changed)
	menu.hide()
	hud.show()
	hud.close_dialogue()
	player.show()
	player.reset_at(GameState.checkpoint)
	player.distance_walked = 0
	camera.reset()
	camera.enabled = true
	player.controls_enabled = true
	scanner.enabled = true
	_mission_changed()
	hud.toast("Glisse en haut à droite pour regarder autour de toi. SCAN indique l'objectif.")

func _mission_changed() -> void:
	world.sync_mission()
	hud.update_mission()
	GameState.save_game()

func _physics_process(delta: float) -> void:
	if not playing or get_tree().paused or dialogue.active or player.dead:
		return
	scan_cooldown = maxf(0, scan_cooldown - delta)
	var mission := GameState.mission
	if mission.stage == MissionProgress.Stage.WAKE and player.distance_walked >= 2.0:
		mission.advance(MissionProgress.Stage.WAKE)
	if mission.stage == MissionProgress.Stage.EXPLORE:
		var horizontal := Vector2(player.position.x, player.position.z)
		if horizontal.length() < 6.2:
			mission.advance(MissionProgress.Stage.EXPLORE)
	for point in world.hazards:
		if Vector2(player.position.x - point.x, player.position.z - point.z).length() < 1.35 and player.position.y < 0.8:
			player.damage(25)
	var goal := world.objective_position()
	marker.position = goal
	marker.rotation.y += delta
	marker.visible = mission.stage != MissionProgress.Stage.COMPLETE
	var distance := Vector2(goal.x - player.position.x, goal.z - player.position.z).length()
	hud.compass.text = "◇ OBJECTIF  /  %d m" % int(distance)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and playing:
		if get_tree().paused:
			_resume()
		else:
			_pause()
		get_viewport().set_input_as_handled()
	elif playing and not get_tree().paused:
		if event.is_action_pressed("interact"):
			_activate()
		elif event.is_action_pressed("action"):
			_scan()

func _activate() -> void:
	if get_tree().paused:
		return
	if dialogue.active:
		dialogue.next()
	else:
		scanner.activate()

func _interact(target: DigitalInteractable) -> void:
	if dialogue.active:
		return
	player.pose("Interaction", 0.55)
	Audio.effect("interact")
	var mission := GameState.mission
	match target.interaction_id:
		"nova":
			if mission.stage == MissionProgress.Stage.NOVA:
				dialogue.start("nova_intro", func():
					_checkpoint(Vector3(0, 0.2, 4))
					mission.advance(MissionProgress.Stage.NOVA))
			elif mission.stage == MissionProgress.Stage.RETURN:
				dialogue.start("nova_complete", func():
					_checkpoint(Vector3(0, 0.2, 4))
					mission.finish()
					Audio.effect("success")
					hud.toast("MISSION ACCOMPLIE  •  +50 énergie  •  Badge de maintenance"))
			else:
				hud.toast("NOVA : " + mission.objective())
		"terminal":
			if mission.stage == MissionProgress.Stage.TERMINAL:
				dialogue.start("terminal_broken", func():
					_checkpoint(Vector3(0, 0.2, -7.5))
					mission.advance(MissionProgress.Stage.TERMINAL))
			elif mission.stage == MissionProgress.Stage.REPAIR:
				dialogue.start("terminal_fixed", func():
					_checkpoint(Vector3(0, 0.2, -7.5))
					mission.repair()
					Audio.effect("success"))
			else:
				hud.toast("Terminal : " + mission.objective())
		"garden", "workshop", "archive":
			if mission.collect(target.interaction_id):
				Audio.effect("collect")
				hud.toast("Fragment sécurisé  •  %d / 3" % mission.fragments.size())
		"door":
			(target as WorldProp).toggle_door()
			if (target as WorldProp).opened:
				dialogue.start("door")
		"patch", "citizen", "portal":
			dialogue.start(target.interaction_id)

func _checkpoint(point: Vector3) -> void:
	GameState.checkpoint = point
	GameState.save_game()

func _dialogue_line(speaker: String, text: String) -> void:
	player.controls_enabled = false
	player.joystick = Vector2.ZERO
	camera.enabled = false
	camera.finger = -1
	scanner.enabled = false
	hud.set_dialogue(speaker, text)

func _dialogue_closed() -> void:
	player.controls_enabled = true
	camera.enabled = true
	scanner.enabled = true
	hud.close_dialogue()

func _scan() -> void:
	if not playing or dialogue.active or scan_cooldown > 0 or player.dead:
		return
	scan_cooldown = 2
	player.pose("Interaction", 0.5)
	Audio.effect("scan")
	hud.toast("NOVA / " + GameState.mission.objective())

func _pause() -> void:
	if not playing:
		return
	GameState.save_game()
	hud.set_controls(false)
	camera.finger = -1
	camera.mouse_dragging = false
	menu.show_pause()
	get_tree().paused = true

func _resume() -> void:
	get_tree().paused = false
	menu.hide()
	hud.set_controls(not dialogue.active)

func _main_menu() -> void:
	GameState.save_game()
	get_tree().paused = false
	playing = false
	GameState.active = false
	if GameState.mission.changed.is_connected(_mission_changed):
		GameState.mission.changed.disconnect(_mission_changed)
	dialogue.active = false
	player.controls_enabled = false
	player.hide()
	camera.enabled = false
	scanner.enabled = false
	hud.hide()
	marker.hide()
	menu.show_home()

func _respawn() -> void:
	player.reset_at(GameState.checkpoint)
	hud.toast("Point de sauvegarde restauré. Les fragments sécurisés sont conservés.")

func _quit() -> void:
	if closing:
		return
	closing = true
	GameState.save_game()
	Audio.stop_all()
	await get_tree().create_timer(0.15, true).timeout
	get_tree().quit()

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_PAUSED and playing:
		_pause()
	elif what == NOTIFICATION_WM_GO_BACK_REQUEST and playing:
		if get_tree().paused:
			_resume()
		else:
			_pause()
	elif what == NOTIFICATION_WM_CLOSE_REQUEST:
		_quit()
