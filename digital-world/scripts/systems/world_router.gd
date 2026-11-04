class_name WorldRouter
extends RefCounted
## Only registered worlds may be loaded. Add future kingdoms here, not in the HUD.
const WORLDS := {"system_city": preload("res://scenes/worlds/system_city.tscn")}

static func create(id: String) -> Node3D:
	if not WORLDS.has(id):
		push_error("Unregistered world: " + id)
		return null
	return WORLDS[id].instantiate()
