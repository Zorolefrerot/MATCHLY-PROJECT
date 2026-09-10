extends Node3D
## The entire prototype is offline: there is deliberately no HTTP, WebSocket,
## authentication or persistent character state in this project.

var arena: TrainingArena
var player: TrainingFighter
var enemy: TrainingFighter
var hud: TrainingHUD
var rules := TrainingRules.new()
var pivot: Node3D
var arm: SpringArm3D
var camera: Camera3D
var effects: Node3D
var projectiles: Array[Dictionary] = []
var zones: Array[Dictionary] = []
var running: bool = false
var round_over: bool = false
var target_locked: bool = false
var enemy_enabled: bool = true
var enemy_windup: float = -1.0
var enemy_cooldown: float = 1.0
var melee_cooldown: float = 0.0
var telegraph: MeshInstance3D
var elapsed: float = 0.0
var yaw: float = 0.0
var pitch: float = -0.30
var patrol_time: float = 0.0
var casts_landed: int = 0

func _ready() -> void:
	_register_inputs()
	arena = TrainingArena.new()
	add_child(arena)
	arena.build()
	effects = Node3D.new()
	add_child(effects)
	player = TrainingFighter.new()
	player.name = "Player"
	add_child(player)
	player.configure(Color("385962"), 2, TrainingRules.MAX_HEALTH)
	enemy = TrainingFighter.new()
	enemy.name = "TrainingOpponent"
	add_child(enemy)
	enemy.configure(Color("954d4c"), 4, 180.0)
	pivot = Node3D.new()
	add_child(pivot)
	arm = SpringArm3D.new()
	arm.spring_length = 7.5
	arm.margin = 0.2
	arm.collision_mask = 1
	var probe := SphereShape3D.new()
	probe.radius = 0.18
	arm.shape = probe
	pivot.add_child(arm)
	camera = Camera3D.new()
	camera.current = true
	camera.fov = 65
	camera.far = 100
	arm.add_child(camera)
	var layer := CanvasLayer.new()
	layer.layer = 10
	add_child(layer)
	hud = TrainingHUD.new()
	layer.add_child(hud)
	hud.action_requested.connect(handle_action)
	hud.resume_requested.connect(_resume)
	hud.restart_requested.connect(start_round)
	hud.quality_changed.connect(_quality)
	hud.opponent_changed.connect(func(active: bool) -> void: enemy_enabled = active)
	_reset_positions()
	hud.refresh(player, enemy, rules, target_locked, elapsed)
	hud.show_menu("Ta voie ninja commence ici.", "Une arène, quatre techniques et un adversaire programmé.\nModèles provisoires. Entraînement solo, sans compte en ligne.", "LANCER L’ENTRAÎNEMENT", false)
	get_tree().paused = true

func _register_inputs() -> void:
	var bindings: Dictionary = {
		"move_forward": [KEY_W, KEY_Z, KEY_UP], "move_back": [KEY_S, KEY_DOWN],
		"move_left": [KEY_A, KEY_Q, KEY_LEFT], "move_right": [KEY_D, KEY_RIGHT],
		"jump": [KEY_SPACE], "sprint": [KEY_SHIFT], "dodge": [KEY_CTRL, KEY_X],
		"melee": [KEY_F], "lock": [KEY_TAB],
		"skill_0": [KEY_1], "skill_1": [KEY_2], "skill_2": [KEY_3], "skill_3": [KEY_4]
	}
	for action in bindings:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for code in bindings[action]:
			var key := InputEventKey.new()
			key.physical_keycode = code
			InputMap.action_add_event(action, key)

func _reset_positions() -> void:
	player.reset_at(Vector3(0, 0.4, 6))
	enemy.reset_at(Vector3(0, 0.4, -6))
	enemy.face(Vector3.BACK)
	yaw = 0
	pitch = -0.30
	pivot.position = player.position + Vector3(0, 1.4, 0)
	pivot.rotation.y = yaw
	arm.rotation.x = pitch
	enemy_windup = -1
	enemy_cooldown = 1.0
	melee_cooldown = 0
	patrol_time = 0
	telegraph = null

func start_round() -> void:
	get_tree().paused = false
	for child in effects.get_children():
		child.queue_free()
	projectiles.clear()
	zones.clear()
	rules.reset()
	_reset_positions()
	elapsed = 0
	casts_landed = 0
	round_over = false
	target_locked = false
	running = true
	hud.hide_menu()
	hud.notice("Approche, cible ton adversaire et essaie tes quatre techniques.")

func _resume() -> void:
	if not running or round_over:
		start_round()
	else:
		get_tree().paused = false
		hud.hide_menu()

