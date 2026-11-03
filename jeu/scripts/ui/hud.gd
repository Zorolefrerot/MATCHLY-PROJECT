class_name Hud
extends CanvasLayer
## Interface complète : objectif de mission, compteur de Mo, invite d'action,
## dialogues (effet machine à écrire), boutique, menu pause (langue FR/EN),
## notifications toast, joystick tactile et bouton d'action.

const PANEL_BG := Color(0.055, 0.07, 0.13, 0.92)
const PANEL_BORDER := Color(0.42, 0.96, 0.78, 0.55)
const TEXT_MAIN := Color("F2F6FF")
const TEXT_MUTED := Color(0.72, 0.78, 0.88)

var _mission_title: Label
var _mission_text: Label
var _mo_label: Label
var _prompt_label: Label
var _toast_label: Label

var _dialogue_panel: Panel
var _dialogue_name: Label
var _dialogue_text: Label
var _dialogue_hint: Label
var _full_text := ""
var _shown_characters := 0.0

var _pause_panel: Panel
var _pause_lang_button: Button

var _shop_panel: Panel
var _shop_mo_label: Label
var _shop_buy_button: Button
var _hint_label: Label

var _toast_tween: Tween

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	layer = 10

	add_child(_make_joystick())
	_build_hud_panels()
	_build_dialogue_panel()
	_build_pause_panel()
	_build_shop_panel()

	Game.mo_changed.connect(_on_mo_changed)
	Game.mission_changed.connect(_update_mission)
	Game.lang_changed.connect(_on_lang_changed)
	Game.prompt_changed.connect(_on_prompt_changed)
	Game.toast_requested.connect(_show_toast)
	Game.dialogue_opened.connect(_on_dialogue_opened)
	Game.dialogue_next.connect(_on_dialogue_next)
	Game.dialogue_closed.connect(_on_dialogue_closed)
	Game.shop_requested.connect(_open_shop)

	_on_mo_changed(Game.mo)
	_update_mission()
	_on_lang_changed()

# ------------------------------------------------------------- fabriques ----

func _panel(width: float, height: float) -> Panel:
	var panel := Panel.new()
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL_BG
	style.corner_radius_top_left = 14
	style.corner_radius_top_right = 14
	style.corner_radius_bottom_left = 14
	style.corner_radius_bottom_right = 14
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_color = PANEL_BORDER
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	style.content_margin_left = 14
	style.content_margin_right = 14
	panel.add_theme_stylebox_override("panel", style)
	panel.custom_minimum_size = Vector2(width, height)
	return panel

