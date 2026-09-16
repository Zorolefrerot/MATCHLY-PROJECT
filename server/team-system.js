// Candidature et formation des équipes de trois à l'Académie Ninja.
// Tout est serveur : candidature, disponibilité, invitations, acceptations,
// composition, numéros d'équipe, Sensei, statuts et portraits. Le client
// n'envoie jamais une apparence, un niveau ou un nom — il reçoit des
// références validées (apparence = dictionnaire d'indices cosmétiques déjà
// contrôlé par validAppearance côté identité) et affiche, jamais ne calcule.

export const TEAM_SCHEMA = 1;
export const TEAM_MAX_MEMBERS = 3;
// Mode test demandé par le propriétaire : deux candidats PNJ pré-inscrits
// (Kaito et Renji) pour que le premier essai solo fonctionne immédiatement.
// Passer ce drapeau à false arrête l'injection ; les définitions restent
// compatibles avec le vivier (mêmes colonnes que les candidats joueurs).
export const TEAM_RECRUITMENT_TEST_MODE = true;
// Fenêtre pendant laquelle une cérémonie récente interdit de réaffecter le même
// Sensei à une autre création simultanée.
export const SENSEI_CEREMONY_WINDOW_MS = 10 * 60 * 1000;
// Le comptoir de la réception de l'Académie, dans les coordonnées absolues du
// village (academy.gd : AcademyReception en (-37.5, ·, -21.4)). Toute
// opération de candidature exige la présence physique du joueur ici.
export const TEAM_RECEPTION = Object.freeze({ x: -37.5, z: -21.4, radius: 4.2 });

// Petit vivier de candidats PNJ. Usage rare : uniquement pour compléter quand
// les joueurs réels sont insuffisants. Les joueurs réels sont toujours triés
// et servis en premier.
export const TEAM_NPC_CANDIDATES = Object.freeze([
  {
    id: "kaito",
    name: "Kaito",
    clan: "Senju",
    level: 8,
    affinity: "Suiton",
    style: "Soutien défensif",
    personality: "Calme et posé, il parle peu et observe beaucoup.",
    idle: "Kaito ajuste ses bandages d’un geste lent, le regard tranquille.",
    // Couleurs froides : cheveux bleu nuit, tenue bleue, regard gris.
    appearance: Object.freeze({
      model: 0,
      hair: 2,
      hair_color: 6,
      eyes: 4,
      skin: 1,
      top: 0,
      top_color: 5,
      bottom: 1,
      bottom_color: 0,
    }),
  },
  {
    id: "renji",
    name: "Renji",
    clan: "Hyuga",
    level: 9,
    affinity: "Raiton",
    style: "Reconnaissance et combat rapproché",
    personality: "Regard concentré, toujours en mouvement, il cherche le point faible.",
    idle: "Renji teste ses appuis sur place, le regard déjà fixé sur l’horizon.",
    // Hyuga : cheveux blancs courts, regard noir perçant, tenue sobre.
    appearance: Object.freeze({
      model: 0,
      hair: 0,
      hair_color: 5,
      eyes: 1,
      skin: 2,
      top: 0,
      top_color: 1,
      bottom: 0,
      bottom_color: 4,
    }),
  },
]);

