class_name SystemCity
extends Node3D
var props: Dictionary = {}
var hazards: Array[Vector3] = [Vector3(-6, 0, -13), Vector3(7, 0, 14)]
var sun: DirectionalLight3D

func _ready() -> void:
	var static_city := Node3D.new()
	static_city.name = "Architecture"
	add_child(static_city)
	CityArt.build(static_city)
	_environment()
	_spawn("nova", "nova", Vector3(-1.8, 0, 1), "PARLER À NOVA")
	_spawn("terminal", "terminal", Vector3(0, 0, -10), "EXAMINER LE TERMINAL")
	_spawn("patch", "patch", Vector3(22.5, 0, -3), "PARLER À PATCH")
	_spawn("citizen", "citizen", Vector3(-6, 0, 7), "PARLER À MÉMO")
	_spawn("door", "door", Vector3(21, 0, 1), "OUVRIR L'ATELIER")
	_spawn("portal", "portal", Vector3(0, 0, -26), "EXAMINER LE PORTAIL")
	_spawn("garden", "fragment", Vector3(-21, 1, 3), "RÉCUPÉRER LE FRAGMENT")
	_spawn("workshop", "fragment", Vector3(18.5, 1, -13), "RÉCUPÉRER LE FRAGMENT")
	_spawn("archive", "fragment", Vector3(-16, 1, -19), "RÉCUPÉRER LE FRAGMENT")
	for point in hazards:
		DigitalArt.shape(self, "cylinder", point + Vector3(0, 0.03, 0), Vector3(2.5, 0.05, 2.5), DigitalArt.NULL_COLOR, true)
		for index in 5:
			var shard := DigitalArt.box(self, point + Vector3(sin(index) * 0.8, 0.3, cos(index) * 0.8), Vector3(0.3, 0.6, 0.3), DigitalArt.NULL_COLOR)
			shard.rotation.z = 0.6
		DigitalArt.sign_text(self, point + Vector3(0, 1.1, 0), "NULL / ZONE INSTABLE", DigitalArt.NULL_COLOR, 15).billboard = BaseMaterial3D.BILLBOARD_ENABLED
	GameState.settings_changed.connect(apply_settings)
	apply_settings()

func _spawn(id: String, kind: String, point: Vector3, prompt_text: String) -> void:
	var prop: WorldProp = preload("res://scenes/worlds/world_prop.tscn").instantiate()
	prop.name = id.capitalize()
	prop.kind = kind
	prop.interaction_id = id
	prop.prompt = prompt_text
	prop.position = point
	add_child(prop)
	props[id] = prop

func sync_mission() -> void:
	var mission := GameState.mission
	for id in MissionProgress.FRAGMENT_IDS:
		var prop: WorldProp = props[id]
		prop.visible = mission.stage == MissionProgress.Stage.COLLECT and id not in mission.fragments
		prop.available = prop.visible
	props["terminal"].set_repaired(mission.stage >= MissionProgress.Stage.RETURN)
	if mission.stage == MissionProgress.Stage.REPAIR:
		props["terminal"].prompt = "RÉPARER LE TERMINAL"

func objective_position() -> Vector3:
	match GameState.mission.stage:
		MissionProgress.Stage.WAKE: return Vector3(0, 0, 9)
		MissionProgress.Stage.EXPLORE: return Vector3(0, 0, 3)
		MissionProgress.Stage.NOVA, MissionProgress.Stage.RETURN: return props["nova"].global_position
		MissionProgress.Stage.TERMINAL, MissionProgress.Stage.REPAIR: return props["terminal"].global_position
		MissionProgress.Stage.COLLECT:
			for id in MissionProgress.FRAGMENT_IDS:
				if id not in GameState.mission.fragments:
					return props[id].global_position
	return props["portal"].global_position

func _environment() -> void:
	var world_env := WorldEnvironment.new()
	var environment := Environment.new()
	var sky := Sky.new()
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color("244566")
	sky_material.sky_horizon_color = Color("83b8b7")
	sky_material.ground_bottom_color = Color("172c46")
	sky_material.ground_horizon_color = Color("83b8b7")
	sky.sky_material = sky_material
	environment.background_mode = Environment.BG_SKY
	environment.sky = sky
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("9cbaca")
	environment.ambient_light_energy = 0.7
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	world_env.environment = environment
	add_child(world_env)
	sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52, -32, 0)
	sun.light_color = Color("ffe2b7")
	sun.light_energy = 1.25
	sun.directional_shadow_max_distance = 45
	add_child(sun)

func apply_settings() -> void:
	var low: bool = GameState.settings["low_graphics"]
	sun.shadow_enabled = not low
	Engine.max_fps = 30 if low else 60
