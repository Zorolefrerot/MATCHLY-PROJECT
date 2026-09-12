import { randomUUID } from "node:crypto";

export const VILLAGE = Object.freeze({
  protocol: 1,
  capacity: 20,
  radius: 12,
  spawn: Object.freeze([0, 0.25, 22]),
  leaseMs: 5000,
});

export const COMBAT = Object.freeze({
  maxPlayers: 2,
  maxHealth: 120,
  maxChakra: 100,
  maxLevel: 50,
  ultimateCost: 70,
  ultimateCooldownMs: 60000,
  ultimateWindupMs: 1400,
  ultimateDurationMs: 5800,
  ultimateBaseDamage: 55,
});

const motions = ["idle", "walk", "run", "jump"];
const combatKinds = [
  "melee",
  "skill_0",
  "skill_1",
  "skill_2",
  "skill_3",
  "ultimate",
];
const skillSlots = ["skill_0", "skill_1", "skill_2", "skill_3"];
const technique = (
  name,
  subtitle,
  element,
  motif,
  cost,
  cooldown,
  damage,
  range,
) =>
  Object.freeze({
    name,
    subtitle,
    element,
    motif,
    cost,
    cooldown,
    damage,
    range,
  });

// Every admitted clan receives its own four-technique loadout. The element is
// server data, not a client label: performCombatAction rejects any slot that
// is not in this clan's catalogue. Katon belongs only to Uchiwa and Mokuton
// belongs only to Senju in this test ruleset.
export const TECHNIQUES_BY_CLAN = Object.freeze({
  Uchiwa: Object.freeze([
    technique("Katon · Gōkakyū", "Boule de feu", "Katon", 0, 16, 5000, 22, 18),
    technique(
      "Katon · Hōsenka",
      "Rafale de flammes",
      "Katon",
      0,
      24,
      8000,
      32,
      18,
    ),
    technique("Katon · Ryūka", "Dragon de feu", "Katon", 0, 12, 4000, 14, 9),
    technique(
      "Katon · Gōryūka",
      "Dragon colossal",
      "Katon",
      0,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Uzumaki: Object.freeze([
    technique(
      "Fūinjutsu · Chaînes",
      "Entrave de chakra",
      "Fūinjutsu",
      1,
      16,
      5000,
      22,
      18,
    ),
    technique(
      "Barrière spirale",
      "Bouclier tournoyant",
      "Fūinjutsu",
      1,
      24,
      8000,
      32,
      18,
    ),
    technique(
      "Sceau d’immobilisation",
      "Marque entravante",
      "Fūinjutsu",
      1,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Rasengan spiral",
      "Impact concentré",
      "Fūinjutsu",
      1,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Senju: Object.freeze([
    technique(
      "Mokuton · Jukai",
      "Forêt naissante",
      "Mokuton",
      2,
      16,
      5000,
      22,
      18,
    ),
    technique(
      "Mokuton · Hotei",
      "Mains de bois",
      "Mokuton",
      2,
      24,
      8000,
      32,
      18,
    ),
    technique(
      "Mokuton · Clone",
      "Double sylvestre",
      "Mokuton",
      2,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Mokuton · Mokuryū",
      "Dragon de bois",
      "Mokuton",
      2,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Hyūga: Object.freeze([
    technique(
      "Jūken · Paume souple",
      "Frappe des tenketsu",
      "Jūken",
      3,
      16,
      5000,
      22,
      18,
    ),
    technique("Hakke Kūshō", "Paume de l’air", "Jūken", 3, 24, 8000, 32, 18),
    technique("Kaiten", "Tourbillon défensif", "Jūken", 3, 12, 4000, 14, 9),
    technique(
      "Hakke · 64 paumes",
      "Rafale de précision",
      "Jūken",
      3,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Akimichi: Object.freeze([
    technique(
      "Baika no Jutsu",
      "Expansion partielle",
      "Expansion",
      4,
      16,
      5000,
      22,
      18,
    ),
    technique(
      "Nikudan Sensha",
      "Boule humaine",
      "Expansion",
      4,
      24,
      8000,
      32,
      18,
    ),
    technique(
      "Chōdan Bakugeki",
      "Poing amplifié",
      "Expansion",
      4,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Papillon de chakra",
      "Percée massive",
      "Expansion",
      4,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Yamanaka: Object.freeze([
    technique(
      "Shintenshin",
      "Transfert d’esprit",
      "Esprit",
      5,
      16,
      5000,
      22,
      18,
    ),
    technique(
      "Shinranshin",
      "Confusion mentale",
      "Esprit",
      5,
      24,
      8000,
      32,
      18,
    ),
    technique(
      "Projection mentale",
      "Onde psychique",
      "Esprit",
      5,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Réseau de l’esprit",
      "Emprise collective",
      "Esprit",
      5,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Aburame: Object.freeze([
    technique(
      "Mushi Bunshin",
      "Clone d’insectes",
      "Kikaichū",
      6,
      16,
      5000,
      22,
      18,
    ),
    technique(
      "Nuée traçante",
      "Essaim perforant",
      "Kikaichū",
      6,
      24,
      8000,
      32,
      18,
    ),
    technique(
      "Insectes de chakra",
      "Drain rampant",
      "Kikaichū",
      6,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Kikaichū · Marée noire",
      "Déferlante d’essaim",
      "Kikaichū",
      6,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Inuzuka: Object.freeze([
    technique(
      "Shikyaku no Jutsu",
      "Forme bestiale",
      "Bestial",
      7,
      16,
      5000,
      22,
      18,
    ),
    technique("Gatsūga", "Double croc", "Bestial", 7, 24, 8000, 32, 18),
    technique(
      "Jūjin Bunshin",
      "Compagnon sauvage",
      "Bestial",
      7,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Sōga · Crocs du loup",
      "Assaut tournoyant",
      "Bestial",
      7,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Fushiguro: Object.freeze([
    technique(
      "Chimères · Chiens divins",
      "Traque des ombres",
      "Ombre",
      8,
      16,
      5000,
      22,
      18,
    ),
    technique("Nue", "Éclair de la nuée", "Ombre", 8, 24, 8000, 32, 18),
    technique(
      "Grenouille d’ombre",
      "Entrave rampante",
      "Ombre",
      8,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Jardin des ombres",
      "Domaine partiel",
      "Ombre",
      8,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Itadori: Object.freeze([
    technique(
      "Poing divergent",
      "Impact retardé",
      "Impact",
      9,
      16,
      5000,
      22,
      18,
    ),
    technique("Black Flash", "Éclair noir", "Impact", 9, 24, 8000, 32, 18),
    technique(
      "Coup de percussion",
      "Onde corporelle",
      "Impact",
      9,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Rafale du cœur",
      "Enchaînement brutal",
      "Impact",
      9,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Kurosaki: Object.freeze([
    technique(
      "Getsuga bleu",
      "Lame spirituelle",
      "Énergie spirituelle",
      10,
      16,
      5000,
      22,
      18,
    ),
    technique(
      "Getsuga Tenshō",
      "Croissant noir",
      "Énergie spirituelle",
      10,
      24,
      8000,
      32,
      18,
    ),
    technique(
      "Pas éclair",
      "Tranchant instantané",
      "Énergie spirituelle",
      10,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Lame du croissant",
      "Vague de reiatsu",
      "Énergie spirituelle",
      10,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Shunsui: Object.freeze([
    technique(
      "Kageoni",
      "Jeu des ombres",
      "Jeu d’ombres",
      11,
      16,
      5000,
      22,
      18,
    ),
    technique(
      "Takaoni",
      "Frappe ascendante",
      "Jeu d’ombres",
      11,
      24,
      8000,
      32,
      18,
    ),
    technique(
      "Irooni",
      "Couleur tranchante",
      "Jeu d’ombres",
      11,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Daruma-san",
      "Ronde des pétales",
      "Jeu d’ombres",
      11,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Yeager: Object.freeze([
    technique("Durcissement", "Poing blindé", "Titan", 12, 16, 5000, 22, 18),
    technique(
      "Marteau de chair",
      "Onde colossale",
      "Titan",
      12,
      24,
      8000,
      32,
      18,
    ),
    technique(
      "Charge blindée",
      "Percée de titan",
      "Titan",
      12,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Rugissement du colosse",
      "Onde de transformation",
      "Titan",
      12,
      32,
      12000,
      44,
      16,
    ),
  ]),
  Ackerman: Object.freeze([
    technique(
      "Lames jumelles",
      "Entaille rapide",
      "Lames",
      13,
      16,
      5000,
      22,
      18,
    ),
    technique(
      "Vrille de l’éclair",
      "Rotation tranchante",
      "Lames",
      13,
      24,
      8000,
      32,
      18,
    ),
    technique(
      "Pas tridimensionnel",
      "Esquive offensive",
      "Lames",
      13,
      12,
      4000,
      14,
      9,
    ),
    technique(
      "Danse des lames",
      "Assaut en spirale",
      "Lames",
      13,
      32,
      12000,
      44,
      16,
    ),
  ]),
});

const skillRange = Object.freeze({ melee: 2.6, ultimate: 20 });
const techniquesFor = (clan) => TECHNIQUES_BY_CLAN[clan] || [];
const techniqueFor = (clan, kind) => {
  const index = skillSlots.indexOf(kind);
  return index >= 0 ? techniquesFor(clan)[index] || null : null;
};
const techniqueView = (value) =>
  value
    ? {
        name: value.name,
        subtitle: value.subtitle,
        element: value.element,
        motif: value.motif,
        cost: value.cost,
        cooldown: value.cooldown / 1000,
        range: value.range,
      }
    : null;
const ultimateByClan = Object.freeze({
  Uchiwa: { name: "Envol du brasier", motif: 0 },
  Uzumaki: { name: "Spirale du grand sceau", motif: 1 },
  Senju: { name: "Rempart des mille rocs", motif: 2 },
  Hyūga: { name: "Couronne des paumes", motif: 3 },
  Akimichi: { name: "Poing du géant", motif: 4 },
  Yamanaka: { name: "Floraison de l’esprit", motif: 5 },
  Aburame: { name: "Nuée d’éclipse", motif: 6 },
  Inuzuka: { name: "Crocs des deux ombres", motif: 7 },
  Fushiguro: { name: "Procession des ombres", motif: 8 },
  Itadori: { name: "Impact du cœur noir", motif: 9 },
  Kurosaki: { name: "Croissant spirituel", motif: 10 },
  Shunsui: { name: "Danse des pétales d’ombre", motif: 11 },
  Yeager: { name: "Colosse de chakra", motif: 12 },
  Ackerman: { name: "Lames de l’orage", motif: 13 },
});
const exact = (value, keys) =>
  value &&
  !Array.isArray(value) &&
  typeof value === "object" &&
  Object.keys(value).sort().join(",") === keys;
const sequence = (v) => Number.isSafeInteger(v) && v >= 0;
const position = (p) =>
  Array.isArray(p) &&
  p.length === 3 &&
  p.every(Number.isFinite) &&
  Math.abs(p[0]) <= 31 &&
  p[1] >= -5 &&
  p[1] <= 12 &&
  Math.abs(p[2]) <= 35;
const direction = (p) =>
  Array.isArray(p) &&
  p.length === 3 &&
  p.every((v) => Number.isFinite(v) && Math.abs(v) <= 1.5) &&
  Math.hypot(...p) > 0.01;
const clampLevel = (value) =>
  Number.isSafeInteger(value)
    ? Math.max(1, Math.min(COMBAT.maxLevel, value))
    : 1;
const levelMultiplier = (level) => 1 + 0.02 * (level - 1);
const combatUltimate = (clan, level) => ({
  ...(ultimateByClan[clan] || { name: "Ultime du genin", motif: 9 }),
  clan,
  level,
  damage: COMBAT.ultimateBaseDamage + 3 * (level - 1),
});
const clonePosition = (p) => [Number(p[0]), Number(p[1]), Number(p[2])];

// One ephemeral room in one Render process. Presence and combat are deliberately
// not written to the database: this is an online test arena, not progression.
export class VillageRoom {
  constructor({ now = Date.now } = {}) {
    this.now = now;
    this.peers = new Map();
    this.frame = 0;
    this.combatFrame = 0;
    this.combat = null;
    this.lastCombatState = 0;
    this.lastTick = this.now();
  }
  active(peer) {
    return (
      this.peers.get(peer.id) === peer &&
      this.now() < peer.leaseUntil &&
      this.now() < peer.expires
    );
  }
  send(peer, event) {
    if (this.active(peer)) peer.transport.send(event);
  }
  broadcast(event) {
    for (const peer of this.peers.values()) this.send(peer, event);
  }
  roster() {
    this.broadcast({
      type: "roster",
      players: [...this.peers.values()]
        .filter((p) => this.active(p))
        .map(({ id, name, appearance }) => ({ id, name, appearance })),
    });
  }
  join(identity, transport) {
    const previous = this.peers.get(identity.id);
    if (!previous && this.peers.size >= VILLAGE.capacity) {
      // Capacity can briefly include a departing/revoked player. Retry without
      // telling an admitted client to erase its otherwise valid login.
      transport.close(1013, "Village complet, réessaie bientôt");
      return null;
    }
    if (previous && this.combat?.players.includes(identity.id))
      this.endCombat("Connexion remplacée");
    const now = this.now();
    const peer = {
      ...identity,
      clan: identity.clan || "Uchiwa",
      combatLevel: clampLevel(identity.level),
      transport,
      leaseUntil: now + VILLAGE.leaseMs,
      state: { id: identity.id, p: [...VILLAGE.spawn], yaw: 0, motion: "idle" },
      seq: -1,
      chatSeq: -1,
      combatSeq: -1,
      lastPacket: now,
      lastMove: now,
      packetTokens: 40,
      chatTokens: 3,
      lastChat: now,
      distanceBudget: 2,
      lastRespawn: now - 5000,
      combat: null,
    };
    this.peers.set(peer.id, peer);
    // The old socket's later close callback cannot remove this replacement.
    if (previous) previous.transport.close(4001, "Compte ouvert ailleurs");
    this.send(peer, {
      type: "welcome",
      protocol: VILLAGE.protocol,
      self: peer.id,
      spawn: [...VILLAGE.spawn],
      radius: VILLAGE.radius,
    });
    this.roster();
    this.tick();
    return peer;
  }
  leave(peer, code = 1000, reason = "Départ") {
    if (!peer || this.peers.get(peer.id) !== peer) return;
    if (this.combat?.players.includes(peer.id))
      this.endCombat("Un joueur a quitté le duel");
    this.peers.delete(peer.id);
    peer.transport.close(code, reason);
    this.roster();
  }
  reject(peer, code, error) {
    this.send(peer, { type: "error", code, error });
  }
  combatPeer(id) {
    return this.peers.get(id);
  }
  combatParticipants() {
    return (
      this.combat?.players
        .map((id) => this.peers.get(id))
        .filter((peer) => peer && this.active(peer)) || []
    );
  }
  combatState() {
    if (!this.combat) return null;
    return {
      type: "combat_state",
      status: this.combat.started ? "active" : "waiting",
      players: this.combat.players
        .map((id) => this.peers.get(id))
        .filter(Boolean)
        .map((peer) => ({
          id: peer.id,
          name: peer.name,
          clan: peer.clan,
          level: peer.combatLevel,
          health: Math.max(0, Math.round(peer.combat.health)),
          maxHealth: COMBAT.maxHealth,
          chakra: Math.max(0, Math.round(peer.combat.chakra)),
          maxChakra: COMBAT.maxChakra,
          ultimateCooldown: Math.max(
            0,
            (peer.combat.ultimateUntil - this.now()) / 1000,
          ),
          techniques: techniquesFor(peer.clan).map(techniqueView),
        })),
    };
  }
  sendCombatState(force = false) {
    if (!this.combat) return;
    const now = this.now();
    if (!force && now - this.lastCombatState < 250) return;
    this.lastCombatState = now;
    const state = this.combatState();
    for (const peer of this.combatParticipants()) this.send(peer, state);
  }
  joinCombat(peer) {
    if (!this.active(peer)) return;
    if (this.combat && !this.combat.players.includes(peer.id)) {
      if (
        this.combat.started ||
        this.combat.players.length >= COMBAT.maxPlayers
      ) {
        this.reject(peer, "COMBAT_BUSY", "Le duel de test est déjà occupé.");
        return;
      }
      this.combat.players.push(peer.id);
    } else if (!this.combat) {
      this.combat = {
        players: [peer.id],
        started: false,
        pending: [],
        frame: 0,
      };
    }
    if (!peer.combat)
      peer.combat = {
        health: COMBAT.maxHealth,
        chakra: COMBAT.maxChakra,
        meleeUntil: 0,
        skillUntil: {},
        ultimateUntil: 0,
      };
    if (this.combat.players.length < COMBAT.maxPlayers) {
      this.send(peer, {
        type: "combat_waiting",
        players: this.combat.players.map(
          (id) => this.peers.get(id)?.name || "Genin",
        ),
        needed: COMBAT.maxPlayers - this.combat.players.length,
      });
      this.sendCombatState(true);
      return;
    }
    this.startCombat();
  }
  startCombat() {
    if (
      !this.combat ||
      this.combat.started ||
      this.combat.players.length !== COMBAT.maxPlayers
    )
      return;
    this.combat.started = true;
    const starts = [
      [-3, 0.25, 22],
      [3, 0.25, 22],
    ];
    for (const [index, id] of this.combat.players.entries()) {
      const peer = this.peers.get(id);
      if (!peer) continue;
      peer.combat = {
        health: COMBAT.maxHealth,
        chakra: COMBAT.maxChakra,
        meleeUntil: 0,
        skillUntil: {},
        ultimateUntil: 0,
      };
      peer.state.p = [...starts[index]];
      peer.state.yaw = index === 0 ? Math.PI / 2 : -Math.PI / 2;
      peer.state.motion = "idle";
      peer.distanceBudget = 2;
      this.send(peer, { type: "correction", ...peer.state });
    }
    this.sendCombatState(true);
    this.broadcast({
      type: "combat_started",
      players: this.combat.players,
      message:
        "Duel de test lancé · rapprochez-vous et utilisez les commandes de combat.",
    });
  }
  leaveCombat(peer) {
    if (!this.combat || !this.combat.players.includes(peer.id)) return;
    this.endCombat("Duel quitté");
  }
  endCombat(reason = "Duel terminé", winner = 0, loser = 0) {
    if (!this.combat) return;
    const participants = this.combatParticipants();
    if (winner) {
      for (const peer of participants)
        this.send(peer, { type: "combat_result", winner, loser, reason });
    }
    for (const peer of participants)
      this.send(peer, { type: "combat_end", reason });
    for (const peer of participants) peer.combat = null;
    this.combat = null;
    this.lastCombatState = 0;
  }
  combatError(peer, message) {
    this.reject(peer, "COMBAT_ACTION", message);
  }
  applyCombatHit(
    attacker,
    target,
    kind,
    damage,
    position,
    ultimate = null,
    technique = null,
  ) {
    if (!this.combat?.started || !attacker?.combat || !target?.combat) return;
    target.combat.health = Math.max(0, target.combat.health - damage);
    const hit = {
      type: "combat_hit",
      attacker: attacker.id,
      target: target.id,
      kind,
      damage: Math.round(damage),
      health: Math.round(target.combat.health),
      position: clonePosition(position),
    };
    if (ultimate) hit.ultimate = ultimate;
    if (technique) hit.technique = technique;
    for (const peer of this.combatParticipants()) this.send(peer, hit);
    this.sendCombatState(true);
    if (target.combat.health <= 0)
      this.endCombat("KO de test", attacker.id, target.id);
  }
  performCombatAction(peer, message) {
    if (!this.combat?.started || !this.combat.players.includes(peer.id)) {
      this.combatError(peer, "Rejoins le duel de test avant d’attaquer.");
      return;
    }
    const target = this.combatPeer(
      this.combat.players.find((id) => id !== peer.id),
    );
    if (!target || !this.active(target) || !target.combat) return;
    const now = this.now();
    const state = peer.combat;
    const clanTechnique = techniqueFor(peer.clan, message.kind);
    if (skillSlots.includes(message.kind) && !clanTechnique) {
      this.combatError(peer, "Cette technique n’appartient pas à ton clan.");
      return;
    }
    const distance = Math.hypot(
      target.state.p[0] - peer.state.p[0],
      target.state.p[2] - peer.state.p[2],
    );
    const attackRange = clanTechnique?.range || skillRange[message.kind];
    if (distance > attackRange) {
      this.combatError(peer, "Cible trop éloignée pour cette technique.");
      return;
    }
    if (message.kind === "melee" && now < state.meleeUntil) {
      this.combatError(peer, "La frappe est encore en récupération.");
      return;
    }
    if (message.kind !== "melee" && message.kind !== "ultimate") {
      const until = state.skillUntil[message.kind] || 0;
      if (now < until) {
        this.combatError(peer, "Cette technique est encore en récupération.");
        return;
      }
      if (state.chakra < clanTechnique.cost) {
        this.combatError(peer, `${clanTechnique.name} : chakra insuffisant.`);
        return;
      }
    }
    if (message.kind === "ultimate") {
      if (now < state.ultimateUntil) {
        this.combatError(peer, "L’ultime est encore en récupération.");
        return;
      }
      if (state.chakra < COMBAT.ultimateCost) {
        this.combatError(peer, "70 chakra sont nécessaires pour l’ultime.");
        return;
      }
      state.chakra -= COMBAT.ultimateCost;
      state.ultimateUntil = now + COMBAT.ultimateCooldownMs;
    } else if (message.kind === "melee") {
      state.meleeUntil = now + 550;
    } else {
      state.chakra -= clanTechnique.cost;
      state.skillUntil[message.kind] = now + clanTechnique.cooldown;
    }
    const origin = [peer.state.p[0], peer.state.p[1] + 1.15, peer.state.p[2]];
    const targetPosition = clonePosition(target.state.p);
    const action = {
      type: "combat_action",
      actionId: ++this.combatFrame,
      attacker: peer.id,
      kind: message.kind,
      origin,
      direction: [...message.direction],
      target: targetPosition,
    };
    if (clanTechnique) action.technique = techniqueView(clanTechnique);
    if (message.kind === "ultimate")
      action.ultimate = combatUltimate(peer.clan, peer.combatLevel);
    for (const participant of this.combatParticipants())
      this.send(participant, action);
    if (message.kind === "ultimate") {
      const radius = 3 + (2 * (peer.combatLevel - 1)) / (COMBAT.maxLevel - 1);
      this.combat.pending.push({
        due: now + COMBAT.ultimateWindupMs,
        attacker: peer.id,
        target: target.id,
        position: targetPosition,
        radius,
        damage: COMBAT.ultimateBaseDamage + 3 * (peer.combatLevel - 1),
        ultimate: action.ultimate,
      });
    } else {
      const base = message.kind === "melee" ? 10 : clanTechnique.damage;
      const damage = Math.round(base * levelMultiplier(peer.combatLevel));
      this.applyCombatHit(
        peer,
        target,
        message.kind,
        damage,
        targetPosition,
        null,
        techniqueView(clanTechnique),
      );
    }
    this.sendCombatState(true);
  }
  updateCombat(deltaMs) {
    if (!this.combat?.started) return;
    const step = Math.max(0, Math.min(1000, deltaMs)) / 1000;
    for (const peer of this.combatParticipants())
      peer.combat.chakra = Math.min(
        COMBAT.maxChakra,
        peer.combat.chakra + 10 * step,
      );
    const now = this.now();
    for (let i = this.combat.pending.length - 1; i >= 0; i--) {
      const pending = this.combat.pending[i];
      if (pending.due > now) continue;
      this.combat.pending.splice(i, 1);
      const attacker = this.combatPeer(pending.attacker);
      const target = this.combatPeer(pending.target);
      if (!attacker || !target || !attacker.combat || !target.combat) continue;
      const distance = Math.hypot(
        target.state.p[0] - pending.position[0],
        target.state.p[2] - pending.position[2],
      );
      if (distance <= pending.radius && target.combat.health > 0)
        this.applyCombatHit(
          attacker,
          target,
          "ultimate",
          pending.damage,
          target.state.p,
          pending.ultimate,
        );
      else
        for (const participant of this.combatParticipants())
          this.send(participant, {
            type: "combat_evaded",
            attacker: attacker.id,
            target: target.id,
            position: clonePosition(pending.position),
          });
    }
    this.sendCombatState();
  }
  receive(peer, message) {
    if (!this.active(peer)) {
      this.leave(
        peer,
        this.now() >= peer.expires ? 4003 : 1013,
        "Session à vérifier",
      );
      return;
    }
    const now = this.now();
    peer.packetTokens = Math.min(
      40,
      peer.packetTokens + (now - peer.lastPacket) * 0.03,
    );
    peer.lastPacket = now;
    if (--peer.packetTokens < 0) {
      this.leave(peer, 1008, "Trop de messages");
      return;
    }
    if (
      exact(message, "motion,p,seq,type,yaw") &&
      message.type === "move" &&
      sequence(message.seq) &&
      position(message.p) &&
      Number.isFinite(message.yaw) &&
      Math.abs(message.yaw) <= Math.PI &&
      motions.includes(message.motion)
    ) {
      if (message.seq <= peer.seq) return;
      peer.seq = message.seq;
      const elapsed = Math.max(0, now - peer.lastMove) / 1000;
      peer.distanceBudget = Math.min(2, peer.distanceBudget + elapsed * 8);
      peer.lastMove = now;
      const distance = Math.hypot(
        message.p[0] - peer.state.p[0],
        message.p[2] - peer.state.p[2],
      );
      if (
        distance > peer.distanceBudget ||
        Math.abs(message.p[1] - peer.state.p[1]) >
          1 + Math.min(elapsed, 0.5) * 12
      ) {
        this.send(peer, { type: "correction", ...peer.state });
        return;
      }
      peer.distanceBudget -= distance;
      peer.state = {
        id: peer.id,
        p: [...message.p],
        yaw: message.yaw,
        motion: message.motion,
      };
      return;
    }
    if (
      exact(message, "channel,seq,text,type") &&
      message.type === "chat" &&
      sequence(message.seq) &&
      ["RP", "HRP"].includes(message.channel) &&
      typeof message.text === "string" &&
      message.text.trim().length > 0 &&
      message.text.length <= 240 &&
      !/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(message.text)
    ) {
      if (message.seq <= peer.chatSeq) {
        this.send(peer, { type: "chat_ack", seq: message.seq });
        return;
      }
      peer.chatTokens = Math.min(
        3,
        peer.chatTokens + (now - peer.lastChat) / 2000,
      );
      peer.lastChat = now;
      if (peer.chatTokens < 1) {
        this.reject(
          peer,
          "CHAT_RATE",
          "Attends un instant avant d’envoyer un autre message.",
        );
        return;
      }
      peer.chatTokens--;
      peer.chatSeq = message.seq;
      const event = {
        type: "chat",
        id: randomUUID(),
        sender: peer.id,
        name: peer.name,
        channel: message.channel,
        text: message.text.trim().toWellFormed(),
      };
      for (const other of this.peers.values()) {
        if (
          Math.hypot(...other.state.p.map((v, i) => v - peer.state.p[i])) <=
          VILLAGE.radius
        )
          this.send(other, event);
      }
      this.send(peer, { type: "chat_ack", seq: message.seq });
      return;
    }
    if (exact(message, "type") && message.type === "combat_join") {
      this.joinCombat(peer);
      return;
    }
    if (exact(message, "type") && message.type === "combat_leave") {
      this.leaveCombat(peer);
      return;
    }
    if (
      exact(message, "level,type") &&
      message.type === "combat_level" &&
      Number.isSafeInteger(message.level) &&
      message.level >= 1 &&
      message.level <= COMBAT.maxLevel
    ) {
      if (
        !this.combat ||
        this.combat.started ||
        !this.combat.players.includes(peer.id)
      ) {
        this.combatError(
          peer,
          "Le niveau se règle avant le lancement du duel.",
        );
        return;
      }
      peer.combatLevel = message.level;
      this.sendCombatState(true);
      return;
    }
    if (
      exact(message, "direction,kind,seq,type") &&
      message.type === "combat_action" &&
      sequence(message.seq) &&
      message.seq > peer.combatSeq &&
      combatKinds.includes(message.kind) &&
      direction(message.direction)
    ) {
      peer.combatSeq = message.seq;
      this.performCombatAction(peer, message);
      return;
    }
    if (exact(message, "type") && message.type === "respawn") {
      if (now - peer.lastRespawn < 5000) return;
      peer.lastRespawn = now;
      peer.state = {
        id: peer.id,
        p: [...VILLAGE.spawn],
        yaw: 0,
        motion: "idle",
      };
      peer.distanceBudget = 2;
      peer.lastMove = now;
      this.send(peer, { type: "correction", ...peer.state });
      return;
    }
    this.leave(peer, 1008, "Message incompatible");
  }
  tick() {
    const now = this.now();
    for (const peer of this.peers.values()) {
      if (!this.active(peer))
        this.leave(
          peer,
          now >= peer.expires ? 4003 : 1013,
          "Session expirée ou non vérifiée",
        );
      else if (now - peer.lastPacket > 15000)
        this.leave(peer, 4000, "Connexion interrompue");
      else if (now - peer.lastPacket > 2000) peer.state.motion = "idle";
    }
    this.updateCombat(Math.min(100, Math.max(0, now - this.lastTick)));
    this.lastTick = now;
    if (this.peers.size)
      this.broadcast({
        type: "snapshot",
        frame: ++this.frame,
        players: [...this.peers.values()]
          .filter((p) => this.active(p))
          .map((p) => p.state),
      });
  }
  close() {
    for (const peer of [...this.peers.values()])
      this.leave(peer, 1012, "Redémarrage du serveur");
  }
}
