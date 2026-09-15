class_name SecondaryMissionManager
extends Node3D
## Client presentation for the global secondary board. The server chooses the
## mission, validates every interaction and adds the five IG reward.
var player: TrainingFighter
var hud: KonohaHUD
var village_link: VillageLink
var givers: Dictionary = {}
var objective_markers: Dictionary = {}
var missions: Dictionary = {}
var unlocked: bool = false
var pending: Dictionary = {}
var last_state_signature: String = ""
var last_notice_signature: String = ""
# Red guidance arrow floating above the player's head. It points at the next
# objective to collect, or at the giver once everything is collected.
var arrow: Node3D
var arrow_clock: float = 0.0
var arrow_allowed: bool = true

func configure(value_player: TrainingFighter, value_hud: KonohaHUD) -> void:
	player = value_player
	hud = value_hud
	for data: Dictionary in SecondaryMission.NPCS:
		var giver := SecondaryMissionGiver.new()
		giver.name = "SecondaryNPC_" + str(data["id"])
		add_child(giver)
		giver.configure_giver(str(data["kind"]), str(data["name"]), data["position"], _tint(str(data["id"])))
		givers[data["id"]] = giver
		giver.set_mission_available(false)
	_build_arrow()

func set_link(value: VillageLink) -> void:
	village_link = value

func apply_state(value: Dictionary) -> void:
	if not SecondaryMission.valid_state(value):
		return
	unlocked = bool(value["unlocked"])
	missions.clear()
	for mission: Dictionary in value["missions"]:
		missions[mission["npcId"]] = mission
	for npc_id: String in givers:
		var mission: Dictionary = missions.get(npc_id, {})
		givers[npc_id].set_mission_available(unlocked and mission.get("status") == "available")
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
	for npc_id: String in missions:
		var mission: Dictionary = missions[npc_id]
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
		var targets: Array = mission.get("targets", [])
		if _nearest_uncollected_target(mission, progress, targets) >= 0:
			return true
	return false

func interaction_caption() -> String:
	var mission := nearest_mission()
	if mission.is_empty():
		return "APPROCHE-TOI"
	return "AIDER · %s" % str(mission.get("title", "MISSION"))

func active_mission() -> Dictionary:
	for npc_id: String in missions:
		var mission: Dictionary = missions[npc_id]
		if mission.get("status") == "accepted":
			return mission
	return {}

func interact() -> bool:
	var own := active_mission()
	var mission := nearest_mission()
	if mission.is_empty():
		for npc_id: String in missions:
			var candidate: Dictionary = missions[npc_id]
			if candidate.get("status") != "accepted":
				continue
			var progress: Array = candidate.get("progress", [])
			var targets: Array = candidate.get("targets", [])
			var target_index := _nearest_uncollected_target(candidate, progress, targets)
			if target_index >= 0:
				_send_action("collect", candidate, target_index)
				return true
		return false
	_clear_inputs()
	if mission.get("status") == "available":
		if not own.is_empty():
			# One single active secondary mission: finish it or give it back
			# before talking to another inhabitant. The server enforces the
			# same rule; this is only the visible explanation on the handset.
			hud.notice("Une seule mission secondaire à la fois : termine « %s » ou abandonne-la auprès de %s." % [str(own.get("title", "ta mission en cours")), str(own.get("npcName", "son donneur"))])
			return true
		pending = mission.duplicate(true)
		hud.show_secondary_prompt(str(mission.get("npcName", "Habitant")), "%s\n\n%s\n\nObjectif : %s\nRécompense : +5 IDREM GOLD" % [str(mission.get("dialogue", "Excuse-moi, shinobi !")), str(mission.get("acceptedDialogue", "Merci pour ton aide.")), str(mission.get("objective", "Aider un habitant."))])
	else:
		var progress: Array = mission.get("progress", [])
		var targets: Array = mission.get("targets", [])
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
			_open_status_prompt(mission, progress)
	return true

func _open_status_prompt(mission: Dictionary, progress: Array) -> void:
	var line := "%s %d / %d" % [str(mission.get("progressLabel", "Objectif réalisé")), progress.size(), int(mission.get("required", 1))]
	hud.show_secondary_status("Mission en cours · %s" % str(mission.get("npcName", "Habitant")), "%s\n\n%s\n\nCONTINUER : tu gardes la mission (une seule active à la fois).\nABANDONNER : elle retourne au tableau du village, sans pénalité." % [str(mission.get("objective", "Aider un habitant.")), line])

