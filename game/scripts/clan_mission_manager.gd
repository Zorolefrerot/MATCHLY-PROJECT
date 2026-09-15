class_name ClanMissionManager
extends Node3D
## Generic mission-2 controller. Clan data selects the sanctuary, chief and
## outfit; one local manager owns one player's private star field.
signal state_changed(value: Dictionary)
signal expiration_requested(score: int)
signal collection_feedback(text: String)

const CLAN_DATA: Dictionary = {
	"Uchiwa": {"clan_id":"uchiwa", "leader":"Chef Akihiro", "accessory":"fan", "emblem":"UCH", "color":Color("67428e"), "accent":Color("ef9a55"), "dark":Color("302943"), "scale":1.00, "appearance":{"model":0,"hair":1,"hair_color":0,"eyes":1,"skin":2,"top":1,"top_color":6,"bottom":0,"bottom_color":1}, "dialogue":"La flamme Uchiwa veille sur chaque génération."},
	"Uzumaki": {"clan_id":"uzumaki", "leader":"Chef Raizen", "accessory":"spiral", "emblem":"UZU", "color":Color("3a7ca5"), "accent":Color("e66c58"), "dark":Color("25435e"), "scale":1.04, "appearance":{"model":1,"hair":2,"hair_color":7,"eyes":2,"skin":1,"top":0,"top_color":5,"bottom":1,"bottom_color":4}, "dialogue":"Les sceaux Uzumaki protègent ceux qui parcourent ces rues."},
	"Senju": {"clan_id":"senju", "leader":"Chef Kaemon", "accessory":"wood", "emblem":"SEN", "color":Color("6c9b61"), "accent":Color("b6d39a"), "dark":Color("385342"), "scale":1.08, "appearance":{"model":0,"hair":3,"hair_color":2,"eyes":3,"skin":2,"top":0,"top_color":4,"bottom":1,"bottom_color":1}, "dialogue":"La force Senju se mesure à la manière dont tu aides le village."},
	"Hyūga": {"clan_id":"hyuga", "leader":"Chef Shirogane", "accessory":"eyes", "emblem":"HYU", "color":Color("ded1a0"), "accent":Color("bce9ff"), "dark":Color("596679"), "scale":0.98, "appearance":{"model":1,"hair":2,"hair_color":5,"eyes":2,"skin":0,"top":1,"top_color":2,"bottom":0,"bottom_color":1}, "dialogue":"Le regard Hyūga distingue le chemin juste, même dans la brume."},
	"Akimichi": {"clan_id":"akimichi", "leader":"Chef Gensai", "accessory":"scroll", "emblem":"AKI", "color":Color("b84b45"), "accent":Color("ffd079"), "dark":Color("63302f"), "scale":1.18, "appearance":{"model":0,"hair":0,"hair_color":4,"eyes":0,"skin":3,"top":1,"top_color":3,"bottom":1,"bottom_color":4}, "dialogue":"Un Akimichi partage sa table et sa détermination."},
	"Yamanaka": {"clan_id":"yamanaka", "leader":"Chef Ayame", "accessory":"flower", "emblem":"YAM", "color":Color("d48a62"), "accent":Color("f4b7d1"), "dark":Color("70495b"), "scale":0.97, "appearance":{"model":1,"hair":1,"hair_color":3,"eyes":5,"skin":1,"top":0,"top_color":7,"bottom":0,"bottom_color":2}, "dialogue":"L’esprit Yamanaka reste attentif aux voix discrètes du village."},
	"Aburame": {"clan_id":"aburame", "leader":"Chef Mutsuro", "accessory":"visor", "emblem":"ABU", "color":Color("34434a"), "accent":Color("9aac78"), "dark":Color("1c282d"), "scale":1.02, "appearance":{"model":0,"hair":3,"hair_color":6,"eyes":1,"skin":2,"top":1,"top_color":1,"bottom":0,"bottom_color":1}, "dialogue":"Les insectes Aburame connaissent les détours que les cartes oublient."},
	"Inuzuka": {"clan_id":"inuzuka", "leader":"Chef Kurogane", "accessory":"fangs", "emblem":"INU", "color":Color("76513b"), "accent":Color("d8b279"), "dark":Color("3b2925"), "scale":1.10, "appearance":{"model":0,"hair":1,"hair_color":1,"eyes":5,"skin":3,"top":2,"top_color":4,"bottom":2,"bottom_color":1}, "dialogue":"Cours avec ton instinct : les pistes Inuzuka se gagnent sur le terrain."},
	"Fushiguro": {"clan_id":"fushiguro", "leader":"Chef Shunrei", "accessory":"shadow", "emblem":"FUS", "color":Color("8b2c35"), "accent":Color("9b98d3"), "dark":Color("27263f"), "scale":1.03, "appearance":{"model":0,"hair":1,"hair_color":6,"eyes":1,"skin":1,"top":0,"top_color":1,"bottom":0,"bottom_color":1}, "dialogue":"Les ombres Fushiguro révèlent la route sans l’éclairer."},
	"Itadori": {"clan_id":"itadori", "leader":"Chef Renjiro", "accessory":"tattoo", "emblem":"ITA", "color":Color("bd4e3b"), "accent":Color("f5c4a0"), "dark":Color("462734"), "scale":1.06, "appearance":{"model":0,"hair":1,"hair_color":0,"eyes":0,"skin":2,"top":2,"top_color":3,"bottom":0,"bottom_color":1}, "dialogue":"Le cœur Itadori avance même quand la mission devient difficile."},
	"Kurosaki": {"clan_id":"kurosaki", "leader":"Chef Tetsuya", "accessory":"moon", "emblem":"KUR", "color":Color("3d718c"), "accent":Color("66b9f2"), "dark":Color("26394c"), "scale":1.07, "appearance":{"model":0,"hair":0,"hair_color":5,"eyes":2,"skin":0,"top":0,"top_color":5,"bottom":0,"bottom_color":1}, "dialogue":"Le croissant Kurosaki guide ceux qui gardent la tête froide."},
	"Shunsui": {"clan_id":"shunsui", "leader":"Chef Hanamori", "accessory":"mask", "emblem":"SHU", "color":Color("bf6d87"), "accent":Color("f6c5db"), "dark":Color("59374d"), "scale":1.00, "appearance":{"model":1,"hair":3,"hair_color":7,"eyes":3,"skin":1,"top":1,"top_color":6,"bottom":1,"bottom_color":4}, "dialogue":"Le clan Shunsui transforme la patience en élégance et en précision."},
	"Yeager": {"clan_id":"yeager", "leader":"Chef Arakumo", "accessory":"armor", "emblem":"YEA", "color":Color("8d4e3e"), "accent":Color("e2b271"), "dark":Color("3d3030"), "scale":1.15, "appearance":{"model":0,"hair":3,"hair_color":2,"eyes":0,"skin":2,"top":1,"top_color":0,"bottom":1,"bottom_color":1}, "dialogue":"La garde Yeager ne recule pas devant les longues routes."},
	"Ackerman": {"clan_id":"ackerman", "leader":"Chef Sazanami", "accessory":"blades", "emblem":"ACK", "color":Color("e5e4d2"), "accent":Color("94cabb"), "dark":Color("33434a"), "scale":1.01, "appearance":{"model":1,"hair":0,"hair_color":0,"eyes":4,"skin":0,"top":0,"top_color":2,"bottom":2,"bottom_color":1}, "dialogue":"Les lames Ackerman ouvrent les passages, jamais les portes interdites."},
}