func _quality(standard: bool) -> void:
	arena.sun.shadow_enabled = standard
	get_viewport().msaa_3d = Viewport.MSAA_2X if standard else Viewport.MSAA_DISABLED

func pause_round() -> void:
	if not running or round_over:
		return
	get_tree().paused = true
	hud.show_menu("Une pause au village.", "Le combat, les recharges et l’adversaire sont en pause.\nTes candidatures et ton compte ne sont pas concernés.", "REPRENDRE", true)

func _notification(what: int) -> void:
	if is_instance_valid(hud) and (what == NOTIFICATION_APPLICATION_FOCUS_OUT or what == NOTIFICATION_WM_GO_BACK_REQUEST):
		hud.reset_input()
		for action in ["move_forward", "move_back", "move_left", "move_right", "sprint"]:
			Input.action_release(action)
		pause_round()

func handle_action(action: String) -> void:
	if action == "pause":
		if get_tree().paused:
			_resume()
		else:
			pause_round()
		return
	if not running or get_tree().paused or round_over:
		return
	if action.begins_with("skill_"):
		cast_skill(int(action.trim_prefix("skill_")))
	elif action == "jump":
		player.jump()
	elif action == "dodge":
		if player.dodge(_movement()):
			hud.notice("Esquive ! Courte fenêtre de protection.")
	elif action == "lock":
		target_locked = not target_locked
		hud.notice("Cible verrouillée. DOTON reste en visée au sol." if target_locked else "Visée libre : glisse à droite pour orienter la caméra.")
	elif action == "melee":
		melee()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		handle_action("melee")

func _movement() -> Vector3:
	var input: Vector2 = Input.get_vector("move_left", "move_right", "move_forward", "move_back") + hud.move_vector
	input = input.limit_length()
	var forward: Vector3 = -pivot.global_transform.basis.z
	var right: Vector3 = pivot.global_transform.basis.x
	return (right * input.x - forward * input.y).limit_length()

func _physics_process(delta: float) -> void:
	if not running or round_over:
		return
	elapsed += delta
	rules.tick(delta)
	melee_cooldown = maxf(0, melee_cooldown - delta)
	var look: Vector2 = hud.consume_look()
	if look.length() > 0.01:
		target_locked = false
		yaw -= look.x * 0.004
		pitch = clampf(pitch - look.y * 0.003, -0.9, -0.07)
	if target_locked:
		var to_enemy: Vector3 = enemy.position - player.position
		if to_enemy.length() > 26 or enemy.health <= 0:
			target_locked = false
		else:
			yaw = lerp_angle(yaw, atan2(-to_enemy.x, -to_enemy.z), minf(1, delta * 5.0))
	pivot.rotation.y = yaw
	arm.rotation.x = pitch
	for action in ["jump", "dodge", "melee", "lock", "skill_0", "skill_1", "skill_2", "skill_3"]:
		if Input.is_action_just_pressed(action):
			handle_action(action)
	player.simulate(delta, _movement(), hud.sprinting or Input.is_action_pressed("sprint"))
	pivot.position = pivot.position.lerp(player.position + Vector3(0, 1.4, 0), minf(1, delta * 16))
	_update_enemy(delta)
	_update_projectiles(delta)
	_update_zones(delta)
	enemy.ring.visible = target_locked
	if player.position.y < -5:
		player.position = Vector3(0, 1, 6)
		player.velocity = Vector3.ZERO
	if enemy.position.y < -5:
		enemy.position = Vector3(0, 1, -6)
		enemy.velocity = Vector3.ZERO
	hud.refresh(player, enemy, rules, target_locked, elapsed)
	if player.health <= 0:
		_finish(false)
	elif enemy.health <= 0:
		_finish(true)

