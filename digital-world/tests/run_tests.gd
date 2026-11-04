extends Node
## Run after headless editor import. Dedicated save paths never touch the player's slot.
var failures := 0
var assertions := 0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	get_tree().create_timer(75, true).timeout.connect(func():
		push_error("Test watchdog: interrupted by an earlier runtime error")
		get_tree().quit(2))
	SaveStore.game_path = "user://test_adventure.json"
	SaveStore.settings_path = "user://test_settings.json"
	call_deferred("_run")

func check(condition: bool, message: String) -> void:
	assertions += 1
	if not condition:
		failures += 1
		push_error("FAIL: " + message)
	else:
		print("PASS: " + message)

func _run() -> void:
	_test_mission()
	_test_saves()
	_test_dialogues()
	await _test_game()
	for path in [SaveStore.game_path, SaveStore.settings_path]:
		for suffix in ["", ".bak", ".tmp"]:
			if FileAccess.file_exists(path + suffix):
				DirAccess.remove_absolute(ProjectSettings.globalize_path(path + suffix))
	DigitalArt.materials.clear()
	DigitalArt.meshes.clear()
	print("DIGITAL WORLD TESTS: %d assertions, %d failures" % [assertions, failures])
	get_tree().quit(1 if failures else 0)

func _test_mission() -> void:
	var mission := MissionProgress.new()
	check(mission.stage == MissionProgress.Stage.WAKE, "Mission begins with movement tutorial")
	check(not mission.collect("garden"), "Fragments cannot be collected before the quest")
	check(not mission.repair(), "Repair rejected before collection")
	check(not mission.finish(), "Early reward rejected")
	for stage in range(MissionProgress.Stage.COLLECT):
		check(mission.advance(stage), "Ordered objective %d" % stage)
	check(not mission.advance(MissionProgress.Stage.NOVA), "Cannot replay earlier objectives")
	check(not mission.collect("unknown"), "Unknown fragment rejected")
	check(mission.collect("garden"), "First fragment collected")
	check(not mission.collect("garden"), "Duplicate fragment rejected")
	check(mission.collect("archive"), "Second fragment collected")
	var restored := MissionProgress.new()
	check(restored.restore(mission.serialize()), "Mid-mission state restores")
	check(restored.fragments.size() == 2, "Collected IDs persist")
	check(restored.collect("workshop"), "Last fragment advances repair objective")
	check(restored.stage == MissionProgress.Stage.REPAIR, "Three fragments required")
	check(restored.repair(), "Terminal repairs")
	check(not restored.inventory.has("data_fragment"), "Repair consumes fragment inventory")
	check(restored.finish(), "Mission completes")
	check(restored.energy == 50 and restored.inventory.get("maintenance_badge") == 1, "Energy and maintenance badge awarded")
	check(not restored.finish() and restored.energy == 50, "Rewards cannot be farmed")
	var finished := MissionProgress.new()
	check(finished.restore(restored.serialize()) and finished.energy == 50, "Completed reward survives reload")
	check(not MissionProgress.new().restore({"stage": 99}), "Out-of-range save rejected")
	check(not MissionProgress.new().restore({"stage": "2"}), "Wrong save type rejected")
	check(not MissionProgress.new().restore({"stage": 2.3}), "Fractional stage rejected")
	check(not MissionProgress.new().restore({"stage": 4, "fragments": ["garden", "garden"]}), "Duplicate saved IDs rejected")
	check(not MissionProgress.new().restore({"stage": 5, "fragments": []}), "Inconsistent repair save rejected")

func _test_saves() -> void:
	var state := {"version": 1, "world": "system_city", "checkpoint": [0, 0.2, 14], "mission": MissionProgress.new().serialize()}
	check(SaveStore.valid(state), "Valid save schema accepted")
	check(SaveStore.write_json(SaveStore.game_path, state), "Atomic save writes to disk")
	check(not SaveStore.load_game().is_empty(), "Save loaded from disk")
	check(SaveStore.write_json(SaveStore.game_path, state), "Second save creates backup")
	var file := FileAccess.open(SaveStore.game_path, FileAccess.WRITE)
	file.store_string("{ corrupted")
	file.close()
	check(not SaveStore.load_game().is_empty(), "Corrupt primary recovers from backup")
	state["checkpoint"] = [999, 0, 0]
	check(not SaveStore.valid(state), "Unsafe checkpoint rejected")
	state["checkpoint"] = [0, 0.2, 14]
	state["version"] = 200
	check(not SaveStore.valid(state), "Unknown save version rejected")
	check(SaveStore.write_json(SaveStore.settings_path, {"music": 0.25, "low_graphics": true}), "Settings persist separately")
	check(SaveStore.read_json(SaveStore.settings_path).get("music") == 0.25, "Setting value round-trip")

func _test_dialogues() -> void:
	var dialogue := DialogueSystem.new()
	var result := {"completed": 0, "lines": 0}
	dialogue.line_changed.connect(func(_name: String, _text: String): result["lines"] += 1)
	dialogue.start("nova_intro", func(): result["completed"] += 1)
	check(dialogue.active, "Dialogue starts")
	for i in 10:
		dialogue.next()
	check(not dialogue.active and result["completed"] == 1, "Dialogue callback runs once")
	check(result["lines"] == 5, "Every intro line emitted")

func frames(count: int) -> void:
	for i in count:
		await get_tree().physics_frame

func walk(action: String, count: int) -> void:
	Input.action_press(action)
	await frames(count)
	Input.action_release(action)
	await frames(8)

