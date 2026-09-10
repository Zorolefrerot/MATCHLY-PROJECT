class_name TrainingRules
extends RefCounted
## Test loadout, not a clan/affinity assignment. Never connects to the website.

const MAX_HEALTH: float = 120.0
const MAX_CHAKRA: float = 100.0
const COMBAT_SECONDS: float = 5.0
const SKILLS: Array[Dictionary] = [
	{"name": "KATON", "subtitle": "Boule de feu", "cost": 16.0, "cooldown": 5.0, "damage": 22.0, "color": Color("ff864d")},
	{"name": "RAITON", "subtitle": "Éclair direct", "cost": 24.0, "cooldown": 8.0, "damage": 32.0, "color": Color("85d7ee")},
	{"name": "FŪTON", "subtitle": "Bourrasque", "cost": 12.0, "cooldown": 4.0, "damage": 14.0, "color": Color("b6ddad")},
	{"name": "DOTON", "subtitle": "Onde au sol", "cost": 32.0, "cooldown": 12.0, "damage": 44.0, "color": Color("e2b36c")},
]

var chakra: float = MAX_CHAKRA
var cooldowns: Array[float] = [0.0, 0.0, 0.0, 0.0]
var combat_remaining: float = 0.0
var casts: int = 0

func reset() -> void:
	chakra = MAX_CHAKRA
	cooldowns = [0.0, 0.0, 0.0, 0.0]
	combat_remaining = 0.0
	casts = 0

func tick(delta: float) -> void:
	var step: float = maxf(delta, 0.0)
	var combat_step: float = minf(step, combat_remaining)
	combat_remaining = maxf(0.0, combat_remaining - step)
	for i in range(cooldowns.size()):
		cooldowns[i] = maxf(0.0, cooldowns[i] - step)
	var regeneration: float = 3.0 * combat_step + 10.0 * (step - combat_step)
	chakra = minf(MAX_CHAKRA, chakra + regeneration)

func enter_combat() -> void:
	combat_remaining = COMBAT_SECONDS

func refusal(index: int) -> String:
	if index < 0 or index >= SKILLS.size():
		return "Technique inconnue."
	if cooldowns[index] > 0.001:
		return "%s : encore %.1f s" % [SKILLS[index]["name"], cooldowns[index]]
	if chakra < float(SKILLS[index]["cost"]):
		return "Chakra insuffisant — laisse-le se régénérer."
	return ""

func try_cast(index: int) -> bool:
	if not refusal(index).is_empty():
		return false
	chakra -= float(SKILLS[index]["cost"])
	cooldowns[index] = float(SKILLS[index]["cooldown"])
	enter_combat()
	casts += 1
	return true
