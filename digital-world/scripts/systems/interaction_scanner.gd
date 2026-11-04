class_name InteractionScanner
extends Node
signal focus_changed(target: DigitalInteractable)
signal activated(target: DigitalInteractable)
var player: ByteController
var focused: DigitalInteractable
var enabled := false
var elapsed := 0.0

func _physics_process(delta: float) -> void:
	elapsed += delta
	if elapsed < 0.08:
		return
	elapsed = 0
	var nearest: DigitalInteractable = null
	var distance := INF
	if enabled and is_instance_valid(player) and not player.dead:
		for candidate: DigitalInteractable in get_tree().get_nodes_in_group("interactables"):
			if not candidate.available or not candidate.is_visible_in_tree():
				continue
			var delta_position := candidate.global_position - player.global_position
			delta_position.y = 0
			var length := delta_position.length()
			if length < candidate.radius and length < distance and _visible(candidate):
				nearest = candidate
				distance = length
	if focused != nearest:
		focused = nearest
		focus_changed.emit(focused)

func _visible(candidate: DigitalInteractable) -> bool:
	var start := player.global_position + Vector3.UP
	var finish := candidate.global_position + Vector3(0, 0.75, 0)
	var query := PhysicsRayQueryParameters3D.create(start, finish, 1)
	# A target's own pedestal may be hit; accepting only its immediate vicinity
	# prevents interactions through building walls, without needing invisible triggers.
	var result := player.get_world_3d().direct_space_state.intersect_ray(query)
	return result.is_empty() or result["position"].distance_to(finish) < 0.8

func activate() -> void:
	if enabled and is_instance_valid(focused) and focused.available and not player.dead:
		activated.emit(focused)
