class_name CityArt
extends RefCounted
## A hand-authored layout built from original low-poly architectural modules.
static func build(root: Node3D) -> void:
	_ground(root)
	_plaza(root)
	for data in [
		[Vector3(-12, 0, 11), Vector3(7, 7, 7), DigitalArt.CORAL, "MÉMOIRES"],
		[Vector3(12, 0, 11), Vector3(7, 10, 7), DigitalArt.TEAL, "MESSAGERIE"],
		[Vector3(-13, 0, -10), Vector3(8, 11, 7), DigitalArt.BLUE, "ARCHIVES"],
		[Vector3(13, 0, -11), Vector3(7, 8, 7), DigitalArt.CORAL, "ÉNERGIE"],
		[Vector3(-24, 0, -10), Vector3(5, 6, 6), DigitalArt.TEAL, "CACHE"],
		[Vector3(24, 0, 10), Vector3(5, 8, 7), DigitalArt.GOLD, "AUDIO"]]:
		_building(root, data[0], data[1], data[2], data[3])
	_workshop(root)
	for x in [-7, 7]:
		for z in [-19, -7, 7, 19]:
			_lamp(root, Vector3(x, 0, z))
	for point in [Vector3(-20, 0, 7), Vector3(21, 0, -20), Vector3(-20, 0, -21), Vector3(22, 0, 21)]:
		_garden(root, point)
	for side in [-1, 1]:
		for index in 12:
			var pos := Vector3(side * 31, 0.7, -28 + index * 5)
			DigitalArt.solid(root, pos, Vector3(0.3, 1.4, 3.8), DigitalArt.BLUE)
			DigitalArt.box(root, pos + Vector3(0, 0.75, 0), Vector3(0.2, 0.08, 3.8), DigitalArt.TEAL, true)
	for z in [-31, 31]:
		DigitalArt.solid(root, Vector3(0, 0.8, z), Vector3(62, 1.6, 0.4), DigitalArt.BLUE)
	# Invisible upper containment, above the visible edge rails.
	for x in [-32, 32]:
		DigitalArt.collider(root, Vector3(x, 5, 0), Vector3(1, 10, 65))
	for z in [-32, 32]:
		DigitalArt.collider(root, Vector3(0, 5, z), Vector3(65, 10, 1))
	DigitalArt.batch(root)

static func _ground(root: Node3D) -> void:
	DigitalArt.solid(root, Vector3(0, -0.5, 0), Vector3(64, 1, 64), DigitalArt.INK)
	# Flush surfaces: no stair-stepping required for any mission route.
	for z in range(-28, 29, 4):
		for x in [-28, -20, -8, 8, 20, 28]:
			DigitalArt.box(root, Vector3(x, 0.012, z), Vector3(0.045, 0.015, 3.7), Color("235169"))
	for x in [-3, 3]:
		DigitalArt.box(root, Vector3(x, 0.025, 0), Vector3(0.09, 0.025, 60), DigitalArt.TEAL, true)
	for z in [-3, 3]:
		DigitalArt.box(root, Vector3(0, 0.025, z), Vector3(60, 0.025, 0.09), DigitalArt.TEAL, true)
	for index in range(-28, 29, 3):
		DigitalArt.box(root, Vector3(0, 0.02, index), Vector3(0.16, 0.02, 0.7), DigitalArt.GOLD, true)
		DigitalArt.box(root, Vector3(index, 0.02, 0), Vector3(0.7, 0.02, 0.16), DigitalArt.GOLD, true)

static func _plaza(root: Node3D) -> void:
	DigitalArt.shape(root, "cylinder", Vector3(0, 0.04, 0), Vector3(13, 0.06, 13), DigitalArt.BLUE)
	DigitalArt.shape(root, "cylinder", Vector3(0, 0.08, 0), Vector3(10.8, 0.025, 10.8), DigitalArt.INK)
	for index in 24:
		var angle := index * TAU / 24
		var pos := Vector3(sin(angle) * 5.8, 0.09, cos(angle) * 5.8)
		var strip := DigitalArt.box(root, pos, Vector3(0.3, 0.03, 0.85), DigitalArt.TEAL, true)
		strip.rotation.y = angle
	# The wake platform and central data monument share a circular design language.
	DigitalArt.shape(root, "cylinder", Vector3(0, 0.025, 14), Vector3(3.3, 0.04, 3.3), DigitalArt.TEAL, true)
	DigitalArt.shape(root, "cylinder", Vector3(0, 0.05, 14), Vector3(3, 0.04, 3), DigitalArt.BLUE)
	DigitalArt.solid(root, Vector3(1.5, 0.5, 0), Vector3(1.2, 1, 1.2), DigitalArt.BLUE)
	var core := DigitalArt.box(root, Vector3(1.5, 2.4, 0), Vector3(0.9, 0.9, 0.9), DigitalArt.TEAL, true)
	core.rotation = Vector3(PI / 4, PI / 4, 0)
	for side in [-1, 1]:
		DigitalArt.box(root, Vector3(1.5 + side * 0.8, 1.8, 0), Vector3(0.15, 2.6, 0.15), DigitalArt.GOLD)
	DigitalArt.sign_text(root, Vector3(0, 5.2, -5.8), "SYSTEM CITY", DigitalArt.TEAL, 62)
	DigitalArt.sign_text(root, Vector3(0, 4.4, -5.8), "CŒUR DU SMARTPHONE  /  SECTEUR 01", DigitalArt.PALE, 18)
	for x in [-4.8, 4.8]:
		DigitalArt.solid(root, Vector3(x, 0.35, 2), Vector3(1.6, 0.7, 0.65), DigitalArt.CORAL)

