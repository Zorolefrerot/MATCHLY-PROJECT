extends Node
## État global du jeu : langue (FR/EN), monnaie (Mo), mission Batterie,
## file de dialogue, boutique et recherche d'interactions.

signal mo_changed(total: int)
signal spark_collected(count: int)
signal mission_changed()
signal lang_changed()
signal hat_changed()
signal dialogue_opened(speaker: String)
signal dialogue_next(text: String)
signal dialogue_closed()
signal shop_requested()
signal prompt_changed(text: String)
signal toast_requested(text: String)

const SAVE_PATH := "user://save.json"
const SPARKS_NEEDED := 5
const HAT_PRICE := 50

var lang := "fr"
var mo := 0
var hat := false
var sparks_collected := 0
var mission_battery_done := false

# Contrôles tactiles (remplis par TouchJoy, lus par le joueur).
var touch_active := false
var touch_axis := Vector2.ZERO

var player: Node2D = null

var dialogue_active := false
var shop_open := false

var _dialogue_lines: Array[String] = []
var _dialogue_index := 0
var _dialogue_speaker := ""
var _current_prompt := "@@init@@"

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	load_game()

# ------------------------------------------------------------------ i18n ----

const TEXTS := {
	"fr": {
		"toast_welcome": "Bienvenue dans le Grand Téléphone, PIX !",
		"toast_sparks_full": "Éclats complets ! Direction la BATTERIE (sud-est) !",
		"toast_mission_done": "MISSION ACCOMPLIE — Batterie rechargée !",
		"toast_bought": "Chapeau Pixel acheté — quel style !",
		"toast_poor": "Pas assez de Mo !",
		"toast_lang": "Langue : Français",
		"ui_objective": "OBJECTIF",
		"ui_mo": "Mo : %d",
		"mission_collect": "Éclats d'énergie : %d / %d",
		"mission_return": "Rapporte les éclats à la BATTERIE (sud-est)",
		"mission_done_idle": "Exploration libre — la suite arrive…",
		"prompt_talk": "Parler à %s",
		"prompt_enter": "Entrer : %s",
		"ui_continue": "E ou toucher — continuer",
		"ui_pause": "PAUSE",
		"ui_resume": "Reprendre",
		"ui_lang": "Langue : English",
		"ui_quit": "Quitter",
		"shop_title": "LA BOUTIQUE",
		"shop_mo": "Tes Mo : %d",
		"shop_hat_name": "Chapeau Pixel",
		"shop_hat_desc": "Le prestige absolu. Se porte sur la tête, brille la nuit.",
		"shop_buy": "Acheter — %d Mo",
		"shop_owned": "Déjà acheté !",
		"shop_close": "Fermer",
		"hint_controls": "ZQSD / WASD / flèches : bouger   ·   E : agir   ·   Échap : pause",
		"curseur_intro_1": "PIX ! Enfin réveillé. Bienvenue dans le Grand Téléphone.",
		"curseur_intro_2": "Moi c'est CURSEUR. Je pointe, je clique, je fais tout le boulot par ici.",
		"curseur_intro_3": "Écoute bien : ALERTE ROUGE. La Batterie est presque vide !",
		"curseur_intro_4": "Cinq éclats d'énergie se sont échappés dans les rues. Récupère-les, puis rapporte-les à la Batterie, au sud-est.",
		"curseur_intro_5": "Les éclats brillent en jaune. File, la machine compte sur toi !",
		"curseur_hint": "Cherche les éclats jaunes brillants dans les rues. La Batterie t'attend au sud-est !",
		"curseur_return": "C'est complet ! File à la Batterie, au sud-est. VITE !",
		"curseur_done_1": "Beau travail, PIX ! Le téléphone tiendra toute la journée.",
		"curseur_done_2": "Mais… j'ai vu un glitch étrange remonter du Cloud. On en reparlera bientôt.",
		"horloge_1": "Je sonne les heures depuis la toute première mise en marche. Tick. Tock.",
		"horloge_2": "Autrefois, une entité a figé tout l'écran en BLEU. On l'appelle CORRUPTUS. Chut… Ne le réveille pas.",
		"joy_1": "Hihi ! On m'a envoyée 47 fois aujourd'hui ! Je suis LA star de l'écran d'accueil !",
		"cool_1": "Je ne cligne jamais des yeux. Trop cool pour ça.",
		"sleep_1": "Zzz… cinq minutes de plus… ronfle… juste cinq minutes…",
		"battery_missing_0": "Bzzz… AUCUN éclat ?! Cherche les éclats jaunes dans les rues, je m'éteins !",
		"battery_missing_n": "Bzzz… %d éclats sur %d… continue, PIX, je compte sur toi !",
		"battery_done_1": "CHARGE COMPLÈTE ! Le courant revient dans tout le téléphone !",
		"battery_done_2": "+100 Mo de récompense ! Tu es officiellement un héros de la machine, PIX.",
		"battery_repeat": "Pleine et heureuse. Merci encore, PIX ! Bzzz…",
		"wifi_line": "Le WiFi capte le Cloud… et parfois, un signal CORROMPU en descend. À surveiller…",
		"locked_amibook": "AMIBOOK — Des emojis brouillés m'attendent derrière cette porte. J'entends les notifications… Bientôt !",
		"locked_viditube": "VIDITUBE — Ça chante, ça danse, ça devient VIRAL derrière cette porte. Bientôt on tourne !",
		"locked_bonbon": "BONBON SMASH — Ça sent la casse… de bonbons ! L'usine ouvre bientôt.",
		"locked_marbouilles": "MARBOUILLES — Une grenouille recrute. Les billes défilent sur les rails. Bientôt !",
		"locked_chronomail": "CHRONOMAIL — Un courrier urgent dort dans le tri postal. On ira le livrer bientôt.",
		"locked_blabla": "BLABLA — On papote jour et nuit ici. On ne dort JAMAIS. Bientôt, tu pourras papoter aussi.",
		"locked_clipclip": "CLIPCLIP — La musique tape fort derrière cette porte. Prépare tes pas de danse !",
		"locked_navik": "NAVIK — Le GRAND PORTAIL vers Internet ! Les vagues du WiFi montent… bientôt, on naviguera.",
		"app_battery": "Batterie",
		"app_boutique": "La Boutique",
		"app_wifi": "Antenne WiFi",
	},
	"en": {
		"toast_welcome": "Welcome to the Great Phone, PIX!",
		"toast_sparks_full": "All sparks found! Head to the BATTERY (south-east)!",
		"toast_mission_done": "MISSION COMPLETE — Battery recharged!",
		"toast_bought": "Pixel Hat purchased — so stylish!",
		"toast_poor": "Not enough Mo!",
		"toast_lang": "Language: English",
		"ui_objective": "OBJECTIVE",
		"ui_mo": "Mo: %d",
		"mission_collect": "Energy sparks: %d / %d",
		"mission_return": "Bring the sparks to the BATTERY (south-east)",
		"mission_done_idle": "Free exploration — more coming soon…",
		"prompt_talk": "Talk to %s",
		"prompt_enter": "Enter: %s",
		"ui_continue": "E or tap — continue",
		"ui_pause": "PAUSE",
		"ui_resume": "Resume",
		"ui_lang": "Langue : Français",
		"ui_quit": "Quit",
		"shop_title": "THE SHOP",
		"shop_mo": "Your Mo: %d",
		"shop_hat_name": "Pixel Hat",
		"shop_hat_desc": "Absolute prestige. Worn on the head, glows at night.",
		"shop_buy": "Buy — %d Mo",
		"shop_owned": "Already owned!",
		"shop_close": "Close",
		"hint_controls": "WASD / arrows: move   ·   E: interact   ·   Esc: pause",
		"curseur_intro_1": "PIX! Finally awake. Welcome to the Great Phone.",
		"curseur_intro_2": "I'm CURSEUR. I point, I click, I do all the work around here.",
		"curseur_intro_3": "Listen up: RED ALERT. The Battery is almost empty!",
		"curseur_intro_4": "Five energy sparks escaped into the streets. Collect them, then bring them to the Battery, south-east.",
		"curseur_intro_5": "Sparks glow yellow. Go, the machine is counting on you!",
		"curseur_hint": "Look for the bright yellow sparks in the streets. The Battery awaits, south-east!",
		"curseur_return": "That's a full charge! Run to the Battery, south-east. QUICK!",
		"curseur_done_1": "Great job, PIX! The phone will last all day now.",
		"curseur_done_2": "But… I saw a weird glitch crawling down from the Cloud. We'll talk about it soon.",
		"horloge_1": "I've been ringing the hours since the very first boot. Tick. Tock.",
		"horloge_2": "Long ago, an entity froze the whole screen BLUE. They call it CORRUPTUS. Shh… don't wake it.",
		"joy_1": "Hehe! I've been sent 47 times today! I'm THE star of the home screen!",
		"cool_1": "I never blink. Too cool for that.",
		"sleep_1": "Zzz… five more minutes… snore… just five minutes…",
		"battery_missing_0": "Bzzz… NOT a single spark?! Look for the yellow sparks in the streets, I'm fading!",
		"battery_missing_n": "Bzzz… %d sparks out of %d… keep going, PIX, I'm counting on you!",
		"battery_done_1": "FULL CHARGE! Power is back across the whole phone!",
		"battery_done_2": "+100 Mo reward! You are officially a hero of the machine, PIX.",
		"battery_repeat": "Full and happy. Thanks again, PIX! Bzzz…",
		"wifi_line": "The WiFi picks up the Cloud… and sometimes a CORRUPTED signal crawls down. Watch out…",
		"locked_amibook": "AMIBOOK — Feuding emojis await behind this door. I can hear the notifications… Soon!",
		"locked_viditube": "VIDITUBE — It sings, it dances, it goes VIRAL behind this door. We'll shoot soon!",
		"locked_bonbon": "BONBON SMASH — Smells like crushing… candy! The factory opens soon.",
		"locked_marbouilles": "MARBOUILLES — A frog is recruiting. Marbles roll along the rails. Soon!",
		"locked_chronomail": "CHRONOMAIL — An urgent letter sleeps in the mail room. We'll deliver it soon.",
		"locked_blabla": "BLABLA — We chat day and night here. We NEVER sleep. Soon you'll chat too.",
		"locked_clipclip": "CLIPCLIP — The music is loud behind this door. Get your dance moves ready!",
		"locked_navik": "NAVIK — The GREAT PORTAL to the Internet! The WiFi waves are rising… soon we'll sail.",
		"app_battery": "Battery",
		"app_boutique": "The Shop",
		"app_wifi": "WiFi Antenna",
	},
}