# All points lie on documented streets, plazas or public landmarks in the
# Konoha map. They are local SpawnPoints, never networked objects.
const STAR_SPAWN_POINTS: Array[Vector3] = [
	Vector3(-60, 0.65, 105), Vector3(-45, 0.65, 72), Vector3(-8, 0.65, 55), Vector3(43, 0.65, 72), Vector3(60, 0.65, 105),
	Vector3(-128, 0.65, 20), Vector3(-92, 0.65, 15), Vector3(-56, 0.65, -44), Vector3(0, 0.65, -38), Vector3(52, 0.65, -44),
	Vector3(92, 0.65, 15), Vector3(128, 0.65, 20), Vector3(-48, 0.65, 8), Vector3(44, 0.65, 12), Vector3(-22, 0.65, 28),
	Vector3(20, 0.65, 28), Vector3(-75, 0.65, -72), Vector3(75, 0.65, -72), Vector3(0, 0.65, 92), Vector3(0, 0.65, 18),
]

var player: TrainingFighter
var hud: KonohaHUD
var profile: Dictionary = {}
var clan_id: String = "uchiwa"
var mission: Dictionary = ClanMission.blank()
var leaders: Dictionary = {}
var access_gates: Array[Dictionary] = []
var active_stars: Dictionary = {}
var spawn_cursor: int = 0
var last_collected_slot: int = -1
var score: int = 0
var remaining_seconds: float = ClanMission.DURATION_SECONDS
var running: bool = false
var mission_unlocked: bool = false
var local_started_at: float = 0.0
var access_notice_cooldown: float = 0.0
var rng := RandomNumberGenerator.new()