// Vivier de Sensei PNJ originaux de Konoha. Gilet vert de Konoha, tenue de
// shinobi, bandeau frontal, allure expérimentée. Noms, portraits, silhouettes,
// tenues et discours tous différents. Daichi Kurogane est imposé à l'Équipe 001.
export const TEAM_SENSEI = Object.freeze([
  {
    id: "daichi",
    name: "Daichi Kurogane",
    title: "Sensei · Défense et discipline",
    specialty: "Défense et discipline",
    personality: "Calme, exigeant, protecteur. Il parle peu ; chaque conseil est précis.",
    appearance: Object.freeze({
      model: 0,
      hair: 0,
      hair_color: 0,
      eyes: 1,
      skin: 3,
      top: 0,
      top_color: 4,
      bottom: 0,
      bottom_color: 1,
    }),
    dialogue: Object.freeze([
      "Vous êtes donc les membres de l’équipe {number}.",
      "Je suis Daichi Kurogane. À partir d’aujourd’hui, je serai votre Sensei.",
      "Apprenez à vous connaître : vos forces, vos faiblesses, vos silences.",
      "Une équipe qui se protège ne perd jamais vraiment.",
      "Reposez-vous. L’entraînement commencera à l’aube.",
    ]),
  },
  {
    id: "ayame",
    name: "Ayame Shirogane",
    title: "Sensei · Tactique et vitesse",
    specialty: "Tactique et vitesse",
    personality: "Vive et stratège, elle pense le combat comme une partie de shogi.",
    appearance: Object.freeze({
      model: 1,
      hair: 3,
      hair_color: 5,
      eyes: 2,
      skin: 1,
      top: 0,
      top_color: 4,
      bottom: 2,
      bottom_color: 1,
    }),
    dialogue: Object.freeze([
      "Équipe {number}… Trois noms, trois souffles, une seule trajectoire.",
      "Ayame Shirogane. La vitesse ne remplace pas la réflexion, elle la récompense.",
      "Je serai votre Sensei. Placez-vous, observez, puis frappez au bon moment.",
      "Demain, premier exercice : vous bougerez ensemble, ou pas du tout.",
    ]),
  },
  {
    id: "genzo",
    name: "Genzō Arakawa",
    title: "Sensei · Offensive et taijutsu",
    specialty: "Offensive et taijutsu",
    personality: "Direct et tonitruant, il croit au poing avant tout.",
    appearance: Object.freeze({
      model: 0,
      hair: 1,
      hair_color: 4,
      eyes: 5,
      skin: 4,
      top: 2,
      top_color: 4,
      bottom: 0,
      bottom_color: 1,
    }),
    dialogue: Object.freeze([
      "Alors c’est vous, l’équipe {number} ? Solides sur vos appuis, on va voir.",
      "Genzō Arakawa, votre Sensei. Le taijutsu ne ment jamais.",
      "Une équipe offensive avance ensemble. Un pas de travers, et tout s’écroule.",
      "Préparez-vous : ça va suer dès demain matin.",
    ]),
  },
  {
    id: "natsumi",
    name: "Natsumi Hoshikawa",
    title: "Sensei · Soutien, perception et coordination",
    specialty: "Soutien, perception et coordination",
    personality: "Douce et perceptive, elle entend ce que l’équipe ne dit pas.",
    appearance: Object.freeze({
      model: 1,
      hair: 2,
      hair_color: 3,
      eyes: 3,
      skin: 0,
      top: 1,
      top_color: 4,
      bottom: 1,
      bottom_color: 5,
    }),
    dialogue: Object.freeze([
      "Bonjour, équipe {number}. Je vous regardais arriver depuis la fenêtre.",
      "Natsumi Hoshikawa. Je serai votre Sensei : perception, soutien, coordination.",
      "Trois fils séparés cassent. Trois fils tressés tiennent une équipe entière.",
      "Parlez-vous, écoutez-vous. Je veillerai sur votre premier pas.",
    ]),
  },
]);

const reject = (status, code, message) => {
  throw Object.assign(new Error(message), { status, gameCode: code });
};
const playerKey = (userId) => `p${Number(userId)}`;
const atReception = (peer) => {
  const p = peer?.state?.p;
  if (!Array.isArray(p) || p.length !== 3) return false;
  return (
    Math.hypot(p[0] - TEAM_RECEPTION.x, p[2] - TEAM_RECEPTION.z) <=
    TEAM_RECEPTION.radius
  );
};
const pad3 = (value) => String(value).padStart(3, "0");