func t(key: String) -> String:
	var table: Dictionary = TEXTS.get(lang, TEXTS["fr"])
	return String(table.get(key, key))

func tf(key: String, args: Array) -> String:
	return t(key) % args

func set_lang(new_lang: String) -> void:
	lang = new_lang
	_current_prompt = "@@init@@"
	lang_changed.emit()
	save_game()

# --------------------------------------------------------- économie / hat ----

func add_mo(amount: int) -> void:
	mo += amount
	mo_changed.emit(mo)
	save_game()

func buy_hat() -> bool:
	if hat:
		return true
	if mo < HAT_PRICE:
		return false
	mo -= HAT_PRICE
	hat = true
	mo_changed.emit(mo)
	hat_changed.emit()
	save_game()
	return true

# ---------------------------------------------------------- mission éclats ----

func collect_spark() -> void:
	if mission_battery_done or sparks_collected >= SPARKS_NEEDED:
		return
	sparks_collected += 1
	spark_collected.emit(sparks_collected)
	mission_changed.emit()
	if sparks_collected >= SPARKS_NEEDED:
		toast_requested.emit(t("toast_sparks_full"))
	save_game()

func mission_stage() -> String:
	if mission_battery_done:
		return "done"
	if sparks_collected >= SPARKS_NEEDED:
		return "return"
	return "collect"