func _label(text: String, size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	var settings := LabelSettings.new()
	settings.font_size = size
	settings.font_color = color
	settings.outline_size = 8
	settings.outline_color = Color(0.02, 0.03, 0.06, 0.85)
	label.label_settings = settings
	return label

func _button(text: String, font_size: int = 26) -> Button:
	var button := Button.new()
	button.text = text
	button.focus_mode = Control.FOCUS_NONE
	var normal := StyleBoxFlat.new()
	normal.bg_color = Color(0.10, 0.14, 0.25, 0.95)
	normal.corner_radius_top_left = 10
	normal.corner_radius_top_right = 10
	normal.corner_radius_bottom_left = 10
	normal.corner_radius_bottom_right = 10
	normal.border_width_top = 2
	normal.border_width_bottom = 2
	normal.border_width_left = 2
	normal.border_width_right = 2
	normal.border_color = PANEL_BORDER
	normal.content_margin_top = 10
	normal.content_margin_bottom = 10
	normal.content_margin_left = 18
	normal.content_margin_right = 18
	var hover := normal.duplicate() as StyleBoxFlat
	hover.bg_color = Color(0.16, 0.22, 0.36, 0.98)
	var pressed := normal.duplicate() as StyleBoxFlat
	pressed.bg_color = Color(0.08, 0.11, 0.19, 1.0)
	button.add_theme_stylebox_override("normal", normal)
	button.add_theme_stylebox_override("hover", hover)
	button.add_theme_stylebox_override("pressed", pressed)
	button.add_theme_color_override("font_color", TEXT_MAIN)
	button.add_theme_color_override("font_hover_color", TEXT_MAIN)
	button.add_theme_color_override("font_pressed_color", Color(0.42, 0.96, 0.78))
	button.add_theme_color_override("font_focus_color", TEXT_MAIN)
	button.add_theme_font_size_override("font_size", font_size)
	return button

func _center_control(control: Control, width: float, height: float) -> void:
	control.anchor_left = 0.5
	control.anchor_right = 0.5
	control.anchor_top = 0.5
	control.anchor_bottom = 0.5
	control.offset_left = -width / 2.0
	control.offset_right = width / 2.0
	control.offset_top = -height / 2.0
	control.offset_bottom = height / 2.0

func _make_joystick() -> Control:
	return TouchJoy.new()

# -------------------------------------------------------------- panneaux ----

func _build_hud_panels() -> void:
	# Objectif (haut gauche)
	var mission_panel := _panel(470, 96)
	mission_panel.offset_left = 16
	mission_panel.offset_top = 12
	mission_panel.offset_right = 486
	mission_panel.offset_bottom = 108
	_mission_title = _label(Game.t("ui_objective"), 18, Color(0.42, 0.96, 0.78))
	_mission_title.position = Vector2(16, 10)
	_mission_title.size = Vector2(440, 24)
	_mission_text = _label("", 22, TEXT_MAIN)
	_mission_text.position = Vector2(16, 36)
	_mission_text.size = Vector2(440, 52)
	_mission_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	mission_panel.add_child(_mission_title)
	mission_panel.add_child(_mission_text)
	add_child(mission_panel)

	# Compteur de Mo (haut droite)
	var mo_panel := _panel(240, 62)
	mo_panel.anchor_left = 1.0
	mo_panel.anchor_right = 1.0
	mo_panel.offset_left = -318
	mo_panel.offset_top = 12
	mo_panel.offset_right = -66
	mo_panel.offset_bottom = 74
	var spark_icon := TextureRect.new()
	spark_icon.texture = Art.to_texture(Art.spark())
	spark_icon.stretch_mode = TextureRect.STRETCH_KEEP_CENTERED
	spark_icon.position = Vector2(10, 19)
	mo_panel.add_child(spark_icon)
	_mo_label = _label("", 30, TEXT_MAIN)
	_mo_label.position = Vector2(48, 14)
	_mo_label.size = Vector2(180, 36)
	mo_panel.add_child(_mo_label)
	add_child(mo_panel)

	# Bouton pause (coin haut droit)
	var pause_button := _button("II", 24)
	pause_button.anchor_left = 1.0
	pause_button.anchor_right = 1.0
	pause_button.offset_left = -54
	pause_button.offset_top = 14
	pause_button.offset_right = -14
	pause_button.offset_bottom = 60
	pause_button.pressed.connect(_toggle_pause)
	add_child(pause_button)

	# Invite d'action (au-dessus de la zone de dialogue)
	_prompt_label = _label("", 26, Color(0.42, 0.96, 0.78))
	_prompt_label.anchor_left = 0.5
	_prompt_label.anchor_right = 0.5
	_prompt_label.anchor_top = 1.0
	_prompt_label.anchor_bottom = 1.0
	_prompt_label.offset_left = -400
	_prompt_label.offset_right = 400
	_prompt_label.offset_top = -210
	_prompt_label.offset_bottom = -166
	_prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_prompt_label.visible = false
	add_child(_prompt_label)

	# Toast (centre haut)
	_toast_label = _label("", 32, Color("FFE24A"))
	_toast_label.anchor_left = 0.5
	_toast_label.anchor_right = 0.5
	_toast_label.offset_left = -440
	_toast_label.offset_right = 440
	_toast_label.offset_top = 120
	_toast_label.offset_bottom = 170
	_toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast_label.modulate.a = 0.0
	add_child(_toast_label)

	# Bouton d'action tactile (bas droite) — cliquable aussi à la souris
	var action_button := _button("A", 44)
	action_button.anchor_left = 1.0
	action_button.anchor_right = 1.0
	action_button.anchor_top = 1.0
	action_button.anchor_bottom = 1.0
	action_button.offset_left = -154
	action_button.offset_top = -164
	action_button.offset_right = -34
	action_button.offset_bottom = -44
	action_button.pressed.connect(Game.interact)
	add_child(action_button)

	# Aide clavier (bas gauche)
	var hint := _label(Game.t("hint_controls"), 17, TEXT_MUTED)
	hint.offset_left = 16
	hint.offset_top = 688
	hint.offset_right = 900
	hint.offset_bottom = 716
	hint.visible = not DisplayServer.is_touchscreen_available()
	add_child(hint)
	_hint_label = hint

func _build_dialogue_panel() -> void:
	_dialogue_panel = _panel(920, 176)
	_center_control(_dialogue_panel, 920, 176)
	_dialogue_panel.anchor_top = 1.0
	_dialogue_panel.anchor_bottom = 1.0
	_dialogue_panel.offset_top = -196
	_dialogue_panel.offset_bottom = -20
	_dialogue_panel.visible = false

	_dialogue_name = _label("", 26, Color(0.42, 0.96, 0.78))
	_dialogue_name.position = Vector2(26, 14)
	_dialogue_name.size = Vector2(860, 32)
	_dialogue_panel.add_child(_dialogue_name)

	_dialogue_text = _label("", 24, TEXT_MAIN)
	_dialogue_text.position = Vector2(26, 50)
	_dialogue_text.size = Vector2(860, 82)
	_dialogue_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_dialogue_panel.add_child(_dialogue_text)

	_dialogue_hint = _label(Game.t("ui_continue"), 17, TEXT_MUTED)
	_dialogue_hint.anchor_left = 1.0
	_dialogue_hint.anchor_right = 1.0
	_dialogue_hint.offset_left = -420
	_dialogue_hint.offset_right = -26
	_dialogue_hint.offset_top = 132
	_dialogue_hint.offset_bottom = 160
	_dialogue_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_dialogue_panel.add_child(_dialogue_hint)

	_dialogue_panel.gui_input.connect(_on_dialogue_gui_input)
	add_child(_dialogue_panel)

func _build_pause_panel() -> void:
	_pause_panel = _panel(460, 340)
	_center_control(_pause_panel, 460, 340)
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_FULL_RECT)
	box.offset_left = 24
	box.offset_right = -24
	box.offset_top = 20
	box.offset_bottom = -20
	box.add_theme_constant_override("separation", 16)
	var title := _label(Game.t("ui_pause"), 36, TEXT_MAIN)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)
	var resume := _button(Game.t("ui_resume"))
	resume.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	resume.pressed.connect(_toggle_pause)
	box.add_child(resume)
	_pause_lang_button = _button(Game.t("ui_lang"))
	_pause_lang_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_pause_lang_button.pressed.connect(_toggle_language)
	box.add_child(_pause_lang_button)
	var quit := _button(Game.t("ui_quit"))
	quit.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	quit.pressed.connect(_quit_game)
	box.add_child(quit)
	_pause_panel.add_child(box)
	_pause_panel.visible = false
	add_child(_pause_panel)

