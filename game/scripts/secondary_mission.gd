class_name SecondaryMission
extends RefCounted
## Client contract for the global NPC mission board. Progress and rewards are
## never computed here; the server sends the authoritative state. Objective
## coordinates are a fixed local presentation catalogue and are never sent by
## the server or accepted as client validation data.
const SCHEMA_VERSION := 2
const REWARD_IG := 5
const RENEWAL_SECONDS := 600.0
const MAX_SLOTS := 3
const NPCS: Array[Dictionary] = [
	{"id":"market_mika", "name":"Mika · marchande", "kind":"woman", "zone":"marché", "position":Vector3(-23,0.55,22)},
	{"id":"residential_ren", "name":"Ren · habitant", "kind":"man", "zone":"quartier résidentiel", "position":Vector3(62,0.55,20)},
	{"id":"gate_sora", "name":"Sora · messagère", "kind":"woman", "zone":"portes du village", "position":Vector3(0,0.55,108)},
	# The academy giver stands in the academy training yard, not in the Yamanaka district.
	{"id":"academy_doctor", "name":"Docteure Hana · médecin", "kind":"elder", "zone":"académie", "position":Vector3(-44,0.55,14)},
	{"id":"river_toma", "name":"Toma · voyageur", "kind":"man", "zone":"quartier des bains", "position":Vector3(48,0.55,-37)},
	{"id":"forge_kenta", "name":"Kenta · forgeron", "kind":"man", "zone":"ateliers", "position":Vector3(38,0.55,50)},
	{"id":"old_momo", "name":"Momo · ancienne", "kind":"elder", "zone":"ruelles", "position":Vector3(-29,0.55,-4)},
	{"id":"child_jun", "name":"Jun · enfant", "kind":"boy", "zone":"marché nord", "position":Vector3(-1,0.55,25)},
]

# These are public, bounded presentation points. The server keeps the same
# catalogue privately and remains authoritative for every collection.
const OBJECTIVE_POINTS: Dictionary = {
	"lost_cat": [Vector3(-54,0.65,18)],
	"parcel_delivery": [Vector3(58,0.65,16)],
	"medicinal_herbs": [Vector3(-52,0.65,45),Vector3(22,0.65,55),Vector3(78,0.65,-4)],
	"lost_scroll": [Vector3(-28,0.65,-20)],
	"lost_dog": [Vector3(34,0.65,-61)],
	"market_delivery": [Vector3(-2,0.65,30)],
	"village_cleanup": [Vector3(-20,0.65,21),Vector3(0,0.65,-45),Vector3(48,0.65,-35)],
	"urgent_message": [Vector3(55,0.65,-35)],
	"blacksmith_tools": [Vector3(-50,0.65,-54),Vector3(38,0.65,50),Vector3(92,0.65,15)],
	"forgotten_items": [Vector3(-34,0.65,2),Vector3(20,0.65,28),Vector3(64,0.65,18)],
	"meal_delivery": [Vector3(10,0.65,22)],
	"lost_coins": [Vector3(-45,0.65,72),Vector3(-8,0.65,55),Vector3(43,0.65,72),Vector3(60,0.65,105),Vector3(0,0.65,92)],
}

static func _number(value: Variant, minimum: float = 0.0) -> bool:
	return typeof(value) in [TYPE_INT, TYPE_FLOAT] and is_finite(float(value)) and float(value) >= minimum

static func _integer(value: Variant, minimum: int = 0) -> bool:
	return _number(value, minimum) and float(value) == floorf(float(value))

static func target_points(type_id: String) -> Array:
	var points: Variant = OBJECTIVE_POINTS.get(type_id, [])
	return points.duplicate(true) if points is Array else []

static func return_point(npc_id: String) -> Vector3:
	for npc: Dictionary in NPCS:
		if str(npc.get("id", "")) == npc_id:
			return npc["position"]
	return Vector3.ZERO

static func valid_mission(value: Variant) -> bool:
	if not value is Dictionary or not value.get("missionId") is String or value["missionId"].is_empty() or not _integer(value.get("slot")) or int(value["slot"]) >= MAX_SLOTS or not _integer(value.get("revision"), 1) or not value.get("typeId") is String or not OBJECTIVE_POINTS.has(value["typeId"]) or not value.get("npcId") is String or npc_for(value["npcId"]).is_empty() or not value.get("status") is String or value["status"] not in ["available","accepted","claimed","cooldown"]:
		return false
	var targets: Array = target_points(str(value["typeId"]))
	if targets.is_empty() or int(value.get("required", -1)) != targets.size():
		return false
	if not value.get("progress") is Array or value["progress"].size() > targets.size():
		return false
	var seen: Dictionary = {}
	for index: Variant in value["progress"]:
		if not _integer(index) or int(index) >= targets.size() or seen.has(int(index)):
			return false
		seen[int(index)] = true
	if value.has("availableAt") and not _number(value["availableAt"]):
		return false
	return true

static func valid_state(value: Variant) -> bool:
	if not value is Dictionary or value.get("schemaVersion") != SCHEMA_VERSION or not value.get("unlocked") is bool or not value.get("missions") is Array or value["missions"].size() > MAX_SLOTS:
		return false
	var slots: Dictionary = {}
	var npcs: Dictionary = {}
	var active_count := 0
	for mission: Variant in value["missions"]:
		if not valid_mission(mission):
			return false
		if slots.has(int(mission["slot"])) or npcs.has(str(mission["npcId"])):
			return false
		slots[int(mission["slot"])] = true
		npcs[str(mission["npcId"])] = true
		if mission["status"] == "accepted":
			active_count += 1
	if active_count > 1:
		return false
	if not value["unlocked"] and not value["missions"].is_empty():
		return false
	return true

static func npc_for(id: String) -> Dictionary:
	for npc: Dictionary in NPCS:
		if npc["id"] == id:
			return npc
	return {}
