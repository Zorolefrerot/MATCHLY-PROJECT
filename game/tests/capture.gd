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
	root.get_texture().get_image().save_png(folder.path_join("training-desktop.png"))
	game.pause_round()
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(folder.path_join("training-menu.png"))
	quit(0)
