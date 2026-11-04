extends Node
signal saved(success: bool)
signal settings_changed

var mission := MissionProgress.new()
var checkpoint := Vector3(0, 0.2, 14)
var settings := {"music": 0.65, "sfx": 0.8, "sensitivity": 0.75, "low_graphics": true}
var active := false

func _ready() -> void:
	for key in settings:
		var value: Variant = SaveStore.read_json(SaveStore.settings_path).get(key)
		if key == "low_graphics" and value is bool:
			settings[key] = value
		elif key != "low_graphics" and (value is float or value is int):
			settings[key] = clampf(float(value), 0.0, 1.0)
	_install_inputs()
	process_mode = Node.PROCESS_MODE_ALWAYS

func _install_inputs() -> void:
	var mappings := {
		"move_forward": [KEY_W, KEY_Z, KEY_UP], "move_back": [KEY_S, KEY_DOWN],
		"move_left": [KEY_A, KEY_Q, KEY_LEFT], "move_right": [KEY_D, KEY_RIGHT],
		"jump": [KEY_SPACE], "run": [KEY_SHIFT], "interact": [KEY_E],
		"action": [KEY_F], "pause": [KEY_ESCAPE]}
	for action in mappings:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for code in mappings[action]:
			var event := InputEventKey.new()
			event.physical_keycode = code
			InputMap.action_add_event(action, event)

func new_game() -> void:
	mission = MissionProgress.new()
	checkpoint = Vector3(0, 0.2, 14)
	active = true
	save_game()

func continue_game() -> bool:
	var data := SaveStore.load_game()
	if data.is_empty():
		return false
	var progress := MissionProgress.new()
	if not progress.restore(data["mission"]):
		return false
	mission = progress
	var point: Array = data["checkpoint"]
	checkpoint = Vector3(point[0], point[1], point[2])
	active = true
	return true

func save_game() -> bool:
	if not active:
		return false
	var data := {"version": SaveStore.VERSION, "world": "system_city",
		"checkpoint": [checkpoint.x, checkpoint.y, checkpoint.z], "mission": mission.serialize()}
	var success := SaveStore.write_json(SaveStore.game_path, data)
	saved.emit(success)
	return success

func update_setting(key: String, value: Variant) -> void:
	if not settings.has(key):
		return
	settings[key] = value
	SaveStore.write_json(SaveStore.settings_path, settings)
	settings_changed.emit()

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_CLOSE_REQUEST:
		save_game()
