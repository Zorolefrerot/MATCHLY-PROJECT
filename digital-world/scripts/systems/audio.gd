extends Node
var music: AudioStreamPlayer
var effects: Array[AudioStreamPlayer] = []
var cursor := 0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	music = AudioStreamPlayer.new()
	music.bus = "Music"
	music.stream = load("res://assets/audio/system_city.wav")
	add_child(music)
	music.play()
	for i in 6:
		var player := AudioStreamPlayer.new()
		player.bus = "SFX"
		effects.append(player)
		add_child(player)
	GameState.settings_changed.connect(apply_settings)
	apply_settings()

func apply_settings() -> void:
	for pair in [["Music", "music"], ["SFX", "sfx"]]:
		var index := AudioServer.get_bus_index(pair[0])
		var value: float = GameState.settings[pair[1]]
		AudioServer.set_bus_volume_db(index, linear_to_db(maxf(value, 0.001)))
		AudioServer.set_bus_mute(index, value < 0.001)

func effect(id: String) -> void:
	var path := "res://assets/audio/" + id + ".wav"
	if not ResourceLoader.exists(path):
		return
	var player := effects[cursor]
	cursor = (cursor + 1) % effects.size()
	player.stream = load(path)
	player.play()

func stop_all() -> void:
	# Release active WAV playbacks before shutdown, including the Dummy audio driver.
	if is_instance_valid(music):
		music.stop()
		music.stream = null
	for player in effects:
		if is_instance_valid(player):
			player.stop()
			player.stream = null