func close_dialogue(game: Node) -> void:
	var count := 0
	while game.dialogue.active and count < 20:
		game._activate()
		count += 1
	await frames(2)

func _test_game() -> void:
	var scene := load("res://scenes/main.tscn") as PackedScene
	check(AudioServer.get_bus_index("Music") >= 0 and AudioServer.get_bus_index("SFX") >= 0, "Music and SFX buses load")
	check(scene != null, "Main scene loads")
	var game: Node3D = scene.instantiate()
	get_tree().root.add_child(game)
	await frames(5)
	check(game.menu.visible and not game.hud.visible, "Main menu displayed above animated 3D city")
	check(game.world.props.size() == 9, "All city interactables instantiated")
	game._start_new()
	Engine.max_fps = 0
	check(game.player.controls_enabled and game.hud.visible, "New Game enables controls")
	check(game.player.visual.animator.get_animation_list().size() == 9, "Nine character animations registered")
	await walk("move_forward", 185)
	check(game.player.position.z < 6.2, "Character physically walks across plaza")
	check(GameState.mission.stage == MissionProgress.Stage.NOVA, "Movement and exploration objectives trigger")
	var floor_y: float = game.player.position.y
	Input.action_press("jump")
	await frames(5)
	Input.action_release("jump")
	check(game.player.position.y > floor_y + 0.2, "Jump leaves ground")
	await frames(80)
	check(game.player.is_on_floor(), "Gravity and landing return to ground")
	# Exercise a real obstacle and the spring-arm physics before quest orchestration.
	game.player.reset_at(Vector3(12, 0.1, 17))
	game.camera.yaw = PI
	game.camera.reset()
	game.camera.yaw = PI
	await frames(30)
	check(game.camera.arm.get_hit_length() < 6.0, "Camera arm retracts before building wall")
	game.camera.yaw = 0
	await walk("move_forward", 80)
	check(game.player.position.z > 14.7, "Building collision blocks character traversal")
	game.player.reset_at(Vector3(21, 0.1, 3))
	game.camera.reset()
	await walk("move_forward", 45)
	check(game.player.position.z > 1.4, "Closed workshop door blocks movement")
	game.world.props["door"].toggle_door()
	await frames(40)
	await walk("move_forward", 70)
	check(game.player.position.z < 0, "Opened workshop door allows entry")
	# Integration orchestration uses explicit positions, not a claim of manual playtesting.
	game.player.reset_at(Vector3(-1.8, 0.1, 3))
	await frames(10)
	check(game.scanner.focused == game.world.props["nova"], "Proximity scanner selects NOVA")
	game._activate()
	check(game.dialogue.active and not game.player.controls_enabled, "NOVA dialogue locks movement")
	await close_dialogue(game)
	check(GameState.mission.stage == MissionProgress.Stage.TERMINAL, "Intro dialogue advances mission")
	game._interact(game.world.props["terminal"])
	await close_dialogue(game)
	check(GameState.mission.stage == MissionProgress.Stage.COLLECT, "Terminal examination unlocks fragments")
	for id in MissionProgress.FRAGMENT_IDS:
		check(game.world.props[id].visible, "Quest fragment %s visible" % id)
		game._interact(game.world.props[id])
		check(not game.world.props[id].visible, "Collected fragment %s removed" % id)
	game._interact(game.world.props["terminal"])
	await close_dialogue(game)
	check(GameState.mission.stage == MissionProgress.Stage.RETURN and game.world.props["terminal"].repaired, "Repair changes terminal and objective")
	game._interact(game.world.props["nova"])
	await close_dialogue(game)
	check(GameState.mission.stage == MissionProgress.Stage.COMPLETE and GameState.mission.energy == 50, "End-to-end mission reaches reward")
	game._pause()
	check(get_tree().paused and game.menu.pause_panel.visible, "Pause menu pauses simulation")
	game._resume()
	check(not get_tree().paused and not game.menu.visible, "Resume works")
	game._main_menu()
	check(game.menu.visible and game.menu.continue_button.disabled == false, "Continue enabled after saving")
	game._continue()
	check(GameState.mission.stage == MissionProgress.Stage.COMPLETE, "Continue restores completed mission")
	check(game.player.global_position.distance_to(GameState.checkpoint) < 0.1, "Continue restores safe checkpoint")
	game.player.damage_cooldown = 0
	game.player.damage(25)
	check(game.player.health == 75, "NULL damage reduces health")
	game._respawn()
	check(game.player.health == 100, "Respawn restores health without losing quest")
	var joystick: VirtualJoystick = game.hud.joystick
	var press := InputEventScreenTouch.new()
	press.index = 3
	press.pressed = true
	press.position = joystick.global_position + joystick.size / 2 + Vector2(50, 0)
	joystick._input(press)
	check(game.player.joystick.x > 0.5, "Touch joystick drives controller axis")
	press.pressed = false
	joystick._input(press)
	check(game.player.joystick == Vector2.ZERO, "Touch release clears axis")
	var action := InputEventScreenTouch.new()
	action.index = 4
	action.pressed = true
	action.position = game.hud.jump.global_position + game.hud.jump.size / 2
	game.hud.jump._input(action)
	check(game.player.touch_jump, "Touch jump button dispatches action")
	action.pressed = false
	game.hud.jump._input(action)
	var yaw_before: float = game.camera.yaw
	game.camera._orbit(Vector2(50, 0))
	check(game.camera.yaw != yaw_before, "Camera orbit responds to drag delta")
	game._main_menu()
	game.queue_free()
	await get_tree().process_frame
