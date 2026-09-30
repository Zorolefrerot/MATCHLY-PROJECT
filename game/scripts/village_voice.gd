class_name VillageVoice
extends Control
## Microphone ouvert et voix de proximité du village.
## Le serveur relaie uniquement des paquets PCM8 courts aux pairs situés à 5 m.
## Aucun échantillon n'est écrit sur disque ou envoyé à HTTP.

const VOICE_RANGE_METERS := 5.0
const SAMPLE_RATE := 8000
const PACKET_SAMPLES := 160 # 20 ms à 8 kHz, 160 octets avant base64.
const MAX_CAPTURE_SAMPLES := 4096

var village_link: VillageLink
var muted: bool = false
var capture_player: AudioStreamPlayer
var capture_effect: AudioEffectCapture
var playback_player: AudioStreamPlayer
var playback: AudioStreamGeneratorPlayback
var capture_bus: int = -1
var source_rate: int = 48000
var resample_phase: int = 0
var outgoing: PackedByteArray = PackedByteArray()
var button: Button
var status: Label
var capture_ready: bool = false
var last_connected: bool = false
var sequence: int = 0

func configure(link: VillageLink) -> void:
	village_link = link
	_build_ui()
	_start_audio()

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	resized.connect(_layout)

func _build_ui() -> void:
	if is_instance_valid(button):
		return
	button = Button.new()
	button.name = "VoiceToggle"
	button.mouse_filter = Control.MOUSE_FILTER_STOP
	button.focus_mode = Control.FOCUS_NONE
	button.custom_minimum_size = Vector2(228, 42)
	button.add_theme_font_size_override("font_size", 14)
	button.add_theme_stylebox_override("normal", TrainingHUD.panel_style(Color(0.07, 0.13, 0.15, 0.92), Color("6d9d86"), 8))
	button.add_theme_stylebox_override("pressed", TrainingHUD.panel_style(Color("754445"), Color("ed6567"), 8))
	button.pressed.connect(toggle_mute)
	add_child(button)
	status = Label.new()
	status.mouse_filter = Control.MOUSE_FILTER_IGNORE
	status.add_theme_font_size_override("font_size", 12)
	status.add_theme_color_override("font_color", Color("d2dfd1"))
	status.text = "VOIX · portée 5 m"
	add_child(status)
	_layout()
	_update_ui()

func _layout() -> void:
	if not is_instance_valid(button):
		return
	button.position = Vector2(20, 360)
	button.size = Vector2(228, 42)
	status.position = Vector2(24, 404)
	status.size = Vector2(230, 24)

func _voice_bus() -> int:
	var index := AudioServer.get_bus_index("VoiceCapture")
	if index >= 0:
		return index
	AudioServer.add_bus()
	index = AudioServer.bus_count - 1
	AudioServer.set_bus_name(index, "VoiceCapture")
	return index

func _start_audio() -> void:
	if OS.has_feature("android"):
		# The export manifest declares RECORD_AUDIO; request its runtime grant on
		# first entry instead of silently transmitting an empty microphone.
		OS.request_permission("android.permission.RECORD_AUDIO")
	# Capture and playback are separate nodes. The capture bus is muted to avoid
	# feeding the local microphone back into the local speakers.
	source_rate = maxi(8000, int(AudioServer.get_mix_rate()))
	capture_bus = _voice_bus()
	capture_effect = AudioEffectCapture.new()
	capture_effect.buffer_length = 0.25
	AudioServer.add_bus_effect(capture_bus, capture_effect)
	AudioServer.set_bus_mute(capture_bus, true)
	capture_player = AudioStreamPlayer.new()
	capture_player.name = "MicrophoneCapture"
	capture_player.bus = "VoiceCapture"
	capture_player.stream = AudioStreamMicrophone.new()
	add_child(capture_player)
	# Do not open the input device before the WSS session is admitted.
	capture_ready = true

	var generator := AudioStreamGenerator.new()
	generator.mix_rate = SAMPLE_RATE
	generator.buffer_length = 0.5
	playback_player = AudioStreamPlayer.new()
	playback_player.name = "ProximityVoicePlayback"
	playback_player.stream = generator
	playback_player.volume_db = -7.0
	add_child(playback_player)
	playback_player.play()
	playback = playback_player.get_stream_playback() as AudioStreamGeneratorPlayback

