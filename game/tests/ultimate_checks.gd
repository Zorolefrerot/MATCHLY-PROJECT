extends RefCounted

static func run(game: Node3D, tree: SceneTree, check: Callable) -> void:
	var expected: Array[String] = ["Uchiwa","Uzumaki","Senju","Hyūga","Akimichi","Yamanaka","Aburame","Inuzuka","Fushiguro","Itadori","Kurosaki","Shunsui","Yeager","Ackerman"]
	var state := TrainingUltimateRules.new()
	var names: Dictionary = {}
	var motifs: Dictionary = {}
	for i in range(expected.size()):
		check.call(state.set_demo(i,1) and state.definition()["clan"] == expected[i],"ultimate catalogue matches clan: "+expected[i])
		names[state.definition()["name"]] = true
		motifs[state.definition()["motif"]] = true
		var low: float = state.damage()
		state.set_demo(i,50)
		check.call(state.damage() > low and state.radius() <= 5 and state.magnitude() <= 1.31,"level scales bounded simulation power: "+expected[i])
	check.call(names.size() == 14 and motifs.size() == 14,"fourteen distinct names and image motifs, no extra clan")
	check.call(not state.set_demo(-1,1) and not state.set_demo(14,1) and not state.set_demo(0,0) and not state.set_demo(0,51),"invalid clan and simulated level do not change the loadout")
	state.set_demo(0,1)
	check.call(not state.begin(69) and not state.begin(NAN) and not state.begin(INF),"ultimate refuses insufficient or non-finite chakra")
	check.call(state.begin(100) and not state.begin(100),"ultimate begins once with its own recharge")
	check.call(not state.set_demo(1,50),"changing the simulation cannot bypass a running recharge")
	check.call(not state.tick(0.7) and state.tick(0.8) and not state.tick(0.1),"windup produces exactly one impact transition")
	state.cancel()
	check.call(state.cooldown > 0 and not state.impact_pending,"cancel does not refund the ultimate recharge")
	state.reset()
	state.begin(100)
	check.call(state.tick(100) and not state.tick(100),"a long frame neither drops nor duplicates the one impact")
	var before_profile: Dictionary = game.account_api.profile.duplicate(true)
	var before_appearance: Dictionary = game.player.appearance.duplicate(true)
	game.start_round()
	game.enemy_enabled = false
	game.player.reset_at(Vector3(0,0.2,5))
	game.enemy.reset_at(Vector3(0,0.2,-3))
	for i in range(8): await tree.physics_frame
	game.target_locked = true
	check.call(game.ultimate.set_demo(0,1),"training starts with an explicitly simulated ultimate")
	var health: float = game.enemy.health
	game.hud.buttons["ultimate"].pressed.emit()
	check.call(game.ultimate.remaining > 0 and game.rules.chakra == 30,"dedicated ultimate button charges chakra once")
	check.call(game.ultimate_visual.layers.size() == 7 and game.ultimate_visual.layers[1].texture == TrainingSpectacle.ATLAS,"economy ultimate uses seven textured depth-tested layers")
	var all_depth: bool = true
	for sprite: Sprite3D in game.ultimate_visual.layers: all_depth = all_depth and not sprite.no_depth_test
	check.call(all_depth,"ultimate cannot paint through walls as a screen overlay")
	check.call(not game.cast_ultimate() and game.rules.cooldowns == [0.0,0.0,0.0,0.0],"double press does not pay twice or apply a global jutsu cooldown")
	game.open_ultimate_lab()
	var remaining: float = game.ultimate.remaining
	await tree.create_timer(0.1,true).timeout
	check.call(game.ultimate.remaining == remaining and game.ultimate_lab.apply.disabled,"lab pauses combat and locks changes during recharge")
	check.call(Rect2(Vector2.ZERO,game.ultimate_lab.size).encloses(game.ultimate_lab.panel.get_global_rect()),"ultimate lab fits the landscape viewport")
	game.close_ultimate_lab()
	for i in range(50): await tree.physics_frame
	check.call(game.enemy.health == health,"spectacular windup does not hit before its impact")
	for i in range(50): await tree.physics_frame
	check.call(game.enemy.health == health-55,"level one ultimate hits the training opponent exactly once")
	for i in range(265): await tree.physics_frame
	check.call(game.enemy.health == health-55 and not is_instance_valid(game.ultimate_visual),"long visual aftermath neither repeats damage nor leaks its nodes")
	game.start_round()
	game.enemy_enabled = false
	game.player.reset_at(Vector3(0,0.2,5))
	game.enemy.reset_at(Vector3(0,0.2,-3))
	for i in range(8): await tree.physics_frame
	game.target_locked = true
	game.ultimate.set_demo(12,50)
	check.call(game.cast_ultimate(),"monumental giant variant can be tested at simulated level fifty")
	for i in range(105): await tree.physics_frame
	check.call(game.enemy.health == 0 and not game.round_over and not tree.paused,"a finishing hit allows the monumental aftermath to play instead of freezing immediately")
	for i in range(265): await tree.physics_frame
	check.call(game.round_over and tree.paused and game.ultimate.remaining == 0,"finish returns to the ordinary replay menu, not permanent death")
	game.start_round()
	game.enemy_enabled = false
	game.player.reset_at(Vector3(0,0.2,5))
	game.enemy.reset_at(Vector3(0,0.2,-3))
	for i in range(8): await tree.physics_frame
	game.target_locked = true
	game.cast_ultimate()
	game.enemy.position.x = 15
	game._tick_ultimate(1.5)
	check.call(game.enemy.health == game.enemy.maximum_health,"escaping the marked area avoids damage despite the large image")
	game.start_round()
	check.call(not is_instance_valid(game.ultimate_visual) and game.ultimate.cooldown == 0,"round restart cancels pending impacts and clears the reserved visual")
	check.call(game.account_api.profile == before_profile and game.player.appearance == before_appearance,"ultimate laboratory changes no account, cloud level, clan or appearance")
	game.pause_round()
