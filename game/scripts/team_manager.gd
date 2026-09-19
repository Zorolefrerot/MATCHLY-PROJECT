class_name TeamManager
extends Node3D
## Présentation client du système de candidature et d'équipes de l'Académie.
## Le serveur décide de tout (candidature, invitations, composition, numéro,
## Sensei, statuts) ; ce script affiche l'état validé et envoie les actions
## faites physiquement à la réception. Les portraits sont générés localement
## depuis les références d'apparence du réseau (NinjaPortrait), jamais des
## copies d'images transférées. Tout reste léger pour Android : textures 96×96
## en cache, listes courtes, une seule scène de cérémonie.

signal focus_requested

# The reception refresh closes the spawn-time gap before the list is opened.
const DOOR_INSIDE := Vector3(-46.0, 0.35, -19.0)
const DOOR_OUTSIDE := Vector3(-46.0, 0.35, -17.0)
const CEREMONY_STAND_SECONDS := 120.0

var player: TrainingFighter
var hud: KonohaHUD
var village_link: VillageLink

var unlocked: bool = false
var revision: int = 0
var message: String = ""
var near_reception: bool = false
var self_candidate: Dictionary = {}
var candidates: Array = []
var invites: Array = []
var team: Dictionary = {}
var last_signature: String = ""
var first_state: bool = true
var prev_own_status: String = "none"
var seen_invites: Dictionary = {}
var refresh_pending: bool = false
var played_ceremonies: Dictionary = {}

var root: Control
var dim: ColorRect
var panel: PanelContainer
var panel_column: VBoxContainer
var panel_title: Label
var panel_text: Label
var panel_list: ScrollContainer
var panel_list_column: VBoxContainer
var panel_buttons: VBoxContainer
var invite_card: PanelContainer
var view: String = ""
var profile_target: Dictionary = {}
var ceremony_lines: Array = []
var ceremony_index: int = 0
var ceremony_sensei: Dictionary = {}
var sensei_node: TeamSensei

func configure(value_player: TrainingFighter, value_hud: KonohaHUD) -> void:
	player = value_player
	hud = value_hud
	_build_ui()

func set_link(value: VillageLink) -> void:
	village_link = value

func _process(_delta: float) -> void:
	# The socket state is authoritative for every action, but the server only
	# broadcasts team state when it changes. Locally mirror the physical counter
	# distance so the list becomes available as soon as the player walks there.
	if not is_instance_valid(player):
		return
	var local_near := Vector2(player.global_position.x + 37.5, player.global_position.z + 21.4).length() <= 4.0
	if local_near != near_reception:
		near_reception = local_near
		if view != "":
			_render()
		if near_reception:
			_request_refresh()

static func valid_state(value: Variant) -> bool:
	if not value is Dictionary:
		return false
	if int(value.get("schemaVersion", -1)) != 1:
		return false
	if not value.get("unlocked") is bool:
		return false
	if not value.get("candidates") is Array or not value.get("invites") is Array:
		return false
	if value.get("self") != null and not value.get("self") is Dictionary:
		return false
	if value.get("team") != null and not value.get("team") is Dictionary:
		return false
	return true

static func status_label(status: String) -> String:
	match status:
		"recherche": return "🟡 En recherche d’équipe"
		"forming": return "🟢 Groupe en formation"
		"official": return "🔵 Équipe créée"
	return "Inconnu"

static func team_label(number: int) -> String:
	return "ÉQUIPE %03d" % number if number > 0 else ""

# --------------------------------------------------------------------- état
func apply_state(value: Dictionary) -> void:
	if not valid_state(value):
		return
	unlocked = bool(value["unlocked"])
	revision = int(value.get("revision", revision))
	message = str(value.get("message", ""))
	near_reception = bool(value.get("nearReception", false))
	self_candidate = value["self"] if value.get("self") is Dictionary else {}
	team = value["team"] if value.get("team") is Dictionary else {}
	candidates.clear()
	for item: Variant in value["candidates"]:
		if item is Dictionary:
			candidates.append(item)
	var signature := JSON.stringify([revision, self_candidate, team, value["invites"], candidates])
	var state_changed := signature != last_signature
	last_signature = signature
	_update_invites(value["invites"] if value["invites"] is Array else [])
	if state_changed:
		_announce_own_status()
		if view != "":
			_render()
	_check_ceremony()
	first_state = false

