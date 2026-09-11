extends SceneTree
## Real GL readback: behavior assertions alone cannot prove textured visibility.

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var game: Node3D = load("res://scenes/training.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.start_round()
	game.enemy_enabled = false
	game.player.reset_at(Vector3(0,0.2,6))
	game.enemy.reset_at(Vector3(0,0.2,-5))
	game.ultimate.set_demo(12,25)
	game.target_locked = true
	for frame in range(8): await physics_frame
	if not game.cast_ultimate():
		push_error("Render fixture could not cast ultimate")
		quit(1)
		return
	for frame in range(130): await physics_frame
	paused = true
	await process_frame
	await RenderingServer.frame_post_draw
	var shown: Image = root.get_texture().get_image()
	if not is_instance_valid(game.ultimate_visual):
		push_error("Ultimate visual expired before the gameplay aftermath")
		quit(1)
		return
	var visual: TrainingSpectacle = game.ultimate_visual
	var sprite: Sprite3D = visual.layers[1]
	print("::notice title=Ultimate render state::age=%s remaining=%s position=%s sprite_position=%s scale=%s color=%s texture=%sx%s visible=%s" % [visual.age,game.ultimate.remaining,visual.global_position,sprite.global_position,sprite.scale,sprite.modulate,sprite.texture.get_width(),sprite.texture.get_height(),sprite.is_visible_in_tree()])
	visual.hide()
	for frame in range(3): await process_frame
	await RenderingServer.frame_post_draw
	var hidden: Image = root.get_texture().get_image()
	var changed: int = 0
	for y in range(0,shown.get_height(),2):
		for x in range(0,shown.get_width(),2):
			var a: Color = shown.get_pixel(x,y)
			var b: Color = hidden.get_pixel(x,y)
			if maxf(absf(a.r-b.r),maxf(absf(a.g-b.g),absf(a.b-b.b))) > 0.08:
				changed += 1
	print("::notice title=Ultimate render pixels::%d sampled pixels change when only the ultimate is hidden" % changed)
	shown.resize(480,270,Image.INTERPOLATE_LANCZOS)
	var encoded: String = Marshalls.raw_to_base64(shown.save_jpg_to_buffer(0.45))
	var parts: int = ceili(float(encoded.length())/3500.0)
	if parts <= 4:
		for part in range(parts):
			print("::notice title=Ultimate GL JPEG part %d of %d::%s" % [part,parts,encoded.substr(part*3500,3500)])
	var passed: bool = changed >= 600
	game.audio.stop_round()
	game.queue_free()
	await process_frame
	await create_timer(0.15,true).timeout
	if not passed:
		push_error("Ultimate has insufficient visible image coverage; APK export blocked")
	else:
		print("IDREM_SPECTACLE_RENDER_SUCCESS")
	quit(0 if passed else 1)
