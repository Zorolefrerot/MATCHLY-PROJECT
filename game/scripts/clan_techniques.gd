class_name ClanTechniques
extends RefCounted
## Display catalogue for the online test duel. The server remains authoritative.
## Motifs map to the generated 4x4 combat_technique_atlas.png (256 px cells).

const CATALOG: Dictionary = {
	"Uchiwa": [
		{"name":"Katon · Gōkakyū", "subtitle":"Boule de feu", "element":"Katon", "motif":0, "cost":16},
		{"name":"Katon · Hōsenka", "subtitle":"Rafale de flammes", "element":"Katon", "motif":0, "cost":24},
		{"name":"Katon · Ryūka", "subtitle":"Dragon de feu", "element":"Katon", "motif":0, "cost":12},
		{"name":"Katon · Gōryūka", "subtitle":"Dragon colossal", "element":"Katon", "motif":0, "cost":32},
	],
	"Uzumaki": [
		{"name":"Fūinjutsu · Chaînes", "subtitle":"Entrave de chakra", "element":"Fūinjutsu", "motif":1, "cost":16},
		{"name":"Barrière spirale", "subtitle":"Bouclier tournoyant", "element":"Fūinjutsu", "motif":1, "cost":24},
		{"name":"Sceau d’immobilisation", "subtitle":"Marque entravante", "element":"Fūinjutsu", "motif":1, "cost":12},
		{"name":"Rasengan spiral", "subtitle":"Impact concentré", "element":"Fūinjutsu", "motif":1, "cost":32},
	],
	"Senju": [
		{"name":"Mokuton · Jukai", "subtitle":"Forêt naissante", "element":"Mokuton", "motif":2, "cost":16},
		{"name":"Mokuton · Hotei", "subtitle":"Mains de bois", "element":"Mokuton", "motif":2, "cost":24},
		{"name":"Mokuton · Clone", "subtitle":"Double sylvestre", "element":"Mokuton", "motif":2, "cost":12},
		{"name":"Mokuton · Mokuryū", "subtitle":"Dragon de bois", "element":"Mokuton", "motif":2, "cost":32},
	],
	"Hyūga": [
		{"name":"Jūken · Paume souple", "subtitle":"Frappe des tenketsu", "element":"Jūken", "motif":3, "cost":16},
		{"name":"Hakke Kūshō", "subtitle":"Paume de l’air", "element":"Jūken", "motif":3, "cost":24},
		{"name":"Kaiten", "subtitle":"Tourbillon défensif", "element":"Jūken", "motif":3, "cost":12},
		{"name":"Hakke · 64 paumes", "subtitle":"Rafale de précision", "element":"Jūken", "motif":3, "cost":32},
	],
	"Akimichi": [
		{"name":"Baika no Jutsu", "subtitle":"Expansion partielle", "element":"Expansion", "motif":4, "cost":16},
		{"name":"Nikudan Sensha", "subtitle":"Boule humaine", "element":"Expansion", "motif":4, "cost":24},
		{"name":"Chōdan Bakugeki", "subtitle":"Poing amplifié", "element":"Expansion", "motif":4, "cost":12},
		{"name":"Papillon de chakra", "subtitle":"Percée massive", "element":"Expansion", "motif":4, "cost":32},
	],
	"Yamanaka": [
		{"name":"Shintenshin", "subtitle":"Transfert d’esprit", "element":"Esprit", "motif":5, "cost":16},
		{"name":"Shinranshin", "subtitle":"Confusion mentale", "element":"Esprit", "motif":5, "cost":24},
		{"name":"Projection mentale", "subtitle":"Onde psychique", "element":"Esprit", "motif":5, "cost":12},
		{"name":"Réseau de l’esprit", "subtitle":"Emprise collective", "element":"Esprit", "motif":5, "cost":32},
	],
	"Aburame": [
		{"name":"Mushi Bunshin", "subtitle":"Clone d’insectes", "element":"Kikaichū", "motif":6, "cost":16},
		{"name":"Nuée traçante", "subtitle":"Essaim perforant", "element":"Kikaichū", "motif":6, "cost":24},
		{"name":"Insectes de chakra", "subtitle":"Drain rampant", "element":"Kikaichū", "motif":6, "cost":12},
		{"name":"Kikaichū · Marée noire", "subtitle":"Déferlante d’essaim", "element":"Kikaichū", "motif":6, "cost":32},
	],
	"Inuzuka": [
		{"name":"Shikyaku no Jutsu", "subtitle":"Forme bestiale", "element":"Bestial", "motif":7, "cost":16},
		{"name":"Gatsūga", "subtitle":"Double croc", "element":"Bestial", "motif":7, "cost":24},
		{"name":"Jūjin Bunshin", "subtitle":"Compagnon sauvage", "element":"Bestial", "motif":7, "cost":12},
		{"name":"Sōga · Crocs du loup", "subtitle":"Assaut tournoyant", "element":"Bestial", "motif":7, "cost":32},
	],
	"Fushiguro": [
		{"name":"Chimères · Chiens divins", "subtitle":"Traque des ombres", "element":"Ombre", "motif":8, "cost":16},
		{"name":"Nue", "subtitle":"Éclair de la nuée", "element":"Ombre", "motif":8, "cost":24},
		{"name":"Grenouille d’ombre", "subtitle":"Entrave rampante", "element":"Ombre", "motif":8, "cost":12},
		{"name":"Jardin des ombres", "subtitle":"Domaine partiel", "element":"Ombre", "motif":8, "cost":32},
	],
	"Itadori": [
		{"name":"Poing divergent", "subtitle":"Impact retardé", "element":"Impact", "motif":9, "cost":16},
		{"name":"Black Flash", "subtitle":"Éclair noir", "element":"Impact", "motif":9, "cost":24},
		{"name":"Coup de percussion", "subtitle":"Onde corporelle", "element":"Impact", "motif":9, "cost":12},
		{"name":"Rafale du cœur", "subtitle":"Enchaînement brutal", "element":"Impact", "motif":9, "cost":32},
	],
	"Kurosaki": [
		{"name":"Getsuga bleu", "subtitle":"Lame spirituelle", "element":"Énergie spirituelle", "motif":10, "cost":16},
		{"name":"Getsuga Tenshō", "subtitle":"Croissant noir", "element":"Énergie spirituelle", "motif":10, "cost":24},
		{"name":"Pas éclair", "subtitle":"Tranchant instantané", "element":"Énergie spirituelle", "motif":10, "cost":12},
		{"name":"Lame du croissant", "subtitle":"Vague de reiatsu", "element":"Énergie spirituelle", "motif":10, "cost":32},
	],
	"Shunsui": [
		{"name":"Kageoni", "subtitle":"Jeu des ombres", "element":"Jeu d’ombres", "motif":11, "cost":16},
		{"name":"Takaoni", "subtitle":"Frappe ascendante", "element":"Jeu d’ombres", "motif":11, "cost":24},
		{"name":"Irooni", "subtitle":"Couleur tranchante", "element":"Jeu d’ombres", "motif":11, "cost":12},
		{"name":"Daruma-san", "subtitle":"Ronde des pétales", "element":"Jeu d’ombres", "motif":11, "cost":32},
	],
	"Yeager": [
		{"name":"Durcissement", "subtitle":"Poing blindé", "element":"Titan", "motif":12, "cost":16},
		{"name":"Marteau de chair", "subtitle":"Onde colossale", "element":"Titan", "motif":12, "cost":24},
		{"name":"Charge blindée", "subtitle":"Percée de titan", "element":"Titan", "motif":12, "cost":12},
		{"name":"Rugissement du colosse", "subtitle":"Onde de transformation", "element":"Titan", "motif":12, "cost":32},
	],
	"Ackerman": [
		{"name":"Lames jumelles", "subtitle":"Entaille rapide", "element":"Lames", "motif":13, "cost":16},
		{"name":"Vrille de l’éclair", "subtitle":"Rotation tranchante", "element":"Lames", "motif":13, "cost":24},
		{"name":"Pas tridimensionnel", "subtitle":"Esquive offensive", "element":"Lames", "motif":13, "cost":12},
		{"name":"Danse des lames", "subtitle":"Assaut en spirale", "element":"Lames", "motif":13, "cost":32},
	],
}

static func for_clan(clan: String) -> Array:
	var value: Variant = CATALOG.get(clan, [])
	return value.duplicate(true) if value is Array else []
