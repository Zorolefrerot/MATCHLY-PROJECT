class_name NinjaPortrait
extends RefCounted
## Portrait procédural généré depuis l'apparence validée (dictionnaire d'indices
## cosmétiques, jamais une image transférée). Le réseau ne porte que la
## référence d'apparence déjà sauvegardée sur le compte ou définie côté serveur
## pour les PNJ ; la texture est dessinée une fois localement (96×96, remplis
## rectangulaires, cache par signature) puis réutilisée partout : liste des
## candidats, fiches profil, invitations, aperçu de groupe et Sensei.
## Chargement léger et déterministe, optimisé pour Android.

const SIZE: int = 96
const HEAD := Color("f4efe6")
const STEEL := Color("c8cdd2")
const BAND := Color("3d4a55")
const VEST := Color("536b48")
static var cache: Dictionary = {}

static func texture(appearance: Dictionary, sensei: bool = false) -> ImageTexture:
	var data := CharacterAppearance.sanitize(appearance)
	var key := "%s|%s" % [JSON.stringify(data), "sensei" if sensei else "genin"]
	if cache.has(key):
		return cache[key]
	var image := Image.create(SIZE, SIZE, false, Image.FORMAT_RGBA8)
	_paint(image, data, sensei)
	var result := ImageTexture.create_from_image(image)
	if cache.size() >= 96:
		cache.clear()
	cache[key] = result
	return result

static func clear_cache() -> void:
	cache.clear()

static func _paint(img: Image, data: Dictionary, sensei: bool) -> void:
	var hair: Color = CharacterAppearance.HAIR_COLORS[data["hair_color"]]
	var skin: Color = CharacterAppearance.SKIN_COLORS[data["skin"]]
	var eyes: Color = CharacterAppearance.EYE_COLORS[data["eyes"]]
	var cloth: Color = CharacterAppearance.CLOTH_COLORS[data["top_color"]]
	var pants: Color = CharacterAppearance.CLOTH_COLORS[data["bottom_color"]]
	var dark := Color("20262e")
	var female: bool = data["model"] == 1
	# Fond : dégradé teal (genin) ou vert profond (Sensei de Konoha).
	var top_bg := Color("3a4450") if not sensei else Color("2f4438")
	for y in range(SIZE):
		img.fill_rect(Rect2i(0, y, SIZE, 1), top_bg.lerp(Color("141e24"), float(y) / float(SIZE)))
	if sensei:
		# Liseré dor discret : allure expérimentée, tenue de Jonin.
		img.fill_rect(Rect2i(0, 0, SIZE, 2), Color("8a743c"))
	# Épaules et tenue (couleur enregistrée du candidat).
	img.fill_rect(Rect2i(10, 76, 76, 20), cloth)
	img.fill_rect(Rect2i(30, 76, 36, 20), cloth.lightened(0.07))
	img.fill_rect(Rect2i(10, 76, 76, 3), cloth.darkened(0.18))
	if sensei:
		# Gilet vert de Konoha par-dessus la tenue, sangle centrale, col rigide.
		img.fill_rect(Rect2i(18, 78, 60, 18), VEST)
		img.fill_rect(Rect2i(44, 78, 8, 18), VEST.darkened(0.3))
		img.fill_rect(Rect2i(18, 78, 60, 3), VEST.darkened(0.15))
		img.fill_rect(Rect2i(22, 84, 12, 8), Color("d8d2bd"))
	else:
		img.fill_rect(Rect2i(44, 78, 8, 18), pants.darkened(0.2))
	# Cou.
	img.fill_rect(Rect2i(41, 66, 14, 12), skin.darkened(0.1))
	# Tête.
	var head_width: int = 38 if female else 40
	var head_x: int = (SIZE - head_width) >> 1
	img.fill_rect(Rect2i(head_x, 24, head_width, 44), skin)
	img.fill_rect(Rect2i(head_x, 24, head_width, 3), skin.lightened(0.07))
	img.fill_rect(Rect2i(head_x - 3, 42, 3, 10), skin.darkened(0.06))
	img.fill_rect(Rect2i(head_x + head_width, 42, 3, 10), skin.darkened(0.06))
	# Cheveux : quatre coupes distinctes, mêmes indices que le personnage 3D.
	var fringe := 5 if female else 6
	img.fill_rect(Rect2i(head_x - 3, 14, head_width + 6, 12), hair)
	img.fill_rect(Rect2i(head_x - 3, 14, 5, 34), hair)
	img.fill_rect(Rect2i(head_x + head_width - 2, 14, 5, 34), hair)
	img.fill_rect(Rect2i(head_x, 24, head_width, fringe), hair)
	match int(data["hair"]):
		1: # En pointes.
			for i in range(5):
				var spike_h: int = 7 + (i % 2) * 4
				for step in range(spike_h):
					var w: int = maxi(2, 8 - step)
					img.fill_rect(Rect2i(head_x - 1 + i * 8 + ((8 - w) >> 1), 14 - step, w, 1), hair)
		2: # Carré : mèches longues encadrant le visage.
			img.fill_rect(Rect2i(head_x - 5, 18, 7, 44), hair)
			img.fill_rect(Rect2i(head_x + head_width - 2, 18, 7, 44), hair)
			img.fill_rect(Rect2i(head_x - 3, 16, head_width + 6, 6), hair.lightened(0.06))
		3: # Queue de cheval : attache et natte derrière l'épaule.
			img.fill_rect(Rect2i(head_x + head_width - 6, 8, 14, 12), hair)
			img.fill_rect(Rect2i(head_x + head_width + 2, 18, 8, 34), hair)
			img.fill_rect(Rect2i(head_x + head_width + 2, 30, 8, 3), dark)
			img.fill_rect(Rect2i(head_x + head_width + 1, 50, 10, 8), hair.darkened(0.12))
	# Bandeau frontal de Konoha : bande sombre + plaque métallique gravée.
	img.fill_rect(Rect2i(head_x - 4, 27, head_width + 8, 8), BAND)
	img.fill_rect(Rect2i(36, 28, 24, 7), STEEL)
	img.fill_rect(Rect2i(36, 28, 24, 2), STEEL.lightened(0.15))
	img.fill_rect(Rect2i(44, 30, 8, 3), Color("37513f"))
	img.fill_rect(Rect2i(46, 29, 2, 5), Color("37513f"))
	# Sourcils puis yeux : pupilles sombres, iris de la couleur enregistrée.
	var brow := hair.darkened(0.35)
	img.fill_rect(Rect2i(34, 40, 11, 2), brow)
	img.fill_rect(Rect2i(52, 40, 11, 2), brow)
	for x in [34, 52]:
		img.fill_rect(Rect2i(x, 44, 11, 7), HEAD)
		img.fill_rect(Rect2i(x + 2, 45, 6, 6), eyes)
		img.fill_rect(Rect2i(x + 4, 46, 2, 4), dark)
	if female:
		img.fill_rect(Rect2i(34, 43, 11, 1), dark)
		img.fill_rect(Rect2i(52, 43, 11, 1), dark)
	# Nez et bouche.
	img.fill_rect(Rect2i(46, 53, 4, 5), skin.darkened(0.12))
	img.fill_rect(Rect2i(43, 61, 10, 2), Color("8a5a50") if female else Color("81564f"))
	if sensei:
		# Marque d'expérience : ombre de mâchoire et cicatrice légère.
		img.fill_rect(Rect2i(head_x, 64, head_width, 3), skin.darkened(0.14))
		img.fill_rect(Rect2i(head_x + 6, 38, 2, 9), skin.darkened(0.25))
