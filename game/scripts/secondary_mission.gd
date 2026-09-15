class_name SecondaryMission
extends RefCounted
## Client contract for the global NPC mission board. Progress and rewards are
## never computed here; the server sends the authoritative state.
const SCHEMA_VERSION := 1
const REWARD_IG := 5
const RENEWAL_SECONDS := 600.0
const MAX_SLOTS := 3
const NPCS: Array[Dictionary] = [
	{"id":"market_mika", "name":"Mika · marchande", "kind":"woman", "zone":"marché", "position":Vector3(-23,0.55,22)},
	{"id":"residential_ren", "name":"Ren · habitant", "kind":"man", "zone":"quartier résidentiel", "position":Vector3(62,0.55,20)},
	{"id":"gate_sora", "name":"Sora · messagère", "kind":"woman", "zone":"portes du village", "position":Vector3(0,0.55,108)},
	{"id":"academy_doctor", "name":"Docteure Hana · médecin", "kind":"elder", "zone":"académie", "position":Vector3(-60,0.55,-8)},
	{"id":"river_toma", "name":"Toma · voyageur", "kind":"man", "zone":"quartier des bains", "position":Vector3(48,0.55,-37)},
	{"id":"forge_kenta", "name":"Kenta · forgeron", "kind":"man", "zone":"ateliers", "position":Vector3(38,0.55,50)},
	{"id":"old_momo", "name":"Momo · ancienne", "kind":"elder", "zone":"ruelles", "position":Vector3(-29,0.55,-4)},
	{"id":"child_jun", "name":"Jun · enfant", "kind":"boy", "zone":"marché nord", "position":Vector3(-1,0.55,25)},
]

static func _number(value: Variant, minimum: float = 0.0) -> bool:
	return typeof(value) in [TYPE_INT, TYPE_FLOAT] and is_finite(float(value)) and float(value) >= minimum

static func valid_position(value: Variant) -> bool:
	if not value is Array or value.size() != 3:
		return false
	return _number(value[0], -1000.0) and _number(value[1], -5.0) and _number(value[2], -1000.0) and absf(float(value[0])) <= 148.0 and absf(float(value[2])) <= 158.0

static func valid_mission(value: Variant) -> bool:
	if not value is Dictionary or not value.get("missionId") is String or value["missionId"].is_empty() or not _number(value.get("slot")) or int(value["slot"]) >= MAX_SLOTS or not _number(value.get("revision"), 1.0) or not value.get("typeId") is String or not value.get("npcId") is String or not value.get("status") is String or value["status"] not in ["available","accepted","claimed","cooldown"]:
		return false
	if not valid_position(value.get("npcPosition")) or not valid_position(value.get("returnPosition")) or not value.get("targets") is Array or value["targets"].size() > 5:
		return false
	for target: Variant in value["targets"]:
		if not valid_position(target):
			return false
	return true

static func valid_state(value: Variant) -> bool:
	if not value is Dictionary or value.get("schemaVersion") != SCHEMA_VERSION or not value.get("unlocked") is bool or not value.get("missions") is Array or value["missions"].size() > MAX_SLOTS:
		return false
	for mission: Variant in value["missions"]:
		if not valid_mission(mission):
			return false
	return true

static func npc_for(id: String) -> Dictionary:
	for npc: Dictionary in NPCS:
		if npc["id"] == id:
			return npc
	return {}
