class_name DialogueSystem
extends RefCounted
signal line_changed(speaker: String, text: String)
signal closed
var lines: Array = []
var cursor := -1
var active := false
var database: Dictionary = {}
var on_complete: Callable

func _init() -> void:
	database = JSON.parse_string(FileAccess.get_file_as_string("res://resources/dialogues.json"))

func start(id: String, callback: Callable = Callable()) -> void:
	if active or not database.has(id):
		return
	lines = database[id]
	cursor = -1
	on_complete = callback
	active = true
	next()

func next() -> void:
	if not active:
		return
	cursor += 1
	if cursor < lines.size():
		line_changed.emit(lines[cursor][0], lines[cursor][1])
	else:
		active = false
		closed.emit()
		if on_complete.is_valid():
			on_complete.call()
