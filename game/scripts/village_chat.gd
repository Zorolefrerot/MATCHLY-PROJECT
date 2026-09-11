class_name VillageChat
extends Control
## Plain text only. Last 50 received lines in RAM, discarded with the visit.
signal closed
signal send_requested(channel: String, text: String)
var panel: PanelContainer
var history: RichTextLabel
var input: LineEdit
var channel: OptionButton
var send_button: Button
var status: Label
var lines: Array[String] = []
var message_ids: Array[String] = []
var online: bool = false
var pending: int = -1
var pending_seconds: float = 0.0
var network_status: String = "Hors ligne"

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel",TrainingHUD.panel_style(Color("182c30")))
	add_child(panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation",8)
	panel.add_child(column)
	var heading := HBoxContainer.new()
	column.add_child(heading)
	var title := Label.new()
	title.text = "PROXIMITÉ · RP / HRP"
	title.add_theme_font_size_override("font_size",24)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	heading.add_child(title)
	var back := Button.new()
	back.text = "FERMER"
	back.custom_minimum_size = Vector2(120,44)
	back.pressed.connect(func() -> void: closed.emit())
	heading.add_child(back)
	status = Label.new()
	status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	status.add_theme_font_size_override("font_size",16)
	status.custom_minimum_size.y = 38
	column.add_child(status)
	history = RichTextLabel.new()
	history.bbcode_enabled = false
	history.scroll_following = true
	history.custom_minimum_size.y = 70
	history.size_flags_vertical = Control.SIZE_EXPAND_FILL
	history.add_theme_font_size_override("normal_font_size",19)
	column.add_child(history)
	var compose := HBoxContainer.new()
	column.add_child(compose)
	channel = OptionButton.new()
	channel.add_item("RP")
	channel.add_item("HRP")
	channel.custom_minimum_size = Vector2(84,48)
	compose.add_child(channel)
	input = LineEdit.new()
	input.placeholder_text = "Message à proximité (240 caractères)"
	input.max_length = 240
	input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	input.custom_minimum_size.y = 48
	input.text_submitted.connect(func(_value: String) -> void: _submit())
	compose.add_child(input)
	send_button = Button.new()
	send_button.text = "ENVOYER"
	send_button.custom_minimum_size = Vector2(125,48)
	send_button.pressed.connect(_submit)
	compose.add_child(send_button)
	var privacy := Label.new()
	privacy.text = "12 m · Pas de canal global · 50 messages locaux maximum · Effacés à la sortie"
	privacy.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	privacy.add_theme_font_size_override("font_size",14)
	column.add_child(privacy)
	set_network(false,"Hors ligne")
	hide()

func _process(delta: float) -> void:
	if pending >= 0:
		pending_seconds += delta
		if pending_seconds > 8:
			uncertain()
	if not visible:
		return
	var physical_height: float = maxf(1,DisplayServer.window_get_size().y)
	var keyboard: float = DisplayServer.virtual_keyboard_get_height()*size.y/physical_height if DisplayServer.has_feature(DisplayServer.FEATURE_VIRTUAL_KEYBOARD) else 0.0
	var available: float = maxf(290,size.y-keyboard-24)
	panel.size = Vector2(minf(780,size.x-32),minf(510,available))
	panel.position = Vector2((size.x-panel.size.x)/2,maxf(12,(size.y-keyboard-panel.size.y)/2))

func _submit() -> void:
	if not online or pending >= 0:
		return
	var text: String = input.text.strip_edges()
	if not VillageLink.plain(text,240):
		status.text = "Texte vide, trop long ou caractères de contrôle interdits."
		return
	send_requested.emit(channel.get_item_text(channel.selected),text)

func mark_pending(sequence: int) -> void:
	pending = sequence
	pending_seconds = 0.0
	send_button.disabled = not online or pending >= 0
	if pending >= 0:
		input.editable = false
		status.text = "Envoi en cours…"
	else:
		status.text = "Envoi non confirmé : vérifie le fil avant de renvoyer."

func uncertain() -> void:
	pending = -1
	input.editable = true
	send_button.disabled = not online
	status.text = "Envoi non confirmé : vérifie le fil avant de renvoyer."

func acknowledge(sequence: int) -> void:
	if sequence != pending or pending < 0:
		return
	pending = -1
	input.text = ""
	input.editable = true
	send_button.disabled = not online
	status.text = network_status

func set_network(value: bool, message: String) -> void:
	online = value
	network_status = message
	if not value and pending >= 0:
		uncertain()
	else:
		status.text = message
	send_button.disabled = not online or pending >= 0

func add_message(event: Dictionary) -> void:
	if event["id"] in message_ids:
		return
	message_ids.append(event["id"])
	lines.append("[%s] %s : %s" % [event["channel"],event["name"],event["text"]])
	if lines.size() > 50:
		lines.pop_front()
		message_ids.pop_front()
	history.text = "\n".join(lines) # No parse_bbcode / append_text interpretation.

func open() -> void:
	show()
	# Keyboard is opened only when the player touches the input.

func close_panel() -> void:
	input.release_focus()
	if DisplayServer.has_feature(DisplayServer.FEATURE_VIRTUAL_KEYBOARD):
		DisplayServer.virtual_keyboard_hide()
	hide()
