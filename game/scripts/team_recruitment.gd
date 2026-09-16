class_name TeamRecruitment
extends Control
## Academy reception UI. It is only opened by the physical receptionist in
## Konoha; the server remains authoritative for every state transition.

var player: TrainingFighter
var hud: KonohaHUD
var village_link: VillageLink
var state: Dictionary = {}
var panel: PanelContainer
var content: VBoxContainer
var header: Label
var status_label: Label
var list_scroll: ScrollContainer
var list: VBoxContainer
var close_button: Button
var opened: bool = false
var previous_invitation_ids: Dictionary = {}

func configure(value_player: TrainingFighter, value_hud: KonohaHUD, link: VillageLink) -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	player = value_player
	hud = value_hud
	village_link = link
	_build_panel()
	village_link.received.connect(_network_event)
	village_link.disconnected.connect(_network_disconnected)

func _build_panel() -> void:
	panel = PanelContainer.new()
	panel.name = "AcademyRecruitmentPanel"
	panel.add_theme_stylebox_override("panel", TrainingHUD.panel_style(Color("15292f"), Color("c58c67"), 14))
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(panel)
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_bottom", 12)
	panel.add_child(margin)
	content = VBoxContainer.new()
	content.add_theme_constant_override("separation", 8)
	margin.add_child(content)
	var title_row := HBoxContainer.new()
	content.add_child(title_row)
	header = Label.new()
	header.text = "RÉCEPTION DE L’ACADÉMIE · ÉQUIPES"
	header.add_theme_font_size_override("font_size", 22)
	header.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_row.add_child(header)
	close_button = Button.new()
	close_button.text = "FERMER"
	close_button.focus_mode = Control.FOCUS_NONE
	close_button.pressed.connect(close)
	title_row.add_child(close_button)
	status_label = Label.new()
	status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	status_label.add_theme_font_size_override("font_size", 14)
	status_label.add_theme_color_override("font_color", Color("ffe4a9"))
	content.add_child(status_label)
	list_scroll = ScrollContainer.new()
	list_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	list_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content.add_child(list_scroll)
	list = VBoxContainer.new()
	list.add_theme_constant_override("separation", 8)
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list_scroll.add_child(list)
	panel.hide()
	get_viewport().size_changed.connect(_layout)
	_layout()

func _layout() -> void:
	if not is_instance_valid(panel):
		return
	var view := get_viewport_rect().size
	var width := minf(920.0, view.x - 28.0)
	var height := minf(650.0, view.y - 24.0)
	panel.position = Vector2(maxf(14.0, (view.x - width) * 0.5), maxf(12.0, (view.y - height) * 0.5))
	panel.size = Vector2(width, height)

func open() -> void:
	if opened:
		return
	opened = true
	hud.show_menu("Réception de l’Académie", "", "FERMER", false)
	hud.menu_panel.hide()
	panel.show()
	_layout()
	if is_instance_valid(village_link) and village_link.connected:
		village_link.academy_refresh()
	else:
		state = {"unlocked": false, "message": "Connexion au village indisponible."}
		_render()

func close() -> void:
	if not opened:
		return
	opened = false
	panel.hide()
	hud.menu_panel.show()
	hud.hide_menu()

func _network_disconnected() -> void:
	if opened:
		status_label.text = "Hors ligne : les actions de l’Académie sont momentanément indisponibles."

func _network_event(event: Dictionary) -> void:
	if str(event.get("type", "")) == "academy_state":
		state = event.duplicate(true)
		_check_notifications()
		_render()
	elif str(event.get("type", "")) == "error":
		var code := str(event.get("code", ""))
		if code.begins_with("ACADEMY_") or code == "INVALID_ACADEMY_ACTION":
			if is_instance_valid(hud):
				hud.notice(str(event.get("error", "Action refusée.")))
			if opened and is_instance_valid(village_link) and village_link.connected:
				village_link.academy_refresh()

func _check_notifications() -> void:
	var current: Dictionary = {}
	for invite: Variant in state.get("invitations", []):
		if invite is Dictionary:
			var invite_id := int(invite.get("id", 0))
			current[invite_id] = true
			if not previous_invitation_ids.has(invite_id) and is_instance_valid(hud):
				hud.notice("Nouvelle invitation d’équipe · %s" % str(invite.get("from", {}).get("name", "un joueur")))
	previous_invitation_ids = current

func _clear_list() -> void:
	for child: Node in list.get_children():
		child.queue_free()

func _label(text: String, size: int = 15, color: Color = Color("e8eee0")) -> Label:
	var result := Label.new()
	result.text = text
	result.add_theme_font_size_override("font_size", size)
	result.add_theme_color_override("font_color", color)
	result.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	result.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return result

func _button(text: String, callback: Callable) -> Button:
	var result := Button.new()
	result.text = text
	result.focus_mode = Control.FOCUS_NONE
	result.custom_minimum_size.y = 36
	result.add_theme_font_size_override("font_size", 14)
	result.add_theme_stylebox_override("normal", TrainingHUD.panel_style(Color("29434a"), Color("66817b"), 7))
	result.add_theme_stylebox_override("hover", TrainingHUD.panel_style(Color("3b5c5b"), Color("ffe0a3"), 7))
	result.pressed.connect(callback)
	return result

