import { randomInt, randomUUID } from "node:crypto";

export const SECONDARY_MISSION_SCHEMA = 1;
export const SECONDARY_REWARD = 5;
export const SECONDARY_RENEWAL_MS = 10 * 60 * 1000;
export const SECONDARY_SLOTS = 3;

// These are fixed, lightweight world actors. Their coordinates are public-road
// points from Konoha, never private clan courtyards or inaccessible interiors.
export const SECONDARY_NPCS = Object.freeze([
  {
    id: "market_mika",
    name: "Mika · marchande",
    kind: "merchant",
    zone: "marché",
    position: [-23, 0.55, 22],
  },
  {
    id: "residential_ren",
    name: "Ren · habitant",
    kind: "villager",
    zone: "quartier résidentiel",
    position: [62, 0.55, 20],
  },
  {
    id: "gate_sora",
    name: "Sora · messagère",
    kind: "messenger",
    zone: "portes du village",
    position: [0, 0.55, 108],
  },
  {
    id: "academy_doctor",
    name: "Docteure Hana · médecin",
    kind: "artisan",
    zone: "académie",
    position: [-60, 0.55, -8],
  },
  {
    id: "river_toma",
    name: "Toma · voyageur",
    kind: "traveler",
    zone: "quartier des bains",
    position: [48, 0.55, -37],
  },
  {
    id: "forge_kenta",
    name: "Kenta · forgeron",
    kind: "artisan",
    zone: "ateliers",
    position: [38, 0.55, 50],
  },
  {
    id: "old_momo",
    name: "Momo · ancienne",
    kind: "elder",
    zone: "ruelles",
    position: [-29, 0.55, -4],
  },
  {
    id: "child_jun",
    name: "Jun · enfant",
    kind: "child",
    zone: "marché nord",
    position: [-1, 0.55, 25],
  },
]);

// Mission objectives are deliberately spread over existing public roads. The
// server is authoritative for these points; clients never submit coordinates.
const OBJECTIVE_POINTS = Object.freeze({
  lost_cat: [[-54, 0.65, 18]],
  parcel_delivery: [[58, 0.65, 16]],
  medicinal_herbs: [
    [-52, 0.65, 45],
    [22, 0.65, 55],
    [78, 0.65, -4],
  ],
  lost_scroll: [[-28, 0.65, -20]],
  lost_dog: [[34, 0.65, -61]],
  market_delivery: [[-2, 0.65, 30]],
  village_cleanup: [
    [-20, 0.65, 21],
    [0, 0.65, -45],
    [48, 0.65, -35],
  ],
  urgent_message: [[55, 0.65, -35]],
  blacksmith_tools: [
    [-50, 0.65, -54],
    [38, 0.65, 50],
    [92, 0.65, 15],
  ],
  forgotten_items: [
    [-34, 0.65, 2],
    [20, 0.65, 28],
    [64, 0.65, 18],
  ],
  meal_delivery: [[10, 0.65, 22]],
  lost_coins: [
    [-45, 0.65, 72],
    [-8, 0.65, 55],
    [43, 0.65, 72],
    [60, 0.65, 105],
    [0, 0.65, 92],
  ],
});