func open_status_menu() -> bool:
	## Appui sur le panneau « MISSION SECONDAIRE » : le joueur choisit de
	## continuer ou d'abandonner, où qu'il soit dans le village. Le serveur
	## n'exige aucune proximité pour l'abandon (contrairement à la collecte
	## et à la remise, validées sur la position réelle).
	var own := active_mission()
	if own.is_empty():
		return false
	var progress: Array = own.get("progress", [])
	_clear_inputs()
	_open_status_prompt(own, progress)
	return true

func abandon_active() -> bool:
	var own := active_mission()
	if own.is_empty():
		return false
	hud.hide_menu()
	_send_action("abandon", own, -1)
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

func handle_network_event(event: Dictionary) -> void:
	match str(event.get("type", "")):
		"secondary_state": apply_state(event)
		"secondary_action_ack":
			var wallet: Variant = event.get("wallet")
			if wallet is Dictionary and is_instance_valid(hud):
				# Server-read balance: the handset displays it, never computes it.
				hud.set_account_progress(int(wallet.get("idremGold", 0)), int(wallet.get("level", 0)))
			var state: Variant = event.get("state")
			if state is Dictionary:
				apply_state(state)
			if event.get("action") == "complete":
				hud.notice("MISSION TERMINÉE · Récompense : +5 IDREM GOLD")
				_refresh_objective()
			elif event.get("action") == "abandon":
				hud.notice("Mission abandonnée · elle retourne au tableau du village.")
				_refresh_objective()

func update_hud(delta: float = 0.016) -> void:
	# The arrow is refreshed even while locked: clearing the board must hide it
	# on the same frame, not after the next server snapshot.
	_tick_arrow(delta)
	if not unlocked:
		return
	_refresh_objective()

func _rebuild_objective_markers() -> void:
	for marker: MeshInstance3D in objective_markers.values():
		if is_instance_valid(marker): marker.queue_free()
	objective_markers.clear()
	if not unlocked:
		return
	for npc_id: String in missions:
		var mission: Dictionary = missions[npc_id]
		if mission.get("status") not in ["available", "accepted"]:
			continue
		var progress: Array = mission.get("progress", [])
		var targets: Array = mission.get("targets", [])
		for index in range(targets.size()):
			if progress.has(index): continue
			var point: Array = targets[index]
			var mesh := CylinderMesh.new()
			mesh.top_radius = 0.14
			mesh.bottom_radius = 0.14
			mesh.height = 0.07
			mesh.radial_segments = 8
			var marker := MeshInstance3D.new()
			marker.name = "SecondaryObjective_%s_%d" % [str(mission.get("slot", 0)), index]
			marker.position = Vector3(float(point[0]), float(point[1]) + 0.10, float(point[2]))
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
	var own := active_mission()
	if own.is_empty():
		hud.set_secondary_objective("", false)
		_update_arrow()
		return
	var progress: Array = own.get("progress", [])
	var required := int(own.get("required", 1))
	var line := "%s %d / %d" % [str(own.get("progressLabel", "Objectif")), progress.size(), required]
	if progress.size() >= required:
		line = "✓ Objectif terminé · Retourner voir %s" % str(own.get("npcName", "le propriétaire"))
	hud.set_secondary_objective("MISSION SECONDAIRE · MENU\n%s\n%s" % [str(own.get("icon", "•")) + " " + str(own.get("title", "Mission")), line], true)
	_update_arrow()

func arrow_target() -> Dictionary:
	## Server-provided point the red arrow must indicate: the nearest objective
	## still to collect, then the giver (delivery, report) once all are done.
	var own := active_mission()
	if own.is_empty() or not is_instance_valid(player):
		return {}
	var progress: Array = own.get("progress", [])
	var targets: Array = own.get("targets", [])
	var best := -1
	var best_distance := INF
	for index in range(targets.size()):
		if progress.has(index):
			continue
		var point: Array = targets[index]
		if point.size() != 3:
			continue
		var candidate := Vector3(float(point[0]), float(point[1]), float(point[2]))
		var distance := player.global_position.distance_to(candidate)
		if distance < best_distance:
			best_distance = distance
			best = index
	if best >= 0:
		var target: Array = targets[best]
		return {"point": Vector3(float(target[0]), float(target[1]) + 1.3, float(target[2])), "returning": false}
	var return_point: Variant = own.get("returnPosition", [])
	if return_point is Array and return_point.size() == 3:
		return {"point": Vector3(float(return_point[0]), float(return_point[1]) + 1.7, float(return_point[2])), "returning": true}
	var giver: Node3D = givers.get(str(own.get("npcId", "")))
	if is_instance_valid(giver):
		return {"point": giver.global_position + Vector3(0, 1.7, 0), "returning": true}
	return {}

