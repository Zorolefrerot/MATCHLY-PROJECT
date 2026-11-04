class_name WorldProp
extends DigitalInteractable
@export_enum("nova", "patch", "citizen", "terminal", "fragment", "portal", "door") var kind := "nova"
var visual: Node3D
var phase := 0.0
var repaired := false
var opened := false
var door_body: StaticBody3D

func _ready() -> void:
	super._ready()
	visual = Node3D.new()
	add_child(visual)
	match kind:
		"nova": _nova()
		"patch", "citizen": _resident()
		"terminal":
			_terminal()
			DigitalArt.collider(self, Vector3(0, 0.6, 0), Vector3(0.8, 1.2, 0.7))
		"fragment":
			var diamond := DigitalArt.box(visual, Vector3.ZERO, Vector3.ONE * 0.5, DigitalArt.GOLD, true)
			diamond.rotation.z = PI / 4
			diamond.rotation.x = PI / 4
			DigitalArt.shape(visual, "cylinder", Vector3(0, -0.8, 0), Vector3(0.9, 0.06, 0.9), DigitalArt.TEAL, true)
		"portal": _portal()
		"door":
			DigitalArt.box(visual, Vector3(0, 1.6, 0), Vector3(2.8, 3.2, 0.3), DigitalArt.BLUE)
			DigitalArt.box(visual, Vector3(0, 1.6, 0.17), Vector3(0.12, 2.4, 0.04), DigitalArt.TEAL, true)
			door_body = DigitalArt.collider(visual, Vector3(0, 1.6, 0), Vector3(2.8, 3.2, 0.3))

func _nova() -> void:
	DigitalArt.shape(visual, "sphere", Vector3.ZERO, Vector3(0.65, 0.65, 0.65), DigitalArt.PALE)
	DigitalArt.shape(visual, "sphere", Vector3(0, 0, -0.3), Vector3(0.38, 0.25, 0.12), DigitalArt.TEAL, true)
	for side in [-1, 1]:
		var wing := DigitalArt.box(visual, Vector3(side * 0.53, 0, 0), Vector3(0.38, 0.11, 0.35), DigitalArt.GOLD)
		wing.rotation.z = side * 0.4
	DigitalArt.box(visual, Vector3(0, -0.45, 0), Vector3(0.1, 0.22, 0.1), DigitalArt.TEAL, true)
	DigitalArt.sign_text(self, Vector3(0, 2.5, 0), "NOVA", DigitalArt.TEAL, 24).billboard = BaseMaterial3D.BILLBOARD_ENABLED

func _resident() -> void:
	var coat := DigitalArt.CORAL if kind == "patch" else DigitalArt.BLUE
	DigitalArt.box(visual, Vector3(0, 0.9, 0), Vector3(0.8, 0.9, 0.5), coat)
	DigitalArt.shape(visual, "sphere", Vector3(0, 1.6, 0), Vector3(0.9, 0.7, 0.7), DigitalArt.GOLD)
	DigitalArt.box(visual, Vector3(0, 1.62, -0.34), Vector3(0.72, 0.22, 0.1), DigitalArt.INK)
	for side in [-1, 1]:
		DigitalArt.box(visual, Vector3(side * 0.22, 0.25, 0), Vector3(0.26, 0.5, 0.3), DigitalArt.INK)
		DigitalArt.box(visual, Vector3(side * 0.55, 0.85, 0), Vector3(0.23, 0.7, 0.25), coat)
		DigitalArt.box(visual, Vector3(side * 0.19, 1.62, -0.4), Vector3(0.12, 0.08, 0.02), DigitalArt.TEAL, true)
	if kind == "patch":
		DigitalArt.box(visual, Vector3(0, 0.9, -0.29), Vector3(0.5, 0.55, 0.08), DigitalArt.BLUE)
		DigitalArt.box(visual, Vector3(0.63, 0.65, -0.1), Vector3(0.13, 0.8, 0.13), DigitalArt.PALE)
		DigitalArt.box(visual, Vector3(0.63, 1.1, -0.1), Vector3(0.35, 0.17, 0.13), DigitalArt.PALE)
	DigitalArt.sign_text(self, Vector3(0, 2.3, 0), "PATCH" if kind == "patch" else "MÉMO", DigitalArt.GOLD, 24).billboard = BaseMaterial3D.BILLBOARD_ENABLED

func _terminal() -> void:
	DigitalArt.shape(visual, "cylinder", Vector3(0, 0.15, 0), Vector3(1.6, 0.3, 1.6), DigitalArt.INK)
	DigitalArt.box(visual, Vector3(0, 0.8, 0), Vector3(0.8, 1.2, 0.7), DigitalArt.BLUE)
	DigitalArt.box(visual, Vector3(0, 1.5, 0), Vector3(1.6, 0.85, 0.5), DigitalArt.INK)
	DigitalArt.box(visual, Vector3(0, 1.5, 0.27), Vector3(1.35, 0.6, 0.035), DigitalArt.CORAL, true)
	DigitalArt.sign_text(visual, Vector3(0, 1.53, 0.3), "!  HORS LIGNE", DigitalArt.INK, 17)
	prompt = "EXAMINER LE TERMINAL"

func _portal() -> void:
	for side in [-1, 1]:
		DigitalArt.solid(visual, Vector3(side * 2.5, 2.5, 0), Vector3(0.9, 5, 1.2), DigitalArt.BLUE)
		DigitalArt.box(visual, Vector3(side * 2.5, 2.5, 0.65), Vector3(0.2, 4.2, 0.05), DigitalArt.NULL_COLOR, true)
	DigitalArt.solid(visual, Vector3(0, 5, 0), Vector3(5.9, 0.7, 1.2), DigitalArt.INK)
	DigitalArt.box(visual, Vector3(0, 2.4, 0), Vector3(4.1, 4.5, 0.12), Color("503f78"))
	DigitalArt.collider(self, Vector3(0, 2.4, 0), Vector3(4.1, 4.5, 0.2))
	DigitalArt.sign_text(visual, Vector3(0, 3.1, 0.13), "ROYAUMES\nACCÈS VERROUILLÉ", DigitalArt.PALE, 25)
	prompt = "EXAMINER LE PORTAIL"

func set_repaired(value: bool) -> void:
	if kind != "terminal" or repaired == value:
		return
	repaired = value
	for child in visual.get_children():
		child.free()
	_terminal()
	if value:
		# Screen meshes share resources; override only this instance's material.
		for child in visual.get_children():
			if child is Label3D:
				child.text = "SYSTÈME EN LIGNE"
			if child is MeshInstance3D and child.position.z > 0.2:
				child.material_override = DigitalArt.material(DigitalArt.TEAL, true)
		prompt = "TERMINAL RESTAURÉ"

func toggle_door() -> void:
	opened = not opened
	var tween := create_tween()
	tween.tween_property(visual, "position:y", 3.3 if opened else 0.0, 0.5)
	prompt = "FERMER L'ATELIER" if opened else "OUVRIR L'ATELIER"

func _process(delta: float) -> void:
	phase += delta
	if kind == "nova":
		visual.position.y = 1.7 + sin(phase * 2.2) * 0.14
		visual.rotation.y = PI + sin(phase * 0.7) * 0.35
	elif kind == "fragment":
		visual.position.y = sin(phase * 2) * 0.12
		visual.rotation.y += delta
	elif kind in ["patch", "citizen"]:
		visual.rotation.y = PI + sin(phase * 0.5) * 0.15
