class_name CharacterAccountAPI
extends Node
## Scoped game session: the password is never stored; an opaque device token is remembered so returning players do not have to re-enter the website URL, email or password.
signal completed(operation: String, success: bool, message: String)
var profile: Dictionary = {}
var busy: bool = false
const SESSION_PATH: String = "user://game-device-session.cfg"
var _token: String = ""
var _origin: String = ""
var _expires_at: int = 0
var _operation: String = ""
var request_node: HTTPRequest

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	request_node = HTTPRequest.new()
	request_node.timeout = 90.0 # Render Free / Neon may need to wake up.
	request_node.max_redirects = 0 # Never forward credentials to another host.
	request_node.body_size_limit = 32768
	add_child(request_node)
	request_node.request_completed.connect(_response)
	call_deferred("_restore_device_session")

static func normalize_origin(value: String) -> String:
	var origin: String = value.strip_edges().to_lower()
	var pattern := RegEx.new()
	pattern.compile("^https://([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,63}(?::443)?/?$")
	if pattern.search(origin) == null:
		return ""
	return origin.trim_suffix("/").trim_suffix(":443")

func _restore_device_session() -> void:
	var config := ConfigFile.new()
	if config.load(SESSION_PATH) != OK:
		return
	var saved_origin := normalize_origin(str(config.get_value("session", "origin", "")))
	var saved_token := str(config.get_value("session", "token", ""))
	var saved_expiry: int = int(config.get_value("session", "expiresAt", 0))
	var token_pattern := RegEx.new()
	token_pattern.compile("^[a-f0-9]{64}$")
	if saved_origin.is_empty() or token_pattern.search(saved_token) == null or saved_expiry <= int(Time.get_unix_time_from_system()*1000):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SESSION_PATH))
		return
	_origin = saved_origin
	_token = saved_token
	_expires_at = saved_expiry
	_send("restore", HTTPClient.METHOD_GET, "/profile")

func login(origin: String, email: String, password: String) -> void:
	if busy:
		return
	forget()
	_origin = normalize_origin(origin)
	if _origin.is_empty():
		completed.emit("login", false, "Indique l’adresse HTTPS exacte de ton site, sans chemin ni identifiant dans l’URL.")
		return
	_send("login", HTTPClient.METHOD_POST, "/login", {"email": email.strip_edges(), "password": password})

func refresh() -> void:
	if not busy:
		_send("refresh", HTTPClient.METHOD_GET, "/profile")

func save_appearance(value: Dictionary) -> void:
	if not busy:
		_send("save", HTTPClient.METHOD_PUT, "/appearance", {"schemaVersion": 1, "expectedRevision": profile.get("revision", 0), "appearance": value})

func mission_event(event: String) -> void:
	if busy:
		return
	var state: Variant = profile.get("welcomeMission")
	if event not in WelcomeMission.EVENTS or not WelcomeMission.valid_state(state):
		completed.emit("mission", false, "Actualise la mission après la mise à jour du serveur.")
		return
	_send("mission", HTTPClient.METHOD_POST, "/missions/welcome/events", {"event": event, "expectedRevision": state["revision"]})

func clan_mission_event(event: String, score: int = -1) -> void:
	if busy:
		return
	var state: Variant = profile.get("clanMission")
	if event not in ClanMission.EVENTS or not ClanMission.valid_state(state):
		completed.emit("clanMission", false, "Actualise la mission de clan après la mise à jour du serveur.")
		return
	var body: Dictionary = {"event": event, "expectedRevision": state["revision"]}
	if event == "expire":
		body["score"] = maxi(0, score)
	_send("clanMission", HTTPClient.METHOD_POST, "/missions/clan/events", body)

func _remember_device_session() -> void:
	if _token.is_empty() or _origin.is_empty() or _expires_at <= 0:
		return
	var config := ConfigFile.new()
	config.set_value("session", "origin", _origin)
	config.set_value("session", "token", _token)
	config.set_value("session", "expiresAt", _expires_at)
	config.save(SESSION_PATH)

func _clear_device_session() -> void:
	DirAccess.remove_absolute(ProjectSettings.globalize_path(SESSION_PATH))

func logout() -> void:
	if busy:
		return
	_send("logout", HTTPClient.METHOD_POST, "/logout", {})
	forget()

func forget() -> void:
	_token = ""
	_expires_at = 0
	profile = {}
	_clear_device_session()

func village_session() -> Dictionary:
	if _token.is_empty() or profile.is_empty() or normalize_origin(_origin).is_empty():
		return {}
	return {"url": _origin.replace("https://", "wss://") + "/api/game/village", "headers": PackedStringArray(["Authorization: Bearer " + _token])}

func _send(operation: String, method: int, path: String, body: Variant = null) -> void:
	if operation != "login" and _token.is_empty():
		completed.emit(operation, false, "Reconnecte-toi dans l’application.")
		return
	_operation = operation
	busy = true
	var headers := PackedStringArray(["Content-Type: application/json", "Accept: application/json"])
	if not _token.is_empty():
		headers.append("Authorization: Bearer " + _token)
	var error: Error = request_node.request(_origin + "/api/game" + path, headers, method, "" if body == null else JSON.stringify(body))
	if error != OK:
		busy = false
		completed.emit(operation, false, "Impossible de lancer la connexion. Vérifie le réseau et réessaie.")

