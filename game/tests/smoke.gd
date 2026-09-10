extends SceneTree
## Run with Godot --headless --path game --script res://tests/smoke.gd.

# Only this test subclass bypasses transport; production uses verified HTTPS.
class MockAccountAPI extends CharacterAccountAPI:
	var sent: Dictionary = {}
	func _send(operation: String, method: int, path: String, body: Variant = null) -> void:
		_operation = operation
		busy = true
		sent = {"operation": operation, "method": method, "path": path, "body": body}
	func respond(status: int, value: Dictionary) -> void:
		_response(HTTPRequest.RESULT_SUCCESS, status, PackedStringArray(), JSON.stringify(value).to_utf8_buffer())

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
	game.account_api = MockAccountAPI.new()
	game.appearance_path = "user://appearance-smoke.json"
	DirAccess.remove_absolute(ProjectSettings.globalize_path(game.appearance_path))
	root.add_child(game)
	await process_frame
	check(paused, "opening menu pauses simulation")
	game.account_panel.origin_config_path = "user://account-panel-smoke.cfg"
	check(not game.account_api.busy and game.account_api.sent.is_empty(), "launching offline training performs no network request")
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
	game.pause_round()
	game.hud.account_button.pressed.emit()
	await process_frame
	await process_frame
	check(game.account_panel.visible and paused and not game.hud.visible, "account panel opens separately from offline training")
	var account_bounds := Rect2(Vector2.ZERO, game.account_panel.size)
	check(account_bounds.encloses(game.account_panel.login_button.get_global_rect()) and account_bounds.encloses(game.account_panel.back_button.get_global_rect()), "account login and return controls fit the landscape viewport")
	check(CharacterAccountAPI.normalize_origin("https://example.onrender.com/") == "https://example.onrender.com", "valid HTTPS website origin is normalized")
	for bad_origin in ["http://example.com", "https://user:password@example.com", "https://example.com/api", "https://example.com?x=1", "https://localhost", "https://127.0.0.1", "https://example.com:9999"]:
		check(CharacterAccountAPI.normalize_origin(bad_origin).is_empty(), "unsafe or ambiguous credential destination is refused")
	game.account_panel.origin_field.text = "http://example.com"
	game.account_panel.password_field.text = "not-a-real-password"
	game.account_panel.login_button.pressed.emit()
	check(game.account_panel.password_field.text.is_empty() and not game.account_api.busy and game.account_api.sent.is_empty(), "invalid origin is refused before any request and password field is cleared")
	var online: Dictionary = {"protocol": 1, "schemaVersion": 1, "character": {"id": 123, "name": "Genin Test", "clan": "Hyūga", "affinity": "Raiton", "mokuton": false, "rank": "Genin", "village": "Konoha"}, "appearance": null, "revision": 0}
	check(CharacterAccountAPI.valid_profile(online), "server profile contract is recognized without fabricating an appearance")
	var incompatible: Dictionary = online.duplicate(true)
	incompatible["protocol"] = 99
	check(not CharacterAccountAPI.valid_profile(incompatible), "incompatible server profile is rejected")
	game.account_panel.origin_field.text = "https://example.onrender.com"
	game.account_panel.email_field.text = "fixture@example.test"
	game.account_panel.password_field.text = "not-a-real-password"
	game.account_panel.login_button.pressed.emit()
	check(game.account_api.sent["path"] == "/login" and game.account_panel.password_field.text.is_empty(), "login uses the dedicated game route without retaining the password field")
	game.account_api.respond(200, {"token": "a".repeat(64), "profile": online})
	check(game.account_api.profile["character"]["name"] == "Genin Test" and not game.account_panel.edit_button.disabled, "valid login shows the account character and allows cosmetic editing")
	var offline_before: Dictionary = game.player.appearance.duplicate()
	var local_before: String = FileAccess.get_file_as_string(CharacterAppearance.SAVE_PATH) if FileAccess.file_exists(CharacterAppearance.SAVE_PATH) else ""
	game.account_panel.edit_button.pressed.emit()
	check(game.creator.remote_mode and game.creator.visible and not game.account_panel.visible, "cloud appearance uses a distinct editor save mode")
	game.creator.set_choice("hair", 3)
	game.creator.confirm()
	check(game.creator.remote_busy and game.account_api.sent["path"] == "/appearance" and game.account_api.sent["body"]["expectedRevision"] == 0, "cloud save sends the expected server revision and does not finish before acknowledgement")
	game.creator.cancel()
	check(game.creator.visible, "pending cloud save cannot falsely report cancellation")
	game.account_api.respond(409, {"error": "Une version plus récente existe."})
	check(game.creator.visible and not game.creator.remote_busy and game.creator.draft["hair"] == 3, "save conflict keeps the draft visible without claiming success")
	game.creator.confirm()
	online["appearance"] = game.creator.draft.duplicate()
	online["revision"] = 1
	check(CharacterAccountAPI.valid_profile(JSON.parse_string(JSON.stringify(online))), "saved appearance accepts valid integral JSON floats from the network")
	game.account_api.respond(200, online)
	check(not game.creator.visible and game.account_panel.visible and game.account_api.profile["revision"] == 1, "acknowledged cloud save returns to the updated account profile")
	check(game.player.appearance == offline_before, "cloud appearance cannot overwrite the offline combat fighter")
	var local_after: String = FileAccess.get_file_as_string(CharacterAppearance.SAVE_PATH) if FileAccess.file_exists(CharacterAppearance.SAVE_PATH) else ""
	check(local_before == local_after, "cloud editor never writes the local appearance save")
	var training_position: Vector3 = game.player.position
	var training_elapsed: float = game.elapsed
	var training_casts: int = game.rules.casts
	game.account_panel.village_button.pressed.emit()
	check(game.village == null and game.village_entry_pending and game.account_api.sent["path"] == "/profile", "village entry waits for a fresh account admission check")
	game.account_api.respond(200, online)
	check(game.village != null and not game.account_panel.visible, "successful account check opens the separate Konoha scene")
	var visit: KonohaVisit = game.village
	for frame in range(22):
		await physics_frame
	check(visit.initialized and visit.player.is_on_floor(), "village avatar arrives on a real colliding floor")
	check(visit.player.get_world_3d() != game.player.get_world_3d(), "Konoha uses its own physics world, not the training arena")
	check(root.disable_3d and game.process_mode == Node.PROCESS_MODE_DISABLED and not game.hud.is_processing_input(), "training rendering, simulation and input are suspended during the visit")
	check(visit.player.appearance == CharacterAppearance.sanitize(online["appearance"]) and visit.hud.identity.text.contains("Genin Test"), "Konoha uses the account identity and saved appearance")
	check(visit.hud.skill_buttons.is_empty() and not visit.hud.buttons.has("melee"), "village does not expose training combat or test jutsu")
	var village_screen := Rect2(Vector2.ZERO, visit.hud.size)
	var visit_buttons_fit: bool = true
	for button: Button in visit.hud.buttons.values():
		visit_buttons_fit = visit_buttons_fit and village_screen.encloses(button.get_global_rect())
	check(visit_buttons_fit, "village touch buttons fit the landscape viewport")
	var arrival: Vector3 = visit.player.position
	Input.action_press("move_forward")
	for frame in range(30):
		await physics_frame
	Input.action_release("move_forward")
	check(visit.player.position.z < arrival.z-1.5, "walking moves the account avatar through Konoha")
	check(visit.player.jump(), "jump works independently in the village")
	for frame in range(10):
		await physics_frame
	check(visit.player.position.y > arrival.y+0.3, "village jump leaves the ground")
	for frame in range(55):
		await physics_frame
	check(visit.player.is_on_floor(), "village jump lands back on the colliding ground")
	touch(81, visit.hud.joystick_center+Vector2(40,0), true)
	touch(82, Vector2(700,320), true)
	check(visit.hud.move_vector.x > 0 and visit.hud.look_finger == 82 and game.hud.move_vector == Vector2.ZERO, "village joystick and camera track separate fingers without controlling training")
	touch(81, visit.hud.joystick_center, false)
	touch(82, Vector2(700,320), false)
	check(visit.hud.move_vector == Vector2.ZERO, "village touch release clears movement")
	visit.player.reset_at(Vector3(27.5,0.1,0))
	Input.action_press("move_right")
	for frame in range(30):
		await physics_frame
	Input.action_release("move_right")
	check(visit.player.position.x < 28.5, "village perimeter collision prevents walking out")
	visit.player.reset_at(KonohaMap.GUIDE+Vector3(0,0.3,2.2))
	for frame in range(5):
		await physics_frame
	visit.interact()
	check(visit.guide_met and visit.hud.blocked and visit.hud.menu_title.text.contains("Aoi"), "nearby guide opens an original written welcome dialogue")
	await process_frame
	check(village_screen.encloses(visit.hud.menu_panel.get_global_rect()), "village dialogue fits the screen")
	var stopped: Vector3 = visit.player.position
	Input.action_press("move_left")
	for frame in range(6):
		await physics_frame
	check(visit.player.position == stopped, "dialogue freezes village movement")
	visit.resume_visit()
	check(not Input.is_action_pressed("move_left") and not visit.hud.blocked, "resuming a visit clears held movement")
	for data in KonohaMap.LANDMARKS:
		visit.player.reset_at(data["point"]+Vector3(0,0.3,2))
		for frame in range(5):
			await physics_frame
		visit.interact()
		check(visit.hud.blocked and visit.hud.menu_title.text == data["name"], "each landmark has an approachable readable sign: " + data["name"])
		visit.resume_visit()
	check(visit.visited.size() == 3, "local orientation counts each of the three landmarks once")
	visit.player.reset_at(Vector3(15,0.1,-0.5))
	await physics_frame
	check(not visit._reachable(Vector3(15,0,-3)), "walls block interaction rays")
	game.notification(MainLoop.NOTIFICATION_APPLICATION_FOCUS_OUT)
	check(visit.hud.blocked, "losing focus pauses the Konoha visit")
	game.notification(Node.NOTIFICATION_WM_GO_BACK_REQUEST)
	check(not visit.hud.blocked, "Android back resumes from the village pause without returning to training")
	visit.player.position.y = -8
	for frame in range(2):
		await physics_frame
	check(visit.player.position.distance_to(KonohaMap.SPAWN) < 1, "fall recovery returns to the village entrance")
	game.handle_action("skill_0")
	check(game.player.position == training_position and game.elapsed == training_elapsed and game.rules.casts == training_casts, "village movement and interactions never advance the training match")
	check(game.account_api.sent["path"] == "/profile" and game.player.appearance == offline_before, "visiting Konoha does not write rewards, position or offline appearance")
	visit.finish()
	await process_frame
	check(game.village == null and game.account_panel.visible and paused and not root.disable_3d and game.hud.is_processing_input(), "leaving destroys the visit and restores the paused account screen")
	game.account_panel.village_button.pressed.emit()
	game.account_api.respond(200, online)
	check(game.village != null and game.village.visited.is_empty(), "a fresh village visit has no invented persistent mission progress")
	game.village.finish()
	await process_frame
	game.account_panel.village_button.pressed.emit()
	game.account_api.respond(401, {"error": "Session expirée."})
	check(game.village == null and not game.village_entry_pending and game.account_panel.village_button.disabled, "an expired session cannot enter the village")
	game.account_panel.refresh_button.pressed.emit()
	game.account_api.respond(401, {"error": "Session expirée."})
	check(game.account_api.profile.is_empty() and game.account_api._token.is_empty() and game.account_panel.edit_button.disabled, "expired session clears account identity and disables edits")
	game.handle_action("pause")
	check(not game.account_panel.visible and game.hud.visible and paused, "back from account returns to the paused offline menu")
	DirAccess.remove_absolute(ProjectSettings.globalize_path(game.account_panel.origin_config_path))
	game.queue_free()
	await process_frame
	print("IDREM_SMOKE_FAILURES=%d" % failures)
	quit(0 if failures == 0 else 1)
