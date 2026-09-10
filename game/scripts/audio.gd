class_name TrainingAudio
extends Node
## Small fixed voice pool, owner-provided offline PCM + original warning, no microphone/network.
const MAX_VOICES: int = 8
const BUS := "TrainingMix"
const CLIPS: Dictionary = {
	"katon": preload("res://assets/audio/katon.wav"),
	"raiton": preload("res://assets/audio/raiton.wav"),
	"futon": preload("res://assets/audio/futon.wav"),
	"doton": preload("res://assets/audio/doton.wav"),
	"earth_impact": preload("res://assets/audio/earth_impact.wav"),
	"melee": preload("res://assets/audio/melee.wav"),
	"hit": preload("res://assets/audio/hit.wav"),
	"dodge": preload("res://assets/audio/dodge.wav"),
	"warning": preload("res://assets/audio/warning.wav"),
}
var voices: Array[AudioStreamPlayer] = []
var music: AudioStreamPlayer
var volume: float = 0.6
var ambience_enabled: bool = true
var active: bool = false
var suspended: bool = true
var cursor: int = 0
var play_count: int = 0

func _ready() -> void:
	if AudioServer.get_bus_index(BUS) < 0:
		AudioServer.add_bus()
		var index: int = AudioServer.bus_count - 1
		AudioServer.set_bus_name(index, BUS)
		var limiter := AudioEffectLimiter.new()
		limiter.threshold_db = -3.0
		limiter.ceiling_db = -1.0
		AudioServer.add_bus_effect(index, limiter)
	for i in range(MAX_VOICES):
		var voice := AudioStreamPlayer.new()
		voice.bus = BUS
		voice.volume_db = -5
		add_child(voice)
		voices.append(voice)
	music = AudioStreamPlayer.new()
	music.bus = BUS
	music.volume_db = -20
	var loop: AudioStreamWAV = preload("res://assets/audio/combat_loop.wav").duplicate()
	loop.loop_mode = AudioStreamWAV.LOOP_FORWARD
	loop.loop_begin = 0
	loop.loop_end = roundi(loop.get_length() * loop.mix_rate)
	music.stream = loop
	add_child(music)
	set_volume(volume)

func set_volume(value: float) -> void:
	volume = clampf(value, 0.0, 1.0)
	var index: int = AudioServer.get_bus_index(BUS)
	if index >= 0:
		AudioServer.set_bus_mute(index, volume == 0.0)
		AudioServer.set_bus_volume_db(index, linear_to_db(maxf(volume, 0.0001)))

func set_ambience(enabled: bool) -> void:
	ambience_enabled = enabled
	if not enabled:
		music.stop()
	elif active and not suspended and not music.playing:
		music.play()

func start_round() -> void:
	stop_round()
	active = true
	suspended = false
	music.stream_paused = false
	if ambience_enabled:
		music.play()

func stop_round() -> void:
	active = false
	for voice in voices:
		voice.stop()
	music.stop()

func set_suspended(value: bool) -> void:
	suspended = value
	music.stream_paused = value
	if value:
		for voice in voices:
			voice.stop()
	elif active and ambience_enabled and not music.playing:
		music.play()

func play_sfx(cue: String) -> bool:
	if not active or suspended or volume == 0 or not CLIPS.has(cue):
		return false
	# Owner recordings are longer than the placeholder bleeps. Restart a cue
	# already in progress instead of stacking several copies of the same sound.
	var voice: AudioStreamPlayer = null
	for candidate in voices:
		if candidate.playing and candidate.get_meta("cue", "") == cue:
			voice = candidate
			break
	if voice == null:
		for candidate in voices:
			if not candidate.playing:
				voice = candidate
				break
	if voice == null:
		voice = voices[cursor]
	cursor = (cursor + 1) % MAX_VOICES
	voice.stop()
	voice.set_meta("cue", cue)
	voice.volume_db = -2.0 if cue == "warning" else -5.0
	voice.stream = CLIPS[cue]
	voice.pitch_scale = 1.0
	voice.play()
	play_count += 1
	return true
