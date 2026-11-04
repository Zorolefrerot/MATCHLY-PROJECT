class_name UIStyle
extends RefCounted
const TEXT := Color("e4f3ee")
const MUTED := Color("9db6c1")
const CYAN := Color("64ead0")
const BG := Color("102439ef")

static func box(color: Color, border := Color.TRANSPARENT, radius := 14) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = border
	style.set_border_width_all(1 if border.a > 0 else 0)
	style.set_corner_radius_all(radius)
	style.content_margin_left = 22
	style.content_margin_right = 22
	style.content_margin_top = 14
	style.content_margin_bottom = 14
	return style

static func theme() -> Theme:
	var result := Theme.new()
	result.default_font_size = 20
	result.set_color("font_color", "Label", TEXT)
	result.set_color("font_color", "Button", TEXT)
	result.set_color("font_hover_color", "Button", Color("142e43"))
	result.set_color("font_pressed_color", "Button", Color("142e43"))
	result.set_stylebox("normal", "Button", box(Color("1a354a"), Color("345b6b")))
	result.set_stylebox("hover", "Button", box(CYAN))
	result.set_stylebox("pressed", "Button", box(Color("4bb7a7")))
	result.set_stylebox("focus", "Button", box(Color.TRANSPARENT, CYAN))
	result.set_stylebox("disabled", "Button", box(Color("142b3b")))
	result.set_color("font_disabled_color", "Button", Color("526976"))
	result.set_stylebox("panel", "PanelContainer", box(BG, Color("33536a")))
	return result

static func label(parent: Node, text: String, size := 20, color := TEXT) -> Label:
	var node := Label.new()
	node.text = text
	node.add_theme_font_size_override("font_size", size)
	node.add_theme_color_override("font_color", color)
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(node)
	return node

static func button(parent: Node, text: String, callback: Callable) -> Button:
	var node := Button.new()
	node.text = text
	node.custom_minimum_size.y = 54
	node.pressed.connect(callback)
	parent.add_child(node)
	return node

static func place(node: Control, anchors: Vector4, offsets := Vector4.ZERO) -> void:
	node.anchor_left = anchors.x
	node.anchor_top = anchors.y
	node.anchor_right = anchors.z
	node.anchor_bottom = anchors.w
	node.offset_left = offsets.x
	node.offset_top = offsets.y
	node.offset_right = offsets.z
	node.offset_bottom = offsets.w