func _build_shop_panel() -> void:
	_shop_panel = _panel(560, 430)
	_center_control(_shop_panel, 560, 430)
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_FULL_RECT)
	box.offset_left = 26
	box.offset_right = -26
	box.offset_top = 22
	box.offset_bottom = -22
	box.add_theme_constant_override("separation", 14)

	var title := _label(Game.t("shop_title"), 32, Color("FFC24A"))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)

	_shop_mo_label = _label("", 24, TEXT_MAIN)
	_shop_mo_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(_shop_mo_label)

	var item_panel := _panel(500, 130)
	var item_name := _label(Game.t("shop_hat_name"), 26, TEXT_MAIN)
	item_name.position = Vector2(18, 12)
	item_name.size = Vector2(460, 32)
	item_panel.add_child(item_name)
	var item_desc := _label(Game.t("shop_hat_desc"), 19, TEXT_MUTED)
	item_desc.position = Vector2(18, 46)
	item_desc.size = Vector2(460, 72)
	item_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	item_panel.add_child(item_desc)
	box.add_child(item_panel)

	_shop_buy_button = _button("")
	_shop_buy_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_shop_buy_button.pressed.connect(_on_buy_pressed)
	box.add_child(_shop_buy_button)

	var close := _button(Game.t("shop_close"))
	close.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	close.pressed.connect(_close_shop)
	box.add_child(close)

	_shop_panel.add_child(box)
	_shop_panel.visible = false
	add_child(_shop_panel)

