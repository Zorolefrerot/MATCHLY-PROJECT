class_name KonohaHUD
extends TrainingHUD
## Shared Konoha visit: mission controls plus an explicit two-player test duel.
var identity: Label
var mission_refresh: Button
var text_scroll: ScrollContainer
var combat_status: Label
var combat_active: bool = false

func _build() -> void:
	top_panel = Panel.new()
	top_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_panel.add_theme_stylebox_override("panel", panel_style(Color(0.06,0.13,0.15,0.90)))
	add_child(top_panel)
	identity = label("KONOHA · QUARTIER D’ACCUEIL", 20)
	objective = label("Bienvenue. Approche-toi du guide Aoi.", 17)
	objective.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	objective.add_theme_color_override("font_shadow_color", Color("172a2b"))
	objective.add_theme_constant_override("shadow_offset_x", 1)
	objective.add_theme_constant_override("shadow_offset_y", 2)
	combat_status = label("DUEL EN LIGNE · Deux joueurs admis nécessaires", 14)
	combat_status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	combat_status.add_theme_color_override("font_color", Color("ffe0a3"))
	feedback = label("", 18)
	feedback.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	footer = label("PROTO 0.11 · Mission personnelle · Position temporaire", 13)
	footer.add_theme_color_override("font_color", Color("253b36"))
	identity.clip_text = true
	identity.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	fps = label("", 12)
	_button("PAUSE", "pause")
	_button("JOURNAL", "journal")
	_button("MUSIQUE : OUI", "music")
	_button("CHAT RP / HRP", "chat")
	_button("COURIR", "sprint")
	_button("SAUT", "jump")
	_button("PARLER / LIRE", "interact")
	_button("DÉFIER EN DUEL", "combat_join")
	_button("NIVEAU TEST : 1", "combat_level")
	_button("QUITTER LE DUEL", "combat_leave")
	_button("FRAPPE", "combat_melee")
	for i in range(4):
		var data: Dictionary = TrainingRules.SKILLS[i]
		var attack: Button = _button("%s\n%d chakra" % [data["name"], int(data["cost"])], "combat_skill_%d" % i)
		attack.add_theme_color_override("font_color", data["color"])
	_button("ULTIME\n70 chakra", "combat_ultimate")
	set_button_icon("pause", 5)
	set_button_icon("journal", 6)
	set_button_icon("music", 7)
	set_button_icon("chat", 4)
	set_button_icon("sprint", 13)
	set_button_icon("jump", 3)
	set_button_icon("interact", 12)
	set_button_icon("combat_join", 8)
	set_button_icon("combat_level", 10)
	set_button_icon("combat_leave", 11)
	set_button_icon("combat_melee", 0)
	set_button_icon("combat_ultimate", 10, TECHNIQUE_ATLAS)
	_set_combat_buttons(false)
	overlay = ColorRect.new()
	overlay.color = Color(0.03,0.07,0.08,0.88)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	menu_panel = PanelContainer.new()
	menu_panel.add_theme_stylebox_override("panel", panel_style(Color("182c30")))
	overlay.add_child(menu_panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 16)
	menu_panel.add_child(column)
	var badge := Label.new()
	badge.text = "IDREM ZENKAI  /  VILLAGE PARTAGÉ"
	badge.add_theme_font_size_override("font_size", 13)
	badge.add_theme_color_override("font_color", Color("ef7470"))
	column.add_child(badge)
	menu_title = Label.new()
	menu_title.add_theme_font_size_override("font_size", 27)
	column.add_child(menu_title)
	text_scroll = ScrollContainer.new()
	text_scroll.custom_minimum_size = Vector2(620,210)
	text_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	column.add_child(text_scroll)
	menu_text = Label.new()
	menu_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	menu_text.custom_minimum_size = Vector2(598, 135)
	menu_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	menu_text.add_theme_font_size_override("font_size", 19)
	text_scroll.add_child(menu_text)
	primary = Button.new()
	primary.text = "CONTINUER"
	primary.custom_minimum_size.y = 48
	primary.pressed.connect(func() -> void: action_requested.emit("mission_confirm"))
	column.add_child(primary)
	mission_refresh = Button.new()
	mission_refresh.text = "ACTUALISER LA MISSION"
	mission_refresh.custom_minimum_size.y = 44
	mission_refresh.pressed.connect(func() -> void: action_requested.emit("mission_refresh"))
	column.add_child(mission_refresh)
	mission_refresh.hide()
	restart_button = Button.new()
	restart_button.text = "RETOUR À MON COMPTE"
	restart_button.custom_minimum_size.y = 48
	restart_button.pressed.connect(func() -> void: action_requested.emit("leave"))
	column.add_child(restart_button)
	hide_menu()

func _set_combat_buttons(active: bool) -> void:
	combat_active = active
	for action in ["combat_level", "combat_leave", "combat_melee", "combat_skill_0", "combat_skill_1", "combat_skill_2", "combat_skill_3", "combat_ultimate"]:
		if buttons.has(action): buttons[action].visible = active
	if buttons.has("combat_join"):
		buttons["combat_join"].visible = not active
	if buttons.has("interact"):
		buttons["interact"].visible = not active

func set_combat_message(message: String) -> void:
	combat_status.text = message