func apply_profile(value: Dictionary) -> void:
	# Profil HTTP (reconnexion sans WSS) : état durable uniquement, la liste des
	# candidats exige la présence à la réception et arrive par le village.
	if not value.get("unlocked") is bool:
		return
	unlocked = bool(value["unlocked"])
	message = str(value.get("message", message))
	if value.get("self") is Dictionary:
		self_candidate = value["self"]
	elif value.get("self") == null:
		self_candidate = {}
	if value.get("team") is Dictionary:
		team = value["team"]
	elif value.get("team") == null:
		team = {}
	_announce_own_status()
	if view != "":
		_render()

func handle_network_event(event: Dictionary) -> void:
	match str(event.get("type", "")):
		"team_state":
			refresh_pending = false
			apply_state(event)
		"team_action_ack":
			refresh_pending = false
			var state: Variant = event.get("state")
			if state is Dictionary:
				apply_state(state)

func notify_error(text: String) -> void:
	if is_instance_valid(hud):
		hud.notice(text)

func own_status() -> String:
	if team.get("status") == "official":
		return "official"
	if team.get("status") == "forming":
		return "forming"
	if not self_candidate.is_empty():
		return "recherche"
	return "none"

func _announce_own_status() -> void:
	var status := own_status()
	if status == prev_own_status or not is_instance_valid(hud):
		return
	var number := int(team.get("number", 0))
	match status:
		"recherche":
			hud.notice("🟡 Candidature déposée : tu apparais dans la liste des candidats.")
		"forming":
			hud.notice("🟢 Groupe en formation · %d/3 membres confirmés." % _team_member_count())
		"official":
			hud.notice("🔵 %s est officielle !" % team_label(number))
		"none":
			if prev_own_status != "none" and not first_state:
				hud.notice("Candidature retirée : tu peux te réinscrire à la réception.")
	prev_own_status = status

func _team_member_count() -> int:
	var members: Variant = team.get("members")
	return members.size() if members is Array else 0

# --------------------------------------------------------------- invitations
func _update_invites(value: Array) -> void:
	invites.clear()
	for item: Variant in value:
		if item is Dictionary:
			invites.append(item)
			var key := "%s|%d" % [str(item.get("fromKey", "")), int(item.get("teamId", 0))]
			if not seen_invites.has(key) and not first_state:
				seen_invites[key] = true
				if is_instance_valid(hud):
					hud.notice("📩 %s t’invite à rejoindre son groupe." % str(item.get("fromName", "Un candidat")))
			elif not seen_invites.has(key):
				seen_invites[key] = true
	_refresh_invite_card()

func _refresh_invite_card() -> void:
	if not is_instance_valid(invite_card):
		return
	if invites.is_empty():
		invite_card.hide()
		return
	var invite: Dictionary = invites[0]
	var card_column: VBoxContainer = invite_card.get_node("Margin/VBox")
	for child: Node in card_column.get_children():
		child.queue_free()
	var heading := Label.new()
	heading.text = "📱 NOTIFICATION · INVITATION D’ÉQUIPE"
	heading.add_theme_font_size_override("font_size", 13)
	heading.add_theme_color_override("font_color", Color("ffe0a3"))
	card_column.add_child(heading)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	invite_card.get_node("Margin/VBox").add_child(row)
	var portrait := TextureRect.new()
	portrait.texture = NinjaPortrait.texture(invite.get("fromAppearance", {}))
	portrait.custom_minimum_size = Vector2(52, 52)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	row.add_child(portrait)
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(column)
	var who := Label.new()
	who.text = "%s · Clan %s · Niv %d" % [str(invite.get("fromName", "Candidat")), str(invite.get("fromClan", "—")), int(invite.get("fromLevel", 1))]
	who.add_theme_font_size_override("font_size", 14)
	who.add_theme_color_override("font_color", Color("f4ead2"))
	column.add_child(who)
	var line := Label.new()
	line.text = "t’invite à rejoindre son groupe (🟢 en formation)."
	line.add_theme_font_size_override("font_size", 12)
	line.add_theme_color_override("font_color", Color("bfd0c7"))
	column.add_child(line)
	var actions := VBoxContainer.new()
	row.add_child(actions)
	var accept := _button("ACCEPTER", Color("4d7a52"))
	accept.pressed.connect(func() -> void: _send("accept"))
	actions.add_child(accept)
	var decline := _button("REFUSER", Color("7a4d4d"))
	decline.pressed.connect(func() -> void: _send("decline"))
	actions.add_child(decline)
	invite_card.show()

