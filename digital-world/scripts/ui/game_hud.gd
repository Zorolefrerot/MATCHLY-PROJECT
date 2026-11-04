class_name GameHUD
extends Control
signal pause_requested
signal jump_requested
signal interact_requested
signal scan_requested
var joystick: VirtualJoystick
var jump: TouchAction
var interact: TouchAction
var scan: TouchAction
var objective: Label
var proximity: Label
var compass: Label
var health: ProgressBar
var reward: Label
var toast_label: Label
var toast_timer := 0.0
var next_line: Button
var dialogue_panel: PanelContainer
var speaker: Label
var dialogue_text: Label
var controls: Control

func _ready() -> void:
	theme = UIStyle.theme()
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var mission_panel := PanelContainer.new()
	add_child(mission_panel)
	UIStyle.place(mission_panel, Vector4(0, 0, 0, 0), Vector4(28, 26, 485, 146))
	var stack := VBoxContainer.new()
	mission_panel.add_child(stack)
	UIStyle.label(stack, "01  /  UN MONDE EN PANNE", 15, UIStyle.CYAN)
	objective = UIStyle.label(stack, "", 19)
	objective.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	objective.custom_minimum_size.x = 395
	var status := HBoxContainer.new()
	stack.add_child(status)
	UIStyle.label(status, "BYTE", 13, UIStyle.MUTED)
	health = ProgressBar.new()
	health.custom_minimum_size = Vector2(140, 9)
	health.value = 100
	health.show_percentage = false
	health.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	health.add_theme_stylebox_override("fill", UIStyle.box(UIStyle.CYAN, Color.TRANSPARENT, 4))
	health.add_theme_stylebox_override("background", UIStyle.box(Color("203c50"), Color.TRANSPARENT, 4))
	status.add_child(health)
	reward = UIStyle.label(status, "   ◇ 0", 14, DigitalArt.GOLD)
	var pause := UIStyle.button(self, "Ⅱ  PAUSE", func(): pause_requested.emit())
	UIStyle.place(pause, Vector4(1, 0, 1, 0), Vector4(-160, 26, -28, 80))
	compass = UIStyle.label(self, "", 17, UIStyle.CYAN)
	compass.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	UIStyle.place(compass, Vector4(0.55, 0, 1, 0), Vector4(0, 92, -28, 124))
	proximity = UIStyle.label(self, "", 18, DigitalArt.GOLD)
	proximity.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	UIStyle.place(proximity, Vector4(0.22, 0.7, 0.8, 0.7), Vector4(0, -20, 0, 20))
	toast_label = UIStyle.label(self, "", 18)
	toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	UIStyle.place(toast_label, Vector4(0.25, 0.2, 0.8, 0.2), Vector4(0, 0, 0, 70))
	controls = Control.new()
	controls.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(controls)
	controls.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	joystick = VirtualJoystick.new()
	controls.add_child(joystick)
	UIStyle.place(joystick, Vector4(0, 1, 0, 1), Vector4(38, -220, 220, -38))
	var hint := UIStyle.label(controls, "MARCHER  /  COURIR", 11, UIStyle.MUTED)
	UIStyle.place(hint, Vector4(0, 1, 0, 1), Vector4(48, -32, 260, -14))
	jump = _action("SAUT", Vector4(-132, -148, -30, -46), func(): jump_requested.emit())
	interact = _action("PARLER", Vector4(-259, -153, -149, -43), func(): interact_requested.emit())
	scan = _action("SCAN", Vector4(-148, -265, -52, -169), func(): scan_requested.emit())
	interact.available = false
	_dialogue_ui()

func _action(text: String, offsets: Vector4, callback: Callable) -> TouchAction:
	var action := TouchAction.new()
	action.caption = text
	controls.add_child(action)
	UIStyle.place(action, Vector4(1, 1, 1, 1), offsets)
	action.pressed.connect(callback)
	return action

func _dialogue_ui() -> void:
	dialogue_panel = PanelContainer.new()
	add_child(dialogue_panel)
	UIStyle.place(dialogue_panel, Vector4(0.12, 1, 0.88, 1), Vector4(0, -235, 0, -28))
	var stack := VBoxContainer.new()
	dialogue_panel.add_child(stack)
	speaker = UIStyle.label(stack, "NOVA", 17, UIStyle.CYAN)
	dialogue_text = UIStyle.label(stack, "", 21)
	dialogue_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	dialogue_text.size_flags_vertical = Control.SIZE_EXPAND_FILL
	next_line = UIStyle.button(stack, "CONTINUER   →   [E]", func(): interact_requested.emit())
	next_line.alignment = HORIZONTAL_ALIGNMENT_RIGHT
	dialogue_panel.hide()

func set_dialogue(name_text: String, text: String) -> void:
	dialogue_panel.show()
	speaker.text = name_text
	dialogue_text.text = text
	set_controls(false)
	proximity.hide()

func close_dialogue() -> void:
	dialogue_panel.hide()
	set_controls(true)
	proximity.show()

func set_controls(value: bool) -> void:
	controls.visible = value
	joystick.reset()
	jump.reset()
	interact.reset()
	scan.reset()

func focus(target: DigitalInteractable) -> void:
	interact.available = target != null
	interact.queue_redraw()
	proximity.text = (target.prompt + "  •  E / INTERAGIR") if target else ""
	interact.caption = "INTERAGIR" if target else "—"

func update_mission() -> void:
	objective.text = GameState.mission.objective()
	reward.text = "   ◇ %d" % GameState.mission.energy

func toast(text: String) -> void:
	toast_label.text = text
	toast_timer = 4.0

func _process(delta: float) -> void:
	toast_timer = maxf(0, toast_timer - delta)
	toast_label.visible = toast_timer > 0
