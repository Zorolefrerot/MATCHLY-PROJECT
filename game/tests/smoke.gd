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
	root.add_child(game)
	await process_frame
	check(paused, "opening menu pauses simulation")
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
	var cooldown_before: Array = game.rules.cooldowns.duplicate()
	var position_before: Vector3 = game.player.position
	for i in range(5):
		await process_frame
	check(game.rules.cooldowns == cooldown_before and game.player.position == position_before, "pause freezes movement and cooldowns")
	game.start_round()
	game.enemy_enabled = false
	game.target_locked = true
	for i in range(8):
		await physics_frame
	var health_before: float = game.enemy.health
	check(game.cast_skill(1), "locked lightning casts")
	check(game.enemy.health < health_before, "locked attack damages opponent")
	game.start_round()
	game.enemy_enabled = false
	game.target_locked = true
	for i in range(8):
		await physics_frame
	health_before = game.enemy.health
	check(game.cast_skill(0), "projectile casts")
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