# ------------------------------------------------------------------ cérémonie
func _check_ceremony() -> void:
	if team.is_empty() or team.get("status") != "official":
		return
	var ceremony: Variant = team.get("ceremony")
	if not ceremony is Dictionary:
		return
	var team_id := int(team.get("id", 0))
	if played_ceremonies.has(team_id):
		return
	played_ceremonies[team_id] = true
	if first_state:
		# Reconnexion pendant la fenêtre : la cérémonie a déjà eu lieu.
		return
	ceremony_sensei = ceremony
	ceremony_lines = ceremony["lines"] if ceremony.get("lines") is Array else []
	ceremony_index = 0
	_spawn_sensei(ceremony)

func _spawn_sensei(ceremony: Dictionary) -> void:
	if not is_instance_valid(player):
		return
	if is_instance_valid(sensei_node):
		sensei_node.queue_free()
	var inside := _inside_academy(player.global_position)
	var spawn := DOOR_INSIDE if inside else _outside_spawn()
	var target := player.global_position
	# Le Sensei marche à la hauteur du sol réel du joueur (hall de l'Académie
	# ou village), jamais à une hauteur fixe inventée.
	spawn.y = target.y
	var offset := target - spawn
	offset.y = 0.0
	if offset.length() > 0.01:
		target = spawn + offset.normalized() * maxf(offset.length() - 1.7, 0.5)
	else:
		target = spawn + Vector3(0, 0, 2.0)
	sensei_node = TeamSensei.new()
	sensei_node.name = "TeamSensei_%d" % int(team.get("id", 0))
	add_child(sensei_node)
	sensei_node.configure(ceremony, spawn, target)
	sensei_node.arrived.connect(_on_sensei_arrived)
	if is_instance_valid(hud):
		hud.notice("%s approche de votre équipe…" % str(ceremony.get("senseiName", "Le Sensei")))
	var timer := get_tree().create_timer(CEREMONY_STAND_SECONDS)
	timer.timeout.connect(_release_sensei)

func _release_sensei() -> void:
	if is_instance_valid(sensei_node):
		sensei_node.queue_free()
		sensei_node = null

func _inside_academy(point: Vector3) -> bool:
	return point.x > -60.0 and point.x < -32.0 and point.z > -50.0 and point.z < -18.0

func _outside_spawn() -> Vector3:
	if not is_instance_valid(player):
		return DOOR_OUTSIDE
	var to_door := DOOR_OUTSIDE - player.global_position
	to_door.y = 0.0
	if to_door.length() < 8.0:
		return DOOR_OUTSIDE
	var spawn := player.global_position + to_door.normalized() * 7.0
	spawn.y = player.global_position.y
	return spawn

func _on_sensei_arrived() -> void:
	if is_instance_valid(hud):
		hud.notice("%s · %s" % [str(ceremony_sensei.get("senseiName", "Sensei")), str(ceremony_sensei.get("senseiTitle", ""))])
	if ceremony_lines.is_empty():
		return
	if is_instance_valid(sensei_node):
		sensei_node.show_dialogue(str(ceremony_lines[0]))
	_open_view("ceremony")

# -------------------------------------------------------------------- actions
func interact() -> bool:
	if not unlocked:
		if is_instance_valid(hud):
			hud.notice("L’Académie ouvrira après ta deuxième mission de clan récompensée.")
		return true
	if panel_open():
		close_panel()
		return true
	_open_view("main")
	_request_refresh()
	return true

func panel_open() -> bool:
	return is_instance_valid(root) and root.visible and view != ""

func close_panel() -> void:
	view = ""
	refresh_pending = false
	if is_instance_valid(root):
		root.hide()
	# This panel is a real modal: freeze the local avatar while the player
	# answers an invitation or validates the team at the counter. Without this
	# release, the network pose could drift away from the reception between two
	# clicks; without the matching reset, a held joystick key could resume motion.
	if is_instance_valid(hud):
		hud.blocked = false
		hud.reset_input()

func _request_refresh() -> void:
	if refresh_pending or not is_instance_valid(village_link) or not village_link.connected:
		return
	refresh_pending = true
	if not village_link.team_refresh():
		refresh_pending = false
		if is_instance_valid(hud):
			hud.notice("La réception attend la reconnexion au village.")

