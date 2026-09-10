class_name CharacterCreator
extends Control
## Local cosmetic draft. Nothing touches the combat fighter before Save succeeds.
signal saved(appearance: Dictionary)
signal closed
var draft: Dictionary = CharacterAppearance.DEFAULTS.duplicate()
var save_path: String = CharacterAppearance.SAVE_PATH
var selectors: Dictionary = {}
var viewport: SubViewport
var preview_camera: Camera3D
var close_up: bool = false
var preview: TrainingFighter
var preview_container: SubViewportContainer
var status_label: Label
var save_button: Button
var cancel_button: Button
var outfit_select: OptionButton
var touch_id: int = -1

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var ui_theme := Theme.new()
	ui_theme.default_font_size = 17
	ui_theme.set_color("font_color", "Label", Color("f1e6cf"))
	ui_theme.set_stylebox("normal", "Button", TrainingHUD.panel_style(Color("29454b")))
	ui_theme.set_stylebox("normal", "OptionButton", TrainingHUD.panel_style(Color("29454b")))
	theme = ui_theme
	var background := ColorRect.new()
	background.color = Color("101e26")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 20)
	add_child(margin)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 12)
	margin.add_child(column)
	var heading := HBoxContainer.new()
	column.add_child(heading)
	var title: Label = _label("CRÉER MON PERSONNAGE", 27)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	heading.add_child(title)
	heading.add_child(_button("Par défaut", reset_draft))
	column.add_child(_label("Apparence libre · modèles 3D provisoires · sauvegarde sur ce téléphone", 15))
	var body := HBoxContainer.new()
	body.add_theme_constant_override("separation", 24)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(body)
	var preview_column := VBoxContainer.new()
	preview_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(preview_column)
	preview_container = SubViewportContainer.new()
	preview_container.stretch = true
	preview_container.custom_minimum_size = Vector2(300, 280)
	preview_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	preview_container.gui_input.connect(_rotate_input)
	preview_column.add_child(preview_container)
	viewport = SubViewport.new()
	viewport.size = Vector2i(550, 520)
	viewport.own_world_3d = true
	preview_container.add_child(viewport)
	_build_preview()
	preview_column.add_child(_label("Glisse sur le modèle pour le tourner.", 15))
	var rotation_row := HBoxContainer.new()
	preview_column.add_child(rotation_row)
	rotation_row.add_child(_button("< Tourner", func() -> void: preview.visual.rotation.y -= PI/4))
	rotation_row.add_child(_button("Face", func() -> void: preview.visual.rotation.y = 0))
	rotation_row.add_child(_button("Visage / corps", toggle_close_up))
	rotation_row.add_child(_button("Tourner >", func() -> void: preview.visual.rotation.y += PI/4))
	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size.x = 555
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	body.add_child(scroll)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 8)
	scroll.add_child(grid)
	var names: Dictionary = {"model": "Modèle", "hair": "Coiffure", "hair_color": "Cheveux", "eyes": "Yeux", "skin": "Peau", "top": "Haut", "top_color": "Couleur du haut", "bottom": "Bas", "bottom_color": "Couleur du bas"}
	for key: String in names:
		grid.add_child(_label(names[key], 17))
		var selector := OptionButton.new()
		selector.custom_minimum_size = Vector2(290, 44)
		selector.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		selector.focus_mode = Control.FOCUS_NONE
		for option in CharacterAppearance.choices(key):
			selector.add_item(option)
		selector.item_selected.connect(func(index: int) -> void: set_choice(key, index))
		grid.add_child(selector)
		selectors[key] = selector
	grid.add_child(_label("Tenue complète", 17))
	outfit_select = OptionButton.new()
	outfit_select.custom_minimum_size.y = 44
	outfit_select.add_item("Choisir un ensemble…")
	for caption in CharacterAppearance.OUTFIT_NAMES:
		outfit_select.add_item(caption)
	outfit_select.item_selected.connect(func(index: int) -> void:
		if index > 0:
			apply_outfit(index-1)
	)
	grid.add_child(outfit_select)
	status_label = _label("", 15)
	column.add_child(status_label)
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 16)
	column.add_child(actions)
	cancel_button = _button("ANNULER", cancel)
	save_button = _button("ENREGISTRER L’APPARENCE", confirm)
	save_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	save_button.add_theme_stylebox_override("normal", TrainingHUD.panel_style(Color("a44750")))
	actions.add_child(cancel_button)
	actions.add_child(save_button)
	_finish()

