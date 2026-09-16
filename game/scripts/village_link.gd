class_name VillageLink
extends Node
## Native-only WSS; receives the opaque token from AccountAPI and never handles a password.
signal status_changed(message: String)
signal received(event: Dictionary)
signal disconnected
var api: CharacterAccountAPI
var peer: WebSocketPeer
var connected: bool = false
var enabled: bool = true
var active: bool = true
var attempts: int = 0
var retry_at: float = 0.0
var started_at: float = 0.0
var closing_at: float = -1.0
var last_received: float = 0.0
var last_frame: int = -1
var sequence: int = 0
var chat_sequence: int = 0
var combat_sequence: int = 0
var clock: float = 0.0
var send_clock: float = 0.0
var pose: Dictionary = {"p":[0,0.25,78],"yaw":0,"motion":"idle"}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	status_changed.emit("Connexion au village…")

static func integer(value: Variant, minimum: int = 0) -> bool:
	return typeof(value) in [TYPE_INT, TYPE_FLOAT] and is_finite(float(value)) and float(value) == floorf(float(value)) and value >= minimum and value <= 9007199254740991

static func point(value: Variant) -> bool:
	if not value is Array or value.size() != 3:
		return false
	for axis: Variant in value:
		if typeof(axis) not in [TYPE_INT, TYPE_FLOAT] or not is_finite(float(axis)):
			return false
	# Match the village perimeter plus the compact southern exterior. The strict
	# packet remains finite and carries the same shared coordinate envelope.
	return absf(float(value[0])) <= 148 and float(value[1]) >= -5 and float(value[1]) <= 12 and float(value[2]) >= -158 and float(value[2]) <= 428

static func state(value: Variant) -> bool:
	return value is Dictionary and integer(value.get("id"),1) and point(value.get("p")) and typeof(value.get("yaw")) in [TYPE_INT,TYPE_FLOAT] and is_finite(float(value["yaw"])) and absf(float(value["yaw"])) <= PI+0.00001 and value.get("motion") is String and value["motion"] in ["idle","walk","run","jump"]

static func combat_vector(value: Variant) -> bool:
	if not value is Array or value.size() != 3:
		return false
	for axis: Variant in value:
		if typeof(axis) not in [TYPE_INT,TYPE_FLOAT] or not is_finite(float(axis)) or absf(float(axis)) > 40:
			return false
	return true

static func combat_technique(value: Variant) -> bool:
	if not value is Dictionary or not plain(value.get("name"),80) or not plain(value.get("subtitle"),100) or not plain(value.get("element"),40) or not integer(value.get("motif")) or value["motif"] < 0 or value["motif"] > 15:
		return false
	for key: String in ["cost","cooldown","range"]:
		if typeof(value.get(key)) not in [TYPE_INT,TYPE_FLOAT] or not is_finite(float(value[key])) or float(value[key]) < 0:
			return false
	return true

static func account_progress(value: Variant) -> bool:
	if not value is Dictionary:
		return false
	for key: String in ["idremGold", "level"]:
		if not integer(value.get(key)):
			return false
	return true

static func academy_appearance(value: Variant) -> bool:
	if value == null:
		return true
	if not value is Dictionary or value.size() != CharacterAppearance.DEFAULTS.size():
		return false
	for key: String in CharacterAppearance.DEFAULTS:
		if not integer(value.get(key)) or value[key] >= CharacterAppearance.choices(key).size():
			return false
	return true

static func academy_profile(value: Variant) -> bool:
	if not value is Dictionary or value.get("kind") not in ["player", "npc"] or not plain(value.get("key"), 96) or not plain(value.get("name"), 50) or not plain(value.get("portraitId"), 120):
		return false
	if not integer(value.get("level")) or value["level"] > 100 or not plain(value.get("clan"), 50) or not plain(value.get("affinity"), 50) or not plain(value.get("style"), 100) or not plain(value.get("personality"), 240) or not academy_appearance(value.get("appearance")):
		return false
	if value["kind"] == "player" and not integer(value.get("id"), 1):
		return false
	if value["kind"] == "npc" and not plain(value.get("id"), 80):
		return false
	return true

static func academy_profiles(value: Variant) -> bool:
	if not value is Array or value.size() > 3:
		return false
	var seen: Dictionary = {}
	for item: Variant in value:
		if not academy_profile(item) or seen.has(item["key"]):
			return false
		seen[item["key"]] = true
	return true