func mission_label() -> String:
	match mission_stage():
		"collect":
			return tf("mission_collect", [sparks_collected, SPARKS_NEEDED])
		"return":
			return t("mission_return")
		_:
			return t("mission_done_idle")

func complete_battery_mission() -> void:
	if mission_battery_done:
		return
	mission_battery_done = true
	mission_changed.emit()
	add_mo(100)
	save_game()

# ---------------------------------------------------------------- dialogue ----

func open_dialogue(lines: Array, speaker: String = "") -> void:
	_dialogue_lines.clear()
	for line in lines:
		_dialogue_lines.append(String(line))
	_dialogue_index = 0
	_dialogue_speaker = speaker
	dialogue_active = true
	dialogue_opened.emit(speaker)
	if _dialogue_lines.is_empty():
		dialogue_active = false
		dialogue_closed.emit()
		return
	dialogue_next.emit(_dialogue_lines[0])

func advance_dialogue() -> void:
	if not dialogue_active:
		return
	_dialogue_index += 1
	if _dialogue_index >= _dialogue_lines.size():
		dialogue_active = false
		dialogue_closed.emit()
	else:
		dialogue_next.emit(_dialogue_lines[_dialogue_index])

# ------------------------------------------------------------ interactions ----

func find_nearest_interactable() -> Node2D:
	if player == null:
		return null
	var best_node: Node2D = null
	var best_distance := INF
	for node in get_tree().get_nodes_in_group("interactable"):
		var n := node as Node2D
		if n == null:
			continue
		var radius := 130.0
		if n.has_method("get_interact_radius"):
			radius = float(n.call("get_interact_radius"))
		var d := player.global_position.distance_to(n.global_position)
		if d <= radius and d < best_distance:
			best_distance = d
			best_node = n
	return best_node

func interact() -> void:
	if dialogue_active:
		advance_dialogue()
		return
	if shop_open:
		return
	var node := find_nearest_interactable()
	if node != null and node.has_method("interact"):
		node.call("interact")

func update_prompt() -> void:
	var text := ""
	if not dialogue_active and not shop_open:
		var node := find_nearest_interactable()
		if node != null and node.has_method("get_prompt"):
			text = String(node.call("get_prompt"))
	if text != _current_prompt:
		_current_prompt = text
		prompt_changed.emit(text)

# -------------------------------------------------------------- sauvegarde ----

func save_game() -> void:
	var data := {
		"lang": lang,
		"mo": mo,
		"hat": hat,
		"sparks_collected": sparks_collected,
		"mission_battery_done": mission_battery_done,
	}
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(data))
		f.close()

func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return
	var parsed = JSON.parse_string(f.get_as_text())
	f.close()
	if parsed == null or not (parsed is Dictionary):
		return
	var data: Dictionary = parsed
	lang = String(data.get("lang", "fr"))
	mo = int(data.get("mo", 0))
	hat = bool(data.get("hat", false))
	sparks_collected = int(data.get("sparks_collected", 0))
	mission_battery_done = bool(data.get("mission_battery_done", false))
