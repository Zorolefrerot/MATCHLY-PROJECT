class_name TrainingHUD
extends Control
## Touch IDs are tracked independently, so moving and casting can overlap.

signal action_requested(action: String)
signal resume_requested
signal account_requested
signal creator_requested
signal restart_requested
signal quality_changed(standard: bool)
signal opponent_changed(active: bool)
signal volume_changed(value: float)
signal ambience_changed(enabled: bool)

var move_vector := Vector2.ZERO
var look_delta := Vector2.ZERO
var sprinting: bool = false
var blocked: bool = true
var joystick_finger: int = -1
var look_finger: int = -1
var joystick_center := Vector2.ZERO
var joystick_radius: float = 66.0
var buttons: Dictionary = {}
var skill_buttons: Array[Button] = []
var top_panel: Panel
var health_bar: ProgressBar
var chakra_bar: ProgressBar
var health_text: Label
var chakra_text: Label
var objective: Label
var target_text: Label
var target_bar: ProgressBar
var feedback: Label
var footer: Label
var crosshair: Label
var fps: Label
var overlay: ColorRect
var menu_panel: PanelContainer
var menu_title: Label
var menu_text: Label
var help_text: Label
var primary: Button
var account_button: Button
var creator_button: Button
var restart_button: Button
var volume_slider: HSlider
var ambience_toggle: CheckButton
var notice_seconds: float = 0.0

const RED := Color("ed6567")
const INK := Color("132327")
const CREAM := Color("eee6d1")

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build()
	resized.connect(_layout)
	_layout()

static func panel_style(color: Color, border: Color = Color("60706a"), radius: int = 10) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	style.set_content_margin_all(12)
	return style

func label(text: String, font_size: int = 18) -> Label:
	var result := Label.new()
	result.text = text
	result.add_theme_font_size_override("font_size", font_size)
	result.add_theme_color_override("font_color", CREAM)
	result.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(result)
	return result

func _button(caption: String, action: String) -> Button:
	var button := Button.new()
	button.text = caption
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_font_size_override("font_size", 17)
	button.add_theme_color_override("font_color", CREAM)
	button.add_theme_stylebox_override("normal", panel_style(Color(0.07, 0.13, 0.15, 0.9)))
	button.add_theme_stylebox_override("hover", panel_style(Color("354c4b"), CREAM))
	button.add_theme_stylebox_override("pressed", panel_style(Color("754445"), RED))
	button.add_theme_stylebox_override("disabled", panel_style(Color(0.1, 0.13, 0.15, 0.7), Color("374b4a")))
	button.pressed.connect(func() -> void: _activate(action))
	add_child(button)
	buttons[action] = button
	return button

func _activate(action: String) -> void:
	if action == "sprint":
		sprinting = not sprinting
		buttons["sprint"].text = "COURSE : OUI" if sprinting else "COURIR"
	else:
		action_requested.emit(action)

func _bar(color: Color) -> ProgressBar:
	var result := ProgressBar.new()
	result.show_percentage = false
	result.max_value = 100
	result.add_theme_stylebox_override("background", panel_style(Color("1c2e31"), Color("1c2e31"), 4))
	result.add_theme_stylebox_override("fill", panel_style(color, color, 4))
	result.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(result)
	return result

func _build() -> void:
	top_panel = Panel.new()
	top_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_panel.add_theme_stylebox_override("panel", panel_style(Color(0.05, 0.10, 0.12, 0.87)))
	add_child(top_panel)
	# No logo texture in the combat HUD: it must never cover the playfield.
	var title := Label.new()
	title.text = "IDREM ZENKAI"
	title.position = Vector2(16, 10)
	title.add_theme_font_size_override("font_size", 21)
	title.add_theme_color_override("font_color", CREAM)
	top_panel.add_child(title)
	var sub := Label.new()
	sub.text = "PROTO 0.11  /  SOLO HORS LIGNE"
	sub.position = Vector2(16, 37)
	sub.add_theme_font_size_override("font_size", 11)
	sub.add_theme_color_override("font_color", Color("b4c7bf"))
	top_panel.add_child(sub)
	health_bar = _bar(Color("de7270"))
	chakra_bar = _bar(Color("6fb6c8"))
	health_text = label("VIE 120 / 120", 13)
	chakra_text = label("CHAKRA 100 / 100", 13)
	objective = label("PREMIERS PAS\nVaincs l’adversaire d’entraînement.", 18)
	objective.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	target_text = label("ADVERSAIRE · 180 PV", 14)
	target_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	target_bar = _bar(Color("e29a77"))
	feedback = label("", 18)
	feedback.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	feedback.add_theme_color_override("font_color", CREAM)
	footer = label("4 jutsu de test · Aucun clan ni compte en ligne modifié", 12)
	footer.add_theme_color_override("font_color", Color("e4d3ae"))
	crosshair = label("+", 30)
	crosshair.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	fps = label("", 12)
	_button("PAUSE", "pause")
	_button("CIBLER", "lock")
	_button("FRAPPE\nF", "melee")
	_button("ESQUIVE\nCtrl", "dodge")
	_button("SAUT\nEspace", "jump")
	_button("COURIR", "sprint")
	_button("ULTIME\nR · 70 chakra", "ultimate")
	_button("RÉGLER ULTIME", "ultimate_setup")
	for i in range(4):
		var data: Dictionary = TrainingRules.SKILLS[i]
		var button: Button = _button("%s\n%d chakra" % [data["name"], int(data["cost"])], "skill_%d" % i)
		button.add_theme_color_override("font_color", data["color"])
		skill_buttons.append(button)
	_build_menu()