static func academy_state(value: Variant) -> bool:
	if not value is Dictionary or not integer(value.get("schemaVersion"), 1) or value["schemaVersion"] != 1 or typeof(value.get("unlocked")) != TYPE_BOOL or not academy_profiles(value.get("candidates")) or not value.get("invitations") is Array or value["invitations"].size() > 3 or not plain(value.get("message"), 240):
		return false
	if value.get("candidate") != null and (not value["candidate"] is Dictionary or not plain(value["candidate"].get("status"), 20)):
		return false
	var group: Variant = value.get("group")
	if group != null:
		if not group is Dictionary or not integer(group.get("id"), 1) or not integer(group.get("ownerId"), 1) or group.get("status") != "FORMING" or not academy_profiles(group.get("members")):
			return false
	var team: Variant = value.get("team")
	if team != null:
		if not team is Dictionary or not integer(team.get("id"), 1) or not integer(team.get("teamNumber"), 1) or team.get("status") != "ACTIVE" or not academy_profile(team.get("sensei")) or not academy_profiles(team.get("members")) or team["members"].size() != 3:
			return false
		var sensei: Dictionary = team["sensei"]
		if not plain(sensei.get("title"), 120) or not plain(sensei.get("dialogue"), 500):
			return false
	for invite: Variant in value["invitations"]:
		if not invite is Dictionary or not integer(invite.get("id"), 1) or not integer(invite.get("groupId"), 1) or not academy_profile(invite.get("from")):
			return false
	return true

static func identity(value: Variant) -> bool:
	if not value is Dictionary or not integer(value.get("id"),1) or not plain(value.get("name"),50):
		return false
	var look: Variant = value.get("appearance")
	if look == null:
		return true
	if not look is Dictionary or look.size() != CharacterAppearance.DEFAULTS.size():
		return false
	for key: String in CharacterAppearance.DEFAULTS:
		if not integer(look.get(key)) or look[key] >= CharacterAppearance.choices(key).size():
			return false
	return true

static func plain(value: Variant, maximum: int) -> bool:
	if not value is String or value.is_empty() or value.length() > maximum:
		return false
	var units: int = 0
	for i in range(value.length()):
		units += 2 if value.unicode_at(i) > 0xffff else 1
	if units > maximum:
		return false
	var controls := RegEx.new()
	controls.compile("[\\p{Cc}\\p{Cf}\\p{Zl}\\p{Zp}]")
	if controls.search(value) != null:
		return false
	return true

func _process(delta: float) -> void:
	clock += delta
	if not enabled or not active or api == null:
		return
	if api.profile.is_empty():
		stop("Session terminée · Reviens à MON COMPTE.")
		return
	if peer == null:
		if clock >= retry_at:
			_connect()
		return
	peer.poll()
	var ready: int = peer.get_ready_state()
	if ready == WebSocketPeer.STATE_OPEN:
		peer.handshake_headers = PackedStringArray()
		var count: int = 0
		while peer.get_available_packet_count() > 0 and count < 32:
			count += 1
			var packet: PackedByteArray = peer.get_packet()
			if not peer.was_string_packet() or packet.size() > 16384:
				stop("Réponse réseau incompatible.")
				return
			var parser := JSON.new()
			if parser.parse(packet.get_string_from_utf8()) != OK or not _accept(parser.data):
				stop("Réponse réseau incompatible · Mets à jour le jeu et le serveur.")
				return
			last_received = clock
		if (not connected and clock-started_at > 30) or (connected and clock-last_received > 18):
			_retry()
			return
		if connected:
			send_clock += delta
			if send_clock >= 0.1:
				send_clock = 0.0
				var message: Dictionary = pose.duplicate(true)
				message["type"] = "move"
				message["seq"] = sequence
				sequence += 1
				_send(message)
	elif ready == WebSocketPeer.STATE_CLOSED:
		var code: int = peer.get_close_code()
		if code in [4001,4003]:
			api.forget()
			stop("Compte ouvert ailleurs." if code == 4001 else "Session expirée ou admission retirée. Reviens à MON COMPTE.")
		elif code in [1008,1009]:
			stop("Connexion refusée · Mets à jour l’application avant de réessayer.")
		else:
			_retry()
	elif ready == WebSocketPeer.STATE_CLOSING:
		# Finish polling a terminal close (not a new connection timeout). In
		# particular, do not lose 4001 after a long-lived connection is replaced.
		if closing_at < 0: closing_at = clock
		elif clock-closing_at > 3: _retry()
	elif ready == WebSocketPeer.STATE_CONNECTING and clock-started_at > 30:
		_retry()