func configure(value_player: TrainingFighter, value_hud: KonohaHUD, value_profile: Dictionary) -> void:
	player = value_player
	hud = value_hud
	profile = value_profile.duplicate(true)
	var identity: Dictionary = profile.get("character", {})
	mission_unlocked = str(profile.get("welcomeMission", {}).get("status", "")) == "completed"
	clan_id = normalize_clan(str(identity.get("clan_id", identity.get("clan", "Uchiwa"))) )
	player.clan_id = clan_id
	player.set_meta("clan_id", clan_id)
	rng.seed = abs(hash(str(identity.get("id", 1)) + clan_id)) + 1
	_build_sanctuary_leaders()
	_set_barriers()
	var saved: Variant = profile.get("clanMission")
	if ClanMission.valid_state(saved):
		sync_state(saved)
	else:
		sync_state(ClanMission.blank())

static func normalize_clan(value: String) -> String:
	var candidate := value.strip_edges().trim_prefix("CLAN ").to_lower()
	for name: String in CLAN_DATA.keys():
		var normalized := name.to_lower().replace("ū", "u").replace("û", "u").replace("î", "i").replace("ï", "i")
		if candidate == normalized or candidate == name.to_lower():
			return str(CLAN_DATA[name]["clan_id"])
	return "uchiwa"

func _data_for_id(value: String) -> Dictionary:
	for name: String in CLAN_DATA.keys():
		if str(CLAN_DATA[name]["clan_id"]) == value:
			var result: Dictionary = CLAN_DATA[name].duplicate(true)
			result["clan"] = name
			return result
	return CLAN_DATA["Uchiwa"].duplicate(true)

func _build_sanctuary_leaders() -> void:
	for data: Dictionary in KonohaMap.DISTRICTS:
		if str(data.get("kind", "")) != "clan":
			continue
		var clan_name := str(data["name"]).trim_prefix("CLAN ")
		var clan_data := _data_for_id(normalize_clan(clan_name))
		var sanctuary_point: Vector3 = data["point"] + KonohaMap.CLAN_SANCTUARY_OFFSET
		var gate_point := sanctuary_point + Vector3(0, 0, KonohaMap.SANCTUARY_HALF_DEPTH)
		var leader := ClanMissionLeader.new()
		leader.name = "ClanLeader_" + str(clan_data["clan_id"])
		leader.position = sanctuary_point + Vector3(0, 0.0, 10.0)
		leader.rotation.y = PI # Chiefs face the identifiable courtyard entrance.
		leader.configure(clan_data)
		add_child(leader)
		leaders[clan_data["clan_id"]] = leader
		var barrier := StaticBody3D.new()
		barrier.name = "ClanAccessBarrier_" + str(clan_data["clan_id"])
		barrier.position = gate_point + Vector3.UP * 1.1
		barrier.collision_layer = 1
		barrier.collision_mask = 0
		var barrier_shape := CollisionShape3D.new()
		var box_shape := BoxShape3D.new()
		box_shape.size = Vector3(KonohaMap.CLAN_GATE_WIDTH, 2.2, 0.45)
		barrier_shape.shape = box_shape
		barrier.add_child(barrier_shape)
		add_child(barrier)
		access_gates.append({"clan_id":clan_data["clan_id"], "clan":clan_data["clan"], "entry":gate_point, "barrier":barrier_shape, "leader":leader, "message_sent":false})

func _set_barriers() -> void:
	for gate: Dictionary in access_gates:
		var barrier: CollisionShape3D = gate["barrier"]
		barrier.disabled = str(gate["clan_id"]) == clan_id

func set_welcome_completed(value: bool) -> void:
	mission_unlocked = value

func nearest_leader() -> ClanMissionLeader:
	if player == null or not leaders.has(clan_id):
		return null
	var leader: ClanMissionLeader = leaders[clan_id]
	return leader if player.global_position.distance_to(leader.global_position) <= 3.8 else null

func is_near_own_leader() -> bool:
	return nearest_leader() != null

func interaction_title() -> String:
	var data := _data_for_id(clan_id)
	return str(data["leader"]) + " · " + str(data["clan"])