func _process(_delta: float) -> void:
	if not is_instance_valid(village_link):
		return
	if last_connected != village_link.connected:
		last_connected = village_link.connected
		_update_ui()
	var should_capture := not muted and village_link.connected and capture_ready
	if should_capture:
		if not capture_player.playing:
			capture_player.play()
		_capture_microphone()
	elif is_instance_valid(capture_player) and capture_player.playing:
		capture_player.stop()
		outgoing.clear()
		_discard_capture_buffer()

func _discard_capture_buffer() -> void:
	if not is_instance_valid(capture_effect):
		return
	var available := capture_effect.get_frames_available()
	if available > 0:
		capture_effect.get_buffer(available)

func _capture_microphone() -> void:
	if not is_instance_valid(capture_effect):
		return
	var available := capture_effect.get_frames_available()
	if available <= 0:
		return
	var frames := capture_effect.get_buffer(mini(available, 1024))
	for frame: Vector2 in frames:
		# Downsample the engine mix to 8 kHz before quantising. This keeps a
		# 20 ms packet under the village WebSocket's 1 KiB payload ceiling.
		resample_phase += SAMPLE_RATE
		if resample_phase >= source_rate:
			resample_phase -= source_rate
			var mono := clampf((frame.x + frame.y) * 0.5, -1.0, 1.0)
			outgoing.append(clampi(int(round((mono * 0.5 + 0.5) * 255.0)), 0, 255))
	if outgoing.size() > MAX_CAPTURE_SAMPLES:
		outgoing = outgoing.slice(outgoing.size() - MAX_CAPTURE_SAMPLES)
	while outgoing.size() >= PACKET_SAMPLES:
		var packet := PackedByteArray()
		for index in range(PACKET_SAMPLES):
			packet.append(outgoing[index])
		outgoing = outgoing.slice(PACKET_SAMPLES)
		village_link.send_voice(Marshalls.raw_to_base64(packet), sequence)
		sequence += 1

func receive_voice(event: Dictionary) -> void:
	if muted or not is_instance_valid(playback):
		return
	var raw: PackedByteArray = Marshalls.base64_to_raw(str(event.get("data", "")))
	if raw.is_empty() or raw.size() > PACKET_SAMPLES + 32:
		return
	if playback.get_frames_available() < raw.size():
		return
	for sample: int in raw:
		var value := (float(sample) - 127.5) / 127.5
		playback.push_frame(Vector2(value, value))

func toggle_mute() -> void:
	muted = not muted
	outgoing.clear()
	_update_ui()

func _update_ui() -> void:
	if not is_instance_valid(button):
		return
	button.text = "🎙 MICRO OUVERT · 5 m" if not muted else "🔇 MICRO COUPÉ · 5 m"
	button.disabled = not is_instance_valid(village_link) or not village_link.connected
	if not is_instance_valid(village_link) or not village_link.connected:
		status.text = "VOIX · en attente de la connexion"
	elif muted:
		status.text = "VOIX · désactivée localement"
	else:
		status.text = "VOIX · seuls les joueurs à 5 m entendent"

func shutdown() -> void:
	muted = true
	outgoing.clear()
	if is_instance_valid(capture_player):
		capture_player.stop()
	if is_instance_valid(playback_player):
		playback_player.stop()
	if capture_bus >= 0 and capture_bus < AudioServer.bus_count:
		AudioServer.remove_bus_effect(capture_bus, 0)
	capture_bus = -1
	capture_ready = false
	capture_effect = null

func _exit_tree() -> void:
	shutdown()
