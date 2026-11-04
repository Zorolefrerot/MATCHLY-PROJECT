class_name TouchAction
extends Control
signal pressed
@export var caption := "SAUT"
var finger := -1
var down := false
var available := true

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP

func _draw() -> void:
	var radius := minf(size.x, size.y) * 0.47
	var center := size / 2
	var color := UIStyle.CYAN if down else Color("14344cdd")
	draw_circle(center, radius, color)
	draw_arc(center, radius, 0, TAU, 48, UIStyle.CYAN if available else UIStyle.MUTED, 2, true)
	var font := ThemeDB.fallback_font
	var font_size := 17
	var text_size := font.get_string_size(caption, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size)
	draw_string(font, center + Vector2(-text_size.x / 2, 6), caption, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, UIStyle.TEXT if available else UIStyle.MUTED)

func _input(event: InputEvent) -> void:
	if not is_visible_in_tree():
		return
	if event is InputEventScreenTouch:
		if event.pressed and finger == -1 and get_global_rect().has_point(event.position):
			finger = event.index
			down = true
			if available:
				pressed.emit()
			get_viewport().set_input_as_handled()
		elif not event.pressed and event.index == finger:
			finger = -1
			down = false
			get_viewport().set_input_as_handled()
		queue_redraw()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and finger == -1:
		down = event.pressed
		if down and available:
			pressed.emit()
		queue_redraw()

func reset() -> void:
	finger = -1
	down = false
	queue_redraw()