func interaction_text() -> String:
	var data := _data_for_id(clan_id)
	if not mission_unlocked and mission.get("status", "NOT_STARTED") == "NOT_STARTED":
		return "Bienvenue dans la cour de ton clan.\n\nTermine d'abord la mission d'accueil d'Aoi avant de recevoir la mission des étoiles."
	match mission.get("status", "NOT_STARTED"):
		"NOT_STARTED": return "Tu es enfin venu. J'ai une mission pour toi.\n%s\n\nParcours le village et récupère autant d'étoiles que possible. La collecte dure exactement 5 minutes." % str(data["dialogue"])
		"ACCEPTED": return "La mission est acceptée. Prépare-toi à parcourir le village."
		"IN_PROGRESS": return "La collecte est en cours. Reviens après le compte à rebours pour faire ton rapport."
		"TIME_EXPIRED", "REPORT_PENDING": return "Combien d'étoiles as-tu réussi à récupérer ?\n\nÉtoiles récupérées : %d" % score
		"COMPLETED": return "Ton rapport est enregistré. La récompense de la mission de %s a déjà été remise." % str(data["clan"])
	return "Approche-toi de ton chef de clan."

func interaction_event() -> String:
	if not mission_unlocked and mission.get("status", "NOT_STARTED") == "NOT_STARTED":
		return ""
	match mission.get("status", "NOT_STARTED"):
		"NOT_STARTED": return "clan_accept"
		"TIME_EXPIRED", "REPORT_PENDING": return "clan_report"
	return ""

func _monitor_access(delta: float) -> void:
	access_notice_cooldown = maxf(0.0, access_notice_cooldown-delta)
	for gate: Dictionary in access_gates:
		if str(gate["clan_id"]) == clan_id:
			continue
		var distance := player.global_position.distance_to(gate["entry"])
		if distance <= 4.6 and access_notice_cooldown <= 0.0:
			access_notice_cooldown = 2.0
			if is_instance_valid(hud):
				hud.notice("Accès refusé. Cette cour est réservée aux membres de ce clan.")

func _process(delta: float) -> void:
	if player == null:
		return
	_set_barriers()
	_monitor_access(delta)
	if not running:
		_update_hud()
		return
	var now := Time.get_unix_time_from_system()
	remaining_seconds = maxf(0.0, ClanMission.DURATION_SECONDS - (now-local_started_at))
	if remaining_seconds <= 0.0:
		_expire_locally()
	_update_hud()

func _update_hud() -> void:
	if not is_instance_valid(hud):
		return
	var status := str(mission.get("status", "NOT_STARTED"))
	if status == "IN_PROGRESS" or running:
		hud.set_clan_mission_hud(ClanMission.hud_line(score, remaining_seconds), true)
	elif status in ["TIME_EXPIRED", "REPORT_PENDING"]:
		hud.set_clan_mission_hud("Collecte terminée ! Étoiles : %d\nFais ton rapport à ton chef de clan :\nla récompense valide la mission et ouvre l'Académie." % score, true)
	else:
		hud.set_clan_mission_hud("", false)

func sync_state(value: Dictionary) -> void:
	if not ClanMission.valid_state(value):
		return
	mission = value.duplicate(true)
	score = int(mission.get("score", 0) if mission.get("score") != null else 0)
	var status := str(mission["status"])
	if status == "IN_PROGRESS":
		var started: Variant = mission.get("startedAt")
		local_started_at = float(started)/1000.0 if typeof(started) in [TYPE_INT, TYPE_FLOAT] and float(started) > 0.0 else Time.get_unix_time_from_system()
		remaining_seconds = maxf(0.0, ClanMission.DURATION_SECONDS-(Time.get_unix_time_from_system()-local_started_at))
		running = remaining_seconds > 0.0
		if running and active_stars.is_empty():
			_spawn_initial_stars()
		elif not running:
			# Minuteur écoulé pendant une déconnexion : sans ce rattrapage la
			# mission reste bloquée à jamais en IN_PROGRESS côté serveur (il
			# attend l'événement « expire » du client) et l'Académie ne se
			# débloque jamais. La chaîne reprend : expire → rapport au chef →
			# récompense → déblocage.
			_expire_locally()
	elif status in ["TIME_EXPIRED", "REPORT_PENDING", "COMPLETED"]:
		running = false
		_clear_stars()
	state_changed.emit(mission.duplicate(true))
	_update_hud()

func start_local_mission() -> void:
	mission["status"] = "IN_PROGRESS"
	mission["startedAt"] = int(Time.get_unix_time_from_system()*1000.0)
	mission["score"] = 0
	score = 0
	local_started_at = Time.get_unix_time_from_system()
	remaining_seconds = ClanMission.DURATION_SECONDS
	running = true
	_spawn_initial_stars()
	state_changed.emit(mission.duplicate(true))
	_update_hud()