func _build_arrow() -> void:
	arrow = Node3D.new()
	arrow.name = "SecondaryObjectiveArrow"
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("d92b36")
	material.emission_enabled = true
	material.emission = Color("ff2f3d")
	material.emission_energy_multiplier = 1.6
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	var shaft := MeshInstance3D.new()
	shaft.name = "ArrowShaft"
	var shaft_mesh := BoxMesh.new()
	shaft_mesh.size = Vector3(0.10, 0.055, 0.62)
	shaft.mesh = shaft_mesh
	shaft.position = Vector3(0, 0, -0.26)
	shaft.material_override = material
	arrow.add_child(shaft)
	var head := MeshInstance3D.new()
	head.name = "ArrowHead"
	head.mesh = _arrow_head_mesh()
	head.position = Vector3(0, 0, -0.57)
	head.material_override = material
	arrow.add_child(head)
	arrow.visible = false
	if is_instance_valid(player):
		player.add_child(arrow)
	else:
		add_child(arrow)

func _arrow_head_mesh() -> ArrayMesh:
	# Explicit wedge pointing along -Z: four side triangles plus a base quad,
	# double-sided material, so the heading is readable from any camera angle.
	var vertices := PackedVector3Array([
		Vector3(0, 0, -0.42),
		Vector3(-0.26, 0.06, 0.0),
		Vector3(0.26, 0.06, 0.0),
		Vector3(0.26, -0.06, 0.0),
		Vector3(-0.26, -0.06, 0.0),
	])
	var indices := PackedInt32Array([0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 1, 4, 1, 2, 3, 1, 3, 4])
	var arrays: Array = []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_INDEX] = indices
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return mesh

func _update_arrow() -> void:
	if not is_instance_valid(arrow):
		return
	var target := arrow_target()
	if target.is_empty() or not arrow_allowed or not is_instance_valid(player):
		arrow.visible = false
		return
	var point: Vector3 = target["point"]
	var base := player.global_position + Vector3(0, 2.95, 0)
	var flat := Vector3(point.x - base.x, 0.0, point.z - base.z)
	if flat.length_squared() < 0.36:
		arrow.visible = false
		return
	arrow.visible = true
	arrow.position = Vector3(0, 2.95 + 0.06 * sin(arrow_clock * 2.6), 0)
	# La pointe de la flèche suit -Z (même convention que les personnages) :
	# atan2(-x,-z) vise la cible. atan2(x,z) la faisait pointer à l'opposé,
	# d'où une flèche « déboussolée » qui ne montrait jamais le bon endroit.
	arrow.rotation.y = lerp_angle(arrow.rotation.y, atan2(-flat.x, -flat.z), 0.30)

func _tick_arrow(delta: float) -> void:
	arrow_clock += delta
	_update_arrow()

func _nearest_uncollected_target(mission: Dictionary, progress: Array, targets: Array) -> int:
	for index in range(targets.size()):
		if progress.has(index):
			continue
		var point: Array = targets[index]
		var target := Vector3(float(point[0]), float(point[1]), float(point[2]))
		if player.global_position.distance_to(target) <= 4.4:
			return index
	return -1

func _send_action(action: String, mission: Dictionary, index: int) -> void:
	if not is_instance_valid(village_link) or not village_link.connected:
		hud.notice("Mission secondaire indisponible hors connexion.")
		return
	village_link.secondary_action(action, int(mission.get("slot", -1)), str(mission.get("missionId", "")), int(mission.get("revision", 0)), index)

func _clear_inputs() -> void:
	if is_instance_valid(hud):
		hud.move_vector = Vector2.ZERO

func _tint(id: String) -> Color:
	return {"market_mika":Color("b96755"), "residential_ren":Color("64869b"), "gate_sora":Color("c0828d"), "academy_doctor":Color("ad8460"), "river_toma":Color("63899a"), "forge_kenta":Color("557a8d"), "old_momo":Color("ad8460"), "child_jun":Color("7197a5")}.get(id, Color("6f9b72"))
