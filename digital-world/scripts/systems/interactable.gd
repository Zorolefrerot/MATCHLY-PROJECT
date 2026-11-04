class_name DigitalInteractable
extends Node3D
## Data-driven reusable interaction target; handlers live in the world controller.
@export var interaction_id := ""
@export var prompt := "INTERAGIR"
@export var radius := 2.6
var available := true

func _ready() -> void:
	add_to_group("interactables")
