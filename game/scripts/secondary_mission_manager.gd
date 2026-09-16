class_name SecondaryMissionManager
extends Node3D
## Client presentation for the global secondary board. The server chooses the
## mission, validates every interaction and adds the five IG reward.
var player: TrainingFighter
var hud: KonohaHUD
var village_link: VillageLink
var direction_arrow: Node3D
var arrow_material: StandardMaterial3D
var givers: Dictionary = {}
var objective_markers: Dictionary = {}
var missions: Dictionary = {}
var unlocked: bool = false
var pending: Dictionary = {}
var action_pending: bool = false
var last_state_signature: String = ""
var last_notice_signature: String = ""

func configure(value_player: TrainingFighter, value_hud: KonohaHUD) -> void:
	player = value_player
	hud = value_hud
	_build_direction_arrow()
	for data: Dictionary in SecondaryMission.NPCS:
		var giver := SecondaryMissionGiver.new()
		giver.name = "SecondaryNPC_" + str(data["id"])
		add_child(giver)
		giver.configure_giver(str(data["kind"]), str(data["name"]), data["position"], _tint(str(data["id"])))
		givers[data["id"]] = giver
		giver.set_mission_available(false)

func _build_direction_arrow() -> void:
	direction_arrow = Node3D.new()
	direction_arrow.name = "SecondaryMissionDirectionArrow"
	direction_arrow.position = Vector3(0, 2.85, 0)
	direction_arrow.visible = false
	player.add_child(direction_arrow)
	arrow_material = StandardMaterial3D.new()
	arrow_material.albedo_color = Color("f0444b")
	arrow_material.emission_enabled = true
	arrow_material.emission = Color("ff2638")
	arrow_material.emission_energy_multiplier = 1.4
	var shaft_mesh := BoxMesh.new()
	shaft_mesh.size = Vector3(0.09, 0.07, 0.58)
	var shaft := MeshInstance3D.new()
	shaft.name = "ArrowShaft"
	shaft.position = Vector3(0, 0, -0.22)
	shaft.mesh = shaft_mesh
	shaft.material_override = arrow_material
	direction_arrow.add_child(shaft)
	var head_mesh := CylinderMesh.new()
	head_mesh.top_radius = 0.0
	head_mesh.bottom_radius = 0.20
	head_mesh.height = 0.30
	head_mesh.radial_segments = 4
	var head := MeshInstance3D.new()
	head.name = "ArrowHead"
	head.position = Vector3(0, 0, -0.60)
	head.rotation.x = -PI / 2.0
	head.mesh = head_mesh
	head.material_override = arrow_material
	direction_arrow.add_child(head)

func set_link(value: VillageLink) -> void:
	village_link = value

func apply_state(value: Dictionary) -> void:
	if not SecondaryMission.valid_state(value):
		return
	unlocked = bool(value["unlocked"])
	missions.clear()
	for mission: Dictionary in value["missions"]:
		missions[mission["npcId"]] = mission
	var active := _own_active_mission()
	for npc_id: String in givers:
		var mission: Dictionary = missions.get(npc_id, {})
		givers[npc_id].set_mission_available(unlocked and active.is_empty() and mission.get("status") == "available")
	_rebuild_objective_markers()
	var signature := JSON.stringify(value)
	if signature == last_state_signature:
		return
	last_state_signature = signature
	if unlocked and last_notice_signature.is_empty():
		last_notice_signature = "unlocked"
		hud.notice(str(value.get("message", "Les habitants du village peuvent maintenant demander ton aide.")))
	_refresh_objective()

func nearest_mission() -> Dictionary:
	if not is_instance_valid(player) or not unlocked:
		return {}
	var nearest: Dictionary = {}
	var best := 4.4
	var active := _own_active_mission()
	for npc_id: String in missions:
		var mission: Dictionary = missions[npc_id]
		if not active.is_empty() and mission.get("status") != "accepted":
			continue
		if mission.get("status") not in ["available", "accepted"]:
			continue
		var giver: SecondaryMissionGiver = givers.get(npc_id)
		if not is_instance_valid(giver):
			continue
		var distance := player.global_position.distance_to(giver.global_position)
		if distance <= best:
			best = distance
			nearest = mission
	return nearest

func interaction_available() -> bool:
	if not nearest_mission().is_empty():
		return true
	for npc_id: String in missions:
		var mission: Dictionary = missions[npc_id]
		if mission.get("status") != "accepted":
			continue
		var progress: Array = mission.get("progress", [])
		var targets: Array = SecondaryMission.target_points(str(mission.get("typeId", "")))
		if _nearest_uncollected_target(mission, progress, targets) >= 0:
			return true
	return false