static func valid_profile(value: Variant) -> bool:
	if not value is Dictionary:
		return false
	for key in ["protocol", "schemaVersion"]:
		var version: Variant = value.get(key)
		if typeof(version) not in [TYPE_INT, TYPE_FLOAT] or version != 1:
			return false
	if value.has("welcomeMission") and not WelcomeMission.valid_state(value["welcomeMission"]):
		return false
	if value.has("clanMission") and not ClanMission.valid_state(value["clanMission"]):
		return false
	if value.has("secondaryMissions") and not SecondaryMission.valid_state(value["secondaryMissions"]):
		return false
	if value.has("progress"):
		var progress: Variant = value["progress"]
		if not progress is Dictionary or typeof(progress.get("idremGold")) not in [TYPE_INT, TYPE_FLOAT] or typeof(progress.get("level")) not in [TYPE_INT, TYPE_FLOAT] or progress["idremGold"] < 0 or progress["level"] < 0:
			return false
	var identity: Variant = value.get("character")
	var revision: Variant = value.get("revision")
	if not identity is Dictionary or typeof(revision) not in [TYPE_INT, TYPE_FLOAT]:
		return false
	if not is_finite(float(revision)) or revision < 0 or revision > 2147483647 or floorf(float(revision)) != revision:
		return false
	for key in ["name", "clan", "affinity"]:
		if not identity.get(key) is String or identity[key].is_empty() or identity[key].length() > 50:
			return false
	if typeof(identity.get("id")) not in [TYPE_INT, TYPE_FLOAT] or not is_finite(float(identity["id"])) or identity["id"] <= 0 or identity["id"] != floorf(float(identity["id"])) or not identity.get("mokuton") is bool:
		return false
	if not identity.get("rank") is String or not identity.get("village") is String or identity["rank"] != "Genin" or identity["village"] != "Konoha":
		return false
	var appearance: Variant = value.get("appearance")
	if revision == 0:
		return appearance == null
	if not appearance is Dictionary or appearance.size() != CharacterAppearance.DEFAULTS.size():
		return false
	for key: String in CharacterAppearance.DEFAULTS:
		var raw: Variant = appearance.get(key)
		if typeof(raw) not in [TYPE_INT, TYPE_FLOAT]:
			return false
		var number: float = float(raw)
		if not is_finite(number) or number < 0 or number >= CharacterAppearance.choices(key).size() or number != floorf(number):
			return false
	# JSON numbers are floats in Godot; dictionary equality with integer defaults
	# would reject an otherwise valid saved profile after a real network response.
	return true

func _response(result: int, status: int, _headers: PackedStringArray, bytes: PackedByteArray) -> void:
	busy = false
	var operation: String = _operation
	if result != HTTPRequest.RESULT_SUCCESS:
		completed.emit(operation, false, "Connexion interrompue. Une sauvegarde peut avoir abouti : actualise avant de réessayer." if operation in ["save", "mission"] else "Serveur indisponible ou connexion interrompue. Vérifie le réseau et réessaie.")
		return
	var parser := JSON.new()
	if parser.parse(bytes.get_string_from_utf8()) != OK or not parser.data is Dictionary:
		completed.emit(operation, false, "Réponse incompatible. Vérifie l’adresse et la mise à jour du serveur.")
		return
	var data: Dictionary = parser.data
	if status < 200 or status >= 300:
		if status == 404:
			completed.emit(operation, false, "Cette fonction nécessite la mise à jour du serveur sur Render. Actualise ensuite le compte ou le journal.")
			return
		if status == 401 or status == 403:
			forget()
		var message: String = "Connexion refusée. Vérifie le serveur et réessaie."
		if data.get("error") is String:
			message = data["error"].left(240)
		completed.emit(operation, false, message)
		return
	if operation == "logout":
		completed.emit(operation, true, "Déconnecté. Aucun mot de passe ni jeton n’est conservé sur le téléphone.")
		return
	var value: Variant = data.get("profile") if operation == "login" else data
	if not valid_profile(value) or (operation == "mission" and not value.has("welcomeMission")):
		forget()
		completed.emit(operation, false, "Profil incompatible. Mets à jour le serveur et l’application.")
		return
	if operation == "login":
		var token_pattern := RegEx.new()
		token_pattern.compile("^[a-f0-9]{64}$")
		if not data.get("token") is String or token_pattern.search(data["token"]) == null:
			completed.emit(operation, false, "Session invalide reçue du serveur.")
			return
		_token = data["token"]
		_expires_at = int(data.get("expiresAt", 0))
	profile = value.duplicate(true)
	if operation == "login":
		_remember_device_session()
	elif operation == "restore":
		# Keep the opaque token only; never reconstruct or store the password.
		_remember_device_session()
	completed.emit(operation, true, "Étape enregistrée sur ton compte." if operation == "mission" else "Apparence enregistrée sur ton compte." if operation == "save" else "Personnage récupéré depuis le site, sans nouveau tirage.")