func set_clan_techniques(value: Array) -> void:
	for i in range(mini(4, value.size())):
		if not value[i] is Dictionary:
			continue
		var data: Dictionary = value[i]
		var button: Button = buttons.get("combat_skill_%d" % i)
		if button == null:
			continue
		button.text = "%s\n%d chakra" % [str(data.get("name", "TECHNIQUE")), int(data.get("cost", 0))]
		button.tooltip_text = "%s · %s" % [str(data.get("element", "Clan")), str(data.get("subtitle", "Technique particulière"))]
		set_button_icon("combat_skill_%d" % i, int(data.get("motif", i)), TECHNIQUE_ATLAS)
		button.add_theme_color_override("font_color", {"Katon":Color("ff864d"), "Mokuton":Color("8bcf78"), "Fūinjutsu":Color("ffa95c"), "Jūken":Color("a9dcff"), "Lames":Color("94cabb")}.get(str(data.get("element", "")), Color("e3eacb")))

func set_combat_state(value: Dictionary) -> void:
	if value.is_empty():
		_set_combat_buttons(false)
		combat_status.text = "DUEL EN LIGNE · Deux joueurs admis nécessaires"
		return
	var status: String = str(value.get("status", "waiting"))
	var players: Array = value.get("players", [])
	if status == "active":
		_set_combat_buttons(true)
		var line := "DUEL ACTIF"
		for fighter: Dictionary in players:
			line += "  ·  %s N%d : %d PV / %d chakra" % [fighter.get("clan", "Genin"), int(fighter.get("level", 1)), int(fighter.get("health", 0)), int(fighter.get("chakra", 0))]
		combat_status.text = line
	else:
		_set_combat_buttons(true)
		buttons["combat_leave"].visible = true
		combat_status.text = "DUEL EN PRÉPARATION · %d / 2 joueur(s) · Choisis ton niveau puis attends l’autre joueur" % players.size()
func set_combat_health(local_id: int, value: Dictionary) -> void:
	var players: Array = value.get("players", [])
	for fighter: Dictionary in players:
		if int(fighter.get("id", -1)) == local_id:
			combat_status.text = "%s  ·  %d PV  ·  %d chakra" % ["DUEL ACTIF" if value.get("status") == "active" else "DUEL EN PRÉPARATION", int(fighter.get("health", 0)), int(fighter.get("chakra", 0))]

func _layout() -> void:
	var w: float = size.x
	var h: float = size.y
	top_panel.position = Vector2(20,20)
	top_panel.size = Vector2(480,78)
	identity.position = Vector2(34,28)
	identity.size = Vector2(458,60)
	buttons["music"].position = Vector2(20,108)
	buttons["music"].size = Vector2(192,44)
	buttons["chat"].position = Vector2(20,164)
	buttons["chat"].size = Vector2(220,48)
	buttons["journal"].position = Vector2(w-500,24)
	buttons["journal"].size = Vector2(148,48)
	buttons["combat_join"].position = Vector2(w-340,24)
	buttons["combat_join"].size = Vector2(180,48)
	buttons["combat_level"].position = Vector2(w-340,78)
	buttons["combat_level"].size = Vector2(180,40)
	buttons["combat_leave"].position = Vector2(w-340,78)
	buttons["combat_leave"].size = Vector2(180,40)
	buttons["pause"].position = Vector2(w-160,24)
	buttons["pause"].size = Vector2(136,48)
	joystick_center = Vector2(142,h-150)
	buttons["sprint"].position = Vector2(72,h-59)
	buttons["sprint"].size = Vector2(142,42)
	buttons["jump"].position = Vector2(w-160,h-225)
	buttons["jump"].size = Vector2(130,70.0)
	buttons["interact"].position = Vector2(w-236,h-137)
	buttons["interact"].size = Vector2(206,70.0)
	buttons["combat_melee"].position = Vector2(w-130,h-137)
	buttons["combat_melee"].size = Vector2(110,58)
	buttons["combat_skill_0"].position = Vector2(w-370,h-205)
	buttons["combat_skill_0"].size = Vector2(112,58)
	buttons["combat_skill_1"].position = Vector2(w-250,h-205)
	buttons["combat_skill_1"].size = Vector2(112,58)
	buttons["combat_skill_2"].position = Vector2(w-370,h-140)
	buttons["combat_skill_2"].size = Vector2(112,58)
	buttons["combat_skill_3"].position = Vector2(w-250,h-140)
	buttons["combat_skill_3"].size = Vector2(112,58)
	buttons["combat_ultimate"].position = Vector2(w-130,h-270)
	buttons["combat_ultimate"].size = Vector2(110,76)
	combat_status.position = Vector2(w/2-320,78)
	combat_status.size = Vector2(640,30)
	objective.position = Vector2(w/2-325,112)
	objective.size = Vector2(650,44)
	feedback.position = Vector2(w/2-320,h-235)
	feedback.size = Vector2(640,48)
	footer.position = Vector2(260,h-30)
	fps.position = Vector2(w-145,82)
	menu_panel.size = Vector2(660,568)
	menu_panel.position = Vector2((w-660)/2, maxf(20,(h-menu_panel.size.y)/2))
	queue_redraw()

func _draw() -> void:
	if blocked: return
	draw_circle(joystick_center, joystick_radius + 9, Color(0.05,0.1,0.12,0.38))
	draw_arc(joystick_center, joystick_radius + 9, 0, TAU, 48, Color(0.95,0.89,0.75,0.48), 2, true)
	draw_circle(joystick_center + move_vector * joystick_radius, 27, Color(0.86,0.88,0.77,0.66))
	draw_circle(joystick_center + move_vector * joystick_radius, 9, Color("25454b"))
