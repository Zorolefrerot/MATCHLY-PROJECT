class_name TouchJoy
extends Control
## Joystick virtuel : toucher la moitié gauche de l'écran pour diriger PIX.
## Ne s'active que sur écran tactile (le clavier reste prioritaire sinon).

const MAX_DISTANCE := 80.0

var _active := false
var _touch_index := -1
var _origin := Vector2.ZERO
var _axis := Vector2.ZERO

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _input(event: InputEvent) -> void:
	if not DisplayServer.is_touchscreen_available():
		return
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.pressed and not _active and touch.position.x < get_viewport_rect().size.x * 0.55:
			_active = true
			_touch_index = touch.index
			_origin = touch.position
			_axis = Vector2.ZERO
			queue_redraw()
		elif not touch.pressed and touch.index == _touch_index:
			_release()
	elif event is InputEventScreenDrag and _active:
		var drag := event as InputEventScreenDrag
		if drag.index == _touch_index:
			_axis = (drag.position - _origin).limit_length(MAX_DISTANCE) / MAX_DISTANCE
			Game.touch_axis = _axis
			Game.touch_active = _axis.length() > 0.15
			queue_redraw()

func _release() -> void:
	_active = false
	_touch_index = -1
	_axis = Vector2.ZERO
	Game.touch_axis = Vector2.ZERO
	Game.touch_active = false
	queue_redraw()

func _draw() -> void:
	if not _active:
		return
	var base_alpha := 0.10
	draw_circle(_origin, 72.0, Color(1, 1, 1, base_alpha))
	draw_arc(_origin, 66.0, 0.0, TAU, 48, Color(0.42, 0.96, 0.78, 0.45), 3.0)
	draw_circle(_origin + _axis * MAX_DISTANCE, 30.0, Color(0.42, 0.96, 0.78, 0.30))
	draw_circle(_origin + _axis * MAX_DISTANCE, 14.0, Color(0.42, 0.96, 0.78, 0.60))
