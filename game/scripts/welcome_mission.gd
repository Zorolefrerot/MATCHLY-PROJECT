class_name WelcomeMission
extends RefCounted
## Server-confirmed orientation, independent from combat and cosmetic revisions.
const PLACES: Array[String] = ["academy", "market", "hokage"]
const NAMES: Array[String] = ["Académie", "Marché", "Résidence du Hokage"]
const EVENTS: Array[String] = ["accept", "read_academy", "read_market", "read_hokage", "report"]

static func valid_state(value: Variant) -> bool:
	if not value is Dictionary or value.size() != 5:
		return false
	var schema_version: Variant = value.get("schemaVersion")
	if typeof(schema_version) not in [TYPE_INT, TYPE_FLOAT] or schema_version != 1:
		return false
	if not value.get("missionId") is String or value["missionId"] != "konoha_welcome":
		return false
	var status: Variant = value.get("status")
	var visited: Variant = value.get("visited")
	var revision: Variant = value.get("revision")
	if not status is String or status not in ["available", "active", "completed"] or not visited is Array:
		return false
	if typeof(revision) not in [TYPE_INT, TYPE_FLOAT] or not is_finite(float(revision)):
		return false
	var unique: Dictionary = {}
	for place: Variant in visited:
		if not place is String or place not in PLACES or unique.has(place):
			return false
		unique[place] = true
	if status == "available":
		return revision == 0 and visited.is_empty()
	if status == "completed":
		return revision == 5 and visited.size() == 3
	return revision == 1 + visited.size()

static func objective(state: Dictionary) -> String:
	match state.get("status", ""):
		"available": return "Mission d’accueil : parle à Aoi près de la porte."
		"completed": return "Premiers pas à Konoha · Mission terminée"
		"active":
			if state["visited"].size() == 3:
				return "Trois lieux repérés : retourne faire ton rapport à Aoi."
			return "Mission d’accueil : %d / 3 panneaux validés" % state["visited"].size()
	return "Exploration solo · Mission indisponible sur ce serveur"

static func journal(state: Dictionary) -> String:
	if state.is_empty():
		return "La mission d’accueil nécessite la nouvelle version du serveur.\nTu peux explorer, mais aucune mission ne sera enregistrée ici.\nAprès la mise à jour du site, actualise ce journal."
	var status: String = state["status"]
	var text: String = "PREMIERS PAS À KONOHA\n"
	text += "[OK] Mission acceptée auprès d’Aoi\n" if status != "available" else "[  ] Parler à Aoi et accepter sa mission\n"
	for i in range(PLACES.size()):
		text += ("[OK] " if PLACES[i] in state["visited"] else "[  ] ") + "Lire le panneau : " + NAMES[i] + "\n"
	text += "[OK] Rapport remis à Aoi · Terminée\n" if status == "completed" else "[  ] Revenir faire son rapport à Aoi\n"
	text += "Étapes confirmées sur ton compte. Position non sauvegardée.\nMission solo, sans ryō, objet, expérience ni pouvoir accordé."
	return text