func _label(text: String, font_size: int) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", font_size)
	return label

func _button(text: String, action: Callable) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size.y = 46
	button.focus_mode = Control.FOCUS_NONE
	button.pressed.connect(action)
	return button

func _build_preview() -> void:
	var environment := WorldEnvironment.new()
	var settings := Environment.new()
	settings.background_mode = Environment.BG_COLOR
	settings.background_color = Color("263b45")
	settings.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	settings.ambient_light_color = Color("e3e8e8")
	settings.ambient_light_energy = 0.8
	environment.environment = settings
	viewport.add_child(environment)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-35, -145, 0)
	light.light_energy = 1.0
	light.shadow_enabled = false
	viewport.add_child(light)
	preview = TrainingFighter.new()
	viewport.add_child(preview)
	preview.configure(Color("385962"), 0, 120)
	preview.collision_mask = 0
	preview_camera = Camera3D.new()
	preview_camera.fov = 34
	viewport.add_child(preview_camera)
	_position_camera()
	preview_camera.current = true
	var base := MeshInstance3D.new()
	var disc := CylinderMesh.new()
	disc.top_radius = 0.83
	disc.bottom_radius = 0.87
	disc.height = 0.09
	disc.radial_segments = 32
	base.mesh = disc
	base.position.y = -0.045
	base.material_override = TrainingFighter.material(Color("566974"))
	viewport.add_child(base)

func toggle_close_up() -> void:
	close_up = not close_up
	_position_camera()

func _position_camera() -> void:
	preview_camera.position = Vector3(0, 1.64, -1.75) if close_up else Vector3(0, 1.15, -4.4)
	preview_camera.look_at(Vector3(0, 1.64 if close_up else 1.05, 0))

func open(current: Dictionary, path: String = CharacterAppearance.SAVE_PATH) -> void:
	save_path = path
	draft = CharacterAppearance.sanitize(current)
	touch_id = -1
	_sync()
	preview.visual.rotation = Vector3.ZERO
	close_up = false
	_position_camera()
	status_label.text = "Cosmétique uniquement. Les tenues conviennent aux deux modèles."
	show()
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS

func set_choice(key: String, index: int) -> void:
	if not CharacterAppearance.DEFAULTS.has(key):
		return
	draft[key] = index
	draft = CharacterAppearance.sanitize(draft)
	_sync()

func apply_outfit(index: int) -> void:
	draft = CharacterAppearance.outfit(draft, index)
	_sync()

func reset_draft() -> void:
	draft = CharacterAppearance.DEFAULTS.duplicate()
	_sync()
	status_label.text = "Choix par défaut dans l’aperçu. Enregistre pour les conserver."

func _sync() -> void:
	for key: String in selectors:
		selectors[key].select(draft[key])
	outfit_select.select(0)
	preview.apply_appearance(draft)

func confirm() -> void:
	if not visible:
		return
	var error: Error = CharacterAppearance.save_local(draft, save_path)
	if error != OK:
		status_label.text = "Sauvegarde impossible. Tes anciens choix sont conservés ; réessaie."
		return
	saved.emit(draft.duplicate())
	_finish()
	closed.emit()

func cancel() -> void:
	_finish()
	closed.emit()

func _finish() -> void:
	for selector: OptionButton in selectors.values():
		selector.get_popup().hide()
	outfit_select.get_popup().hide()
	touch_id = -1
	viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
	hide()

func _rotate_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and touch_id == -1:
			touch_id = event.index
		elif event.index == touch_id and not event.pressed:
			touch_id = -1
	elif event is InputEventScreenDrag and event.index == touch_id:
		preview.visual.rotation.y -= event.relative.x*0.012
	elif event is InputEventMouseMotion and event.device != InputEvent.DEVICE_ID_EMULATION and (event.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0:
		preview.visual.rotation.y -= event.relative.x*0.012
	preview_container.accept_event()
