extends SceneTree
## Run with Godot --headless --path game --script res://tests/smoke.gd.

var failures: int = 0

func check(condition: bool, message: String) -> void:
	if not condition:
		failures += 1
		push_error("TEST FAILED: " + message)
	else:
		print("PASS: " + message)

func touch(index: int, point: Vector2, pressed: bool) -> void:
	var event := InputEventScreenTouch.new()
	event.index = index
	event.position = point
	event.pressed = pressed
	root.push_input(event, true)

func emulated_mouse(point: Vector2, pressed: bool) -> void:
	var event := InputEventMouseButton.new()
	event.device = InputEvent.DEVICE_ID_EMULATION
	event.position = point
	event.button_index = MOUSE_BUTTON_LEFT
	event.button_mask = MOUSE_BUTTON_MASK_LEFT if pressed else 0
	event.pressed = pressed
	root.push_input(event, true)

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var rules := TrainingRules.new()
	check(rules.try_cast(0), "first jutsu can be cast")
	check(not rules.try_cast(0), "same jutsu cannot bypass its cooldown")
	check(rules.try_cast(1), "a different jutsu can be used immediately")
	check(is_equal_approx(rules.chakra, 60.0), "chakra is charged exactly once per cast")
	check(rules.cooldowns[0] == 5.0 and rules.cooldowns[1] == 8.0, "powerful attacks have longer independent cooldowns")
	rules.chakra = 0
	check(not rules.try_cast(2), "insufficient chakra cannot cast")
	rules.tick(1)
	check(is_equal_approx(rules.chakra, 3.0), "combat regeneration is slow")
	rules.combat_remaining = 0
	rules.tick(1)
	check(is_equal_approx(rules.chakra, 13.0), "out-of-combat regeneration is faster")
	check(not rules.try_cast(-1) and not rules.try_cast(9), "invalid skills are rejected")
	rules.chakra = 0
	rules.combat_remaining = 0.5
	rules.tick(1)
	check(is_equal_approx(rules.chakra, 6.5), "regeneration integrates the combat boundary accurately")
	rules.reset()
	check(rules.chakra == 100 and rules.casts == 0, "round reset restores only local test state")
	var scene: PackedScene = load("res://scenes/training.tscn")
	var game: Node3D = scene.instantiate()
	game.appearance_path = "user://appearance-smoke.json"
	DirAccess.remove_absolute(ProjectSettings.globalize_path(game.appearance_path))
	root.add_child(game)
	await process_frame
	check(paused, "opening menu pauses simulation")
	check(CharacterAppearance.sanitize({"skin": -1, "model": 999, "hair": "path", "eyes": 2.5, "clan": "Uchiwa"}) == CharacterAppearance.DEFAULTS, "cosmetic validation rejects invalid values and ignores gameplay keys")
	check(CharacterAppearance.load_local(game.appearance_path) == CharacterAppearance.DEFAULTS, "missing appearance save falls back safely")
	check(game.creator.viewport.render_target_update_mode == SubViewport.UPDATE_DISABLED, "closed preview does not render an extra viewport")
	var original_appearance: Dictionary = game.player.appearance.duplicate()
	var original_shape: Shape3D = game.player.get_child(0).shape
	game.hud.creator_button.pressed.emit()
	await process_frame
	await process_frame
	check(game.creator.visible and paused and not game.hud.visible and not game.audio.active, "creator opens from the menu without combat or audio")
	check(game.creator.selectors.size() == 9, "all nine requested separate cosmetic choices have controls")
	game.creator.toggle_close_up()
	check(game.creator.close_up and game.creator.preview_camera.position.z > -2, "face view makes eye and hair colors easier to inspect")
	game.creator.toggle_close_up()
	var creator_screen := Rect2(Vector2.ZERO, game.creator.size)
	check(creator_screen.encloses(game.creator.save_button.get_global_rect()) and creator_screen.encloses(game.creator.cancel_button.get_global_rect()), "creator footer actions fit the landscape viewport")
	check(creator_screen.encloses(game.creator.preview_container.get_global_rect()), "3D preview fits beside the scrollable cosmetic choices")
	game.creator.selectors["model"].item_selected.emit(1)
	game.creator.set_choice("hair", 3)
	game.creator.set_choice("hair_color", 3)
	game.creator.set_choice("eyes", 2)
	game.creator.set_choice("skin", 5)
	game.creator.apply_outfit(2)
	check(game.creator.draft["model"] == 1 and game.creator.draft["hair"] == 3 and game.creator.draft["skin"] == 5, "complete outfit leaves body, hair and skin choices intact")
	check(game.creator.draft["top"] == 2 and game.creator.draft["bottom"] == 2, "complete outfit applies top and bottom together")
	game.creator.set_choice("top_color", 6)
	check(game.creator.draft["bottom_color"] == 1, "upper and lower clothing colors can be changed independently")
	check(game.player.appearance == original_appearance, "unsaved preview never modifies the combat character")
	check(game.creator.preview.eye_material.albedo_color == CharacterAppearance.EYE_COLORS[2] and game.creator.preview.skin_material.albedo_color == CharacterAppearance.SKIN_COLORS[5], "preview visibly applies chosen eye and skin colors")
	check(game.creator.preview.hair_root.get_child_count() == 3, "ponytail selection builds distinct visible hair geometry")
	game.creator.cancel()
	check(game.player.appearance == original_appearance and not FileAccess.file_exists(game.appearance_path), "cancel discards the draft without creating a save")
	check(game.hud.visible and paused and not game.creator.visible, "closing the creator returns to the paused menu")
	game.open_creator()
	game.creator.set_choice("model", 1)
	game.creator.set_choice("hair", 1)
	game.creator.set_choice("skin", 4)
	game.creator.confirm()
	check(game.player.appearance["model"] == 1 and game.player.appearance["hair"] == 1, "save applies the chosen model and hairstyle to the playable character")
	check(CharacterAppearance.load_local(game.appearance_path) == game.player.appearance, "appearance survives a disk save and fresh reload")
	check(game.player.get_child(0).shape == original_shape and game.player.health == TrainingRules.MAX_HEALTH, "cosmetics never replace collision geometry or change health")
	game.open_creator()
	game.creator.set_choice("hair", 2)
	game.creator.confirm()
	check(CharacterAppearance.load_local(game.appearance_path)["hair"] == 2, "saving again safely replaces the previous appearance")
	game.open_creator()
	game.creator.reset_draft()
	game.creator.save_path = "user://missing-parent-idrem/appearance.json"
	game.creator.confirm()
	check(game.creator.visible and game.player.appearance["hair"] == 2, "failed save leaves the editor open and does not apply an unsaved draft")
	check(CharacterAppearance.load_local(game.appearance_path)["hair"] == 2, "failed save preserves the previous on-disk choices")
	game.handle_action("pause")
	check(not game.creator.visible and paused, "back closes the editor without resuming combat")
	var corrupt := FileAccess.open(game.appearance_path, FileAccess.WRITE)
	corrupt.store_string("not-json")
	corrupt.close()
	check(CharacterAppearance.load_local(game.appearance_path) == CharacterAppearance.DEFAULTS, "corrupt local data falls back to defaults without a crash")
	CharacterAppearance.save_local({"hair": 3}, game.appearance_path)
	check(CharacterAppearance.load_local(game.appearance_path)["hair"] == 3, "a corrupt appearance file can be replaced by a new valid save")
	game.player.apply_appearance(original_appearance)
	DirAccess.remove_absolute(ProjectSettings.globalize_path(game.appearance_path))
	await process_frame
	check(game.hud.find_children("*", "TextureRect", true, false).is_empty(), "no logo image exists anywhere in the gameplay HUD")
	check(not game.audio.active and not game.audio.music.playing, "opening menu is silent")
	check(game.audio.voices.size() == TrainingAudio.MAX_VOICES, "sound effects use a fixed eight-voice pool")
	var audio_manifest: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/audio/manifest.json"))
	for cue in TrainingAudio.CLIPS:
		var clip: AudioStream = TrainingAudio.CLIPS[cue]
		check(clip.get_length() > 0.05 and absf(clip.get_length() - float(audio_manifest["clips"][cue]["duration_seconds"])) < 0.001, "provided audio resource loaded at its full prepared duration: " + cue)
	check(absf(game.audio.music.stream.get_length() - float(audio_manifest["clips"]["combat_loop"]["duration_seconds"])) < 0.001, "background player uses the owner-provided track")
	check(game.audio.music.stream.loop_mode == AudioStreamWAV.LOOP_FORWARD and game.audio.music.stream.loop_end > 0, "combat ambience is a real looping audio stream")
	var screen := Rect2(Vector2.ZERO, game.hud.size)
	check(screen.encloses(game.hud.menu_panel.get_global_rect()), "opening menu fits within the virtual landscape viewport")
	var controls_inside: bool = true
	for button: Button in game.hud.buttons.values():
		controls_inside = controls_inside and screen.encloses(button.get_global_rect())
	check(controls_inside, "all touch action buttons fit within the landscape viewport")
	var start_point: Vector2 = game.hud.primary.get_global_rect().get_center()
	emulated_mouse(start_point, true)
	touch(0, start_point, true)
	emulated_mouse(start_point, false)
	touch(0, start_point, false)
	check(game.running and not paused and not game.hud.blocked, "menu start button accepts emulated touch mouse input")
	game.start_round()
	game.enemy_enabled = false
	for i in range(30):
		await physics_frame
	check(game.player.is_on_floor(), "player capsule stands on solid arena")
	var stick: Vector2 = game.hud.joystick_center + Vector2(0, -40)
	emulated_mouse(stick, true)
	check(game.melee_cooldown == 0, "emulated touch mouse does not trigger an accidental melee")
	touch(0, stick, true)
	touch(1, Vector2(800, 250), true)
	var skill_point: Vector2 = game.hud.skill_buttons[2].get_global_rect().get_center()
	touch(2, skill_point, true)
	check(game.hud.move_vector.y < -0.5 and game.hud.look_finger == 1 and game.rules.casts == 1, "three fingers can move, aim and cast independently")
	var drag := InputEventScreenDrag.new()
	drag.index = 1
	drag.position = Vector2(825, 240)
	drag.relative = Vector2(25, -10)
	root.push_input(drag, true)
	check(game.hud.look_delta.x > 0, "camera finger records drag independently of joystick")
	touch(2, skill_point, false)
	touch(1, drag.position, false)
	touch(0, stick, false)
	emulated_mouse(stick, false)
	check(game.hud.move_vector == Vector2.ZERO and game.hud.look_finger == -1, "releasing touch fingers clears controls")
	game.hud.reset_input()
	var sprint_point: Vector2 = game.hud.buttons["sprint"].get_global_rect().get_center()
	emulated_mouse(sprint_point, true)
	touch(0, sprint_point, true)
	emulated_mouse(sprint_point, false)
	touch(0, sprint_point, false)
	check(game.hud.sprinting, "touch toggles sprint once, not twice through mouse emulation")
	game.hud.reset_input()
	check(game.audio.active and game.audio.music.playing, "a single ambience track plays in an active round")
	game.hud.volume_slider.value = 0
	check(game.audio.volume == 0 and AudioServer.is_bus_mute(AudioServer.get_bus_index(TrainingAudio.BUS)), "menu volume slider mutes all game audio")
	check(not game.audio.play_sfx("katon"), "muted techniques do not allocate sound playback")
	game.hud.volume_slider.value = 60
	game.hud.ambience_toggle.button_pressed = false
	check(not game.audio.music.playing, "ambience toggle stops only the background track")
	check(game.audio.play_sfx("hit"), "effects still play when background ambience is disabled")
	game.audio.play_sfx("hit")
	game.audio.play_sfx("hit")
	await process_frame
	var hit_voices: int = 0
	for voice in game.audio.voices:
		if voice.playing and voice.get_meta("cue", "") == "hit":
			hit_voices += 1
	check(hit_voices == 1, "repeated impacts restart one recording instead of stacking long copies")
	check(not game.audio.play_sfx("missing_cue"), "unknown sound names fail safely")
	game.hud.ambience_toggle.button_pressed = true
	check(game.audio.music.playing, "ambience can be enabled again")
	game.player.strike_remaining = 0
	game.hud.sprinting = true
	Input.action_press("move_forward")
	for i in range(20):
		await physics_frame
	check(game.player.left_arm.rotation.x < -0.9 and game.player.right_arm.rotation.x < -0.9, "running trails both arms behind the ninja")
	check(game.player.visual.rotation.x < -0.1 and is_zero_approx(game.player.forward().y), "running leans the model without tilting the combat direction")
	game.player.strike_remaining = 0.3
	for i in range(6):
		await physics_frame
	check(game.player.right_arm.rotation.x > 0.5, "attacking while running brings the striking arm forward")
	Input.action_release("move_forward")
	game.hud.sprinting = false
	for i in range(30):
		await physics_frame
	check(absf(game.player.visual.rotation.x) < 0.02 and absf(game.player.left_arm.rotation.x) < 0.02, "standing restores an upright idle pose")
	game.start_round()
	game.enemy_enabled = false
	for i in range(30):
		await physics_frame
	var previous: Vector3 = game.player.position
	Input.action_press("move_forward")
	for i in range(30):
		await physics_frame
	Input.action_release("move_forward")
	check(game.player.position.z < previous.z - 0.7, "camera-relative movement works")
	check(game.player.jump(), "jump works from the ground")
	for i in range(5):
		await physics_frame
	check(game.player.position.y > 0.2, "jump has vertical motion")
	check(game.player.dodge(Vector3.RIGHT), "dodge starts")
	check(not game.player.take_damage(10), "dodge briefly protects from attacks")
	game.player.dodge_remaining = 0
	check(game.player.take_damage(10), "damage applies outside dodge window")
	game.pause_round()
	check(game.audio.suspended and game.audio.music.stream_paused, "pause suspends background sound")
	check(not game.audio.play_sfx("hit"), "pause refuses new technique sounds")
	var cooldown_before: Array = game.rules.cooldowns.duplicate()
	var position_before: Vector3 = game.player.position
	for i in range(5):
		await process_frame
	check(game.rules.cooldowns == cooldown_before and game.player.position == position_before, "pause freezes movement and cooldowns")
	check(screen.encloses(game.hud.menu_panel.get_global_rect()), "pause menu including restart fits on screen")
	game.start_round()
	game.enemy_enabled = false
	game.target_locked = true
	for i in range(8):
		await physics_frame
	var health_before: float = game.enemy.health
	var sound_count: int = game.audio.play_count
	check(game.cast_skill(1), "locked lightning casts")
	check(game.audio.play_count > sound_count and game.vfx.get_child_count() > 0, "a valid technique creates sound and world-space effects")
	sound_count = game.audio.play_count
	check(not game.cast_skill(1) and game.audio.play_count == sound_count, "a refused technique does not create a duplicate sound")
	check(game.enemy.health < health_before, "locked attack damages opponent")
	var bolt: TrainingBolt = null
	for group in game.vfx.get_children():
		for effect in group.get_children():
			if effect is TrainingBolt:
				bolt = effect
	check(bolt != null, "Raiton creates a dedicated electrical visual")
	if bolt != null:
		check(bolt.layers.size() == 3 and bolt.strokes.size() >= 10, "lightning batches its core, channel, halo and branches into three meshes")
		check(bolt.strokes[0][0] == Vector3.ZERO and bolt.strokes[0][-1] == bolt.endpoint, "main electrical channel preserves the gameplay ray endpoints")
		var health_after: float = game.enemy.health
		for i in range(10):
			await physics_frame
		check(bolt.redraws == 3 and game.enemy.health == health_after, "electrical flicker rebuilds at most three times without repeating damage")
	game.start_round()
	game.enemy_enabled = false
	game.target_locked = true
	for i in range(8):
		await physics_frame
	health_before = game.enemy.health
	check(game.cast_skill(0), "projectile casts")
	var fire: TrainingFlame = game.projectiles[0]["node"]
	check(fire is TrainingFlame and fire.sprites.size() == 3, "Katon projectile uses layered flames rather than an opaque sphere")
	var first_frame: int = fire.sprites[0].frame
	for i in range(8):
		await physics_frame
	check(fire.sprites[0].frame != first_frame, "fire atlas visibly animates while the projectile travels")
	check(not fire.sprites[0].no_depth_test and fire.sprites[0].pixel_size < 0.01, "flames remain depth-tested and world-sized instead of covering the screen")
	for i in range(70):
		await physics_frame
	check(game.enemy.health < health_before, "projectile collides with opponent")
	game.start_round()
	game.enemy_enabled = false
	game.target_locked = true
	game.enemy.position = Vector3(0, 0.2, 1)
	for i in range(8):
		await physics_frame
	health_before = game.enemy.health
	check(game.cast_skill(2), "wind cone casts at a nearby target")
	check(game.enemy.health == health_before - 14 and game.enemy.impulse.length() > 7.5, "wind deals damage and adds knockback")
	game.start_round()
	game.enemy_enabled = false
	for i in range(30):
		await physics_frame
	game.enemy.position = game._ground_aim()
	game.enemy.position.y = 0.2
	for i in range(8):
		await physics_frame
	health_before = game.enemy.health
	check(game.cast_skill(3) and game.zones.size() == 1, "earth creates a manually aimed ground warning")
	for i in range(20):
		await physics_frame
	check(game.enemy.health == health_before, "earth warning does not damage immediately")
	for i in range(30):
		await physics_frame
	check(game.enemy.health == health_before - 44 and game.zones.is_empty(), "earth detonates once after the warning")
	game.start_round()
	game.enemy_enabled = false
	for i in range(80):
		game.vfx.impact(Vector3.ZERO, Color.WHITE)
	check(game.vfx.get_child_count() <= TrainingVFX.MAX_GROUPS, "effect bursts have a strict simultaneous group budget")
	for i in range(35):
		await physics_frame
	check(game.vfx.get_child_count() == 0, "short-lived effects are cleaned up automatically")
	game.vfx.fire_impact(Vector3.ZERO, Vector3.FORWARD)
	check(game.vfx.get_child_count() > 0, "fire collision can create a short flame bloom")
	for i in range(42):
		await physics_frame
	check(game.vfx.get_child_count() == 0, "fire impact and embers fully disappear after their short lifetime")
	game.vfx.earth(Vector3.ZERO)
	game.start_round()
	await process_frame
	check(game.vfx.get_child_count() == 0, "restarting clears remaining visuals and their tweens")
	game.player.position = Vector3(0, 0.2, 18.8)
	Input.action_press("move_back")
	for i in range(60):
		await physics_frame
	Input.action_release("move_back")
	check(game.player.position.z < 20, "arena wall prevents escape")
	game.hud.move_vector = Vector2.ONE
	game.hud.reset_input()
	check(game.hud.move_vector == Vector2.ZERO and game.hud.joystick_finger == -1, "touch cancellation clears movement")
	game.enemy.health = 0
	await physics_frame
	await physics_frame
	check(game.round_over and paused, "defeating opponent opens a paused result screen")
	game.start_round()
	check(game.enemy.health == 180 and game.player.health == 120 and not game.round_over, "restart restores both fighters")
	check(game.player.appearance == original_appearance, "round reset keeps cosmetic choices instead of resetting the avatar")
	game.open_creator()
	check(not game.creator.visible, "creator cannot be opened directly during active combat")
	game.pause_round()
	game.open_creator()
	var creator_time: float = game.elapsed
	game._resume()
	await process_frame
	check(paused and game.elapsed == creator_time and game.creator.visible, "creator keeps simulation paused even if a resume is requested")
	game.notification(MainLoop.NOTIFICATION_APPLICATION_FOCUS_OUT)
	check(game.creator.visible and paused, "losing focus keeps an unsaved creator draft paused")
	game.notification(Node.NOTIFICATION_WM_GO_BACK_REQUEST)
	check(not game.creator.visible and paused, "Android back returns from creator to the menu without committing")
	game.start_round()
	game.enemy_enabled = true
	game.enemy.position = Vector3(0, 0.2, 4.5)
	game.enemy_cooldown = 0
	for i in range(25):
		await physics_frame
	check(game.enemy_windup > 0 and is_instance_valid(game.telegraph) and game.player.health == 120, "enemy gives a visible warning before damage")
	for i in range(30):
		await physics_frame
	check(game.player.health == 102 and game.rules.combat_remaining > 0, "enemy strike damages the player after its warning")
	game.player.health = 0
	await physics_frame
	await physics_frame
	check(game.round_over and paused, "player defeat also pauses the round")
	check(not game.audio.active and not game.audio.music.playing, "the result screen stops combat audio")
	game.start_round()
	game.hud.move_vector = Vector2.ONE
	Input.action_press("move_forward")
	game.notification(MainLoop.NOTIFICATION_APPLICATION_FOCUS_OUT)
	check(paused and game.hud.move_vector == Vector2.ZERO and not Input.is_action_pressed("move_forward"), "losing application focus pauses and clears held inputs")
	game._resume()
	check(not paused and not game.hud.blocked, "resume leaves controls usable")
	game.queue_free()
	await process_frame
	print("IDREM_SMOKE_FAILURES=%d" % failures)
	quit(0 if failures == 0 else 1)