func _send(action: String, target_key: String = "") -> void:
	if is_instance_valid(village_link) and village_link.connected:
		if not village_link.team_action(action, target_key, revision):
			if is_instance_valid(hud): hud.notice("Action non envoyée · vérifie la connexion au village.")
	elif is_instance_valid(hud):
		hud.notice("Hors ligne : rejoins le village pour parler à la réception.")

# ------------------------------------------------------------------ interface
func _build_ui() -> void:
	if not is_instance_valid(hud):
		return
	root = Control.new()
	root.name = "TeamRoot"
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.visible = false
	hud.add_child(root)
	dim = ColorRect.new()
	dim.color = Color(0.02, 0.05, 0.06, 0.62)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	root.add_child(dim)
	panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _style(Color("182c30"), Color("a86b66"), 16))
	panel.custom_minimum_size = Vector2(560, 0)
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	root.add_child(panel)
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_top", 14)
	margin.add_theme_constant_override("margin_bottom", 14)
	panel.add_child(margin)
	panel_column = VBoxContainer.new()
	panel_column.add_theme_constant_override("separation", 8)
	margin.add_child(panel_column)
	panel_title = Label.new()
	panel_title.add_theme_font_size_override("font_size", 22)
	panel_title.add_theme_color_override("font_color", Color("f4ead2"))
	panel_column.add_child(panel_title)
	panel_text = Label.new()
	panel_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	panel_text.add_theme_font_size_override("font_size", 14)
	panel_text.add_theme_color_override("font_color", Color("bfd0c7"))
	panel_column.add_child(panel_text)
	panel_list = ScrollContainer.new()
	panel_list.custom_minimum_size = Vector2(0, 260)
	panel_list.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	panel_list.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	panel_column.add_child(panel_list)
	panel_list_column = VBoxContainer.new()
	panel_list_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel_list_column.add_theme_constant_override("separation", 6)
	panel_list.add_child(panel_list_column)
	panel_buttons = VBoxContainer.new()
	panel_buttons.add_theme_constant_override("separation", 6)
	panel_column.add_child(panel_buttons)
	# Carte d'invitation : rattachée au HUD directement, jamais à l'overlay
	# sombre. Elle reste visible et non bloquante pendant la marche.
	invite_card = PanelContainer.new()
	invite_card.name = "TeamInviteCard"
	invite_card.add_theme_stylebox_override("panel", _style(Color("20363a"), Color("d9b671"), 12))
	invite_card.set_anchors_preset(Control.PRESET_CENTER_TOP)
	invite_card.position = Vector2(-190, 74)
	invite_card.custom_minimum_size = Vector2(380, 0)
	invite_card.visible = false
	var card_margin := MarginContainer.new()
	card_margin.name = "Margin"
	card_margin.add_theme_constant_override("margin_left", 10)
	card_margin.add_theme_constant_override("margin_right", 10)
	card_margin.add_theme_constant_override("margin_top", 8)
	card_margin.add_theme_constant_override("margin_bottom", 8)
	invite_card.add_child(card_margin)
	var card_column := VBoxContainer.new()
	card_column.name = "VBox"
	card_margin.add_child(card_column)
	hud.add_child(invite_card)

func _style(bg: Color, border: Color, radius: int = 12) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = bg
	style.border_color = border
	style.set_border_width_all(2)
	style.set_corner_radius_all(radius)
	style.set_content_margin_all(12)
	return style

func _button(text: String, bg: Color) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(0, 46)
	button.add_theme_stylebox_override("normal", _style(bg, bg.lightened(0.25), 10))
	button.add_theme_stylebox_override("pressed", _style(bg.darkened(0.2), bg, 10))
	button.add_theme_font_size_override("font_size", 15)
	button.add_theme_color_override("font_color", Color("f6efdd"))
	return button

func _open_view(next: String) -> void:
	view = next
	if not is_instance_valid(root):
		return
	# Do not let the player walk away from the physical reception while the
	# menu is open. Server-side actions still verify the exact position, so a
	# non-modal panel made the same click sequence fail intermittently.
	if is_instance_valid(hud):
		hud.blocked = true
		hud.reset_input()
	root.show()
	focus_requested.emit()
	_render()

func _render() -> void:
	if not is_instance_valid(panel_column):
		return
	for child: Node in panel_buttons.get_children():
		child.queue_free()
	for child: Node in panel_list_column.get_children():
		child.queue_free()
	panel_list.hide()
	match view:
		"main": _render_main()
		"list": _render_list()
		"profile": _render_profile()
		"group": _render_group()
		"ceremony": _render_ceremony()