func _update_enemy(delta: float) -> void:
	var direction := Vector3.ZERO
	enemy_cooldown = maxf(0, enemy_cooldown - delta)
	var to_player: Vector3 = player.position - enemy.position
	to_player.y = 0
	var distance: float = to_player.length()
	if enemy_enabled and enemy.health > 0:
		if enemy_windup > 0:
			enemy.face(to_player, delta * 5)
			enemy_windup -= delta
			if is_instance_valid(telegraph):
				telegraph.position = enemy.position + Vector3.UP * 0.06
			if enemy_windup <= 0:
				if is_instance_valid(telegraph):
					telegraph.queue_free()
				enemy.strike_remaining = 0.25
				if distance < 2.6 and _clear_line(enemy, player):
					if player.take_damage(18, to_player.normalized() * 2.0):
						rules.enter_combat()
						_burst(player.position + Vector3.UP, Color("fa9b86"), 0.6)
						hud.notice("Touché ! Esquive lorsque le cercle rouge apparaît.")
				enemy_cooldown = 1.5
				enemy_windup = -1
		elif distance < 2.0 and enemy_cooldown <= 0:
			enemy_windup = 0.75
			telegraph = _disc(enemy.position + Vector3.UP * 0.05, 2.6, Color(0.9, 0.25, 0.22, 0.32))
			hud.notice("L’adversaire prépare une frappe : éloigne-toi ou esquive !")
		elif distance < 15 and distance > 1.7:
			direction = to_player.normalized() * 0.65
		else:
			patrol_time += delta * 0.45
			var patrol_point := Vector3(sin(patrol_time) * 4, 0, -6 + cos(patrol_time) * 2)
			var to_patrol: Vector3 = patrol_point - enemy.position
			to_patrol.y = 0
			if to_patrol.length() > 0.5:
				direction = to_patrol.normalized() * 0.3
	else:
		enemy_windup = -1
		if is_instance_valid(telegraph):
			telegraph.queue_free()
	enemy.simulate(delta, direction)

func _clear_line(from: TrainingFighter, to: TrainingFighter) -> bool:
	var ray := PhysicsRayQueryParameters3D.create(from.position + Vector3.UP, to.position + Vector3.UP, 1)
	return get_world_3d().direct_space_state.intersect_ray(ray).is_empty()

func _ground_aim() -> Vector3:
	var middle: Vector2 = get_viewport().get_visible_rect().size / 2.0
	var origin: Vector3 = camera.project_ray_origin(middle)
	var ray: Vector3 = camera.project_ray_normal(middle)
	var point: Variant = Plane(Vector3.UP, 0.15).intersects_ray(origin, ray)
	var result: Vector3 = player.position - pivot.global_basis.z * 7.0
	if point != null:
		result = point
	var delta: Vector3 = result - player.position
	delta.y = 0
	result = player.position + delta.limit_length(16)
	result.y = 0.16
	return result

func _attack_direction() -> Vector3:
	if target_locked and enemy.health > 0:
		return (enemy.position + Vector3.UP - (player.position + Vector3.UP * 1.15)).normalized()
	var middle: Vector2 = get_viewport().get_visible_rect().size / 2.0
	var point: Vector3 = camera.project_ray_origin(middle) + camera.project_ray_normal(middle) * 40.0
	return (point - (player.position + Vector3.UP * 1.15)).normalized()

func melee() -> void:
	if melee_cooldown > 0:
		return
	melee_cooldown = 0.55
	player.strike_remaining = 0.22
	rules.enter_combat()
	if target_locked:
		player.face(enemy.position - player.position)
	var difference: Vector3 = enemy.position - player.position
	if difference.length() < 2.2 and player.forward().dot(difference.normalized()) > 0.15 and _clear_line(player, enemy):
		_hit_enemy(10, difference.normalized() * 0.8)
	else:
		hud.notice("Frappe courte : rapproche-toi de l’adversaire.")

func cast_skill(index: int) -> bool:
	if not running or round_over or get_tree().paused:
		return false
	var refusal: String = rules.refusal(index)
	if not refusal.is_empty():
		hud.notice(refusal)
		return false
	if not rules.try_cast(index):
		return false
	var skill: Dictionary = TrainingRules.SKILLS[index]
	var color: Color = skill["color"]
	var direction: Vector3 = _attack_direction()
	player.face(direction)
	player.strike_remaining = 0.35
	var origin: Vector3 = player.position + Vector3.UP * 1.15 + direction * 0.7
	if index == 0:
		var orb: MeshInstance3D = _orb(origin, 0.26, color)
		projectiles.append({"node": orb, "direction": direction, "remaining": 1.8, "damage": float(skill["damage"]), "speed": 18.0})
	elif index == 1:
		var end: Vector3 = origin + direction * 15.0
		var ray := PhysicsRayQueryParameters3D.create(origin, end, 1 | 4)
		var hit: Dictionary = get_world_3d().direct_space_state.intersect_ray(ray)
		if not hit.is_empty():
			end = hit["position"]
			if hit["collider"] == enemy:
				_hit_enemy(float(skill["damage"]), direction * 1.8)
		_beam(origin, end, color)
	elif index == 2:
		var flat: Vector3 = Vector3(direction.x, 0, direction.z).normalized()
		var distance: Vector3 = enemy.position - player.position
		distance.y = 0
		_burst(origin + flat * 2, color, 2.0)
		if distance.length() < 8 and flat.dot(distance.normalized()) > 0.55 and _clear_line(player, enemy):
			_hit_enemy(float(skill["damage"]), flat * 8)
	elif index == 3:
		var point: Vector3 = _ground_aim()
		var marker: MeshInstance3D = _disc(point, 3.0, Color(color, 0.48))
		zones.append({"node": marker, "position": point, "remaining": 0.65, "damage": float(skill["damage"])})
		hud.notice("DOTON : onde au sol dans 0,65 seconde — visée manuelle.")
	if index != 3:
		hud.notice("%s ! Recharge indépendante : %.0f s" % [skill["name"], float(skill["cooldown"])])
	return true