func _build_menu() -> void:
	overlay = ColorRect.new()
	overlay.color = Color(0.03, 0.07, 0.08, 0.85)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	menu_panel = PanelContainer.new()
	menu_panel.add_theme_stylebox_override("panel", panel_style(Color("182c30"), Color("a86b66"), 16))
	overlay.add_child(menu_panel)
	var margin := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 18)
	menu_panel.add_child(margin)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 8)
	margin.add_child(column)
	var badge := Label.new()
	badge.text = "IDREM ZENKAI  /  TERRAIN D’ENTRAÎNEMENT"
	badge.add_theme_font_size_override("font_size", 13)
	badge.add_theme_color_override("font_color", RED)
	column.add_child(badge)
	menu_title = Label.new()
	menu_title.text = "Ta voie ninja commence ici."
	menu_title.add_theme_font_size_override("font_size", 30)
	menu_title.add_theme_color_override("font_color", CREAM)
	column.add_child(menu_title)
	menu_text = Label.new()
	menu_text.text = "Un prototype 3D pour tester les commandes et les combats.\nPersonnages provisoires. Pas encore de multijoueur."
	menu_text.add_theme_font_size_override("font_size", 16)
	menu_text.add_theme_color_override("font_color", Color("bfd0c7"))
	column.add_child(menu_text)
	help_text = Label.new()
	help_text.text = "Joystick à gauche · Glisser à droite pour viser · CIBLER : verrouillage.\nPC : ZQSD/WASD · F : frappe · Ctrl : esquive · 1–4 : jutsu."
	help_text.add_theme_font_size_override("font_size", 14)
	help_text.add_theme_color_override("font_color", Color("c5bfa9"))
	column.add_child(help_text)
	var quality := OptionButton.new()
	quality.add_item("Graphismes : Économie (conseillé)")
	quality.add_item("Graphismes : Standard (ombres)")
	quality.custom_minimum_size.y = 42
	quality.add_theme_font_size_override("font_size", 16)
	quality.item_selected.connect(func(index: int) -> void: quality_changed.emit(index == 1))
	column.add_child(quality)
	var opponent := CheckButton.new()
	opponent.text = "Adversaire actif (décocher pour viser sans danger)"
	opponent.button_pressed = true
	opponent.add_theme_font_size_override("font_size", 15)
	opponent.toggled.connect(func(active: bool) -> void: opponent_changed.emit(active))
	column.add_child(opponent)
	var sound_row := HBoxContainer.new()
	var volume_label := Label.new()
	volume_label.text = "Volume général"
	volume_label.add_theme_font_size_override("font_size", 15)
	sound_row.add_child(volume_label)
	volume_slider = HSlider.new()
	volume_slider.min_value = 0
	volume_slider.max_value = 100
	volume_slider.step = 5
	volume_slider.value = 60
	volume_slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	volume_slider.custom_minimum_size = Vector2(230, 36)
	volume_slider.value_changed.connect(func(value: float) -> void: volume_changed.emit(value / 100.0))
	sound_row.add_child(volume_slider)
	column.add_child(sound_row)
	ambience_toggle = CheckButton.new()
	ambience_toggle.text = "Ambiance de combat"
	ambience_toggle.button_pressed = true
	ambience_toggle.custom_minimum_size.y = 36
	ambience_toggle.toggled.connect(func(enabled: bool) -> void: ambience_changed.emit(enabled))
	column.add_child(ambience_toggle)
	primary = Button.new()
	primary.text = "LANCER L’ENTRAÎNEMENT"
	primary.custom_minimum_size.y = 52
	primary.add_theme_stylebox_override("normal", panel_style(Color("b75155"), RED))
	primary.add_theme_font_size_override("font_size", 18)
	primary.pressed.connect(func() -> void: resume_requested.emit())
	column.add_child(primary)
	var character_row := HBoxContainer.new()
	column.add_child(character_row)
	creator_button = Button.new()
	creator_button.text = "APPARENCE HORS LIGNE"
	creator_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	creator_button.custom_minimum_size.y = 44
	creator_button.pressed.connect(func() -> void: creator_requested.emit())
	character_row.add_child(creator_button)
	account_button = Button.new()
	account_button.text = "MON COMPTE"
	account_button.custom_minimum_size.y = 44
	account_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	account_button.pressed.connect(func() -> void: account_requested.emit())
	character_row.add_child(account_button)
	restart_button = Button.new()
	restart_button.text = "Recommencer la manche"
	restart_button.custom_minimum_size.y = 42
	restart_button.pressed.connect(func() -> void: restart_requested.emit())
	column.add_child(restart_button)
	restart_button.visible = false
	var disclaimer := Label.new()
	disclaimer.text = "Entraînement local. « Mon compte » contacte le site.\nCe prototype n’est pas une version complète du jeu RP.\nGodot 4.5.1 (MIT) : godotengine.org/license"
	disclaimer.add_theme_font_size_override("font_size", 12)
	disclaimer.add_theme_color_override("font_color", Color("9aaea5"))
	column.add_child(disclaimer)