func _render_main() -> void:
	var greeting := "Bonjour %s." % str(self_candidate.get("name", "")) if not self_candidate.is_empty() else "Bienvenue à la réception."
	panel_title.text = "Réception de l’Académie"
	panel_text.text = "%s Que souhaitez-vous faire ?\n\n%s" % [greeting, message]
	if own_status() == "none":
		var apply := _button("DÉPOSER MA CANDIDATURE", Color("4d7a52"))
		apply.pressed.connect(func() -> void: _send("apply"))
		panel_buttons.add_child(apply)
	var consult := _button("CONSULTER LES CANDIDATS", Color("3f6a75"))
	consult.disabled = not near_reception
	if not near_reception:
		consult.text = "CONSULTER LES CANDIDATS · AU COMPTOIR"
	consult.pressed.connect(func() -> void: _open_view("list"))
	panel_buttons.add_child(consult)
	if own_status() in ["forming", "official"]:
		var group := _button("MON GROUPE / MON ÉQUIPE", Color("7a6a3f"))
		group.pressed.connect(func() -> void: _open_view("group"))
		panel_buttons.add_child(group)
	if own_status() in ["recherche", "forming"]:
		var withdraw := _button("RETIRER MA CANDIDATURE", Color("7a4d4d"))
		withdraw.pressed.connect(func() -> void: _send("withdraw"))
		panel_buttons.add_child(withdraw)
	var cancel := _button("ANNULER", Color("4a5560"))
	cancel.pressed.connect(close_panel)
	panel_buttons.add_child(cancel)

func _render_list() -> void:
	panel_title.text = "Candidats · %s" % ("liste de la réception" if near_reception else "hors du comptoir")
	panel_text.text = "Joueurs réels d’abord ; les PNJ complètent rarement.\nChaque fiche porte le portrait généré depuis l’apparence enregistrée."
	if not near_reception:
		panel_list.hide()
		panel_text.text += "\n\nApproche-toi du comptoir de la réception pour voir les portraits."
		_back_button()
		return
	panel_list.show()
	if candidates.is_empty():
		var empty := Label.new()
		empty.text = "Aucun candidat en recherche pour l’instant."
		empty.add_theme_color_override("font_color", Color("bfd0c7"))
		panel_list_column.add_child(empty)
	for item: Dictionary in candidates:
		panel_list_column.add_child(_candidate_row(item))
	_back_button()

func _candidate_row(item: Dictionary) -> Control:
	var row := PanelContainer.new()
	row.add_theme_stylebox_override("panel", _style(Color("20363a"), Color("3d5a5e"), 10))
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 8)
	margin.add_theme_constant_override("margin_right", 8)
	margin.add_theme_constant_override("margin_top", 6)
	margin.add_theme_constant_override("margin_bottom", 6)
	row.add_child(margin)
	var line := HBoxContainer.new()
	line.add_theme_constant_override("separation", 10)
	margin.add_child(line)
	var portrait := TextureRect.new()
	portrait.texture = NinjaPortrait.texture(item.get("appearance", {}))
	portrait.custom_minimum_size = Vector2(56, 56)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	line.add_child(portrait)
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	line.add_child(column)
	var title := Label.new()
	title.text = "%s · Niv %d · %s" % [str(item.get("name", "?")), int(item.get("level", 1)), str(item.get("clan", "—"))]
	title.add_theme_font_size_override("font_size", 15)
	title.add_theme_color_override("font_color", Color("f4ead2"))
	column.add_child(title)
	var details := Label.new()
	var affinity: String = str(item.get("affinity", ""))
	var style: String = str(item.get("style", ""))
	var parts: Array[String] = []
	if not affinity.is_empty():
		parts.append(affinity)
	if not style.is_empty():
		parts.append(style)
	details.text = " · ".join(PackedStringArray(parts))
	if details.text.is_empty():
		details.text = "Candidat de l’Académie"
	details.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	details.add_theme_font_size_override("font_size", 12)
	details.add_theme_color_override("font_color", Color("9fb8ae"))
	column.add_child(details)
	var status := Label.new()
	status.text = status_label(str(item.get("status", "recherche")))
	status.add_theme_font_size_override("font_size", 12)
	status.add_theme_color_override("font_color", Color("d9b671"))
	column.add_child(status)
	var actions := VBoxContainer.new()
	actions.add_theme_constant_override("separation", 4)
	line.add_child(actions)
	var profile := _button("PROFIL", Color("3f6a75"))
	profile.custom_minimum_size = Vector2(96, 38)
	profile.pressed.connect(func() -> void: profile_target = item; _open_view("profile"))
	actions.add_child(profile)
	if _can_invite(item):
		var invite := _button("INVITER", Color("4d7a52"))
		invite.custom_minimum_size = Vector2(96, 38)
		invite.pressed.connect(func() -> void: _send("invite", str(item.get("key", ""))))
		actions.add_child(invite)
	return row

