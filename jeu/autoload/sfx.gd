extends Node
## Effets sonores générés par code (AudioStreamWAV) — aucun fichier audio requis.

var _streams: Dictionary = {}
var _player: AudioStreamPlayer

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_player = AudioStreamPlayer.new()
	add_child(_player)
	_streams["blip"] = _build([[660.0, 0.05, 0.30]])
	_streams["talk"] = _build([[980.0, 0.03, 0.18]])
	_streams["pickup"] = _build([[880.0, 0.06, 0.35], [1320.0, 0.09, 0.35]])
	_streams["denied"] = _build([[220.0, 0.07, 0.30], [165.0, 0.10, 0.30]])
	_streams["success"] = _build([
		[523.0, 0.09, 0.35], [659.0, 0.09, 0.35],
		[784.0, 0.09, 0.35], [1047.0, 0.16, 0.40],
	])

func play(sound_name: String) -> void:
	if _streams.has(sound_name):
		_player.stream = _streams[sound_name]
		_player.play()

func _build(notes: Array) -> AudioStreamWAV:
	var bytes := PackedByteArray()
	for note in notes:
		bytes.append_array(_tone(float(note[0]), float(note[1]), float(note[2])))
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = 22050
	wav.stereo = false
	wav.data = bytes
	return wav

func _tone(freq: float, duration: float, volume: float) -> PackedByteArray:
	var count := int(duration * 22050.0)
	var out := PackedByteArray()
	out.resize(count * 2)
	for i in count:
		var time := float(i) / 22050.0
		var envelope := 1.0 - float(i) / float(count)
		var sample := sin(TAU * freq * time) * envelope * volume
		out.encode_s16(i * 2, int(clampf(sample, -1.0, 1.0) * 32767.0))
	return out