func _expire_locally() -> void:
	# Garde sur le statut (pas sur running) : le rattrapage hors ligne arrive
	# avec running déjà faux, et un double envoi reste impossible car le statut
	# local passe immédiatement à TIME_EXPIRED.
	if str(mission.get("status", "")) != "IN_PROGRESS":
		return
	running = false
	_clear_stars()
	mission["status"] = "TIME_EXPIRED"
	mission["score"] = score
	mission["startedAt"] = mission.get("startedAt")
	collection_feedback.emit("Collecte terminée ! Étoiles récupérées : %d · Fais ton rapport à ton chef de clan pour valider la mission." % score)
	expiration_requested.emit(score)
	_update_hud()

func _clear_stars() -> void:
	for star: Area3D in active_stars.values():
		if is_instance_valid(star):
			star.queue_free()
	active_stars.clear()

func _spawn_initial_stars() -> void:
	_clear_stars()
	last_collected_slot = -1
	for i in range(ClanMission.STAR_COUNT):
		_spawn_next_star(-1 if i == 0 else -1)

func _valid_spawn(point: Vector3) -> bool:
	if absf(point.x) > KonohaMap.BOUNDS.x-8.0 or absf(point.z) > KonohaMap.BOUNDS.y-8.0 or point.y <= 0.0:
		return false
	# SpawnPoints are public routes, never a courtyard/building footprint.
	for district: Dictionary in KonohaMap.DISTRICTS:
		if str(district.get("kind", "")) == "clan":
			var sanctuary_point: Vector3 = district["point"] + KonohaMap.CLAN_SANCTUARY_OFFSET
			if Vector2(point.x, point.z).distance_to(Vector2(sanctuary_point.x, sanctuary_point.z)) < 18.0:
				return false
	return true

func _spawn_next_star(previous_slot: int) -> void:
	if not running or active_stars.size() >= ClanMission.STAR_COUNT:
		return
	var candidates: Array[int] = []
	for i in range(STAR_SPAWN_POINTS.size()):
		if active_stars.has(i) or not _valid_spawn(STAR_SPAWN_POINTS[i]):
			continue
		if previous_slot >= 0 and STAR_SPAWN_POINTS[i].distance_to(STAR_SPAWN_POINTS[previous_slot]) < 12.0:
			continue
		if player != null and STAR_SPAWN_POINTS[i].distance_to(player.global_position) < 7.0:
			continue
		candidates.append(i)
	if candidates.is_empty():
		for i in range(STAR_SPAWN_POINTS.size()):
			if not active_stars.has(i) and _valid_spawn(STAR_SPAWN_POINTS[i]):
				candidates.append(i)
	if candidates.is_empty():
		return
	var slot: int = candidates[rng.randi_range(0, candidates.size()-1)]
	var star := _make_star(slot)
	active_stars[slot] = star

func _make_star(slot: int) -> Area3D:
	var star := Area3D.new()
	star.name = "PrivateStar_%02d" % slot
	star.position = STAR_SPAWN_POINTS[slot]
	star.collision_layer = 0
	star.collision_mask = 2
	star.monitoring = true
	var shape_node := CollisionShape3D.new()
	var shape := SphereShape3D.new()
	shape.radius = 0.72
	shape_node.shape = shape
	star.add_child(shape_node)
	var visual := Label3D.new()
	visual.text = "★"
	visual.font_size = 64
	visual.pixel_size = 0.012
	visual.modulate = Color("ffd45e")
	visual.outline_size = 8
	visual.outline_modulate = Color("76462d")
	visual.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	visual.position = Vector3(0,0.35,0)
	star.add_child(visual)
	var ring := MeshInstance3D.new()
	var ring_mesh := TorusMesh.new()
	ring_mesh.inner_radius = 0.28
	ring_mesh.outer_radius = 0.38
	ring_mesh.rings = 8
	ring_mesh.ring_segments = 12
	ring.mesh = ring_mesh
	ring.material_override = TrainingFighter.material(Color("ffe69b"), true)
	ring.position.y = 0.20
	star.add_child(ring)
	star.body_entered.connect(_on_star_body.bind(star, slot))
	add_child(star)
	return star

func _on_star_body(body: Node3D, star: Area3D, slot: int) -> void:
	if not running or body != player or not active_stars.has(slot) or active_stars[slot] != star:
		return
	active_stars.erase(slot)
	star.queue_free()
	last_collected_slot = slot
	score += 1
	mission["score"] = score
	collection_feedback.emit("+1 étoile")
	if is_instance_valid(hud):
		hud.notice("+1 étoile")
	_spawn_next_star(last_collected_slot)
	_update_hud()
