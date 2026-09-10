class_name KonohaHUD
extends TrainingHUD
## Reuse the tested multi-touch controller, but no combat buttons or combat menu.
var identity: Label

func _build() -> void:
	top_panel = Panel.new()
	top_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_panel.add_theme_stylebox_override("panel", panel_style(Color(0.06,0.13,0.15,0.90)))
	add_child(top_panel)
	identity = label("KONOHA · QUARTIER D’ACCUEIL", 20)
	objective = label("Bienvenue. Approche-toi du guide Aoi.", 17)
	objective.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	objective.add_theme_color_override("font_shadow_color", Color("172a2b"))
	objective.add_theme_constant_override("shadow_offset_x", 1)
	objective.add_theme_constant_override("shadow_offset_y", 2)
	feedback = label("", 18)
	feedback.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	footer = label("PROTO 0.8 · Visite solo · Pas de progression sauvegardée", 13)
	footer.add_theme_color_override("font_color", Color("253b36"))
	identity.clip_text = true
	identity.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	fps = label("", 12)
	_button("PAUSE", "pause")
	_button("COURIR", "sprint")
	_button("SAUT", "jump")
	_button("PARLER / LIRE", "interact")
	overlay = ColorRect.new()
	overlay.color = Color(0.03,0.07,0.08,0.88)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	menu_panel = PanelContainer.new()
	menu_panel.add_theme_stylebox_override("panel", panel_style(Color("182c30")))
	overlay.add_child(menu_panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 16)
	menu_panel.add_child(column)
	menu_title = Label.new()
	menu_title.add_theme_font_size_override("font_size", 27)
	column.add_child(menu_title)
	menu_text = Label.new()
	menu_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	menu_text.custom_minimum_size = Vector2(620, 135)
	menu_text.add_theme_font_size_override("font_size", 19)
	column.add_child(menu_text)
	primary = Button.new()
	primary.text = "CONTINUER"
	primary.custom_minimum_size.y = 48
	primary.pressed.connect(func() -> void: resume_requested.emit())
	column.add_child(primary)
	restart_button = Button.new()
	restart_button.text = "RETOUR À MON COMPTE"
	restart_button.custom_minimum_size.y = 48
	restart_button.pressed.connect(func() -> void: action_requested.emit("leave"))
	column.add_child(restart_button)
	hide_menu()

func _layout() -> void:
	var w: float = size.x
	var h: float = size.y
	top_panel.position = Vector2(20,20)
	top_panel.size = Vector2(480,78)
	identity.position = Vector2(34,28)
	identity.size = Vector2(458,60)
	buttons["pause"].position = Vector2(w-160,24)
	buttons["pause"].size = Vector2(136,48)
	joystick_center = Vector2(142,h-150)
	buttons["sprint"].position = Vector2(72,h-59)
	buttons["sprint"].size = Vector2(142,42)
	buttons["jump"].position = Vector2(w-160,h-225)
	buttons["jump"].size = Vector2(130, 70.0)
	buttons["interact"].position = Vector2(w-236,h-137)
	buttons["interact"].size = Vector2(206, 70.0)
	objective.position = Vector2(w/2-325,112)
	objective.size = Vector2(650,44)
	feedback.position = Vector2(w/2-320,h-235)
	feedback.size = Vector2(640,48)
	footer.position = Vector2(260,h-30)
	fps.position = Vector2(w-145,82)
	menu_panel.size = Vector2(660,390)
	menu_panel.position = Vector2((w-660)/2, maxf(20,(h-menu_panel.size.y)/2))
	queue_redraw()

