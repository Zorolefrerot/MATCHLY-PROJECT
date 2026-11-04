class_name VirtualJoystick
extends Control
signal changed(value: Vector2)
var finger := -1
var value := Vector2.ZERO
var mouse_active := false

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	custom_minimum_size = Vector2(172, 172)

func _draw() -> void:
	var center := size / 2
	var radius := minf(size.x, size.y) * 0.45
	draw_circle(center, radius, Color("102a3a99"))
	draw_arc(center, radius, 0, TAU, 64, Color("66d9c488"), 2, true)
	draw_arc(center, radius * 0.64, 0, TAU, 48, Color("73b7b033"), 1, true)
	draw_circle(center + value * radius * 0.63, radius * 0.32, Color("68d8c9bb"))
	draw_arc(center + value * radius * 0.63, radius * 0.32, 0, TAU, 32, UIStyle.CYAN, 2, true)

func _input(event: InputEvent) -> void:
	if not is_visible_in_tree():
		return
	if event is InputEventScreenTouch:
		if event.pressed and finger == -1 and get_global_rect().has_point(event.position):
			finger = event.index
			_update(event.position)
			get_viewport().set_input_as_handled()
		elif event.index == finger and not event.pressed:
			reset()
			get_viewport().set_input_as_handled()
	if event is InputEventScreenDrag and event.index == finger:
		_update(event.position)
		get_viewport().set_input_as_handled()
	if event is InputEventMouseMotion and mouse_active:
		_update(event.position)
	if event is InputEventMouseButton and not event.pressed and mouse_active:
		reset()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and finger == -1:
		mouse_active = event.pressed
		if mouse_active:
			_update(get_global_mouse_position())
		else:
			reset()

func _update(point: Vector2) -> void:
	value = ((point - global_position - size / 2) / (minf(size.x, size.y) * 0.45 * 0.63)).limit_length()
	if value.length() < 0.12:
		value = Vector2.ZERO
	changed.emit(value)
	queue_redraw()

func reset() -> void:
	finger = -1
	mouse_active = false
	value = Vector2.ZERO
	changed.emit(value)
	queue_redraw()
