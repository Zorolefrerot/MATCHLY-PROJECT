class_name MissionProgress
extends RefCounted
## Pure mission state: UI, dialogue and saves share this single source of truth.
signal changed

enum Stage { WAKE, EXPLORE, NOVA, TERMINAL, COLLECT, REPAIR, RETURN, COMPLETE }
const FRAGMENT_IDS := ["garden", "workshop", "archive"]
const OBJECTIVES := [
	"Déplace BYTE avec le joystick • ZQSD / WASD / flèches",
	"Rejoins le cercle lumineux de la place centrale",
	"Parle à NOVA, près de la balise cyan",
	"Examine le terminal orange, au nord de la place",
	"Récupère les fragments de données : %d / 3",
	"Retourne réparer le terminal orange",
	"Retourne parler à NOVA sur la place",
	"Mission accomplie • Le signal de PATCH débloqué"
]
var stage: int = Stage.WAKE
var fragments: Array[String] = []
var completed: Array[String] = []
var unlocked: Array[String] = ["un_monde_en_panne"]
var inventory: Dictionary = {}
var energy: int = 0

func objective() -> String:
	if stage == Stage.COLLECT:
		return OBJECTIVES[stage] % fragments.size()
	return OBJECTIVES[stage]

func advance(expected: int) -> bool:
	if stage != expected or stage >= Stage.COMPLETE:
		return false
	stage += 1
	changed.emit()
	return true

func collect(id: String) -> bool:
	if stage != Stage.COLLECT or id not in FRAGMENT_IDS or id in fragments:
		return false
	fragments.append(id)
	inventory["data_fragment"] = fragments.size()
	if fragments.size() == 3:
		stage = Stage.REPAIR
	changed.emit()
	return true

func repair() -> bool:
	if stage != Stage.REPAIR or fragments.size() != 3:
		return false
	inventory.erase("data_fragment")
	return advance(Stage.REPAIR)

func finish() -> bool:
	if stage != Stage.RETURN:
		return false
	if "un_monde_en_panne" not in completed:
		completed.append("un_monde_en_panne")
		unlocked.append("le_signal_de_patch")
		energy += 50
		inventory["maintenance_badge"] = 1
	return advance(Stage.RETURN)

func serialize() -> Dictionary:
	return {"stage": stage, "fragments": fragments.duplicate(),
		"completed": completed.duplicate(), "unlocked": unlocked.duplicate(), "inventory": inventory.duplicate(), "energy": energy}

func restore(data: Dictionary) -> bool:
	var saved_stage: Variant = data.get("stage", -1)
	if not (saved_stage is int or saved_stage is float):
		return false
	if float(saved_stage) != floor(float(saved_stage)) or int(saved_stage) < 0 or int(saved_stage) > Stage.COMPLETE:
		return false
	var ids: Variant = data.get("fragments", [])
	if not ids is Array or ids.size() > 3:
		return false
	var clean: Array[String] = []
	for id in ids:
		if not id is String or id not in FRAGMENT_IDS or id in clean:
			return false
		clean.append(id)
	if int(saved_stage) < Stage.COLLECT and not clean.is_empty():
		return false
	if int(saved_stage) >= Stage.REPAIR and clean.size() != 3:
		return false
	if int(saved_stage) == Stage.COLLECT and clean.size() == 3:
		return false
	# Reconstruct reward/inventory invariants; do not trust user-edited counts.
	stage = int(saved_stage)
	fragments = clean
	completed.clear()
	unlocked = ["un_monde_en_panne"]
	inventory.clear()
	energy = 0
	if stage == Stage.COLLECT or stage == Stage.REPAIR:
		inventory["data_fragment"] = clean.size()
	if stage == Stage.COMPLETE:
		completed.append("un_monde_en_panne")
		unlocked.append("le_signal_de_patch")
		inventory["maintenance_badge"] = 1
		energy = 50
	changed.emit()
	return true