func _connect() -> void:
	var session: Dictionary = api.village_session()
	if session.is_empty():
		stop("Visite locale · Réseau indisponible.")
		return
	attempts += 1
	peer = WebSocketPeer.new()
	peer.inbound_buffer_size = 32768
	peer.outbound_buffer_size = 8192
	peer.max_queued_packets = 64
	peer.handshake_headers = session["headers"]
	started_at = clock
	status_changed.emit("Connexion au village…" if attempts == 1 else "Reconnexion au village…")
	# Default TLS certificate verification; no redirects or query-string secrets.
	var error: Error = _open_socket(session)
	if error != OK:
		_retry()

func _open_socket(session: Dictionary) -> Error:
	return peer.connect_to_url(session["url"])

func _drop() -> void:
	connected = false
	closing_at = -1.0
	last_frame = -1
	sequence = 0
	chat_sequence = 0
	combat_sequence = 0
	send_clock = 0.0
	if peer != null:
		peer.handshake_headers = PackedStringArray()
		peer.close(1000,"Départ du village")
		peer = null
	disconnected.emit()

func _retry() -> void:
	_drop()
	if attempts >= 6:
		stop("Village indisponible · Reviens à MON COMPTE, puis réessaie. Vérifie aussi la mise à jour Render.")
		return
	retry_at = clock + minf(30,pow(2,maxi(0,attempts-1)))
	status_changed.emit("Hors ligne · Reconnexion automatique, aucun message renvoyé.")

func stop(message: String = "Hors ligne") -> void:
	enabled = false
	_drop()
	status_changed.emit(message)

func set_active(value: bool) -> void:
	active = value
	if not value:
		_drop()
		status_changed.emit("Hors ligne · Application en arrière-plan.")
	else:
		attempts = 0
		retry_at = clock

func _exit_tree() -> void:
	_drop()

func _send(message: Dictionary) -> bool:
	if peer == null or peer.get_ready_state() != WebSocketPeer.STATE_OPEN or peer.get_current_outbound_buffered_amount() > 4096:
		return false
	return peer.send_text(JSON.stringify(message)) == OK

func chat(channel: String, text: String) -> int:
	if not connected or channel not in ["RP","HRP"] or not plain(text.strip_edges(),240):
		return -1
	var seq: int = chat_sequence
	chat_sequence += 1
	if not _send({"type":"chat","seq":seq,"channel":channel,"text":text.strip_edges()}):
		return -1
	return seq

func secondary_action(action: String, slot: int, mission_id: String, revision: int, index: int = -1) -> bool:
	if connected and action in ["accept", "collect", "complete", "abandon"] and slot >= 0 and slot < 3 and not mission_id.is_empty() and revision >= 1 and index >= -1:
		return _send({"type":"secondary_action","action":action,"slot":slot,"missionId":mission_id,"revision":revision,"index":index})
	return false

func team_action(action: String, target_key: String = "", revision: int = 0) -> bool:
	# Team actions carry only a server-issued candidate key and revision.
	if not connected or action not in ["refresh", "apply", "withdraw", "invite", "accept", "decline", "form"] or target_key.length() > 24 or revision < 0:
		return false
	return _send({"type":"team_action", "action":action, "targetKey":target_key, "revision":revision})

func team_refresh() -> bool:
	# The initial room snapshot is sent at the Konoha spawn, where the candidate
	# list is intentionally empty. Refresh after the player reaches reception so
	# the server recomputes physical proximity and returns the two test NPCs.
	return team_action("refresh", "", 0)

func secondary_refresh() -> bool:
	if not connected:
		return false
	return _send({"type":"secondary_refresh"})

func academy_refresh() -> bool:
	if not connected:
		return false
	return _send({"type":"academy_action","action":"refresh"})

