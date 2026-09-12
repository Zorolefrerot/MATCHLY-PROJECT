class_name CharacterAccountPanel
extends Control
signal closed
signal edit_requested
signal village_requested
var origin_config_path: String = "user://server-origin.cfg"
var api: CharacterAccountAPI
var origin_field: LineEdit
var email_field: LineEdit
var password_field: LineEdit
var status_label: Label
var identity_label: Label
var login_button: Button
var edit_button: Button
var village_button: Button
var refresh_button: Button
var logout_button: Button
var back_button: Button

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var background := ColorRect.new()
	background.color = Color("101e26")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_"+side, 24)
	add_child(margin)
	var scroll := ScrollContainer.new()
	margin.add_child(scroll)
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.add_theme_constant_override("separation", 10)
	scroll.add_child(column)
	column.add_child(_label("MON PERSONNAGE · COMPTE DU SITE", 27))
	column.add_child(_label("Joueur admis uniquement. Le compte propriétaire ne consomme pas de place.\nKonoha : quartier partagé et duel de test à deux joueurs admis. La progression réelle n’est pas encore persistante.", 16))
	origin_field = _field("Adresse exacte du site : https://ton-site.onrender.com", column)
	email_field = _field("E-mail du compte joueur", column)
	email_field.virtual_keyboard_type = LineEdit.KEYBOARD_TYPE_EMAIL_ADDRESS
	password_field = _field("Mot de passe du site", column)
	password_field.secret = true
	password_field.virtual_keyboard_type = LineEdit.KEYBOARD_TYPE_PASSWORD
	var config := ConfigFile.new()
	if config.load(origin_config_path) == OK:
		origin_field.text = CharacterAccountAPI.normalize_origin(str(config.get_value("server", "origin", "")))
	column.add_child(_label("Vérifie l’adresse avant de saisir ton mot de passe. Aucun lien inconnu.\nLa première connexion peut prendre environ une minute (hébergement gratuit).", 15))
	login_button = _button("SE CONNECTER", _login, column)
	identity_label = _label("Aucun personnage connecté.", 19)
	column.add_child(identity_label)
	village_button = _button("ENTRER À KONOHA · VILLAGE PARTAGÉ", func() -> void: _waiting(); village_requested.emit(), column)
	village_button.add_theme_stylebox_override("normal", TrainingHUD.panel_style(Color("39776b")))
	status_label = _label("Le mot de passe et la session restent uniquement en mémoire.", 16)
	column.add_child(status_label)
	var actions := HBoxContainer.new()
	column.add_child(actions)
	edit_button = _button("MODIFIER L’APPARENCE", func() -> void: edit_requested.emit(), actions)
	refresh_button = _button("ACTUALISER", func() -> void: _waiting(); api.refresh(), actions)
	logout_button = _button("DÉCONNEXION", func() -> void: _waiting(); api.logout(), actions)
	back_button = _button("RETOUR À L’ENTRAÎNEMENT HORS LIGNE", close, column)
	api.completed.connect(_completed)
	_update_controls()
	hide()

func _field(placeholder: String, parent: Node) -> LineEdit:
	var field := LineEdit.new()
	field.placeholder_text = placeholder
	field.custom_minimum_size.y = 44
	field.add_theme_font_size_override("font_size", 18)
	parent.add_child(field)
	return field

func _label(text: String, font_size: int) -> Label:
	var label := Label.new()
	label.text = text
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", font_size)
	return label

func _button(text: String, action: Callable, parent: Node) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size.y = 46
	button.add_theme_font_size_override("font_size", 16)
	button.add_theme_stylebox_override("normal", TrainingHUD.panel_style(Color("29454b")))
	button.pressed.connect(action)
	parent.add_child(button)
	return button

func open() -> void:
	show()
	_update_controls()

func close() -> void:
	if api.busy:
		return
	password_field.clear()
	hide()
	closed.emit()

func _login() -> void:
	var password: String = password_field.text
	password_field.clear()
	_waiting()
	api.login(origin_field.text, email_field.text, password)
	password = ""

func _waiting() -> void:
	status_label.text = "Connexion en cours… patiente pendant le réveil éventuel du serveur."
	for button in [login_button, edit_button, village_button, refresh_button, logout_button, back_button]:
		button.disabled = true
	for field in [origin_field, email_field, password_field]:
		field.editable = false

func _completed(operation: String, success: bool, message: String) -> void:
	status_label.text = message
	if success and operation == "login":
		email_field.clear()
		var config := ConfigFile.new()
		config.set_value("server", "origin", CharacterAccountAPI.normalize_origin(origin_field.text))
		config.save(origin_config_path) # Public origin only, no credential.
	_update_controls()

func _update_controls() -> void:
	var connected: bool = not api.profile.is_empty()
	login_button.disabled = api.busy or connected
	edit_button.disabled = api.busy or not connected
	village_button.disabled = api.busy or not connected
	refresh_button.disabled = api.busy or not connected
	logout_button.disabled = api.busy or not connected
	back_button.disabled = api.busy
	for field in [origin_field, email_field, password_field]:
		field.editable = not api.busy and not connected
	if connected:
		var character: Dictionary = api.profile["character"]
		identity_label.text = "%s · %s de %s\nClan : %s · Affinité : %s · Potentiel Mokuton : %s\nApparence du compte : %s" % [character["name"], character["rank"], character["village"], character["clan"], character["affinity"], "oui, à éveiller" if character["mokuton"] else "non", "à créer" if api.profile["revision"] == 0 else "sauvegardée"]
	else:
		identity_label.text = "Aucun personnage connecté."
