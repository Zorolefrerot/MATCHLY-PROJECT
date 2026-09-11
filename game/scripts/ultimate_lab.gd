class_name UltimateLab
extends Control
signal closed
signal selected(index: int, level: int)
var panel: PanelContainer
var clan: OptionButton
var level: HSlider
var detail: Label
var note: Label
var apply: Button
var current: TrainingUltimateRules

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var backdrop := ColorRect.new()
	backdrop.color = Color(0.03,0.07,0.09,0.94)
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(backdrop)
	panel = PanelContainer.new()
	panel.add_theme_stylebox_override("panel",TrainingHUD.panel_style(Color("182c30")))
	add_child(panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation",16)
	panel.add_child(column)
	var title := Label.new()
	title.text = "LABORATOIRE DES ULTIMES"
	title.add_theme_font_size_override("font_size",26)
	column.add_child(title)
	note = Label.new()
	note.text = "SIMULATION HORS LIGNE\nNe change ni ton vrai clan ni le niveau de ton compte.\nCes techniques sont des propositions visuelles à tester."
	note.add_theme_font_size_override("font_size",17)
	column.add_child(note)
	clan = OptionButton.new()
	for data: Dictionary in TrainingUltimateRules.CATALOG: clan.add_item(data["clan"])
	clan.custom_minimum_size.y = 48
	clan.item_selected.connect(func(_i: int) -> void: _detail())
	column.add_child(clan)
	level = HSlider.new()
	level.min_value = 1
	level.max_value = TrainingUltimateRules.MAX_LEVEL
	level.step = 1
	level.custom_minimum_size = Vector2(580,44)
	level.value_changed.connect(func(_v: float) -> void: _detail())
	column.add_child(level)
	detail = Label.new()
	detail.add_theme_font_size_override("font_size",18)
	detail.custom_minimum_size.y = 100
	column.add_child(detail)
	apply = Button.new()
	apply.text = "APPLIQUER À LA SIMULATION"
	apply.custom_minimum_size.y = 48
	apply.pressed.connect(func() -> void: selected.emit(clan.selected,int(level.value)))
	column.add_child(apply)
	var back := Button.new()
	back.text = "REVENIR À L’ENTRAÎNEMENT"
	back.custom_minimum_size.y = 48
	back.pressed.connect(func() -> void: closed.emit())
	column.add_child(back)
	resized.connect(_layout)
	_layout()
	hide()

func _layout() -> void:
	panel.size = Vector2(640,0)
	panel.position = Vector2((size.x-640)/2,maxf(16,(size.y-panel.get_combined_minimum_size().y)/2))

func open(value: TrainingUltimateRules) -> void:
	current = value
	clan.select(current.clan_index)
	level.value = current.level
	var locked: bool = current.cooldown > 0.001 or current.remaining > 0
	clan.disabled = locked
	level.editable = not locked
	apply.disabled = locked
	_detail()
	show()
	call_deferred("_layout")

func _detail() -> void:
	var preview := TrainingUltimateRules.new()
	preview.set_demo(clan.selected,int(level.value))
	detail.text = "%s\nNiveau SIMULÉ : %d · Puissance : %.0f · Rayon : %.1f m\n70 chakra · Recharge propre : 60 s · Effet : 5,8 s" % [preview.definition()["name"],preview.level,preview.damage(),preview.radius()]
	if current != null and current.cooldown > 0.001:
		detail.text += "\nRéglages verrouillés pendant la recharge (pas de remise à zéro)."
