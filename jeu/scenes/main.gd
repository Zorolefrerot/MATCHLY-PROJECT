extends Node2D
## Point d'entrée : charge le monde (écran d'accueil du téléphone) puis l'interface.

func _ready() -> void:
	var world := HomeScreen.new()
	add_child(world)
	var hud := Hud.new()
	add_child(hud)