# --------------------------------------------------------------- events ----

func _on_mo_changed(total: int) -> void:
	_mo_label.text = Game.tf("ui_mo", [total])

func _update_mission() -> void:
	_mission_text.text = Game.mission_label()

func _on_lang_changed() -> void:
	_mission_title.text = Game.t("ui_objective")
	_update_mission()
	_mo_label.text = Game.tf("ui_mo", [Game.mo])
	_dialogue_hint.text = Game.t("ui_continue")
	_pause_lang_button.text = Game.t("ui_lang")
	_hint_label.text = Game.t("hint_controls")
	_shop_mo_label.text = Game.tf("shop_mo", [Game.mo])
	if Game.hat:
		_shop_buy_button.text = Game.t("shop_owned")
	else:
		_shop_buy_button.text = Game.tf("shop_buy", [Game.HAT_PRICE])

func _on_prompt_changed(text: String) -> void:
	_prompt_label.visible = text != ""
	_prompt_label.text = text

func _show_toast(text: String) -> void:
	_toast_label.text = text
	if _toast_tween != null and _toast_tween.is_valid():
		_toast_tween.kill()
	_toast_tween = create_tween()
	_toast_tween.tween_property(_toast_label, "modulate:a", 1.0, 0.25)
	_toast_tween.tween_interval(2.4)
	_toast_tween.tween_property(_toast_label, "modulate:a", 0.0, 0.6)

func _on_dialogue_opened(speaker: String) -> void:
	_dialogue_name.text = speaker
	_dialogue_panel.visible = true
	_prompt_label.visible = false

func _on_dialogue_next(text: String) -> void:
	_full_text = text
	_shown_characters = 0.0
	_dialogue_text.text = ""
	Sfx.play("talk")

func _on_dialogue_closed() -> void:
	_dialogue_panel.visible = false
	_full_text = ""
	_dialogue_text.text = ""

func _on_dialogue_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		Game.advance_dialogue()
	elif event is InputEventScreenTouch and event.pressed:
		Game.advance_dialogue()

func _process(delta: float) -> void:
	if _dialogue_panel.visible and _shown_characters < float(_full_text.length()):
		_shown_characters = minf(_shown_characters + delta * 34.0, float(_full_text.length()))
		_dialogue_text.text = _full_text.substr(0, int(_shown_characters))

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_toggle_pause()
		get_viewport().set_input_as_handled()

# --------------------------------------------------------------- pause ----

func _toggle_pause() -> void:
	if _shop_panel.visible:
		_close_shop()
	var now_paused := not get_tree().paused
	get_tree().paused = now_paused
	_pause_panel.visible = now_paused

func _toggle_language() -> void:
	Game.set_lang("fr" if Game.lang == "en" else "en")
	Sfx.play("blip")
	_show_toast(Game.t("toast_lang"))

func _quit_game() -> void:
	get_tree().quit()

# ------------------------------------------------------------ boutique ----

func _open_shop() -> void:
	_refresh_shop()
	_shop_panel.visible = true

func _close_shop() -> void:
	_shop_panel.visible = false
	Game.shop_open = false

func _refresh_shop() -> void:
	_shop_mo_label.text = Game.tf("shop_mo", [Game.mo])
	if Game.hat:
		_shop_buy_button.text = Game.t("shop_owned")
		_shop_buy_button.disabled = true
	else:
		_shop_buy_button.text = Game.tf("shop_buy", [Game.HAT_PRICE])
		_shop_buy_button.disabled = false

func _on_buy_pressed() -> void:
	if Game.buy_hat():
		Sfx.play("success")
		_show_toast(Game.t("toast_bought"))
	else:
		Sfx.play("denied")
		_show_toast(Game.t("toast_poor"))
	_refresh_shop()