func academy_action(action: String, target_key: String = "") -> bool:
	if not connected or action not in ["apply", "withdraw", "invite"]:
		return false
	if action == "invite" and (target_key.is_empty() or target_key.length() > 80):
		return false
	var message := {"type":"academy_action","action":action}
	if action == "invite":
		message["targetKey"] = target_key
	return _send(message)

func academy_answer(invite_id: int, accepted: bool) -> bool:
	if not connected or invite_id < 1:
		return false
	return _send({"type":"academy_action","action":"accept_invite" if accepted else "decline_invite","inviteId":invite_id})

func academy_confirm() -> bool:
	if not connected:
		return false
	return _send({"type":"academy_action","action":"confirm_team"})

func combat_join() -> void:
	if connected:
		_send({"type":"combat_join"})

func combat_leave() -> void:
	if connected:
		_send({"type":"combat_leave"})

func combat_level(value: int) -> void:
	if connected and value >= 1 and value <= 50:
		_send({"type":"combat_level","level":value})

func combat_action(kind: String, aim: Vector3) -> int:
	if not connected or kind not in ["melee","skill_0","skill_1","skill_2","skill_3","ultimate"] or not is_finite(aim.x) or not is_finite(aim.y) or not is_finite(aim.z) or aim.length_squared() < 0.0001:
		return -1
	var seq: int = combat_sequence
	combat_sequence += 1
	if not _send({"type":"combat_action","seq":seq,"kind":kind,"direction":[aim.x,aim.y,aim.z]}):
		return -1
	return seq

func respawn() -> void:
	if connected:
		_send({"type":"respawn"})