export const SECONDARY_TYPES = Object.freeze([
  {
    id: "lost_cat",
    title: "Chat perdu",
    icon: "🐈",
    giver: "Mon chat s’est enfui ! Peux-tu le retrouver et me le ramener ?",
    accepted:
      "Merci ! Approche-toi du chat, puis retourne voir son propriétaire.",
    objective: "Ramener le chat à son propriétaire.",
    progress: "Chat retrouvé",
    required: 1,
  },
  {
    id: "parcel_delivery",
    title: "Livraison de colis",
    icon: "📦",
    giver:
      "J’ai besoin que tu apportes ce colis à quelqu’un du quartier résidentiel.",
    accepted:
      "Le colis est fragile. Remets-le au destinataire, puis reviens me voir.",
    objective: "Livrer le colis au bon destinataire.",
    progress: "Colis remis",
    required: 1,
  },
  {
    id: "medicinal_herbs",
    title: "Herbes médicinales",
    icon: "🌿",
    giver:
      "Le dispensaire manque de plantes. Peux-tu en récupérer trois dans le village ?",
    accepted:
      "Trouve les trois plantes sur les chemins publics et rapporte-les-moi.",
    objective: "Ramasser 3 herbes médicinales.",
    progress: "Herbe ramassée",
    required: 3,
  },
  {
    id: "lost_scroll",
    title: "Parchemin perdu",
    icon: "📜",
    giver:
      "Un parchemin important a disparu dans une ruelle. Aide-moi à le retrouver.",
    accepted:
      "Retrouve le parchemin et rapporte-le directement à son propriétaire.",
    objective: "Rapporter le parchemin perdu.",
    progress: "Parchemin retrouvé",
    required: 1,
  },
  {
    id: "lost_dog",
    title: "Chien égaré",
    icon: "🐕",
    giver:
      "Mon chien s’est éloigné du village. Peux-tu le ramener près de moi ?",
    accepted:
      "Approche-toi doucement du chien, puis ramène-le à son propriétaire.",
    objective: "Ramener le chien à l’enfant.",
    progress: "Chien retrouvé",
    required: 1,
  },
  {
    id: "market_delivery",
    title: "Livraison du marché",
    icon: "🛒",
    giver:
      "Ce sac doit parvenir à un autre commerçant. Tu peux traverser le marché pour moi ?",
    accepted: "Prends le sac, livre-le au stand indiqué et reviens confirmer.",
    objective: "Livrer le sac du marché.",
    progress: "Sac livré",
    required: 1,
  },
  {
    id: "village_cleanup",
    title: "Aide au village",
    icon: "🧹",
    giver:
      "Trois endroits ont besoin d’être nettoyés. Les habitants comptent sur toi.",
    accepted: "Interagis avec les trois zones sales. Un petit geste suffit.",
    objective: "Nettoyer 3 zones du village.",
    progress: "Zone nettoyée",
    required: 3,
  },
  {
    id: "urgent_message",
    title: "Message urgent",
    icon: "🕊️",
    giver: "Ce message doit parvenir à une messagère près des bains.",
    accepted:
      "Va parler au destinataire dans l’autre quartier, puis reviens si nécessaire.",
    objective: "Transmettre le message urgent.",
    progress: "Message transmis",
    required: 1,
  },
  {
    id: "blacksmith_tools",
    title: "Outils de forgeron",
    icon: "🔨",
    giver:
      "Mes outils ont été transportés ailleurs. Peux-tu en récupérer trois ?",
    accepted:
      "Les outils sont répartis dans le village. Rapporte-les tous à la forge.",
    objective: "Rapporter 3 outils au forgeron.",
    progress: "Outil récupéré",
    required: 3,
  },
  {
    id: "forgotten_items",
    title: "Objets oubliés",
    icon: "🧺",
    giver:
      "J’ai oublié plusieurs objets dans le village. Peux-tu les retrouver ?",
    accepted:
      "Récupère les trois objets, puis rapporte-les à leur propriétaire.",
    objective: "Rapporter 3 objets oubliés.",
    progress: "Objet récupéré",
    required: 3,
  },
  {
    id: "meal_delivery",
    title: "Livraison de repas",
    icon: "🍜",
    giver: "Ce repas doit arriver chaud chez un habitant éloigné du marché.",
    accepted: "Livre le repas au destinataire, sans l’abandonner en route.",
    objective: "Livrer le repas.",
    progress: "Repas livré",
    required: 1,
  },
  {
    id: "lost_coins",
    title: "Pièces perdues",
    icon: "🪙",
    giver:
      "J’ai perdu cinq pièces dans différents quartiers. Peux-tu les chercher ?",
    accepted:
      "Cherche les cinq pièces sur les chemins publics et rapporte-les-moi.",
    objective: "Récupérer 5 pièces perdues.",
    progress: "Pièce récupérée",
    required: 5,
  },
]);

