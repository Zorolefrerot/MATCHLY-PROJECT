class_name ClanMission
extends RefCounted
## Shared client contract for mission 2. Star positions and effects are local;
## durable status and the single reward report come back from the account API.
const MISSION_ID: String = "clan_stars"
const DURATION_SECONDS: float = 300.0
const STAR_COUNT: int = 10
const STATUSES: Array[String] = [
	"NOT_STARTED", "ACCEPTED", "IN_PROGRESS", "TIME_EXPIRED", "REPORT_PENDING", "COMPLETED"
]
const EVENTS: Array[String] = ["accept", "start", "expire", "report_pending", "report"]

static func blank() -> Dictionary:
	return {
		"schemaVersion": 1,
		"missionId": MISSION_ID,
		"status": "NOT_STARTED",
		"score": null,
		"revision": 0,
		"startedAt": null,
		"rewardClaimed": false,
		"reward": {"idremGold": 0, "level": 0, "tier": "none"},
	}

static func valid_state(value: Variant) -> bool:
	if not value is Dictionary:
		return false
	if value.get("schemaVersion") != 1 or value.get("missionId") != MISSION_ID:
		return false
	if value.get("status") not in STATUSES:
		return false
	var revision: Variant = value.get("revision")
	if typeof(revision) not in [TYPE_INT, TYPE_FLOAT] or revision < 0 or revision > 5 or not is_finite(float(revision)):
		return false
	var score: Variant = value.get("score")
	if score != null and (typeof(score) not in [TYPE_INT, TYPE_FLOAT] or score < 0 or not is_finite(float(score)) or floorf(float(score)) != float(score)):
		return false
	if value.get("status") in ["TIME_EXPIRED", "REPORT_PENDING", "COMPLETED"] and score == null:
		return false
	if value.get("status") == "NOT_STARTED" and revision != 0:
		return false
	if value.get("status") == "COMPLETED" and not value.get("rewardClaimed") is bool:
		return false
	return true

static func reward(score: int) -> Dictionary:
	if score < 5:
		return {"idremGold": 5, "level": 0, "tier": "0-4"}
	if score < 10:
		return {"idremGold": 10, "level": 0, "tier": "5-9"}
	if score < 20:
		return {"idremGold": 0, "level": 1, "tier": "10-19"}
	if score < 30:
		return {"idremGold": 10, "level": 1, "tier": "20-29"}
	if score < 50:
		return {"idremGold": 10, "level": 1, "tier": "30-49"}
	return {"idremGold": 30, "level": 2, "tier": "50+"}

static func objective(value: Dictionary) -> String:
	match value.get("status", "NOT_STARTED"):
		"NOT_STARTED": return "Mission de clan : rends-toi dans ton propre sanctuaire."
		"ACCEPTED": return "Mission acceptée : écoute ton chef de clan."
		"IN_PROGRESS": return "Collecte des étoiles · 5 minutes"
		"TIME_EXPIRED", "REPORT_PENDING": return "Retourne voir ton chef de clan pour faire ton rapport."
		"COMPLETED": return "Mission de clan terminée · récompense enregistrée"
	return "Mission de clan indisponible"

static func hud_line(score: int, remaining: float) -> String:
	var seconds: int = maxi(0, ceili(remaining))
	return "⭐ Étoiles : %d\n⏱️ Temps : %02d:%02d" % [score, seconds / 60, seconds % 60]