func _can_invite(item: Dictionary) -> bool:
	if self_candidate.is_empty():
		return false
	if str(item.get("key", "")) == str(self_candidate.get("key", "")):
		return false
	if str(item.get("status", "")) != "recherche":
		return false
	if team.get("status") == "official":
		return false
	return _team_member_count() < 3

func _render_profile() -> void:
	if profile_target.is_empty():
		_open_view("list")
		return
	panel_title.text = str(profile_target.get("name", "Candidat"))
	var affinity: String = str(profile_target.get("affinity", ""))
	var style: String = str(profile_target.get("style", ""))
	var personality: String = str(profile_target.get("personality", ""))
	var idle: String = str(profile_target.get("idle", ""))
	panel_text.text = "Niveau %d · Clan %s\nAffinité : %s\nStyle de combat : %s\n%s%s\n\n%s" % [
		int(profile_target.get("level", 1)),
		str(profile_target.get("clan", "—")),
		affinity if not affinity.is_empty() else "—",
		style if not style.is_empty() else "—",
		personality + "\n" if not personality.is_empty() else "",
		status_label(str(profile_target.get("status", "recherche"))),
		idle,
	]
	panel_list.show()
	var portrait := TextureRect.new()
	portrait.texture = NinjaPortrait.texture(profile_target.get("appearance", {}))
	portrait.custom_minimum_size = Vector2(96, 96)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT
	portrait.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	panel_list_column.add_child(portrait)
	if _can_invite(profile_target):
		var invite := _button("INVITER DANS MON GROUPE", Color("4d7a52"))
		invite.pressed.connect(func() -> void: _send("invite", str(profile_target.get("key", ""))))
		panel_buttons.add_child(invite)
	var back := _button("RETOUR À LA LISTE", Color("4a5560"))
	back.pressed.connect(func() -> void: _open_view("list"))
	panel_buttons.add_child(back)
	var cancel := _button("ANNULER", Color("3a444d"))
	cancel.pressed.connect(close_panel)
	panel_buttons.add_child(cancel)