func _layout() -> void:
	var width: float = size.x
	var height: float = size.y
	var pad: float = 30.0
	top_panel.position = Vector2(pad, 24)
	top_panel.size = Vector2(292, 134)
	health_text.position = Vector2(pad + 16, 86)
	health_bar.position = Vector2(pad + 16, 108)
	health_bar.size = Vector2(258, 10)
	chakra_text.position = Vector2(pad + 16, 122)
	chakra_bar.position = Vector2(pad + 16, 145)
	chakra_bar.size = Vector2(258, 6)
	objective.position = Vector2(width / 2.0 - 215, 26)
	objective.size = Vector2(430, 60)
	target_text.position = Vector2(width / 2.0 - 130, 98)
	target_text.size = Vector2(260, 24)
	target_bar.position = Vector2(width / 2.0 - 130, 127)
	target_bar.size = Vector2(260, 8)
	buttons["ultimate"].position = Vector2(width-214,height-306)
	buttons["ultimate"].size = Vector2(182,76)
	buttons["ultimate_setup"].position = Vector2(width-204,176)
	buttons["ultimate_setup"].size = Vector2(172,44)
	buttons["pause"].position = Vector2(width - 152, 28)
	buttons["pause"].size = Vector2(120, 45)
	buttons["lock"].position = Vector2(width - 152, 83)
	buttons["lock"].size = Vector2(120, 45)
	joystick_center = Vector2(142, height - 157)
	buttons["sprint"].position = Vector2(74, height - 58)
	buttons["sprint"].size = Vector2(136, 36)
	for i in range(4):
		skill_buttons[i].position = Vector2(width - 442 + i * 102, height - 105)
		skill_buttons[i].size = Vector2(96, 80)
	for i in range(3):
		var action: String = ["jump", "dodge", "melee"][i]
		buttons[action].position = Vector2(width - 333 + i * 100, height - 205)
		buttons[action].size = Vector2(92, 88)
	feedback.position = Vector2(width / 2.0 - 285, height - 256)
	feedback.size = Vector2(570, 34)
	footer.position = Vector2(254, height - 26)
	crosshair.position = Vector2(width / 2.0 - 16, height / 2.0 - 23)
	crosshair.size = Vector2(32, 40)
	fps.position = Vector2(width - 150, 141)
	menu_panel.size = Vector2(610, 0)
	menu_panel.position = Vector2((width - 610) / 2.0, maxf(16, (height - menu_panel.get_combined_minimum_size().y) / 2.0))
	queue_redraw()

func _draw() -> void:
	if blocked:
		return
	draw_circle(joystick_center, joystick_radius + 9, Color(0.05, 0.1, 0.12, 0.38))
	draw_arc(joystick_center, joystick_radius + 9, 0, TAU, 48, Color(0.95, 0.89, 0.75, 0.48), 2, true)
	draw_circle(joystick_center + move_vector * joystick_radius, 27, Color(0.86, 0.88, 0.77, 0.66))
	draw_circle(joystick_center + move_vector * joystick_radius, 9, Color("25454b"))

func reset_input() -> void:
	move_vector = Vector2.ZERO
	look_delta = Vector2.ZERO
	joystick_finger = -1
	look_finger = -1
	sprinting = false
	if buttons.has("sprint"):
		buttons["sprint"].text = "COURIR"
	queue_redraw()