const NPC_BY_ID = new Map(SECONDARY_NPCS.map((npc) => [npc.id, npc]));
const TYPE_BY_ID = new Map(SECONDARY_TYPES.map((type) => [type.id, type]));
const rowTime = () => new Date().toISOString();
const reject = (status, code, message) => {
  throw Object.assign(new Error(message), { status, gameCode: code });
};
const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

function typeById(id) {
  const value = TYPE_BY_ID.get(id);
  if (!value) throw new Error("Type de mission secondaire inconnu.");
  return value;
}
function npcById(id) {
  const value = NPC_BY_ID.get(id);
  if (!value) throw new Error("PNJ de mission secondaire inconnu.");
  return value;
}
function shuffled(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function chooseAssignment(rows, slot) {
  const previous = rows.find((row) => Number(row.slot) === slot);
  const usedTypes = new Set(
    rows.filter((row) => row.status === "AVAILABLE").map((row) => row.type_id),
  );
  const usedNpcs = new Set(
    rows.filter((row) => row.status === "AVAILABLE").map((row) => row.npc_id),
  );
  const usedZones = new Set(
    rows.filter((row) => row.status === "AVAILABLE").map((row) => row.zone),
  );
  const type =
    shuffled(SECONDARY_TYPES).find(
      (candidate) =>
        candidate.id !== previous?.last_type && !usedTypes.has(candidate.id),
    ) ||
    shuffled(SECONDARY_TYPES).find(
      (candidate) => candidate.id !== previous?.last_type,
    ) ||
    SECONDARY_TYPES[0];
  const npc =
    shuffled(SECONDARY_NPCS).find(
      (candidate) =>
        candidate.id !== previous?.last_npc &&
        !usedNpcs.has(candidate.id) &&
        !usedZones.has(candidate.zone),
    ) ||
    shuffled(SECONDARY_NPCS).find(
      (candidate) =>
        candidate.id !== previous?.last_npc && !usedNpcs.has(candidate.id),
    ) ||
    SECONDARY_NPCS[slot % SECONDARY_NPCS.length];
  const targets = (OBJECTIVE_POINTS[type.id] || []).map((point) => [...point]);
  return {
    missionId: randomUUID(),
    type,
    npc,
    targets,
    returnPosition: [...npc.position],
  };
}

function publicMission(row, viewerId) {
  const type = typeById(row.type_id);
  const npc = npcById(row.npc_id);
  const progress =
    row.accepted_by === viewerId ? JSON.parse(row.progress || "[]") : [];
  const assignedToViewer = Number(row.accepted_by || 0) === Number(viewerId);
  return {
    slot: Number(row.slot),
    missionId: row.mission_id,
    revision: Number(row.revision),
    typeId: type.id,
    title: type.title,
    icon: type.icon,
    npcId: npc.id,
    npcName: npc.name,
    npcKind: npc.kind,
    zone: npc.zone,
    npcPosition: [...npc.position],
    targets: JSON.parse(row.objective).targets,
    returnPosition: JSON.parse(row.objective).returnPosition,
    status:
      row.status === "AVAILABLE"
        ? "available"
        : assignedToViewer
          ? "accepted"
          : row.status === "COOLDOWN"
            ? "cooldown"
            : "claimed",
    progress,
    required: type.required,
    objective: type.objective,
    progressLabel: type.progress,
    dialogue: type.giver,
    acceptedDialogue: type.accepted,
    availableAt: Number(row.available_at),
  };
}

export function secondaryUnlocked(row) {
  return row?.status === "COMPLETED" && Number(row?.reward_claimed || 0) === 1;
}

export async function ensureSecondaryMissions(db, now = Date.now()) {
  let rows = await db
    .prepare("SELECT * FROM secondary_missions ORDER BY slot")
    .all();
  const mutable = [...rows];
  for (let slot = 0; slot < SECONDARY_SLOTS; slot++) {
    const current = mutable.find((row) => Number(row.slot) === slot);
    const shouldGenerate =
      !current ||
      (current.status === "COOLDOWN" && Number(current.available_at) <= now);
    if (!shouldGenerate) continue;
    const assignment = chooseAssignment(mutable, slot);
    const previous = current;
    const record = {
      slot,
      mission_id: assignment.missionId,
      type_id: assignment.type.id,
      npc_id: assignment.npc.id,
      zone: assignment.npc.zone,
      objective: JSON.stringify({
        targets: assignment.targets,
        returnPosition: assignment.returnPosition,
      }),
      progress: "[]",
      status: "AVAILABLE",
      accepted_by: null,
      accepted_at: null,
      completed_at: null,
      available_at: now,
      revision: Number(previous?.revision || 0) + 1,
      last_type: assignment.type.id,
      last_npc: assignment.npc.id,
      last_zone: assignment.npc.zone,
      updated: rowTime(),
    };
    await db
      .prepare(
        `INSERT INTO secondary_missions(slot,mission_id,type_id,npc_id,zone,objective,progress,status,accepted_by,accepted_at,completed_at,available_at,revision,last_type,last_npc,last_zone,updated)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(slot) DO UPDATE SET mission_id=excluded.mission_id,type_id=excluded.type_id,npc_id=excluded.npc_id,zone=excluded.zone,objective=excluded.objective,progress=excluded.progress,status=excluded.status,accepted_by=excluded.accepted_by,accepted_at=excluded.accepted_at,completed_at=excluded.completed_at,available_at=excluded.available_at,revision=excluded.revision,last_type=excluded.last_type,last_npc=excluded.last_npc,last_zone=excluded.last_zone,updated=excluded.updated`,
      )
      .run(
        record.slot,
        record.mission_id,
        record.type_id,
        record.npc_id,
        record.zone,
        record.objective,
        record.progress,
        record.status,
        record.accepted_by,
        record.accepted_at,
        record.completed_at,
        record.available_at,
        record.revision,
        record.last_type,
        record.last_npc,
        record.last_zone,
        record.updated,
      );
    const index = mutable.findIndex((row) => Number(row.slot) === slot);
    if (index >= 0) mutable[index] = record;
    else mutable.push(record);
  }
  return mutable.sort((a, b) => Number(a.slot) - Number(b.slot));
}

export async function secondaryStateForUser(db, userId) {
  const clan = await db
    .prepare("SELECT status,reward_claimed FROM clan_missions WHERE user_id=?")
    .get(userId);
  const unlocked = secondaryUnlocked(clan);
  if (!unlocked)
    return {
      schemaVersion: SECONDARY_MISSION_SCHEMA,
      unlocked: false,
      message:
        "Termine la deuxième mission de clan et reçois sa récompense pour débloquer les habitants.",
      missions: [],
    };
  const rows = await ensureSecondaryMissions(db);
  return {
    schemaVersion: SECONDARY_MISSION_SCHEMA,
    unlocked: true,
    message: "Les habitants du village peuvent maintenant demander ton aide.",
    missions: rows.map((row) => publicMission(row, userId)),
  };
}

export class SecondaryMissionService {
  constructor(db) {
    this.db = db;
    this.rows = [];
    this.hasUnlockedPlayer = false;
    this.onChange = null;
    this.lastPublic = "";
  }
  async refresh() {
    try {
      const result = await dbTransaction(this.db, async () => {
        const eligible = await this.db
          .prepare(
            "SELECT 1 FROM clan_missions WHERE status='COMPLETED' AND reward_claimed=1 LIMIT 1",
          )
          .get();
        this.hasUnlockedPlayer = Boolean(eligible);
        if (!this.hasUnlockedPlayer) return [];
        return ensureSecondaryMissions(this.db);
      });
      this.rows = result;
      const signature = JSON.stringify(
        this.rows.map((row) => [
          row.slot,
          row.mission_id,
          row.status,
          row.progress,
          row.available_at,
          row.revision,
        ]),
      );
      if (signature !== this.lastPublic) {
        this.lastPublic = signature;
        this.onChange?.();
      }
    } catch {
      // A transient database failure must not destroy cached public missions.
    }
  }
  stateForPeer(peer) {
    if (!peer.secondaryUnlocked || !this.hasUnlockedPlayer)
      return {
        schemaVersion: SECONDARY_MISSION_SCHEMA,
        unlocked: false,
        message: "Les habitants attendent encore ton premier rapport de clan.",
        missions: [],
      };
    return {
      schemaVersion: SECONDARY_MISSION_SCHEMA,
      unlocked: true,
      message: "Les habitants du village peuvent maintenant demander ton aide.",
      missions: this.rows.map((row) => publicMission(row, peer.id)),
    };
  }
  async action(peer, message) {
    const result = await dbTransaction(this.db, async () => {
      const clan = await this.db
        .prepare(
          "SELECT status,reward_claimed FROM clan_missions WHERE user_id=?",
        )
        .get(peer.id);
      if (!secondaryUnlocked(clan))
        reject(
          403,
          "SECONDARY_LOCKED",
          "Termine la deuxième mission de clan et récupère sa récompense.",
        );
      const row = await this.db
        .prepare(
          "SELECT * FROM secondary_missions WHERE slot=? AND mission_id=?",
        )
        .get(message.slot, message.missionId);
      if (!row || Number(row.revision) !== message.revision)
        reject(
          409,
          "SECONDARY_CONFLICT",
          "Cette mission secondaire a changé. Actualise le village.",
        );
      const type = typeById(row.type_id);
      const objective = JSON.parse(row.objective);
      const now = Date.now();
      if (message.action === "accept") {
        if (row.status !== "AVAILABLE")
          reject(
            409,
            "SECONDARY_NOT_AVAILABLE",
            "Cette mission n’est plus disponible.",
          );
        const own = await this.db
          .prepare(
            "SELECT 1 FROM secondary_missions WHERE status='ACCEPTED' AND accepted_by=?",
          )
          .get(peer.id);
        if (own)
          reject(
            409,
            "SECONDARY_ALREADY_ACTIVE",
            "Une seule mission secondaire à la fois : termine-la ou abandonne-la auprès du PNJ avant d’en accepter une autre.",
          );
        const accepted = await this.db
          .prepare(
            "UPDATE secondary_missions SET status='ACCEPTED',accepted_by=?,accepted_at=?,progress='[]',updated=? WHERE slot=? AND mission_id=? AND revision=? AND status='AVAILABLE'",
          )
          .run(
            peer.id,
            now,
            rowTime(),
            message.slot,
            message.missionId,
            message.revision,
          );
        // The guard above is not enough on its own: two simultaneous accepts
        // must leave exactly one reserved row, so the write is conditional and
        // its row count is checked inside the same transaction.
        if (Number(accepted.changes || 0) !== 1)
          reject(
            409,
            "SECONDARY_NOT_AVAILABLE",
            "Cette mission n’est plus disponible.",
          );
      } else {
        if (
          row.status !== "ACCEPTED" ||
          Number(row.accepted_by) !== Number(peer.id)
        )
          reject(
            409,
            "SECONDARY_NOT_OWNER",
            "Cette mission est déjà prise ou n’est pas active pour toi.",
          );
        const progress = JSON.parse(row.progress || "[]");
        if (message.action === "abandon") {
          // Leaving a mission is an explicit, confirmed player choice. The slot
          // returns to the shared board immediately: same mission, same NPC and
          // same objectives, emptied progress and a bumped revision so a stale
          // client cannot act on the previous reservation. No reward, no
          // cooldown and no penalty is written.
          const abandoned = await this.db
            .prepare(
              "UPDATE secondary_missions SET status='AVAILABLE',accepted_by=NULL,accepted_at=NULL,progress='[]',revision=revision+1,updated=? WHERE slot=? AND mission_id=? AND revision=? AND status='ACCEPTED' AND accepted_by=?",
            )
            .run(
              rowTime(),
              message.slot,
              message.missionId,
              message.revision,
              peer.id,
            );
          if (Number(abandoned.changes || 0) !== 1)
            reject(
              409,
              "SECONDARY_NOT_OWNER",
              "Cette mission n’est plus active pour toi.",
            );
          await this.db
            .prepare(
              "INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)",
            )
            .run(
              peer.id,
              "secondary_mission_abandoned",
              peer.id,
              JSON.stringify({
                missionId: row.mission_id,
                typeId: row.type_id,
                abandonedProgress: progress.length,
              }),
            );
        } else if (message.action === "collect") {
          if (
            !Number.isSafeInteger(message.index) ||
            message.index < 0 ||
            message.index >= objective.targets.length ||
            progress.includes(message.index)
          )
            reject(
              409,
              "SECONDARY_OBJECTIVE_INVALID",
              "Cet objectif a déjà été validé ou est invalide.",
            );
          if (distance(peer.state.p, objective.targets[message.index]) > 4.5)
            reject(
              409,
              "SECONDARY_TOO_FAR",
              "Approche-toi réellement de l’objectif.",
            );
          progress.push(message.index);
          progress.sort((a, b) => a - b);
          await this.db
            .prepare(
              "UPDATE secondary_missions SET progress=?,updated=? WHERE slot=? AND mission_id=? AND revision=?",
            )
            .run(
              JSON.stringify(progress),
              rowTime(),
              message.slot,
              message.missionId,
              message.revision,
            );
        } else if (message.action === "complete") {
          if (
            progress.length < type.required ||
            distance(peer.state.p, objective.returnPosition) > 4.5
          )
            reject(
              409,
              "SECONDARY_NOT_COMPLETE",
              "Termine les objectifs puis reviens voir le PNJ.",
            );
          await this.db
            .prepare(
              "UPDATE secondary_missions SET status='COOLDOWN',completed_at=?,available_at=?,accepted_by=NULL,accepted_at=NULL,progress=?,revision=revision+1,updated=? WHERE slot=? AND mission_id=? AND status='ACCEPTED' AND accepted_by=?",
            )
            .run(
              now,
              now + SECONDARY_RENEWAL_MS,
              JSON.stringify(progress),
              rowTime(),
              message.slot,
              message.missionId,
              peer.id,
            );
          if (!this.db) throw new Error("Database unavailable");
          await this.db
            .prepare(
              `INSERT INTO player_progress(user_id,idrem_gold,level,updated) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET idrem_gold=player_progress.idrem_gold+excluded.idrem_gold,updated=excluded.updated`,
            )
            .run(peer.id, SECONDARY_REWARD, 0, rowTime());
          await this.db
            .prepare(
              "INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)",
            )
            .run(
              peer.id,
              "secondary_mission_reward",
              peer.id,
              JSON.stringify({
                missionId: row.mission_id,
                typeId: row.type_id,
                reward: SECONDARY_REWARD,
              }),
            );
        } else
          reject(
            400,
            "INVALID_SECONDARY_ACTION",
            "Action de mission secondaire inconnue.",
          );
      }
      const rows = await this.db
        .prepare("SELECT * FROM secondary_missions ORDER BY slot")
        .all();
      // Authoritative balance, read inside the same transaction as the reward.
      // It is display-only: no client computes or submits a wallet.
      const walletRow = await this.db
        .prepare("SELECT idrem_gold,level FROM player_progress WHERE user_id=?")
        .get(peer.id);
      return {
        rows,
        wallet: {
          idremGold: Number(walletRow?.idrem_gold || 0),
          level: Number(walletRow?.level || 0),
        },
      };
    });
    this.rows = result.rows;
    this.lastPublic = "";
    this.onChange?.();
    return { state: this.stateForPeer(peer), wallet: result.wallet };
  }
}

async function dbTransaction(db, fn) {
  return db.transaction(fn);
}

export function secondaryPublicState(rows, viewerId, unlocked = true) {
  return {
    schemaVersion: SECONDARY_MISSION_SCHEMA,
    unlocked,
    message: "Les habitants du village peuvent maintenant demander ton aide.",
    missions: unlocked ? rows.map((row) => publicMission(row, viewerId)) : [],
  };
}