func _render_group() -> void:
	var number := int(team.get("number", 0))
	var official: bool = team.get("status") == "official"
	panel_title.text = team_label(number) if official else "Groupe en formation"
	panel_text.text = str(team.get("label", "")) if official else "Une équipe officielle compte exactement trois membres confirmés."
	panel_list.show()
	var members: Array = team["members"] if team.get("members") is Array else []
	for index in range(3):
		var slot := PanelContainer.new()
		slot.add_theme_stylebox_override("panel", _style(Color("20363a"), Color("3d5a5e") if index < members.size() else Color("31464a"), 10))
		var margin := MarginContainer.new()
		margin.add_theme_constant_override("margin_left", 8)
		margin.add_theme_constant_override("margin_right", 8)
		margin.add_theme_constant_override("margin_top", 6)
		margin.add_theme_constant_override("margin_bottom", 6)
		slot.add_child(margin)
		var line := HBoxContainer.new()
		line.add_theme_constant_override("separation", 10)
		margin.add_child(line)
		if index < members.size():
			var member: Dictionary = members[index]
			var portrait := TextureRect.new()
			portrait.texture = NinjaPortrait.texture(member.get("appearance", {}))
			portrait.custom_minimum_size = Vector2(52, 52)
			portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
			line.add_child(portrait)
			var column := VBoxContainer.new()
			column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			line.add_child(column)
			var title := Label.new()
			title.text = "%s · Niv %d · %s" % [str(member.get("name", "?")), int(member.get("level", 1)), str(member.get("clan", "—"))]
			title.add_theme_font_size_override("font_size", 14)
			title.add_theme_color_override("font_color", Color("f4ead2"))
			column.add_child(title)
			var status := Label.new()
			status.text = "Membre confirmé ✓"
			status.add_theme_font_size_override("font_size", 12)
			status.add_theme_color_override("font_color", Color("9fd49f"))
			column.add_child(status)
		else:
			var empty := Label.new()
			empty.text = "Place libre · invite un candidat à la réception"
			empty.custom_minimum_size = Vector2(0, 52)
			empty.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
			empty.add_theme_font_size_override("font_size", 13)
			empty.add_theme_color_override("font_color", Color("7e948b"))
			line.add_child(empty)
		panel_list_column.add_child(slot)
	if official:
		var sensei_id: String = str(team.get("senseiId", ""))
		var sensei_line := Label.new()
		sensei_line.text = "Sensei attribué : %s" % (str(ceremony_sensei.get("senseiName", sensei_id)) if not sensei_id.is_empty() else "—")
		sensei_line.add_theme_font_size_override("font_size", 13)
		sensei_line.add_theme_color_override("font_color", Color("d9b671"))
		panel_list_column.add_child(sensei_line)
	elif members.size() == 3:
		var form := _button("FORMER L’ÉQUIPE OFFICIELLE", Color("8a6d2f"))
		form.disabled = not near_reception
		if not near_reception:
			form.text = "VALIDER AU COMPTOIR DE LA RÉCEPTION"
		form.pressed.connect(func() -> void: _send("form"))
		panel_buttons.add_child(form)
	else:
		var hint := Label.new()
		hint.text = "%d/3 membres · les trois candidats voient leurs portraits et profils avant la validation finale." % members.size()
		hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		hint.add_theme_font_size_override("font_size", 12)
		hint.add_theme_color_override("font_color", Color("bfd0c7"))
		panel_buttons.add_child(hint)
	if not official and not self_candidate.is_empty():
		var consult := _button("CONSULTER LES CANDIDATS", Color("3f6a75"))
		consult.disabled = not near_reception
		consult.pressed.connect(func() -> void: _open_view("list"))
		panel_buttons.add_child(consult)
		var withdraw := _button("RETIRER MA CANDIDATURE", Color("7a4d4d"))
		withdraw.pressed.connect(func() -> void: _send("withdraw"))
		panel_buttons.add_child(withdraw)
	_back_button()

func _render_ceremony() -> void:
	var number := int(team.get("number", 0))
	panel_title.text = "%s · %s" % [str(ceremony_sensei.get("senseiName", "Sensei")), team_label(number)]
	if ceremony_index < ceremony_lines.size():
		var spoken_line := str(ceremony_lines[ceremony_index])
		panel_text.text = "Le Sensei te parle dans une bulle au-dessus de lui.\n\n%s" % spoken_line
		if is_instance_valid(sensei_node):
			sensei_node.show_dialogue(spoken_line)
	else:
		panel_text.text = "Le Sensei prend ses fonctions auprès de %s." % team_label(number)
		if is_instance_valid(sensei_node):
			sensei_node.show_dialogue(panel_text.text)
	panel_list.show()
	var portrait := TextureRect.new()
	portrait.texture = NinjaPortrait.texture(ceremony_sensei.get("senseiAppearance", {}), true)
	portrait.custom_minimum_size = Vector2(96, 96)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT
	portrait.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	panel_list_column.add_child(portrait)
	var specialty := Label.new()
	specialty.text = "%s\n%s" % [str(ceremony_sensei.get("senseiTitle", "")), str(ceremony_sensei.get("senseiPersonality", ""))]
	specialty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	specialty.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	specialty.add_theme_font_size_override("font_size", 12)
	specialty.add_theme_color_override("font_color", Color("d9b671"))
	panel_list_column.add_child(specialty)
	if ceremony_index < ceremony_lines.size():
		var next := _button("SUITE", Color("4d7a52"))
		next.pressed.connect(func() -> void: ceremony_index += 1; _render())
		panel_buttons.add_child(next)
	var close := _button("PRENDRE SES FONCTIONS", Color("4a5560"))
	close.pressed.connect(close_panel)
	panel_buttons.add_child(close)

func _back_button() -> void:
	var back := _button("RETOUR", Color("4a5560"))
	back.pressed.connect(func() -> void: _open_view("main"))
	panel_buttons.add_child(back)
	var cancel := _button("ANNULER", Color("3a444d"))
	cancel.pressed.connect(close_panel)
	panel_buttons.add_child(cancel)