func _section(text: String) -> void:
	list.add_child(_label(text, 18, Color("f0b878")))

func _profile_card(profile: Dictionary, action_text: String = "", action: Callable = Callable()) -> void:
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", TrainingHUD.panel_style(Color("1d353b"), Color("42636a"), 8))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	card.add_child(row)
	var portrait := AcademyPortrait.new()
	portrait.custom_minimum_size = Vector2(74, 88)
	portrait.set_profile(profile)
	row.add_child(portrait)
	var text_column := VBoxContainer.new()
	text_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(text_column)
	text_column.add_child(_label("%s · N%d" % [str(profile.get("name", "Genin")), int(profile.get("level", 0))], 17, Color("fff0c9")))
	text_column.add_child(_label("%s · %s · %s" % [str(profile.get("clan", "Sans clan")), str(profile.get("affinity", "Chakra")), str(profile.get("style", "Style personnel"))], 13))
	text_column.add_child(_label("Portrait : %s" % str(profile.get("portraitId", "référence serveur")), 11, Color("8eb8b6")))
	text_column.add_child(_label(str(profile.get("personality", "Profil joueur issu de l’apparence sauvegardée.")), 12, Color("cbd9ca")))
	if not action_text.is_empty():
		row.add_child(_button(action_text, action))
	list.add_child(card)

func _render() -> void:
	if not opened:
		return
	_clear_list()
	var unlocked := bool(state.get("unlocked", false))
	status_label.text = str(state.get("message", "Approche la réception de l’Académie."))
	if not unlocked:
		list.add_child(_label("La réception devient active après la mission 2 et la récupération de sa récompense. Aoi et les missions existantes restent inchangés.", 16, Color("ffcfaa")))
		return
	var team: Variant = state.get("team")
	var group: Variant = state.get("group")
	var candidate: Variant = state.get("candidate")
	if team is Dictionary:
		_section("ÉQUIPE %03d · VALIDÉE" % int(team.get("teamNumber", 0)))
		var sensei: Dictionary = team.get("sensei", {})
		_profile_card(sensei)
		list.add_child(_label("%s\n%s\n%s" % [str(sensei.get("title", sensei.get("name", "Sensei"))), str(sensei.get("style", "Style")), str(sensei.get("dialogue", ""))], 13, Color("ffe4a9")))
		_section("MEMBRES · %d / 3" % team.get("members", []).size())
		for member: Variant in team.get("members", []):
			if member is Dictionary:
				_profile_card(member)
		return
	if group is Dictionary:
		_section("GROUPE TEMPORAIRE · %d / 3" % group.get("members", []).size())
		for member: Variant in group.get("members", []):
			if member is Dictionary:
				_profile_card(member)
		list.add_child(_button("QUITTER / RETIRER MA CANDIDATURE", func() -> void: village_link.academy_action("withdraw")))
		var owner := int(group.get("ownerId", -1)) == int(village_link.api.profile.get("character", {}).get("id", -2))
		if owner and group.get("members", []).size() == 3:
			list.add_child(_button("VALIDER L’ÉQUIPE 3 / 3", func() -> void: village_link.academy_confirm()))
		else:
			list.add_child(_label("Un groupe de deux reste temporaire. La validation serveur exige exactement trois membres.", 13, Color("ffcfaa")))
	elif candidate is Dictionary:
		list.add_child(_label("CANDIDATURE : %s" % str(candidate.get("status", "AVAILABLE")), 16, Color("f4dfb0")))
		list.add_child(_button("RETIRER MA CANDIDATURE", func() -> void: village_link.academy_action("withdraw")))
	else:
		list.add_child(_button("DÉPOSER MA CANDIDATURE", func() -> void: village_link.academy_action("apply")))
	var invitations: Array = state.get("invitations", [])
	if not invitations.is_empty():
		_section("INVITATIONS · NOTIFICATION")
		for invite: Variant in invitations:
			if not invite is Dictionary:
				continue
			var sender: Dictionary = invite.get("from", {})
			_profile_card(sender, "ACCEPTER", func() -> void: village_link.academy_answer(int(invite.get("id", 0)), true))
			list.add_child(_button("REFUSER L’INVITATION", func() -> void: village_link.academy_answer(int(invite.get("id", 0)), false)))
	if team == null and (group == null or int(group.get("ownerId", -1)) == int(village_link.api.profile.get("character", {}).get("id", -2))):
		_section("CANDIDATS DISPONIBLES · JOUEURS PRIORITAIRES")
		var candidates: Array = state.get("candidates", [])
		if candidates.is_empty():
			list.add_child(_label("Aucun autre candidat réel n’est actuellement disponible. Les PNJ restent des compléments rares.", 13, Color("cbd9ca")))
		for profile: Variant in candidates:
			if profile is Dictionary:
				var invite_text := "INVITER" if candidate is Dictionary else "CANDIDAT"
				_profile_card(profile, invite_text if candidate is Dictionary else "", func() -> void: village_link.academy_action("invite", str(profile.get("key", ""))))