static func _building(root: Node3D, pos: Vector3, size: Vector3, color: Color, title: String) -> void:
	DigitalArt.solid(root, pos + Vector3(0, 0.25, 0), Vector3(size.x + 0.6, 0.5, size.z + 0.6), DigitalArt.BLUE)
	DigitalArt.solid(root, pos + Vector3(0, size.y / 2, 0), size, color)
	DigitalArt.box(root, pos + Vector3(0, size.y + 0.15, 0), Vector3(size.x + 0.7, 0.3, size.z + 0.7), DigitalArt.INK)
	DigitalArt.box(root, pos + Vector3(0, size.y + 0.36, 0), Vector3(size.x + 0.35, 0.08, size.z + 0.35), DigitalArt.TEAL, true)
	# Window ribbons, recessed entrance and rooftop equipment, not plain cubes.
	for floor_index in range(1, int(size.y / 1.6)):
		var height := floor_index * 1.6
		DigitalArt.box(root, pos + Vector3(0, height, size.z / 2 + 0.025), Vector3(size.x - 0.7, 0.62, 0.06), DigitalArt.INK)
		for pane in 4:
			DigitalArt.box(root, pos + Vector3(-size.x * 0.32 + pane * size.x * 0.21, height, size.z / 2 + 0.065), Vector3(0.2, 0.4, 0.025), DigitalArt.GOLD, true)
		for side in [-1, 1]:
			DigitalArt.box(root, pos + Vector3(side * (size.x / 2 + 0.025), height, 0), Vector3(0.06, 0.5, size.z - 0.8), DigitalArt.BLUE)
	DigitalArt.box(root, pos + Vector3(0, 1.25, size.z / 2 + 0.04), Vector3(1.6, 2.5, 0.09), DigitalArt.INK)
	DigitalArt.box(root, pos + Vector3(0, 2.9, size.z / 2 + 0.7), Vector3(3.3, 0.2, 1.5), DigitalArt.BLUE)
	DigitalArt.sign_text(root, pos + Vector3(0, size.y - 0.5, size.z / 2 + 0.15), title, DigitalArt.PALE, 25)
	DigitalArt.shape(root, "cylinder", pos + Vector3(0, size.y + 0.9, 0), Vector3(2, 1.2, 2), DigitalArt.BLUE)
	DigitalArt.box(root, pos + Vector3(0, size.y + 2, 0), Vector3(0.1, 2, 0.1), DigitalArt.GOLD)
	DigitalArt.shape(root, "sphere", pos + Vector3(0, size.y + 3, 0), Vector3.ONE * 0.25, DigitalArt.CORAL, true)

static func _workshop(root: Node3D) -> void:
	# Walk-in U-shaped workshop, clear 2.8m door; roof intentionally partial.
	var center := Vector3(21, 0, -3)
	DigitalArt.solid(root, center + Vector3(-4, 2, 0), Vector3(0.4, 4, 8), DigitalArt.CORAL)
	DigitalArt.solid(root, center + Vector3(4, 2, 0), Vector3(0.4, 4, 8), DigitalArt.CORAL)
	DigitalArt.solid(root, center + Vector3(0, 2, -4), Vector3(8, 4, 0.4), DigitalArt.BLUE)
	for side in [-1, 1]:
		DigitalArt.solid(root, center + Vector3(side * 2.7, 1.6, 4), Vector3(2.6, 3.2, 0.4), DigitalArt.CORAL)
	DigitalArt.box(root, center + Vector3(0, 3.8, 4), Vector3(8.8, 1.2, 1.2), DigitalArt.INK)
	DigitalArt.sign_text(root, center + Vector3(0, 3.85, 4.62), "PATCH / RÉPARATIONS", DigitalArt.GOLD, 27)
	DigitalArt.solid(root, center + Vector3(0, 0.6, -2), Vector3(4.5, 1.2, 1.2), DigitalArt.BLUE)
	for index in 3:
		DigitalArt.box(root, center + Vector3(-1.4 + index * 1.4, 1.3, -2), Vector3(0.6, 0.2, 0.7), DigitalArt.TEAL)
	DigitalArt.box(root, center + Vector3(0, 0.025, 0), Vector3(7.8, 0.03, 7.8), Color("395e70"))

static func _lamp(root: Node3D, pos: Vector3) -> void:
	DigitalArt.shape(root, "cylinder", pos + Vector3(0, 0.15, 0), Vector3(0.7, 0.3, 0.7), DigitalArt.BLUE)
	DigitalArt.box(root, pos + Vector3(0, 1.6, 0), Vector3(0.16, 3.2, 0.16), DigitalArt.PALE)
	DigitalArt.box(root, pos + Vector3(0, 3.2, 0), Vector3(0.8, 0.18, 0.8), DigitalArt.TEAL, true)

static func _garden(root: Node3D, pos: Vector3) -> void:
	DigitalArt.solid(root, pos + Vector3(0, 0.25, 0), Vector3(2.6, 0.5, 2.6), DigitalArt.BLUE)
	for index in 5:
		var angle := index * TAU / 5
		var offset := Vector3(sin(angle) * 0.65, 0, cos(angle) * 0.65)
		DigitalArt.box(root, pos + offset + Vector3(0, 0.9, 0), Vector3(0.09, 0.9, 0.09), DigitalArt.GOLD)
		var leaf := DigitalArt.box(root, pos + offset + Vector3(0, 1.5, 0), Vector3(0.5, 0.7, 0.3), DigitalArt.TEAL)
		leaf.rotation.z = 0.4
