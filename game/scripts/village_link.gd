class_name VillageLink
extends Node
## Native-only WSS; credentials from the existing HTTPS login, RAM only.
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
var pose: Dictionary = {"p":[0,0.25,22],"yaw":0,"motion":"idle"}

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
	return absf(float(value[0])) <= 31 and float(value[1]) >= -5 and float(value[1]) <= 12 and absf(float(value[2])) <= 35

static func state(value: Variant) -> bool:
	return value is Dictionary and integer(value.get("id"),1) and point(value.get("p")) and typeof(value.get("yaw")) in [TYPE_INT,TYPE_FLOAT] and is_finite(float(value["yaw"])) and absf(float(value["yaw"])) <= PI+0.00001 and value.get("motion") is String and value["motion"] in ["idle","walk","run","jump"]

static func combat_vector(value: Variant) -> bool:
	if not value is Array or value.size() != 3:
		return false
	for axis: Variant in value:
		if typeof(axis) not in [TYPE_INT,TYPE_FLOAT] or not is_finite(float(axis)) or absf(float(axis)) > 40:
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
		if (not connected and clock-started_at > 20) or (connected and clock-last_received > 6):
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
		if connected or not integer(value.get("protocol"),1) or value["protocol"] != 1 or not integer(value.get("self"),1) or value["self"] != api.profile.get("character",{}).get("id") or not point(value.get("spawn")) or not integer(value.get("radius"),1) or value["radius"] != 12:
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
	elif kind == "combat_action":
		if not integer(value.get("actionId"),1) or not integer(value.get("attacker"),1) or value.get("kind") not in ["melee","skill_0","skill_1","skill_2","skill_3","ultimate"] or not combat_vector(value.get("origin")) or not combat_vector(value.get("direction")) or not combat_vector(value.get("target")):
			return false
		if value["kind"] == "ultimate":
			var ultimate: Variant = value.get("ultimate")
			if not ultimate is Dictionary or not plain(ultimate.get("clan"),50) or not plain(ultimate.get("name"),80) or not integer(ultimate.get("motif")) or ultimate["motif"] < 0 or ultimate["motif"] > 15 or not integer(ultimate.get("level"),1) or ultimate["level"] > 50:
				return false
	elif kind == "combat_hit":
		if not integer(value.get("attacker"),1) or not integer(value.get("target"),1) or value.get("kind") not in ["melee","skill_0","skill_1","skill_2","skill_3","ultimate"] or not combat_vector(value.get("position")) or typeof(value.get("damage")) not in [TYPE_INT,TYPE_FLOAT] or float(value["damage"]) <= 0 or typeof(value.get("health")) not in [TYPE_INT,TYPE_FLOAT] or float(value["health"]) < 0:
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
		if not value.get("code") is String or value["code"] not in ["CHAT_RATE","COMBAT_BUSY","COMBAT_ACTION"] or not plain(value.get("error"),240):
			return false
	else:
		return false
	received.emit(value)
	return true
