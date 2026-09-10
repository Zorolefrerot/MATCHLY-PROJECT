extends SceneTree
## Optional desktop render evidence; never claims a physical Android device test.

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var scene: PackedScene = load("res://scenes/training.tscn")
	var game: Node3D = scene.instantiate()
	root.add_child(game)
	await process_frame
	game.start_round()
	game.enemy_enabled = false
	for i in range(90):
		await process_frame
	await RenderingServer.frame_post_draw
	var folder: String = OS.get_environment("IDREM_CAPTURE_DIR")
	if folder.is_empty():
		folder = "user://"
	if root.get_texture().get_image().save_png(folder.path_join("training-desktop.png")) != OK:
		push_error("Unable to write gameplay render evidence")
		quit(1)
		return
	Input.action_press("move_right")
	Input.action_press("sprint")
	for i in range(22):
		await physics_frame
	await RenderingServer.frame_post_draw
	if root.get_texture().get_image().save_png(folder.path_join("training-ninja-run.png")) != OK:
		quit(1)
		return
	Input.action_release("move_right")
	Input.action_release("sprint")
	for skill in range(4):
		game.start_round()
		game.enemy_enabled = false
		game.target_locked = true
		for i in range(20):
			await physics_frame
		game.cast_skill(skill)
		var frames: int = [18, 2, 8, 47][skill]
		for i in range(frames):
			await physics_frame
		await RenderingServer.frame_post_draw
		var rendered: Image = root.get_texture().get_image()
		if rendered.save_png(folder.path_join("training-technique-%d.png" % skill)) != OK:
			quit(1)
			return
	game.pause_round()
	await process_frame
	await RenderingServer.frame_post_draw
	if root.get_texture().get_image().save_png(folder.path_join("training-menu.png")) != OK:
		push_error("Unable to write menu render evidence")
		quit(1)
		return
	game.open_creator()
	for model in range(2):
		game.creator.set_choice("model", model)
		game.creator.set_choice("hair", 1 if model == 0 else 3)
		game.creator.set_choice("hair_color", 0 if model == 0 else 3)
		game.creator.set_choice("skin", 2 if model == 0 else 4)
		game.creator.set_choice("eyes", 2)
		game.creator.apply_outfit(0 if model == 0 else 2)
		game.creator.set_choice("top_color", 0 if model == 0 else 6)
		for frame in range(8):
			await process_frame
		await RenderingServer.frame_post_draw
		var rendered: Image = root.get_texture().get_image()
		if rendered.save_png(folder.path_join("character-creator-%d.png" % model)) != OK:
			quit(1)
			return
	game.creator.cancel()
	game.open_account()
	for frame in range(4):
		await process_frame
	await RenderingServer.frame_post_draw
	var account_image: Image = root.get_texture().get_image()
	if account_image.save_png(folder.path_join("account-login.png")) != OK:
		quit(1)
		return
	# Render fixture only: no real account, token or network call in visual QA.
	game.account_api.profile = {"protocol": 1, "schemaVersion": 1, "character": {"id": 1, "name": "Genin de test", "clan": "Hyūga", "affinity": "Raiton", "mokuton": false, "rank": "Genin", "village": "Konoha"}, "appearance": {"model": 1, "hair": 3, "hair_color": 3, "eyes": 2, "skin": 4, "top": 0, "top_color": 6, "bottom": 0, "bottom_color": 1}, "revision": 1}
	game.account_api.profile["welcomeMission"] = {"schemaVersion":1,"missionId":"konoha_welcome","status":"available","visited":[],"revision":0}
	game._open_village()
	for frame in range(25):
		await physics_frame
	await RenderingServer.frame_post_draw
	if not save_village_image(folder, "konoha-arrival", 0):
		quit(1)
		return
	game.village.player.reset_at(Vector3(-2,0.2,7))
	game.village.yaw = 0.9
	for frame in range(15):
		await physics_frame
	await RenderingServer.frame_post_draw
	if not save_village_image(folder, "konoha-market", 2):
		quit(1)
		return
	game.village.player.reset_at(Vector3(6,0.2,21))
	game.village.yaw = -0.92
	game.village.pitch = 0.04
	for frame in range(15):
		await physics_frame
	await RenderingServer.frame_post_draw
	if not save_village_image(folder, "konoha-house", 3):
		quit(1)
		return
	game.village.player.reset_at(Vector3(0,0.2,-4))
	game.village.yaw = 0
	game.village.pitch = 0.08
	for frame in range(15):
		await physics_frame
	await RenderingServer.frame_post_draw
	if not save_village_image(folder, "konoha-palace", 4):
		quit(1)
		return
	game.village.yaw = 0.9
	game.village.pitch = -0.06
	game.village.player.reset_at(KonohaMap.GUIDE+Vector3(0,0.2,2.3))
	for frame in range(6):
		await physics_frame
	game.village.interact()
	await process_frame
	await RenderingServer.frame_post_draw
	if not save_village_image(folder, "konoha-guide", 1):
		quit(1)
		return
	# Render fixtures only, no mission write or real token in screenshots.
	game.account_api.profile["welcomeMission"] = {"schemaVersion":1,"missionId":"konoha_welcome","status":"active","visited":["academy"],"revision":2}
	game.village._sync_mission()
	game.village.open_journal()
	await process_frame
	await RenderingServer.frame_post_draw
	if not save_village_image(folder, "konoha-mission-journal", 6):
		quit(1)
		return
	game.account_api.profile["welcomeMission"] = {"schemaVersion":1,"missionId":"konoha_welcome","status":"completed","visited":["academy","market","hokage"],"revision":5}
	game.village._sync_mission()
	game.village.open_journal()
	await process_frame
	await RenderingServer.frame_post_draw
	if not save_village_image(folder, "konoha-mission-completed", 7):
		quit(1)
		return
	game.village.sync_error = "Connexion interrompue. Une sauvegarde peut avoir abouti : actualise avant de réessayer."
	game.village.open_journal()
	await process_frame
	await RenderingServer.frame_post_draw
	if not save_village_image(folder, "konoha-mission-network-error", 8):
		quit(1)
		return
	game.village.finish()
	await process_frame
	print("IDREM_CAPTURE_SUCCESS")
	quit(0)

func save_village_image(folder: String, filename: String, index: int) -> bool:
	var image: Image = root.get_texture().get_image()
	if image.save_png(folder.path_join(filename+".png")) != OK:
		return false
	if OS.get_environment("GITHUB_ACTIONS") == "true" and index in [6,8]:
		# Two selected views × four parts maximum, below GitHub’s ten-notice step cap.
		image.resize(480, 270, Image.INTERPOLATE_LANCZOS)
		var encoded: String = Marshalls.raw_to_base64(image.save_jpg_to_buffer(0.45))
		if encoded.length() > 14000:
			encoded = Marshalls.raw_to_base64(image.save_jpg_to_buffer(0.25))
		if encoded.length() <= 14000:
			var parts: int = ceili(float(encoded.length()) / 3500.0)
			for part in range(parts):
				print("::notice title=Konoha QA %d JPEG part %d of %d::%s" % [index, part, parts, encoded.substr(part*3500, 3500)])
	return true