func _accept(value: Variant) -> bool:
	if not value is Dictionary or not value.get("type") is String:
		return false
	var kind: String = value["type"]
	if kind == "welcome":
		if connected or not integer(value.get("protocol"),1) or value["protocol"] != 1 or not integer(value.get("self"),1) or value["self"] != api.profile.get("character",{}).get("id") or not point(value.get("spawn")) or not integer(value.get("radius"),1) or value["radius"] != 18:
			return false
		connected = true
		attempts = 0
		status_changed.emit("Connecté · Proximité 12 m · RP / HRP")
	elif not connected:
		return false
	elif kind in ["roster","snapshot"]:
		if not value.get("players") is Array or value["players"].size() > 20:
			return false
		var seen: Dictionary = {}
		for item: Variant in value["players"]:
			if not (identity(item) if kind == "roster" else state(item)) or seen.has(item["id"]):
				return false
			seen[item["id"]] = true
		if kind == "snapshot":
			if not integer(value.get("frame"),1):
				return false
			if value["frame"] <= last_frame:
				return true
			last_frame = int(value["frame"])
	elif kind == "correction":
		if not state(value) or value["id"] != api.profile.get("character",{}).get("id"):
			return false
	elif kind == "chat":
		if not plain(value.get("id"),50) or not integer(value.get("sender"),1) or not plain(value.get("name"),50) or not plain(value.get("text"),240) or not value.get("channel") is String or value["channel"] not in ["RP","HRP"]:
			return false
	elif kind == "chat_ack":
		if not integer(value.get("seq")):
			return false
	elif kind == "academy_state":
		if not academy_state(value):
			return false
	elif kind == "secondary_state":
		if not SecondaryMission.valid_state(value) or (value.has("progress") and not account_progress(value["progress"])):
			return false
	elif kind == "secondary_action_ack":
		if value.get("action") not in ["accept", "collect", "complete", "abandon"] or not SecondaryMission.valid_state(value.get("state")) or not account_progress(value.get("progress")):
			return false
	elif kind == "team_state":
		if not TeamManager.valid_state(value):
			return false
	elif kind == "team_action_ack":
		if value.get("action") not in ["refresh", "apply", "withdraw", "invite", "accept", "decline", "form"] or not TeamManager.valid_state(value.get("state")):
			return false
	elif kind == "combat_waiting":
		if not value.get("players") is Array or value["players"].size() > 2 or not integer(value.get("needed"),1) or value["needed"] > 2:
			return false
		for name: Variant in value["players"]:
			if not plain(name,50):
				return false
	elif kind == "combat_started":
		if not value.get("players") is Array or value["players"].size() != 2:
			return false
		for id: Variant in value["players"]:
			if not integer(id,1):
				return false
	elif kind == "combat_state":
		if value.get("status") not in ["waiting","active"] or not value.get("players") is Array or value["players"].size() > 2:
			return false
		for combatant: Variant in value["players"]:
			if not combatant is Dictionary or not integer(combatant.get("id"),1) or not plain(combatant.get("name"),50) or not plain(combatant.get("clan"),50) or not integer(combatant.get("level"),1) or combatant["level"] > 50:
				return false
			for field: String in ["health","maxHealth","chakra","maxChakra"]:
				if typeof(combatant.get(field)) not in [TYPE_INT,TYPE_FLOAT] or not is_finite(float(combatant[field])) or float(combatant[field]) < 0:
					return false
			var techniques: Variant = combatant.get("techniques")
			if not techniques is Array or techniques.size() != 4:
				return false
			for technique_value: Variant in techniques:
				if not combat_technique(technique_value):
					return false
	elif kind == "combat_action":
		if not integer(value.get("actionId"),1) or not integer(value.get("attacker"),1) or value.get("kind") not in ["melee","skill_0","skill_1","skill_2","skill_3","ultimate"] or not combat_vector(value.get("origin")) or not combat_vector(value.get("direction")) or not combat_vector(value.get("target")):
			return false
		if value["kind"] == "ultimate":
			var ultimate: Variant = value.get("ultimate")
			if not ultimate is Dictionary or not plain(ultimate.get("clan"),50) or not plain(ultimate.get("name"),80) or not integer(ultimate.get("motif")) or ultimate["motif"] < 0 or ultimate["motif"] > 15 or not integer(ultimate.get("level"),1) or ultimate["level"] > 50:
				return false
		elif value["kind"] in ["skill_0","skill_1","skill_2","skill_3"] and not combat_technique(value.get("technique")):
			return false
	elif kind == "combat_hit":
		if not integer(value.get("attacker"),1) or not integer(value.get("target"),1) or value.get("kind") not in ["melee","skill_0","skill_1","skill_2","skill_3","ultimate"] or not combat_vector(value.get("position")) or typeof(value.get("damage")) not in [TYPE_INT,TYPE_FLOAT] or float(value["damage"]) <= 0 or typeof(value.get("health")) not in [TYPE_INT,TYPE_FLOAT] or float(value["health"]) < 0:
			return false
		if value["kind"] in ["skill_0","skill_1","skill_2","skill_3"] and not combat_technique(value.get("technique")):
			return false
	elif kind == "combat_evaded":
		if not integer(value.get("attacker"),1) or not integer(value.get("target"),1) or not combat_vector(value.get("position")):
			return false
	elif kind == "combat_result":
		if not integer(value.get("winner"),1) or not integer(value.get("loser"),1) or not plain(value.get("reason"),120):
			return false
	elif kind == "combat_end":
		if not plain(value.get("reason"),120):
			return false
	elif kind == "error":
		var error_code := str(value.get("code", ""))
		var known_error := error_code in ["CHAT_RATE","COMBAT_BUSY","COMBAT_ACTION","SECONDARY_LOCKED","SECONDARY_CONFLICT","SECONDARY_NOT_AVAILABLE","SECONDARY_ALREADY_ACTIVE","SECONDARY_NOT_OWNER","SECONDARY_OBJECTIVE_INVALID","SECONDARY_TOO_FAR","SECONDARY_NOT_COMPLETE","INVALID_SECONDARY_ACTION","SECONDARY_ACTION","TEAM_LOCKED","TEAM_ACTION_INVALID","TEAM_NOT_AT_RECEPTION","TEAM_ALREADY_CANDIDATE","TEAM_NOT_CANDIDATE","TEAM_OFFICIAL","TEAM_TARGET_INVALID","TEAM_TARGET_UNKNOWN","TEAM_TARGET_BUSY","TEAM_INVITE_CONFLICT","TEAM_FULL","TEAM_NO_INVITE","TEAM_ALREADY_MEMBER","TEAM_INVITE_STALE","TEAM_INCOMPLETE","TEAM_FORM_RACE","TEAM_ACTION","TEAM_DB"] or error_code.begins_with("ACADEMY_") or error_code == "INVALID_ACADEMY_ACTION"
		if not plain(error_code, 64) or not known_error or not plain(value.get("error"),240):
			return false
	else:
		return false
	received.emit(value)
	return true
