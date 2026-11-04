extends Node
## Native GLES smoke test. Screenshots are diagnostic artifacts, not mockups.
var game: Node3D

func _ready() -> void:
	SaveStore.game_path = "user://visual_test_adventure.json"
	SaveStore.settings_path = "user://visual_test_settings.json"
	call_deferred("_capture")

func _capture() -> void:
	game = preload("res://scenes/main.tscn").instantiate()
	get_tree().root.add_child(game)
	for i in 15:
		await get_tree().process_frame
	await _save_frame("menu")
	game._start_new()
	for i in 15:
		await get_tree().process_frame
	await _save_frame("gameplay")
	game._main_menu()
	game.queue_free()
	for i in 3:
		await get_tree().process_frame
	Audio.stop_all()
	await get_tree().create_timer(0.15, true).timeout
	DigitalArt.materials.clear()
	DigitalArt.meshes.clear()
	print("GRAPHICAL SMOKE PASS: native Compatibility rendering produced menu and gameplay images")
	get_tree().quit()

func _save_frame(name_text: String) -> void:
	await RenderingServer.frame_post_draw
	var image := get_viewport().get_texture().get_image()
	var colors: Dictionary = {}
	for y in range(0, image.get_height(), 20):
		for x in range(0, image.get_width(), 20):
			colors[image.get_pixel(x, y).to_rgba32()] = true
	if colors.size() < 30:
		push_error("Graphical smoke: unexpectedly blank frame")
		get_tree().quit(1)
		return
	var destination := OS.get_environment("DW_SCREENSHOTS")
	if destination.is_empty():
		destination = "user://screenshots"
	DirAccess.make_dir_recursive_absolute(destination)
	if image.save_png(destination.path_join(name_text + ".png")) != OK:
		get_tree().quit(1)