func _update_projectiles(delta: float) -> void:
	for i in range(projectiles.size() - 1, -1, -1):
		var shot: Dictionary = projectiles[i]
		var node: MeshInstance3D = shot["node"]
		if not is_instance_valid(node):
			projectiles.remove_at(i)
			continue
		var next: Vector3 = node.position + Vector3(shot["direction"]) * float(shot["speed"]) * delta
		var ray := PhysicsRayQueryParameters3D.create(node.position, next, 1 | 4)
		var hit: Dictionary = get_world_3d().direct_space_state.intersect_ray(ray)
		shot["remaining"] = float(shot["remaining"]) - delta
		if not hit.is_empty():
			if hit["collider"] == enemy:
				_hit_enemy(float(shot["damage"]), Vector3(shot["direction"]) * 1.6)
			_burst(hit["position"], Color("ff9a56"), 1.0)
			node.queue_free()
			projectiles.remove_at(i)
		elif float(shot["remaining"]) <= 0:
			node.queue_free()
			projectiles.remove_at(i)
		else:
			node.position = next

func _update_zones(delta: float) -> void:
	for i in range(zones.size() - 1, -1, -1):
		var zone: Dictionary = zones[i]
		zone["remaining"] = float(zone["remaining"]) - delta
		if float(zone["remaining"]) <= 0:
			var point: Vector3 = zone["position"]
			var distance: Vector3 = enemy.position - point
			distance.y = 0
			if distance.length() < 3.0 and absf(enemy.position.y - point.y) < 2.0:
				_hit_enemy(float(zone["damage"]), distance.normalized() * 3)
			_burst(point + Vector3.UP * 0.4, Color("dcb079"), 3.0)
			if is_instance_valid(zone["node"]):
				zone["node"].queue_free()
			zones.remove_at(i)

func _hit_enemy(damage: float, push: Vector3) -> void:
	if enemy.take_damage(damage, push):
		rules.enter_combat()
		casts_landed += 1
		_burst(enemy.position + Vector3.UP, Color("ffe2a3"), 0.5)

func _orb(point: Vector3, radius: float, color: Color) -> MeshInstance3D:
	var result := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2
	mesh.radial_segments = 10
	mesh.rings = 5
	result.mesh = mesh
	result.position = point
	result.material_override = TrainingFighter.material(color, true)
	result.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	effects.add_child(result)
	return result

func _burst(point: Vector3, color: Color, radius: float) -> void:
	var orb: MeshInstance3D = _orb(point, 0.2, color)
	var tween: Tween = create_tween().bind_node(orb)
	tween.tween_property(orb, "scale", Vector3.ONE * radius * 4.0, 0.10)
	tween.tween_property(orb, "scale", Vector3.ONE * 0.05, 0.20)
	tween.tween_callback(orb.queue_free)

func _disc(point: Vector3, radius: float, color: Color) -> MeshInstance3D:
	var result := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = 0.04
	mesh.radial_segments = 32
	result.mesh = mesh
	result.position = point
	var material: StandardMaterial3D = TrainingFighter.material(color, true)
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	result.material_override = material
	result.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	effects.add_child(result)
	return result

func _beam(from: Vector3, to: Vector3, color: Color) -> void:
	var result := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.09
	mesh.bottom_radius = 0.16
	mesh.height = maxf(from.distance_to(to), 0.01)
	mesh.radial_segments = 8
	result.mesh = mesh
	result.position = (from + to) / 2
	result.quaternion = Quaternion(Vector3.UP, (to - from).normalized())
	result.material_override = TrainingFighter.material(color, true)
	effects.add_child(result)
	var tween: Tween = create_tween().bind_node(result)
	tween.tween_interval(0.10)
	tween.tween_callback(result.queue_free)

func _finish(victory: bool) -> void:
	round_over = true
	get_tree().paused = true
	var title: String = "Premier entraînement réussi." if victory else "Hors de combat, pas hors jeu."
	var text: String = "%d techniques lancées · %d impacts · %d secondes\nAucune récompense en ligne : cette arène sert à tester." % [rules.casts, casts_landed, int(elapsed)]
	hud.show_menu(title, text, "REJOUER L’ENTRAÎNEMENT", false)
