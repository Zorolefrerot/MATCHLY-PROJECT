class_name SaveStore
extends RefCounted
## Atomic replacement + previous valid copy. Never overwrite a save with partial JSON.
const PATH := "user://adventure.json"
const SETTINGS_PATH := "user://settings.json"
const VERSION := 1
static var game_path := PATH
static var settings_path := SETTINGS_PATH

static func write_json(path: String, data: Dictionary) -> bool:
	var file := FileAccess.open(path + ".tmp", FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(data, "\t"))
	file.flush()
	var error := file.get_error()
	file.close()
	if error != OK:
		return false
	var absolute := ProjectSettings.globalize_path(path)
	if FileAccess.file_exists(path):
		DirAccess.copy_absolute(absolute, absolute + ".bak")
	return DirAccess.rename_absolute(absolute + ".tmp", absolute) == OK

static func read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var value: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return value if value is Dictionary else {}

static func valid(data: Dictionary) -> bool:
	if data.get("version") != VERSION or data.get("world") != "system_city":
		return false
	var point: Variant = data.get("checkpoint")
	if not point is Array or point.size() != 3:
		return false
	for coordinate in point:
		if not (coordinate is int or coordinate is float) or not is_finite(float(coordinate)):
			return false
	if abs(float(point[0])) > 30 or abs(float(point[2])) > 30 or float(point[1]) < 0 or float(point[1]) > 5:
		return false
	var mission: Variant = data.get("mission")
	return mission is Dictionary and MissionProgress.new().restore(mission)

static func load_game() -> Dictionary:
	for path in [game_path, game_path + ".bak"]:
		var data := read_json(path)
		if valid(data):
			return data
	return {}