func _input(event: InputEvent) -> void:
	# Godot emits an emulated mouse event BEFORE the originating touch. During
	# combat we handle touch IDs ourselves; allowing that mouse event through
	# would punch on joystick presses and activate buttons twice. Menus still
	# need mouse emulation for native Button / OptionButton controls.
	if not blocked and event.device == InputEvent.DEVICE_ID_EMULATION and (event is InputEventMouseButton or event is InputEventMouseMotion):
		get_viewport().set_input_as_handled()
		return
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_ESCAPE:
		action_requested.emit("pause")
		get_viewport().set_input_as_handled()
		return
	if blocked:
		return
	if event is InputEventScreenTouch:
		if event.pressed and not event.canceled:
			for action in buttons:
				var button: Button = buttons[action]
				if button.visible and button.get_global_rect().has_point(event.position):
					if not button.disabled:
						_activate(action)
					get_viewport().set_input_as_handled()
					return
			if event.position.distance_to(joystick_center) < 130 and joystick_finger == -1:
				joystick_finger = event.index
				move_vector = ((event.position - joystick_center) / joystick_radius).limit_length()
			elif event.position.x > size.x * 0.36 and look_finger == -1:
				look_finger = event.index
		else:
			if event.index == joystick_finger:
				joystick_finger = -1
				move_vector = Vector2.ZERO
			if event.index == look_finger:
				look_finger = -1
		get_viewport().set_input_as_handled()
		queue_redraw()
	elif event is InputEventScreenDrag:
		if event.index == joystick_finger:
			move_vector = ((event.position - joystick_center) / joystick_radius).limit_length()
			queue_redraw()
		elif event.index == look_finger:
			look_delta += event.relative
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		look_delta += event.relative
		get_viewport().set_input_as_handled()

func consume_look() -> Vector2:
	var result: Vector2 = look_delta
	look_delta = Vector2.ZERO
	return result

func notice(text: String) -> void:
	feedback.text = text
	notice_seconds = 2.4

func refresh(player: TrainingFighter, enemy: TrainingFighter, rules: TrainingRules, locked: bool, seconds: float) -> void:
	health_bar.max_value = player.maximum_health
	health_bar.value = player.health
	chakra_bar.value = rules.chakra
	health_text.text = "VIE  %d / %d" % [int(player.health), int(player.maximum_health)]
	chakra_text.text = "CHAKRA  %d / 100" % int(rules.chakra)
	target_bar.max_value = enemy.maximum_health
	target_bar.value = enemy.health
	target_text.text = "ADVERSAIRE  ·  %d PV%s" % [int(enemy.health), "  ·  CIBLÉ" if locked else ""]
	buttons["lock"].text = "CIBLÉ ✓" if locked else "CIBLER"
	buttons["dodge"].text = "ESQUIVE\n%.1f s" % player.dodge_cooldown if player.dodge_cooldown > 0.0 else "ESQUIVE\nCtrl"
	for i in range(4):
		var data: Dictionary = TrainingRules.SKILLS[i]
		var detail: String = "%.1f s" % rules.cooldowns[i] if rules.cooldowns[i] > 0.01 else "%d chakra" % int(data["cost"])
		skill_buttons[i].text = "%s\n%s" % [data["name"], detail]
	# Keep buttons interactive to explain failed casts rather than ignoring input.
	fps.text = "%d FPS · %02d:%02d" % [Engine.get_frames_per_second(), floori(seconds / 60.0), int(seconds) % 60]

func _process(delta: float) -> void:
	if not blocked:
		notice_seconds = maxf(0, notice_seconds - delta)
		if notice_seconds == 0:
			feedback.text = ""

func show_menu(title: String, text: String, button_text: String, can_restart: bool) -> void:
	blocked = true
	reset_input()
	menu_title.text = title
	menu_text.text = text
	primary.text = button_text
	restart_button.visible = can_restart
	overlay.show()
	call_deferred("_layout")

func hide_menu() -> void:
	blocked = false
	overlay.hide()
	reset_input()
	queue_redraw()


func refresh_ultimate(ultimate: TrainingUltimateRules) -> void:
	var data: Dictionary = ultimate.definition()
	buttons["ultimate"].text = "ULTIME\n%.0f s" % ultimate.cooldown if ultimate.cooldown > 0.001 else "ULTIME\nR · 70 chakra"
	buttons["ultimate"].add_theme_color_override("font_color",data["color"])
	footer.text = "SIMULATION · %s · Niveau %d · Aucun pouvoir attribué au compte" % [data["clan"],ultimate.level]
	if ultimate.remaining > 0:
		objective.text = "%s\n%s" % [data["name"],"CONCENTRATION" if ultimate.impact_pending else "DÉCHAÎNEMENT" if ultimate.remaining > 2.4 else "DISSIPATION"]
	else:
		objective.text = "PREMIERS PAS\nVaincs l’adversaire d’entraînement."
