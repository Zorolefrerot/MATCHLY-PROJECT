class_name TrainingUltimateRules
extends RefCounted
## OFFLINE LAB ONLY. Names/values are proposals, not earned account abilities.
## No XP, clan draws, account writes, or multiplayer damage here.
const COST: float = 70.0
const COOLDOWN: float = 60.0
const WINDUP: float = 1.4
const DURATION: float = 5.8
const MAX_LEVEL: int = 50
const CATALOG: Array[Dictionary] = [
	{"clan":"Uchiwa","name":"Envol du brasier","motif":0,"color":Color("ff7045"),"accent":Color("ffd797"),"sound":"katon"},
	{"clan":"Uzumaki","name":"Spirale du grand sceau","motif":1,"color":Color("ffa95c"),"accent":Color("ffeac1"),"sound":"futon"},
	{"clan":"Senju","name":"Rempart des mille rocs","motif":2,"color":Color("caa16c"),"accent":Color("eae0aa"),"sound":"doton"},
	{"clan":"Hyūga","name":"Couronne des paumes","motif":3,"color":Color("a9dcff"),"accent":Color("edeaff"),"sound":"futon"},
	{"clan":"Akimichi","name":"Poing du géant","motif":4,"color":Color("ef957d"),"accent":Color("ffd795"),"sound":"earth_impact"},
	{"clan":"Yamanaka","name":"Floraison de l’esprit","motif":5,"color":Color("d6a3ef"),"accent":Color("f9dbea"),"sound":"futon"},
	{"clan":"Aburame","name":"Nuée d’éclipse","motif":6,"color":Color("9aac78"),"accent":Color("d3d2a0"),"sound":"futon"},
	{"clan":"Inuzuka","name":"Crocs des deux ombres","motif":7,"color":Color("91d6e0"),"accent":Color("f5e8cb"),"sound":"futon"},
	{"clan":"Fushiguro","name":"Procession des ombres","motif":8,"color":Color("9b98d3"),"accent":Color("d2bcf0"),"sound":"futon"},
	{"clan":"Itadori","name":"Impact du cœur noir","motif":9,"color":Color("d65872"),"accent":Color("f6c4c1"),"sound":"hit"},
	{"clan":"Kurosaki","name":"Croissant spirituel","motif":10,"color":Color("66b9f2"),"accent":Color("e0eeff"),"sound":"raiton"},
	{"clan":"Shunsui","name":"Danse des pétales d’ombre","motif":11,"color":Color("b88acd"),"accent":Color("f6c5db"),"sound":"futon"},
	{"clan":"Yeager","name":"Colosse de chakra","motif":12,"color":Color("e2b271"),"accent":Color("f3e5bd"),"sound":"doton"},
	{"clan":"Ackerman","name":"Lames de l’orage","motif":13,"color":Color("94cabb"),"accent":Color("e4f1f7"),"sound":"raiton"},
]
var clan_index: int = 0
var level: int = 1
var cooldown: float = 0.0
var remaining: float = 0.0
var impact_pending: bool = false

func definition() -> Dictionary:
	return CATALOG[clan_index]

func set_demo(index: int, value: int) -> bool:
	if index < 0 or index >= CATALOG.size() or value < 1 or value > MAX_LEVEL or cooldown > 0.001 or remaining > 0:
		return false
	clan_index = index
	level = value
	return true

func damage() -> float:
	return 55.0 + 3.0 * (level-1)

func radius() -> float:
	return 3.0 + 2.0 * float(level-1)/float(MAX_LEVEL-1)

func magnitude() -> float:
	return 0.85 + 0.45 * float(level-1)/float(MAX_LEVEL-1)

func reset() -> void:
	cooldown = 0
	remaining = 0
	impact_pending = false

func refusal(chakra: float) -> String:
	if remaining > 0: return "L’ultime est déjà en cours."
	if cooldown > 0.001: return "Ultime : encore %.1f s." % cooldown
	if not is_finite(chakra) or chakra < COST: return "Ultime : 70 chakra nécessaires."
	return ""

func begin(chakra: float) -> bool:
	if not refusal(chakra).is_empty(): return false
	cooldown = COOLDOWN
	remaining = DURATION
	impact_pending = true
	return true

func tick(delta: float) -> bool:
	if not is_finite(delta) or delta <= 0: return false
	cooldown = maxf(0,cooldown-delta)
	remaining = maxf(0,remaining-delta)
	if impact_pending and remaining <= DURATION-WINDUP:
		impact_pending = false
		return true # Exactly one impact, even for a long frame.
	return false

func cancel() -> void:
	remaining = 0
	impact_pending = false # Never refund chakra/cooldown on cancellation.