func interaction_caption() -> String:
	var mission := nearest_mission()
	if mission.is_empty():
		return "APPROCHE-TOI"
	return "AIDER · %s" % str(mission.get("title", "MISSION"))

func interact() -> bool:
	var mission := nearest_mission()
	if mission.is_empty():
		for npc_id: String in missions:
			var candidate: Dictionary = missions[npc_id]
			if candidate.get("status") != "accepted":
				continue
			var progress: Array = candidate.get("progress", [])
			var targets: Array = SecondaryMission.target_points(str(candidate.get("typeId", "")))
			var target_index := _nearest_uncollected_target(candidate, progress, targets)
			if target_index >= 0:
				_send_action("collect", candidate, target_index)
				return true
		return false
	_clear_inputs()
	if mission.get("status") == "available":
		pending = mission.duplicate(true)
		hud.show_secondary_prompt(str(mission.get("npcName", "Habitant")), "%s\n\n%s\n\nObjectif : %s\nRécompense : +5 IDREM GOLD" % [str(mission.get("dialogue", "Excuse-moi, shinobi !")), str(mission.get("acceptedDialogue", "Merci pour ton aide.")), str(mission.get("objective", "Aider un habitant."))])
	else:
		var progress: Array = mission.get("progress", [])
		var targets: Array = SecondaryMission.target_points(str(mission.get("typeId", "")))
		var collect_index := _nearest_uncollected_target(mission, progress, targets)
		if collect_index >= 0:
			_send_action("collect", mission, collect_index)
		elif progress.size() >= int(mission.get("required", 1)):
			var giver: Node3D = givers.get(str(mission.get("npcId", "")))
			if is_instance_valid(giver) and player.global_position.distance_to(giver.global_position) <= 4.4:
				_send_action("complete", mission, -1)
			else:
				hud.notice("Retourne voir %s pour terminer la mission." % str(mission.get("npcName", "le PNJ")))
		else:
			hud.notice("%s %d / %d" % [str(mission.get("progressLabel", "Objectif réalisé")), progress.size(), int(mission.get("required", 1))])
	return true

func confirm_pending() -> bool:
	if pending.is_empty():
		return false
	var mission := pending.duplicate(true)
	pending.clear()
	hud.hide_menu()
	_send_action("accept", mission, -1)
	return true

func decline_pending() -> bool:
	if pending.is_empty():
		return false
	pending.clear()
	hud.hide_menu()
	return true

func abandon_active() -> void:
	if action_pending:
		return
	for npc_id: String in missions:
		var mission: Dictionary = missions[npc_id]
		if mission.get("status") == "accepted":
			_send_action("abandon", mission, -1)
			return
	hud.notice("Aucune mission secondaire active à abandonner.")

func handle_network_event(event: Dictionary) -> void:
	match str(event.get("type", "")):
		"secondary_state": apply_state(event)
		"secondary_action_ack":
			action_pending = false
			var state: Variant = event.get("state")
			if state is Dictionary:
				apply_state(state)
			if event.get("action") == "complete":
				hud.notice("MISSION TERMINÉE · Récompense : +5 IDREM GOLD")
			elif event.get("action") == "abandon":
				hud.notice("Mission secondaire abandonnée. Elle est de nouveau disponible pour le village.")
			_refresh_objective()

func handle_network_error(message: String) -> void:
	if not action_pending:
		return
	action_pending = false
	pending.clear()
	if is_instance_valid(hud):
		hud.hide_menu()
		hud.notice(message)

func reset_network_action() -> void:
	action_pending = false
	pending.clear()

func update_hud() -> void:
	if not unlocked:
		_set_direction_arrow({}, [])
		return
	_refresh_objective()
	var own: Dictionary = _own_active_mission()
	_set_direction_arrow(own, own.get("progress", []))

func _own_active_mission() -> Dictionary:
	for npc_id: String in missions:
		var mission: Dictionary = missions[npc_id]
		if mission.get("status") == "accepted":
			return mission
	return {}