// Apparence validée uniquement : une identité sans apparence sauvegardée reçoit
// le dictionnaire vide, que CharacterAppearance.sanitize ramène aux défauts
// côté client. Jamais d'apparence fournie par un message client.
function safeAppearance(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function senseiDialogue(sensei, number) {
  return sensei.dialogue.map((line) => line.replaceAll("{number}", pad3(number)));
}

export class TeamService {
  constructor(db, { now = Date.now } = {}) {
    this.db = db;
    this.now = now;
    this.candidates = [];
    this.teams = [];
    this.members = [];
    this.invites = [];
    this.revision = 0;
    this.seeded = false;
    this.onChange = null;
    this.lastPublic = "";
  }

  async load() {
    if (TEAM_RECRUITMENT_TEST_MODE && !this.seeded) {
      this.seeded = true;
      for (const npc of TEAM_NPC_CANDIDATES) {
        // Idempotent : la clé primaire garantit au plus une ligne par PNJ.
        await this.db
          .prepare(
            `INSERT INTO team_candidates(key,kind,npc_id,name,clan,level,appearance,affinity,style,personality,idle,status,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(key) DO NOTHING`,
          )
          .run(
            `n${npc.id}`,
            "npc",
            npc.id,
            npc.name,
            npc.clan,
            npc.level,
            JSON.stringify(npc.appearance),
            npc.affinity,
            npc.style,
            npc.personality,
            npc.idle,
            "recherche",
            this.now(),
          );
      }
    }
    this.candidates = await this.db
      .prepare("SELECT * FROM team_candidates ORDER BY created_at")
      .all();
    this.teams = await this.db.prepare("SELECT * FROM teams ORDER BY id").all();
    this.members = await this.db.prepare("SELECT * FROM team_members").all();
    this.invites = await this.db.prepare("SELECT * FROM team_invites").all();
    // Le niveau affiché reste le niveau durable du compte (player_progress),
    // rafraîchi à chaque lecture ; jamais un niveau choisi par le client.
    const progress = await this.db
      .prepare("SELECT user_id,level FROM player_progress")
      .all();
    const levelByUser = new Map(
      progress.map((row) => [Number(row.user_id), Math.max(1, Number(row.level) || 1)]),
    );
    for (const row of this.candidates) {
      if (row.kind !== "player" || !row.user_id) continue;
      const fresh = levelByUser.get(Number(row.user_id));
      if (fresh && Number(row.level) !== fresh) {
        row.level = fresh;
        await this.db
          .prepare("UPDATE team_candidates SET level=? WHERE key=?")
          .run(fresh, row.key);
      }
    }
  }

  async countMembers(teamId) {
    const row = await this.db
      .prepare("SELECT COUNT(*) AS n FROM team_members WHERE team_id=?")
      .get(teamId);
    return Number(row?.n || 0);
  }

  async refresh() {
    try {
      await this.db.transaction(async () => {
        await this.load();
      });
      const signature = JSON.stringify([
        this.candidates.map((row) => [row.key, row.status, row.name, row.level]),
        this.teams.map((row) => [row.id, row.number, row.status, row.sensei_id]),
        this.members.map((row) => [row.team_id, row.key]),
        this.invites.map((row) => [row.id, row.to_key]),
      ]);
      if (signature !== this.lastPublic) {
        this.lastPublic = signature;
        this.revision += 1;
        this.onChange?.();
      }
    } catch {
      // Un échec transitoire de la base ne détruit pas l'état public en cache.
    }
  }

  // ------------------------------------------------------------------ helpers
  candidateByKey(key) {
    return this.candidates.find((row) => row.key === key) || null;
  }
  teamOfKey(key) {
    const membership = this.members.find((row) => row.key === key);
    if (!membership) return null;
    return this.teams.find((row) => Number(row.id) === Number(membership.team_id)) || null;
  }
  teamMembers(teamId) {
    return this.members
      .filter((row) => Number(row.team_id) === Number(teamId))
      .map((row) => this.candidateByKey(row.key))
      .filter(Boolean);
  }
  pendingInvitesFor(key) {
    return this.invites.filter((row) => row.to_key === key);
  }

  // Données publiques d'un candidat. Pour un joueur en ligne, l'identité vive
  // du pair (nom, clan, apparence actuelle) remplace l'instantané : le portrait
  // suit l'apparence sauvegardée la plus récente, sans jamais faire confiance
  // à un envoi du client.
  publicCandidate(row, peers = null) {
    let name = row.name;
    let clan = row.clan;
    let level = Number(row.level) || 1;
    let appearance = safeAppearance(JSON.parse(row.appearance || "{}"));
    if (row.kind === "player" && peers) {
      const peer = peers.get(Number(row.key.slice(1)));
      if (peer) {
        name = String(peer.name || name).slice(0, 50);
        clan = String(peer.clan || clan);
        appearance = safeAppearance(peer.appearance);
      }
    }
    const team = this.teamOfKey(row.key);
    return {
      key: row.key,
      kind: row.kind,
      name,
      clan,
      level,
      affinity: row.affinity || "",
      style: row.style || "",
      personality: row.personality || "",
      idle: row.idle || "",
      appearance,
      status: team
        ? team.status === "official"
          ? "official"
          : "forming"
        : "recherche",
      teamNumber: team && team.number ? Number(team.number) : 0,
    };
  }

  publicTeam(team, peers = null) {
    if (!team) return null;
    const members = this.teamMembers(team.id).map((row) =>
      this.publicCandidate(row, peers),
    );
    const sensei = TEAM_SENSEI.find((item) => item.id === team.sensei_id) || null;
    const ceremonyActive =
      team.status === "official" &&
      sensei &&
      Number(team.ceremony_at) > 0 &&
      this.now() - Number(team.ceremony_at) <= SENSEI_CEREMONY_WINDOW_MS;
    return {
      id: Number(team.id),
      number: team.number ? Number(team.number) : 0,
      label: team.number ? `ÉQUIPE ${pad3(team.number)}` : "",
      status: team.status,
      members,
      senseiId: sensei ? sensei.id : "",
      ceremony: ceremonyActive
        ? {
            senseiId: sensei.id,
            senseiName: sensei.name,
            senseiTitle: sensei.title,
            senseiPersonality: sensei.personality,
            senseiAppearance: sensei.appearance,
            lines: senseiDialogue(sensei, Number(team.number)),
            x: Number(team.ceremony_x),
            z: Number(team.ceremony_z),
            at: Number(team.ceremony_at),
          }
        : null,
    };
  }

  stateForPeer(peer, peers = null) {
    if (!peer?.secondaryUnlocked)
      return {
        schemaVersion: TEAM_SCHEMA,
        unlocked: false,
        revision: this.revision,
        message: "Termine la deuxième mission de clan pour ouvrir l’Académie et les candidatures.",
        nearReception: false,
        self: null,
        candidates: [],
        invites: [],
        team: null,
      };
    const key = playerKey(peer.id);
    const own = this.candidateByKey(key);
    const ownTeam = this.teamOfKey(key);
    const near = atReception(peer);
    const candidates = near
      ? this.candidates
          .filter((row) => row.status === "recherche" && !this.teamOfKey(row.key))
          // Joueurs réels d'abord (par ancienneté), PNJ rares ensuite.
          .sort((a, b) => {
            if (a.kind !== b.kind) return a.kind === "player" ? -1 : 1;
            return Number(a.created_at) - Number(b.created_at);
          })
          .map((row) => this.publicCandidate(row, peers))
      : [];
    const invites = this.pendingInvitesFor(key).map((row) => {
      const from = this.candidateByKey(row.from_key);
      return {
        teamId: Number(row.team_id),
        fromKey: row.from_key,
        fromName: from ? from.name : "Candidat",
        fromClan: from ? from.clan : "",
        fromLevel: from ? Number(from.level) || 1 : 1,
        fromAppearance: from
          ? safeAppearance(JSON.parse(from.appearance || "{}"))
          : {},
      };
    });
    return {
      schemaVersion: TEAM_SCHEMA,
      unlocked: true,
      revision: this.revision,
      message: own
        ? ownTeam
          ? ownTeam.status === "official"
            ? `Ton équipe est officielle : ${ownTeam.number ? `ÉQUIPE ${pad3(ownTeam.number)}` : "complète"}.`
            : "Groupe en formation : complétez à trois, puis validez l’équipe officielle à la réception."
          : "Candidature déposée : tu apparais dans la liste des candidats."
        : "Dépose ta candidature au comptoir de la réception pour rejoindre la liste.",
      nearReception: near,
      self: own ? this.publicCandidate(own, peers) : null,
      candidates,
      invites,
      team: this.publicTeam(ownTeam, peers),
    };
  }

  // ------------------------------------------------------------------- actions
  async action(peer, message) {
    if (!peer?.secondaryUnlocked)
      reject(409, "TEAM_LOCKED", "L’Académie n’est pas encore ouverte pour toi.");
    const action = String(message?.action || "");
    if (
      !["refresh", "apply", "withdraw", "invite", "accept", "decline", "form"].includes(action)
    )
      reject(400, "TEAM_ACTION_INVALID", "Action d’équipe inconnue.");
    if (action === "refresh") {
      await this.load();
      return { state: this.stateForPeer(peer, null) };
    }
    const result = await this.db.transaction(async () => {
      await this.load();
      const key = playerKey(peer.id);
      switch (action) {
        case "apply":
          await this.applyAction(peer, key);
          break;
        case "withdraw":
          await this.withdrawAction(peer, key);
          break;
        case "invite":
          await this.inviteAction(peer, key, String(message.targetKey || ""));
          break;
        case "accept":
          await this.acceptAction(peer, key);
          break;
        case "decline":
          await this.declineAction(peer, key);
          break;
        case "form":
          await this.formAction(peer, key);
          break;
      }
      // Resynchronisation complète après mutation : l'état renvoyé est toujours
      // lu depuis la base, jamais depuis un cache construit à la main.
      await this.load();
      this.revision += 1;
      return this.stateForPeer(peer, null);
    });
    this.lastPublic = "";
    this.onChange?.();
    return { state: result };
  }

  async applyAction(peer, key) {
    if (!atReception(peer))
      reject(
        409,
        "TEAM_NOT_AT_RECEPTION",
        "Présente-toi physiquement au comptoir de la réception de l’Académie.",
      );
    if (this.candidateByKey(key) || this.teamOfKey(key))
      reject(409, "TEAM_ALREADY_CANDIDATE", "Ta candidature est déjà déposée.");
    // Le niveau affiché est le niveau durable du compte, jamais le niveau
    // choisi pour un duel de test.
    const stored = await this.db
      .prepare("SELECT level FROM player_progress WHERE user_id=?")
      .get(peer.id);
    const level = Math.max(1, Number(stored?.level) || Number(peer.combatLevel) || 1);
    const name = String(peer.name || "Genin").slice(0, 50);
    const clan = String(peer.clan || "Uchiwa");
    const appearance = safeAppearance(peer.appearance);
    // Identité enregistrée par le serveur depuis la session : portrait et nom
    // proviennent de la base, jamais d'un champ choisi par le client.
    await this.db
      .prepare(
        `INSERT INTO team_candidates(key,kind,user_id,name,clan,level,appearance,affinity,style,personality,idle,status,created_at)
         VALUES (?,'player',?,?,?,?,?,?,?,?,?,'recherche',?)`,
      )
      .run(
        key,
        peer.id,
        name,
        clan,
        level,
        JSON.stringify(appearance),
        clanAffinity(clan),
        "",
        "",
        "",
        this.now(),
      );
    await this.audit(peer.id, "team_apply", { key });
  }

  async withdrawAction(peer, key) {
    const own = this.candidateByKey(key);
    if (!own)
      reject(409, "TEAM_NOT_CANDIDATE", "Tu n’as aucune candidature à retirer.");
    const team = this.teamOfKey(key);
    if (team && team.status === "official")
      reject(
        409,
        "TEAM_OFFICIAL",
        "Ton équipe est officielle : la dissolution n’existe pas encore.",
      );
    if (team) {
      await this.db.prepare("DELETE FROM team_members WHERE team_id=? AND key=?").run(team.id, key);
      await this.removeTeamIfEmpty(team, key);
    }
    await this.db.prepare("DELETE FROM team_invites WHERE to_key=? OR from_key=?").run(key, key);
    await this.db.prepare("DELETE FROM team_candidates WHERE key=?").run(key);
    await this.audit(peer.id, "team_withdraw", { key });
  }

  async inviteAction(peer, key, targetKey) {
    if (!atReception(peer))
      reject(
        409,
        "TEAM_NOT_AT_RECEPTION",
        "Les invitations se déposent au comptoir de la réception.",
      );
    if (!/^[pn][A-Za-z0-9_-]{1,23}$/.test(targetKey) || targetKey === key)
      reject(400, "TEAM_TARGET_INVALID", "Candidat visé invalide.");
    const own = this.candidateByKey(key);
    if (!own)
      reject(409, "TEAM_NOT_CANDIDATE", "Dépose d’abord ta candidature.");
    const target = this.candidateByKey(targetKey);
    if (!target)
      reject(409, "TEAM_TARGET_UNKNOWN", "Ce candidat n’existe pas ou s’est retiré.");
    if (this.teamOfKey(targetKey))
      reject(409, "TEAM_TARGET_BUSY", "Ce candidat fait déjà partie d’un groupe.");
    // Invitations doubles incompatibles : une seule invitation en attente par
    // destinataire, et jamais d'invitation croisée simultanée.
    if (this.pendingInvitesFor(targetKey).length > 0)
      reject(
        409,
        "TEAM_INVITE_CONFLICT",
        "Ce candidat a déjà une invitation en attente.",
      );
    if (this.invites.some((row) => row.from_key === targetKey && row.to_key === key))
      reject(
        409,
        "TEAM_INVITE_CONFLICT",
        "Ce candidat vient de t’inviter : réponds d’abord à son invitation.",
      );
    let team = this.teamOfKey(key);
    if (team && team.status === "official")
      reject(409, "TEAM_OFFICIAL", "Ton équipe est déjà officielle.");
    if (!team) {
      await this.db
        .prepare("INSERT INTO teams(number,status,created_at) VALUES (NULL,'forming',?)")
        .run(this.now());
      const row = await this.db.prepare("SELECT MAX(id) AS id FROM teams").get();
      if (!row?.id) reject(500, "TEAM_DB", "Création du groupe impossible.");
      team = { id: Number(row.id) };
      await this.db
        .prepare("INSERT INTO team_members(team_id,key,accepted_at) VALUES (?,?,?)")
        .run(team.id, key, this.now());
      await this.db
        .prepare("UPDATE team_candidates SET status='groupe' WHERE key=?")
        .run(key);
    }
    // Le plafond de trois est compté en base, dans la transaction : deux
    // invitations simultanées ne peuvent jamais produire un quatrième membre.
    if ((await this.countMembers(team.id)) + 1 > TEAM_MAX_MEMBERS)
      reject(409, "TEAM_FULL", "Une équipe ne dépasse jamais trois membres.");
    if (target.kind === "npc") {
      // Vivier PNJ : acceptation immédiate, uniquement quand le PNJ est encore
      // en recherche. C'est le complément rare, jamais la règle.
      await this.db
        .prepare("INSERT INTO team_members(team_id,key,accepted_at) VALUES (?,?,?)")
        .run(team.id, targetKey, this.now());
      await this.db
        .prepare("UPDATE team_candidates SET status='groupe' WHERE key=?")
        .run(targetKey);
    } else {
      await this.db
        .prepare(
          "INSERT INTO team_invites(team_id,from_key,to_key,created_at) VALUES (?,?,?,?)",
        )
        .run(team.id, key, targetKey, this.now());
    }
    await this.audit(peer.id, "team_invite", { teamId: team.id, targetKey });
  }

  async acceptAction(peer, key) {
    const invite = this.pendingInvitesFor(key)[0];
    if (!invite)
      reject(409, "TEAM_NO_INVITE", "Aucune invitation en attente pour toi.");
    if (this.teamOfKey(key))
      reject(409, "TEAM_ALREADY_MEMBER", "Tu fais déjà partie d’un groupe.");
    const team = this.teams.find((row) => Number(row.id) === Number(invite.team_id));
    if (!team || team.status !== "forming") {
      await this.db.prepare("DELETE FROM team_invites WHERE to_key=?").run(key);
      reject(409, "TEAM_INVITE_STALE", "Cette invitation n’est plus valable.");
    }
    if ((await this.countMembers(team.id)) + 1 > TEAM_MAX_MEMBERS) {
      await this.db.prepare("DELETE FROM team_invites WHERE to_key=?").run(key);
      reject(409, "TEAM_FULL", "Le groupe est déjà complet à trois.");
    }
    await this.db
      .prepare("INSERT INTO team_members(team_id,key,accepted_at) VALUES (?,?,?)")
      .run(team.id, key, this.now());
    await this.db.prepare("DELETE FROM team_invites WHERE to_key=?").run(key);
    await this.db
      .prepare("UPDATE team_candidates SET status='groupe' WHERE key=?")
      .run(key);
    await this.audit(peer.id, "team_accept", { teamId: team.id });
  }

  async declineAction(peer, key) {
    const invite = this.pendingInvitesFor(key)[0];
    if (!invite)
      reject(409, "TEAM_NO_INVITE", "Aucune invitation en attente pour toi.");
    await this.db.prepare("DELETE FROM team_invites WHERE to_key=?").run(key);
    await this.audit(peer.id, "team_decline", { teamId: invite.team_id });
  }

  async formAction(peer, key) {
    if (!atReception(peer))
      reject(
        409,
        "TEAM_NOT_AT_RECEPTION",
        "La validation officielle se fait au comptoir de la réception.",
      );
    const team = this.teamOfKey(key);
    if (!team)
      reject(409, "TEAM_NOT_CANDIDATE", "Tu n’as ni candidature ni groupe actif.");
    if (team.status === "official")
      reject(409, "TEAM_OFFICIAL", "Ton équipe est déjà officielle.");
    const memberRows = this.members.filter(
      (row) => Number(row.team_id) === Number(team.id),
    );
    const members = memberRows.map((row) => this.candidateByKey(row.key));
    if (memberRows.length !== TEAM_MAX_MEMBERS || members.some((row) => !row))
      reject(
        409,
        "TEAM_INCOMPLETE",
        `Un groupe de ${memberRows.length} reste provisoire : une équipe officielle compte exactement trois membres.`,
      );
    // 1. Le numéro unique est attribué AVANT le choix du Sensei. Jamais
    //    réutilisé : les équipes officielles restent en base pour toujours.
    const maxRow = await this.db
      .prepare("SELECT COALESCE(MAX(number),0) AS max FROM teams WHERE number IS NOT NULL")
      .get();
    const number = Number(maxRow?.max || 0) + 1;
    // 2. Sensei distinct : Daichi Kurogane imposé à l'Équipe 001 ; ensuite le
    //    Sensei libre le moins affecté ; réutilisation maîtrisée (jamais le
    //    même Sensei sur deux créations simultanées) quand le vivier est épuisé.
    const assigned = new Map();
    for (const row of this.teams)
      if (row.status === "official" && row.sensei_id)
        assigned.set(row.sensei_id, (assigned.get(row.sensei_id) || 0) + 1);
    const recent = this.teams
      .filter(
        (row) =>
          row.status === "official" &&
          row.sensei_id &&
          Number(row.ceremony_at) > this.now() - SENSEI_CEREMONY_WINDOW_MS,
      )
      .map((row) => row.sensei_id);
    let pool = TEAM_SENSEI.filter((item) => !assigned.has(item.id));
    if (!pool.length) pool = TEAM_SENSEI.filter((item) => !recent.includes(item.id));
    if (!pool.length) pool = [...TEAM_SENSEI];
    // Réutilisation maîtrisée : le moins affecté d'abord, puis celui dont la
    // dernière cérémonie est la plus ancienne — jamais le même Sensei sur deux
    // créations qui se suivent dans la fenêtre de cérémonie.
    const lastCeremony = new Map();
    for (const row of this.teams)
      if (row.status === "official" && row.sensei_id)
        lastCeremony.set(
          row.sensei_id,
          Math.max(lastCeremony.get(row.sensei_id) || 0, Number(row.ceremony_at) || 0),
        );
    pool = [...pool].sort(
      (a, b) =>
        (assigned.get(a.id) || 0) - (assigned.get(b.id) || 0) ||
        (lastCeremony.get(a.id) || 0) - (lastCeremony.get(b.id) || 0),
    );
    const sensei = number === 1 && !assigned.has("daichi") ? TEAM_SENSEI[0] : pool[0];
    const p = peer.state.p;
    const updated = await this.db
      .prepare(
        `UPDATE teams SET number=?,status='official',sensei_id=?,ceremony_at=?,ceremony_x=?,ceremony_z=?
         WHERE id=? AND status='forming'`,
      )
      .run(number, sensei.id, this.now(), Number(p[0]), Number(p[2]), team.id);
    if (Number(updated.changes || 0) !== 1)
      reject(409, "TEAM_FORM_RACE", "Le groupe a changé entre-temps : réessaie à la réception.");
    for (const row of members)
      await this.db
        .prepare("UPDATE team_candidates SET status='groupe' WHERE key=?")
        .run(row.key);
    await this.db
      .prepare("DELETE FROM team_invites WHERE team_id=?")
      .run(team.id);
    await this.audit(peer.id, "team_formed", {
      teamId: team.id,
      number,
      sensei: sensei.id,
      members: members.map((row) => row.key),
    });
  }

  async removeTeamIfEmpty(team, withdrawnKey) {
    const remaining = await this.db
      .prepare("SELECT key FROM team_members WHERE team_id=?")
      .all(team.id);
    if (remaining.length === 0) {
      await this.db.prepare("DELETE FROM team_invites WHERE team_id=?").run(team.id);
      await this.db.prepare("DELETE FROM teams WHERE id=? AND status='forming'").run(team.id);
    } else {
      // Un groupe réduit à un ou deux membres reste un groupe provisoire :
      // jamais officiel, ses membres gardent leur candidature.
      await this.db
        .prepare("DELETE FROM team_invites WHERE team_id=? AND to_key=?")
        .run(team.id, withdrawnKey);
    }
  }

  async audit(actor, action, detail) {
    try {
      await this.db
        .prepare("INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)")
        .run(actor, action, actor, JSON.stringify(detail));
    } catch {
      // L'audit ne bloque jamais une action valide.
    }
  }
}

// Affinité affichée sur la fiche candidat : dérivée du clan côté serveur,
// jamais saisie par le client.
export function clanAffinity(clan) {
  const table = {
    Uchiwa: "Katon",
    Senju: "Suiton",
    Hyuga: "Raiton",
    Nara: "Doton",
    Yamanaka: "Fūton",
    Inuzuka: "Doton",
    Aburame: "Fūton",
    Akimichi: "Doton",
    Uzumaki: "Suiton",
    Ackerman: "Raiton",
  };
  return table[String(clan)] || "Taijutsu";
}

// Profil HTTP (/api/game/profile) : état durable de la candidature/équipe du
// joueur, sans la liste des candidats (elle exige la présence à la réception).
export async function teamStateForUser(db, userId) {
  const clan = await db
    .prepare("SELECT status,reward_claimed FROM clan_missions WHERE user_id=?")
    .get(userId);
  const unlocked =
    Boolean(clan) && clan.status === "COMPLETED" && Number(clan.reward_claimed) === 1;
  if (!unlocked)
    return {
      schemaVersion: TEAM_SCHEMA,
      unlocked: false,
      message: "Termine la deuxième mission de clan pour ouvrir l’Académie et les candidatures.",
      self: null,
      team: null,
    };
  const service = new TeamService(db);
  await service.load();
  const key = playerKey(userId);
  const own = service.candidateByKey(key);
  const team = service.teamOfKey(key);
  return {
    schemaVersion: TEAM_SCHEMA,
    unlocked: true,
    message: team
      ? team.status === "official"
        ? `Équipe officielle : ${team.number ? `ÉQUIPE ${pad3(team.number)}` : "complète"}.`
        : "Groupe en formation."
      : own
        ? "Candidature déposée."
        : "Aucune candidature active.",
    self: own ? service.publicCandidate(own) : null,
    team: service.publicTeam(team),
  };
}
