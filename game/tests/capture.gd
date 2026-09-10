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
		# Actual render preview through Checks, no dependency on download hosts.
		if OS.get_environment("GITHUB_ACTIONS") == "true":
			rendered.resize(480, 270, Image.INTERPOLATE_LANCZOS)
			var encoded: String = Marshalls.raw_to_base64(rendered.save_jpg_to_buffer(0.45))
			if encoded.length() > 14000:
				encoded = Marshalls.raw_to_base64(rendered.save_jpg_to_buffer(0.25))
			if encoded.length() <= 14000:
				var parts: int = ceili(float(encoded.length()) / 3500.0)
				for part in range(parts):
					print("::notice title=Creator QA %d JPEG part %d of %d::%s" % [model, part, parts, encoded.substr(part*3500, 3500)])
	game.creator.cancel()
	print("IDREM_CAPTURE_SUCCESS")
	quit(0)
