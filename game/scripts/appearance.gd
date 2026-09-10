class_name CharacterAppearance
extends RefCounted
## Cosmetic IDs only. No account, clan, statistics, resources or equipment rights.
const SAVE_PATH: String = "user://appearance-v1.json"
const DEFAULTS: Dictionary = {"model": 0, "hair": 0, "hair_color": 0, "eyes": 0, "skin": 2, "top": 0, "top_color": 0, "bottom": 0, "bottom_color": 1}
const MODELS: Array[String] = ["Masculin", "Féminin"]
const HAIR: Array[String] = ["Court", "En pointes", "Carré", "Queue de cheval"]
const TOPS: Array[String] = ["Veste ninja", "Tunique", "Haut à manches courtes"]
const BOTTOMS: Array[String] = ["Pantalon", "Pantalon ample", "Short et jambières"]
const HAIR_NAMES: Array[String] = ["Noir", "Brun", "Châtain", "Blond", "Roux", "Blanc", "Bleu nuit", "Rose"]
const HAIR_COLORS: Array[Color] = [Color("202630"), Color("503329"), Color("866047"), Color("e5c36d"), Color("af5636"), Color("ece9df"), Color("334977"), Color("c881a4")]
const EYE_NAMES: Array[String] = ["Brun", "Noir", "Bleu", "Vert", "Gris", "Ambre"]
const EYE_COLORS: Array[Color] = [Color("86542f"), Color("202734"), Color("3a91dd"), Color("4eab74"), Color("9caebb"), Color("e0aa35")]
const SKIN_NAMES: Array[String] = ["Très claire", "Claire", "Dorée", "Mate", "Brune", "Foncée"]
const SKIN_COLORS: Array[Color] = [Color("f4d9c6"), Color("e5bea1"), Color("c99570"), Color("a97753"), Color("805439"), Color("503529")]
const CLOTH_NAMES: Array[String] = ["Bleu pétrole", "Noir", "Crème", "Rouge", "Vert", "Bleu", "Violet", "Orange"]
const CLOTH_COLORS: Array[Color] = [Color("385962"), Color("28313d"), Color("d4cbb1"), Color("a64d52"), Color("536b48"), Color("416c9c"), Color("76618f"), Color("c98043")]
const OUTFIT_NAMES: Array[String] = ["Ninja du village", "Voyage", "Entraînement", "Éclaireur"]
const OUTFITS: Array[Dictionary] = [
	{"top": 0, "top_color": 0, "bottom": 0, "bottom_color": 1},
	{"top": 1, "top_color": 2, "bottom": 1, "bottom_color": 4},
	{"top": 2, "top_color": 3, "bottom": 2, "bottom_color": 1},
	{"top": 0, "top_color": 4, "bottom": 1, "bottom_color": 1}
]

static func choices(key: String) -> Array[String]:
	match key:
		"model": return MODELS
		"hair": return HAIR
		"hair_color": return HAIR_NAMES
		"eyes": return EYE_NAMES
		"skin": return SKIN_NAMES
		"top": return TOPS
		"bottom": return BOTTOMS
		_: return CLOTH_NAMES

static func sanitize(value: Variant) -> Dictionary:
	var result: Dictionary = DEFAULTS.duplicate()
	if not value is Dictionary:
		return result
	for key: String in DEFAULTS:
		var raw: Variant = value.get(key)
		if typeof(raw) not in [TYPE_INT, TYPE_FLOAT]:
			continue
		var number: float = float(raw)
		if is_finite(number) and number >= 0 and number < choices(key).size() and number == floorf(number):
			result[key] = int(number)
	return result

static func outfit(value: Dictionary, index: int) -> Dictionary:
	var result: Dictionary = sanitize(value)
	if index >= 0 and index < OUTFITS.size():
		result.merge(OUTFITS[index], true)
	return result

static func load_local(path: String = SAVE_PATH) -> Dictionary:
	if not FileAccess.file_exists(path):
		return DEFAULTS.duplicate()
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null or file.get_length() > 8192:
		return DEFAULTS.duplicate()
	var parser := JSON.new()
	if parser.parse(file.get_as_text()) != OK:
		return DEFAULTS.duplicate()
	var parsed: Variant = parser.data
	if not parsed is Dictionary or parsed.get("version") != 1:
		return DEFAULTS.duplicate()
	return sanitize(parsed.get("choices"))

static func save_local(value: Dictionary, path: String = SAVE_PATH) -> Error:
	# Replace only after a complete temporary file; keep the previous save on error.
	var file := FileAccess.open(path + ".tmp", FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_string(JSON.stringify({"version": 1, "choices": sanitize(value)}))
	file.flush()
	var error: Error = file.get_error()
	file.close()
	if error != OK:
		return error
	return DirAccess.rename_absolute(ProjectSettings.globalize_path(path + ".tmp"), ProjectSettings.globalize_path(path))
