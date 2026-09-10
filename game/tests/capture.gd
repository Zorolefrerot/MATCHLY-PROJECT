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
		# Small preview through the Checks API when artifact download hosts are
		# unreachable. These are actual desktop renders, never generated mockups.
		if skill < 2 and OS.get_environment("GITHUB_ACTIONS") == "true":
			var crop: Image = rendered.get_region(Rect2i(280, 150, 720, 440))
			crop.resize(640, 391, Image.INTERPOLATE_LANCZOS)
			var encoded: String = Marshalls.raw_to_base64(crop.save_jpg_to_buffer(0.72))
			if encoded.length() < 60000:
				print("::notice title=Visual QA %d JPEG::%s" % [skill, encoded])
	game.pause_round()
	await process_frame
	await RenderingServer.frame_post_draw
	if root.get_texture().get_image().save_png(folder.path_join("training-menu.png")) != OK:
		push_error("Unable to write menu render evidence")
		quit(1)
		return
	print("IDREM_CAPTURE_SUCCESS")
	quit(0)
