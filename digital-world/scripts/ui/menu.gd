class_name GameMenu
extends Control
signal new_requested
signal continue_requested
signal resume_requested
signal main_requested
signal quit_requested
var home: PanelContainer
var pause_panel: PanelContainer
var settings_panel: PanelContainer
var confirm_panel: PanelContainer
var continue_button: Button
var last_panel: Control
var is_paused_menu := false

func _ready() -> void:
	theme = UIStyle.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	home = PanelContainer.new()
	add_child(home)
	UIStyle.place(home, Vector4(0, 0, 0, 1), Vector4(0, 0, 510, 0))
	home.add_theme_stylebox_override("panel", UIStyle.box(Color("0c2036ed"), Color.TRANSPARENT, 0))
	var margin := MarginContainer.new()
	for side in ["left", "right"]:
		margin.add_theme_constant_override("margin_" + side, 24)
	home.add_child(margin)
	var stack := VBoxContainer.new()
	stack.alignment = BoxContainer.ALIGNMENT_CENTER
	stack.add_theme_constant_override("separation", 12)
	margin.add_child(stack)
	UIStyle.label(stack, "UNE AVENTURE À L'INTÉRIEUR DU SMARTPHONE", 12, UIStyle.CYAN)
	UIStyle.label(stack, "DIGITAL\nWORLD", 68)
	UIStyle.label(stack, "B E Y O N D   T H E   S C R E E N", 15, DigitalArt.GOLD)
	UIStyle.label(stack, "Un petit être. Un immense univers à sauver.\nBienvenue à System City.", 18, UIStyle.MUTED)
	var space := Control.new()
	space.custom_minimum_size.y = 12
	stack.add_child(space)
	UIStyle.button(stack, "NOUVELLE PARTIE    →", _new_game)
	continue_button = UIStyle.button(stack, "CONTINUER", func(): continue_requested.emit())
	UIStyle.button(stack, "PARAMÈTRES", show_settings)
	UIStyle.button(stack, "QUITTER", func(): quit_requested.emit())
	UIStyle.label(stack, "PROTOTYPE 0.1  /  HORS LIGNE  /  SOLO", 11, UIStyle.MUTED)
	_pause_ui()
	_settings_ui()
	_confirm_ui()
	show_home()

func _center_panel(width := 470) -> PanelContainer:
	var panel := PanelContainer.new()
	add_child(panel)
	UIStyle.place(panel, Vector4(0.5, 0.5, 0.5, 0.5), Vector4(-width / 2.0, -220, width / 2.0, 220))
	return panel

func _pause_ui() -> void:
	pause_panel = _center_panel()
	var stack := VBoxContainer.new()
	stack.alignment = BoxContainer.ALIGNMENT_CENTER
	stack.add_theme_constant_override("separation", 14)
	pause_panel.add_child(stack)
	UIStyle.label(stack, "CIRCUITS EN VEILLE", 26, UIStyle.CYAN)
	UIStyle.label(stack, "La ville peut attendre un instant.", 17, UIStyle.MUTED)
	UIStyle.button(stack, "REPRENDRE", func(): resume_requested.emit())
	UIStyle.button(stack, "PARAMÈTRES", show_settings)
	UIStyle.button(stack, "SAUVEGARDER ET MENU", func(): main_requested.emit())
	UIStyle.button(stack, "QUITTER", func(): quit_requested.emit())

func _settings_ui() -> void:
	settings_panel = _center_panel(560)
	var stack := VBoxContainer.new()
	stack.add_theme_constant_override("separation", 14)
	settings_panel.add_child(stack)
	UIStyle.label(stack, "PARAMÈTRES", 27, UIStyle.CYAN)
	for data in [["music", "Musique"], ["sfx", "Effets sonores"], ["sensitivity", "Sensibilité caméra"]]:
		var key: String = data[0]
		UIStyle.label(stack, data[1], 16)
		var slider := HSlider.new()
		slider.min_value = 0
		slider.max_value = 1
		slider.step = 0.05
		slider.value = GameState.settings[key]
		slider.custom_minimum_size.y = 28
		slider.value_changed.connect(func(value: float): GameState.update_setting(key, value))
		stack.add_child(slider)
	var low := CheckButton.new()
	low.text = "Économie • 30 FPS, ombres désactivées"
	low.button_pressed = GameState.settings["low_graphics"]
	low.toggled.connect(func(value: bool): GameState.update_setting("low_graphics", value))
	stack.add_child(low)
	UIStyle.label(stack, "Rotation : glisser en haut à droite / clic droit\nSaut : Espace • Interagir : E • Scan : F • Course : Maj", 14, UIStyle.MUTED)
	UIStyle.button(stack, "RETOUR", _back_settings)

func _confirm_ui() -> void:
	confirm_panel = _center_panel(520)
	var stack := VBoxContainer.new()
	stack.alignment = BoxContainer.ALIGNMENT_CENTER
	stack.add_theme_constant_override("separation", 20)
	confirm_panel.add_child(stack)
	UIStyle.label(stack, "RECOMMENCER L'AVENTURE ?", 24, DigitalArt.GOLD)
	var text := UIStyle.label(stack, "La progression actuelle sera remplacée.\nLes paramètres seront conservés.", 19)
	text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	UIStyle.button(stack, "OUI, NOUVELLE PARTIE", func(): new_requested.emit())
	UIStyle.button(stack, "ANNULER", show_home)

func _new_game() -> void:
	if not SaveStore.load_game().is_empty():
		home.hide()
		confirm_panel.show()
	else:
		new_requested.emit()

func _hide_panels() -> void:
	for panel in [home, pause_panel, settings_panel, confirm_panel]:
		panel.hide()

func show_home() -> void:
	show()
	_hide_panels()
	home.show()
	is_paused_menu = false
	continue_button.disabled = SaveStore.load_game().is_empty()

func show_pause() -> void:
	show()
	_hide_panels()
	pause_panel.show()
	is_paused_menu = true

func show_settings() -> void:
	last_panel = pause_panel if is_paused_menu else home
	_hide_panels()
	settings_panel.show()

func _back_settings() -> void:
	settings_panel.hide()
	last_panel.show()