func _set_direction_arrow(mission: Dictionary, progress: Array) -> void:
	if not is_instance_valid(direction_arrow) or mission.is_empty() or not is_instance_valid(player):
		if is_instance_valid(direction_arrow): direction_arrow.visible = false
		return
	var target := Vector3.ZERO
	var targets: Array = SecondaryMission.target_points(str(mission.get("typeId", "")))
	for index in range(targets.size()):
		if progress.has(index): continue
		var point: Vector3 = targets[index]
		target = Vector3(point.x, player.global_position.y + 2.85, point.z)
		break
	if target == Vector3.ZERO:
		var return_point := SecondaryMission.return_point(str(mission.get("npcId", "")))
		if return_point != Vector3.ZERO:
			target = Vector3(return_point.x, player.global_position.y + 2.85, return_point.z)
	if target == Vector3.ZERO:
		direction_arrow.visible = false
		return
	var horizontal := Vector3(target.x, player.global_position.y + 2.85, target.z) - direction_arrow.global_position
	if horizontal.length_squared() < 0.04:
		direction_arrow.visible = false
		return
	direction_arrow.visible = true
	direction_arrow.look_at(Vector3(target.x, direction_arrow.global_position.y, target.z), Vector3.UP)
	direction_arrow.scale = Vector3.ONE * (1.0 + 0.06 * sin(Time.get_ticks_msec() / 180.0))

func _rebuild_objective_markers() -> void:
	for marker: MeshInstance3D in objective_markers.values():
		if is_instance_valid(marker): marker.queue_free()
	objective_markers.clear()
	if not unlocked:
		return
	for npc_id: String in missions:
		var mission: Dictionary = missions[npc_id]
		if mission.get("status") != "accepted":
			continue
		var progress: Array = mission.get("progress", [])
		var targets: Array = SecondaryMission.target_points(str(mission.get("typeId", "")))
		for index in range(targets.size()):
			if progress.has(index): continue
			var point: Vector3 = targets[index]
			var mesh := CylinderMesh.new()
			mesh.top_radius = 0.14
			mesh.bottom_radius = 0.14
			mesh.height = 0.07
			mesh.radial_segments = 8
			var marker := MeshInstance3D.new()
			marker.name = "SecondaryObjective_%s_%d" % [str(mission.get("slot", 0)), index]
			marker.position = Vector3(point.x, point.y + 0.10, point.z)
			marker.mesh = mesh
			var material := StandardMaterial3D.new()
			material.albedo_color = Color("e9b45f")
			material.emission_enabled = true
			material.emission = Color("d9824f")
			material.emission_energy_multiplier = 0.55
			marker.material_override = material
			add_child(marker)
			objective_markers["%d:%d" % [int(mission.get("slot", 0)), index]] = marker

func _refresh_objective() -> void:
	var own: Dictionary = {}
	for npc_id: String in missions:
		var mission: Dictionary = missions[npc_id]
		if mission.get("status") == "accepted":
			own = mission
			break
	if own.is_empty():
		hud.set_secondary_objective("", false)
		return
	var progress: Array = own.get("progress", [])
	var required := int(own.get("required", 1))
	var line := "%s %d / %d" % [str(own.get("progressLabel", "Objectif")), progress.size(), required]
	if progress.size() >= required:
		line = "✓ Objectif terminé · Retourner voir %s" % str(own.get("npcName", "le propriétaire"))
	hud.set_secondary_objective("MISSION SECONDAIRE\n%s\n%s" % [str(own.get("icon", "•")) + " " + str(own.get("title", "Mission")), line], true)

func _nearest_uncollected_target(mission: Dictionary, progress: Array, targets: Array) -> int:
	for index in range(targets.size()):
		if progress.has(index):
			continue
		var point: Vector3 = targets[index]
		var target := point
		if player.global_position.distance_to(target) <= 4.4:
			return index
	return -1

func _send_action(action: String, mission: Dictionary, index: int) -> void:
	if action_pending:
		return
	if not is_instance_valid(village_link) or not village_link.connected:
		hud.notice("Mission secondaire indisponible hors connexion.")
		return
	action_pending = true
	if not village_link.secondary_action(action, int(mission.get("slot", -1)), str(mission.get("missionId", "")), int(mission.get("revision", 0)), index):
		action_pending = false
		hud.notice("Mission secondaire indisponible hors connexion.")

func _clear_inputs() -> void:
	if is_instance_valid(hud):
		hud.move_vector = Vector2.ZERO

func _tint(id: String) -> Color:
	return {"market_mika":Color("b96755"), "residential_ren":Color("64869b"), "gate_sora":Color("c0828d"), "academy_doctor":Color("ad8460"), "river_toma":Color("63899a"), "forge_kenta":Color("557a8d"), "old_momo":Color("ad8460"), "child_jun":Color("7197a5")}.get(id, Color("6f9b72"))
