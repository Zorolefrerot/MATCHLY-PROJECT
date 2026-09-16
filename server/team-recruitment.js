import { transaction } from "./store.js";

export const ACADEMY_SCHEMA = 1;
export const TEAM_SIZE = 3;
export const TEAM_RECRUITMENT_TEST_MODE =
  process.env.TEAM_RECRUITMENT_TEST_MODE === undefined
    ? true
    : process.env.TEAM_RECRUITMENT_TEST_MODE === "true";
export const ACADEMY_RECEPTION = Object.freeze([-34, 0.55, 12]);
export const ACADEMY_RECEPTION_RADIUS = 7.0;

const npc = (
  id,
  name,
  level,
  clan,
  affinity,
  style,
  personality,
  portraitId,
  appearance,
) =>
  Object.freeze({
    id,
    name,
    level,
    clan,
    affinity,
    style,
    personality,
    portraitId,
    appearance: Object.freeze(appearance),
  });

export const NPC_CANDIDATES = Object.freeze([
  npc(
    "kaito",
    "Kaito",
    8,
    "Senju",
    "Suiton",
    "Soutien défensif",
    "Calme et attentif, Kaito protège ses équipiers avant de contre-attaquer.",
    "academy-npc-kaito-v1",
    {
      model: 0,
      hair: 2,
      hair_color: 6,
      eyes: 2,
      skin: 1,
      top: 1,
      top_color: 5,
      bottom: 1,
      bottom_color: 4,
    },
  ),
  npc(
    "renji",
    "Renji",
    9,
    "Hyūga",
    "Raiton",
    "Reconnaissance et combat rapproché",
    "Concentré et rapide, Renji repère les ouvertures avant les autres.",
    "academy-npc-renji-v1",
    {
      model: 1,
      hair: 1,
      hair_color: 3,
      eyes: 4,
      skin: 0,
      top: 2,
      top_color: 3,
      bottom: 2,
      bottom_color: 1,
    },
  ),
  npc(
    "mina",
    "Mina",
    7,
    "Yamanaka",
    "Fūton",
    "Perception et contrôle",
    "Mina observe longtemps et désorganise le terrain au bon moment.",
    "academy-npc-mina-v1",
    {
      model: 1,
      hair: 3,
      hair_color: 7,
      eyes: 3,
      skin: 2,
      top: 0,
      top_color: 7,
      bottom: 0,
      bottom_color: 2,
    },
  ),
  npc(
    "sora",
    "Sora",
    8,
    "Inuzuka",
    "Doton",
    "Vitesse et reconnaissance",
    "Sora préfère les détours, les pistes et les attaques éclairs.",
    "academy-npc-sora-v1",
    {
      model: 0,
      hair: 1,
      hair_color: 1,
      eyes: 5,
      skin: 3,
      top: 2,
      top_color: 4,
      bottom: 2,
      bottom_color: 1,
    },
  ),
]);

export const SENSEIS = Object.freeze([
  {
    id: "daichi_kurogane",
    name: "Daichi Kurogane",
    title: "Sensei Daichi Kurogane",
    style: "Défense disciplinée",
    personality: "Calme, observateur, exigeant et protecteur.",
    dialogue:
      "Vous êtes donc les membres de l’équipe {team}. Je suis Daichi Kurogane. À partir d’aujourd’hui, je serai votre Sensei. Apprenez à vous connaître. Une équipe ne repose pas uniquement sur la force de ses membres : elle repose sur votre capacité à combattre ensemble.",
    portraitId: "sensei-daichi-kurogane-v1",
    appearance: {
      model: 0,
      hair: 3,
      hair_color: 5,
      eyes: 4,
      skin: 3,
      top: 0,
      top_color: 4,
      bottom: 1,
      bottom_color: 1,
    },
  },
  {
    id: "ayame_shirogane",
    name: "Ayame Shirogane",
    title: "Sensei Ayame Shirogane",
    style: "Tactique et vitesse",
    personality: "Directe, vive et attentive aux détails.",
    dialogue:
      "Équipe {team}, observez avant d’agir. La vitesse ne sert à rien si personne ne sait où regarder. Je suis Ayame Shirogane, votre Sensei.",
    portraitId: "sensei-ayame-shirogane-v1",
    appearance: {
      model: 1,
      hair: 2,
      hair_color: 5,
      eyes: 2,
      skin: 1,
      top: 0,
      top_color: 4,
      bottom: 0,
      bottom_color: 1,
    },
  },
  {
    id: "genzo_arakawa",
    name: "Genzō Arakawa",
    title: "Sensei Genzō Arakawa",
    style: "Offensive et corps à corps",
    personality: "Énergique, franc et encourageant.",
    dialogue:
      "Équipe {team}, vous apprendrez à avancer sans vous gêner. Je suis Genzō Arakawa. Votre force commence par votre confiance mutuelle.",
    portraitId: "sensei-genzo-arakawa-v1",
    appearance: {
      model: 0,
      hair: 0,
      hair_color: 4,
      eyes: 0,
      skin: 2,
      top: 2,
      top_color: 3,
      bottom: 0,
      bottom_color: 1,
    },
  },
  {
    id: "natsumi_hoshikawa",
    name: "Natsumi Hoshikawa",
    title: "Sensei Natsumi Hoshikawa",
    style: "Soutien, perception et coordination",
    personality: "Patiente, précise et rassurante.",
    dialogue:
      "Équipe {team}, coordonnez vos regards avant vos techniques. Je suis Natsumi Hoshikawa, et je vous aiderai à trouver votre rythme.",
    portraitId: "sensei-natsumi-hoshikawa-v1",
    appearance: {
      model: 1,
      hair: 0,
      hair_color: 2,
      eyes: 3,
      skin: 2,
      top: 1,
      top_color: 2,
      bottom: 1,
      bottom_color: 4,
    },
  },
]);

const npcById = (id) => NPC_CANDIDATES.find((value) => value.id === id) || null;
const senseiById = (id) => SENSEIS.find((value) => value.id === id) || null;
const time = () => new Date().toISOString();
const reject = (code, message, status = 409) => {
  throw Object.assign(new Error(message), { gameCode: code, status });
};
const distanceToReception = (position) =>
  Array.isArray(position) && position.length === 3
    ? Math.hypot(
        Number(position[0]) - ACADEMY_RECEPTION[0],
        Number(position[2]) - ACADEMY_RECEPTION[2],
      )
    : Infinity;
const parseAppearance = (value) => {
  if (!value) return null;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

function npcProfile(value, status = "AVAILABLE") {
  return {
    key: `npc:${value.id}`,
    kind: "npc",
    id: value.id,
    name: value.name,
    level: value.level,
    clan: value.clan,
    affinity: value.affinity,
    style: value.style,
    personality: value.personality,
    portraitId: value.portraitId,
    appearance: value.appearance,
    status,
  };
}

function senseiProfile(value, teamNumber) {
  return {
    ...npcProfile(
      { ...value, level: 1, clan: "Sensei", affinity: "Chakra" },
      "SENSEI",
    ),
    title: value.title,
    dialogue: value.dialogue.replace("{team}", String(teamNumber)),
  };
}

function playerProfile(row, status = "AVAILABLE") {
  const id = Number(row.id || row.user_id || row.user_profile_id);
  const appearance = parseAppearance(row.appearance);
  return {
    key: `player:${id}`,
    kind: "player",
    id,
    name: String(row.name || "Genin"),
    level: Math.max(0, Number(row.level || 0)),
    clan: row.clan || "Sans clan attribué",
    affinity: row.affinity || "Chakra",
    style: row.style || "Style personnel",
    portraitId: `player-${id}-v${Number(row.appearance_revision || 0)}`,
    appearance,
    status,
  };
}

function memberProfile(row) {
  const accepted = row.accepted === undefined || Number(row.accepted) === 1;
  if (row.npc_id)
    return npcProfile(
      npcById(row.npc_id) || NPC_CANDIDATES[0],
      accepted ? "GROUP" : "PENDING",
    );
  return playerProfile(
    { ...row, id: row.user_profile_id || row.user_id || row.id },
    accepted ? "GROUP" : "PENDING",
  );
}

export function validAcademyAction(value) {
  if (!value || typeof value !== "object" || value.type !== "academy_action")
    return false;
  if (
    ![
      "refresh",
      "apply",
      "withdraw",
      "invite",
      "accept_invite",
      "decline_invite",
      "confirm_team",
    ].includes(value.action)
  )
    return false;
  const expected = ["type", "action"];
  if (value.action === "invite") {
    if (typeof value.targetKey !== "string" || value.targetKey.length > 80)
      return false;
    expected.push("targetKey");
  }
  if (["accept_invite", "decline_invite"].includes(value.action)) {
    if (!Number.isSafeInteger(value.inviteId)) return false;
    expected.push("inviteId");
  }
  const keys = Object.keys(value).sort();
  const sortedExpected = expected.sort();
  return (
    keys.length === sortedExpected.length &&
    keys.every((key, index) => key === sortedExpected[index])
  );
}

export class TeamRecruitmentService {
  constructor(db) {
    this.db = db;
    this.onChange = null;
  }

  async unlocked(userId) {
    const row = await this.db
      .prepare(
        "SELECT status,reward_claimed FROM clan_missions WHERE user_id=?",
      )
      .get(userId);
    return (
      row?.status === "COMPLETED" && Number(row?.reward_claimed || 0) === 1
    );
  }

  async playerRow(userId) {
    return this.db
      .prepare(
        `SELECT u.id,a.character AS name,l.clan,l.affinity,ca.appearance,ca.revision AS appearance_revision,COALESCE(pp.level,0) AS level
         FROM users u JOIN applications a ON a.user_id=u.id AND a.status='accepted'
         LEFT JOIN allocations l ON l.user_id=u.id
         LEFT JOIN character_appearances ca ON ca.user_id=u.id
         LEFT JOIN player_progress pp ON pp.user_id=u.id
         WHERE u.id=? AND u.role='player'`,
      )
      .get(userId);
  }

  async groupFor(userId) {
    return this.db
      .prepare(
        `SELECT g.id,g.owner_user_id,g.status,gm.member_order,gm.user_id,gm.npc_id,gm.accepted,gm.portrait_id,
                u.id AS user_profile_id,a.character AS name,l.clan,l.affinity,ca.appearance,ca.revision AS appearance_revision,COALESCE(pp.level,0) AS level
         FROM academy_groups g JOIN academy_group_members gm ON gm.group_id=g.id
         LEFT JOIN users u ON u.id=gm.user_id
         LEFT JOIN applications a ON a.user_id=gm.user_id
         LEFT JOIN allocations l ON l.user_id=gm.user_id
         LEFT JOIN character_appearances ca ON ca.user_id=gm.user_id
         LEFT JOIN player_progress pp ON pp.user_id=gm.user_id
         WHERE g.status='FORMING' AND (g.owner_user_id=? OR gm.user_id=?) ORDER BY gm.member_order`,
      )
      .all(userId, userId);
  }

  async teamFor(userId) {
    return this.db
      .prepare(
        `SELECT t.id,t.team_number,t.sensei_id,t.status,tm.member_order,tm.user_id,tm.npc_id,tm.portrait_id,
                u.id AS user_profile_id,a.character AS name,l.clan,l.affinity,ca.appearance,ca.revision AS appearance_revision,COALESCE(pp.level,0) AS level
         FROM academy_teams t JOIN academy_team_members tm ON tm.team_id=t.id
         LEFT JOIN users u ON u.id=tm.user_id
         LEFT JOIN applications a ON a.user_id=tm.user_id
         LEFT JOIN allocations l ON l.user_id=tm.user_id
         LEFT JOIN character_appearances ca ON ca.user_id=tm.user_id
         LEFT JOIN player_progress pp ON pp.user_id=tm.user_id
         WHERE t.status='ACTIVE' AND EXISTS (SELECT 1 FROM academy_team_members mine WHERE mine.team_id=t.id AND mine.user_id=?)
         ORDER BY tm.member_order`,
      )
      .all(userId);
  }

  async candidatesFor(userId, groupRows = []) {
    const rows = await this.db
      .prepare(
        `SELECT u.id,a.character AS name,l.clan,l.affinity,ca.appearance,ca.revision AS appearance_revision,COALESCE(pp.level,0) AS level
         FROM academy_candidates c JOIN users u ON u.id=c.user_id
         JOIN applications a ON a.user_id=u.id AND a.status='accepted'
         LEFT JOIN allocations l ON l.user_id=u.id
         LEFT JOIN character_appearances ca ON ca.user_id=u.id
         LEFT JOIN player_progress pp ON pp.user_id=u.id
         WHERE c.status='AVAILABLE'
           AND c.user_id<>?
           AND NOT EXISTS (SELECT 1 FROM academy_team_members tm WHERE tm.user_id=c.user_id)
           AND NOT EXISTS (SELECT 1 FROM academy_group_members gm JOIN academy_groups g ON g.id=gm.group_id AND g.status='FORMING' WHERE gm.user_id=c.user_id)
         ORDER BY c.updated,c.user_id`,
      )
      .all(userId);
    const result = rows.map((row) => playerProfile(row));
    const realCount = result.length;
    const usedNpc = new Set(
      groupRows.filter((row) => row.npc_id).map((row) => row.npc_id),
    );
    if (TEAM_RECRUITMENT_TEST_MODE || realCount < 2) {
      const limit = TEAM_RECRUITMENT_TEST_MODE ? 2 : Math.max(0, 2 - realCount);
      for (const value of NPC_CANDIDATES) {
        if (result.length >= realCount + limit) break;
        if (usedNpc.has(value.id)) continue;
        result.push(npcProfile(value));
      }
    }
    return result;
  }

  async invitationsFor(userId) {
    const rows = await this.db
      .prepare(
        `SELECT i.id,i.group_id,i.inviter_user_id,i.created,u.id AS user_profile_id,a.character AS name,l.clan,l.affinity,ca.appearance,ca.revision AS appearance_revision,COALESCE(pp.level,0) AS level
         FROM academy_invitations i JOIN users u ON u.id=i.inviter_user_id
         JOIN applications a ON a.user_id=u.id LEFT JOIN allocations l ON l.user_id=u.id
         LEFT JOIN character_appearances ca ON ca.user_id=u.id LEFT JOIN player_progress pp ON pp.user_id=u.id
         WHERE i.invitee_user_id=? AND i.status='PENDING' ORDER BY i.created`,
      )
      .all(userId);
    return rows.map((row) => ({
      id: Number(row.id),
      groupId: Number(row.group_id),
      from: playerProfile({ ...row, id: row.user_profile_id }, "INVITATION"),
      created: row.created,
    }));
  }

  async stateForPeer(peer) {
    const unlocked = await this.unlocked(peer.id);
    peer.academyUnlocked = unlocked;
    if (!unlocked)
      return {
        schemaVersion: ACADEMY_SCHEMA,
        unlocked: false,
        candidates: [],
        group: null,
        invitations: [],
        team: null,
        message:
          "L’Académie des équipes se débloque après la mission 2 et sa récompense.",
      };
    const [groupRows, teamRows, invitations] = await Promise.all([
      this.groupFor(peer.id),
      this.teamFor(peer.id),
      this.invitationsFor(peer.id),
    ]);
    const group = groupRows.length
      ? {
          id: Number(groupRows[0].id),
          ownerId: Number(groupRows[0].owner_user_id),
          status: "FORMING",
          members: groupRows.map(memberProfile),
        }
      : null;
    const team = teamRows.length
      ? {
          id: Number(teamRows[0].id),
          teamNumber: Number(teamRows[0].team_number),
          status: teamRows[0].status,
          sensei: senseiProfile(
            senseiById(teamRows[0].sensei_id) || SENSEIS[0],
            Number(teamRows[0].team_number),
          ),
          members: teamRows.map(memberProfile),
        }
      : null;
    const candidates = team ? [] : await this.candidatesFor(peer.id, groupRows);
    const own = await this.db
      .prepare("SELECT status FROM academy_candidates WHERE user_id=?")
      .get(peer.id);
    return {
      schemaVersion: ACADEMY_SCHEMA,
      unlocked: true,
      candidates,
      candidate: own ? { status: own.status } : null,
      group,
      invitations,
      team,
      message: "Présente-toi à la réception pour former une équipe de trois.",
    };
  }

  async requireReception(peer) {
    if (!peer || distanceToReception(peer.state?.p) > ACADEMY_RECEPTION_RADIUS)
      reject("ACADEMY_TOO_FAR", "Approche-toi de la réception de l’Académie.");
    if (!(await this.unlocked(peer.id)))
      reject(
        "ACADEMY_LOCKED",
        "Termine la mission 2 et récupère sa récompense avant de former une équipe.",
        403,
      );
  }

  async ensureCandidate(peer) {
    const existing = await this.db
      .prepare("SELECT status FROM academy_candidates WHERE user_id=?")
      .get(peer.id);
    if (!existing) {
      await this.db
        .prepare(
          "INSERT INTO academy_candidates(user_id,status,updated) VALUES (?,?,?)",
        )
        .run(peer.id, "AVAILABLE", time());
    }
  }

  async withdraw(peer) {
    if ((await this.teamFor(peer.id)).length)
      reject(
        "ACADEMY_ALREADY_TEAM",
        "Une équipe officielle ne peut pas être quittée ici.",
      );
    const rows = await this.groupFor(peer.id);
    if (rows.length) {
      const groupId = Number(rows[0].id);
      const owner = Number(rows[0].owner_user_id) === Number(peer.id);
      if (
        owner &&
        rows.some(
          (row) => row.user_id && Number(row.user_id) !== Number(peer.id),
        )
      )
        reject(
          "ACADEMY_GROUP_LOCKED",
          "Le responsable ne peut pas dissoudre un groupe avec d’autres joueurs.",
        );
      if (owner) {
        await this.db
          .prepare("DELETE FROM academy_groups WHERE id=?")
          .run(groupId);
      } else {
        await this.db
          .prepare(
            "DELETE FROM academy_group_members WHERE group_id=? AND user_id=?",
          )
          .run(groupId, peer.id);
        const remaining = await this.db
          .prepare(
            "SELECT 1 FROM academy_group_members WHERE group_id=? LIMIT 1",
          )
          .get(groupId);
        if (!remaining)
          await this.db
            .prepare("DELETE FROM academy_groups WHERE id=?")
            .run(groupId);
      }
    }
    await this.db
      .prepare(
        "UPDATE academy_invitations SET status='CANCELLED' WHERE invitee_user_id=? AND status='PENDING'",
      )
      .run(peer.id);
    await this.db
      .prepare("DELETE FROM academy_candidates WHERE user_id=?")
      .run(peer.id);
  }

  async action(peer, message) {
    if (!validAcademyAction(message))
      reject("INVALID_ACADEMY_ACTION", "Action d’Académie invalide.", 400);
    if (message.action !== "refresh") await this.requireReception(peer);
    if (message.action === "refresh") return this.stateForPeer(peer);
    await transaction(this.db, async () => {
      if (!(await this.unlocked(peer.id)))
        reject(
          "ACADEMY_LOCKED",
          "Termine la mission 2 et récupère sa récompense avant de former une équipe.",
          403,
        );
      if (message.action === "apply") {
        const team = await this.teamFor(peer.id);
        const group = await this.groupFor(peer.id);
        if (team.length || group.length)
          reject(
            "ACADEMY_ALREADY_GROUPED",
            "Tu appartiens déjà à un groupe ou une équipe.",
          );
        await this.db
          .prepare(
            "INSERT INTO academy_candidates(user_id,status,updated) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET status=excluded.status,updated=excluded.updated",
          )
          .run(peer.id, "AVAILABLE", time());
      } else if (message.action === "withdraw") {
        await this.withdraw(peer);
      } else if (message.action === "invite") {
        await this.invite(peer, message.targetKey);
      } else if (
        message.action === "accept_invite" ||
        message.action === "decline_invite"
      ) {
        await this.answerInvitation(
          peer,
          Number(message.inviteId),
          message.action === "accept_invite",
        );
      } else if (message.action === "confirm_team") {
        await this.confirm(peer);
      }
    });
    this.onChange?.();
    return this.stateForPeer(peer);
  }

  async ensureGroup(peer) {
    const existing = await this.groupFor(peer.id);
    if (existing.length) {
      if (Number(existing[0].owner_user_id) !== Number(peer.id))
        reject(
          "ACADEMY_NOT_OWNER",
          "Seul le responsable du groupe peut inviter.",
        );
      return Number(existing[0].id);
    }
    await this.ensureCandidate(peer);
    const result = await this.db
      .prepare(
        "INSERT INTO academy_groups(owner_user_id,status,created) VALUES (?,?,?)",
      )
      .run(peer.id, "FORMING", time());
    const groupId = Number(result.lastInsertRowid);
    const row = await this.playerRow(peer.id);
    await this.db
      .prepare(
        "INSERT INTO academy_group_members(group_id,member_order,user_id,accepted,portrait_id) VALUES (?,?,?,?,?)",
      )
      .run(groupId, 0, peer.id, 1, playerProfile(row).portraitId);
    await this.db
      .prepare(
        "UPDATE academy_candidates SET status='FORMING',updated=? WHERE user_id=?",
      )
      .run(time(), peer.id);
    return groupId;
  }

  async invite(peer, targetKey) {
    const groupId = await this.ensureGroup(peer);
    const rows = await this.groupFor(peer.id);
    if (rows.length >= TEAM_SIZE)
      reject(
        "ACADEMY_GROUP_FULL",
        "Le groupe temporaire contient déjà trois membres.",
      );
    const [kind, rawId] = String(targetKey).split(":");
    if (kind === "npc") {
      const value = npcById(rawId);
      if (!value || (!TEAM_RECRUITMENT_TEST_MODE && rawId !== "kaito"))
        reject(
          "ACADEMY_NPC_UNAVAILABLE",
          "Ce candidat PNJ n’est pas disponible.",
        );
      if (rows.some((row) => row.npc_id === rawId))
        reject(
          "ACADEMY_ALREADY_INVITED",
          "Ce candidat est déjà dans le groupe.",
        );
      await this.db
        .prepare(
          "INSERT INTO academy_group_members(group_id,member_order,npc_id,accepted,portrait_id) VALUES (?,?,?,?,?)",
        )
        .run(groupId, rows.length, rawId, 1, value.portraitId);
      return;
    }
    const userId = Number(rawId);
    if (
      kind !== "player" ||
      !Number.isSafeInteger(userId) ||
      userId === Number(peer.id)
    )
      reject("ACADEMY_TARGET_INVALID", "Candidat invalide.");
    const target = await this.db
      .prepare("SELECT status FROM academy_candidates WHERE user_id=?")
      .get(userId);
    if (!target || target.status !== "AVAILABLE")
      reject("ACADEMY_NOT_AVAILABLE", "Ce joueur n’est plus disponible.");
    const existingGroup = await this.groupFor(userId);
    const existingTeam = await this.teamFor(userId);
    if (existingGroup.length || existingTeam.length)
      reject("ACADEMY_ALREADY_GROUPED", "Ce joueur est déjà dans un groupe.");
    const pending = await this.db
      .prepare(
        "SELECT id FROM academy_invitations WHERE invitee_user_id=? AND status='PENDING'",
      )
      .get(userId);
    if (pending)
      reject(
        "ACADEMY_INVITE_PENDING",
        "Ce joueur a déjà une invitation en attente.",
      );
    await this.db
      .prepare(
        "INSERT INTO academy_invitations(group_id,inviter_user_id,invitee_user_id,status,created) VALUES (?,?,?,?,?)",
      )
      .run(groupId, peer.id, userId, "PENDING", time());
  }

  async answerInvitation(peer, inviteId, accept) {
    const invitation = await this.db
      .prepare(
        "SELECT * FROM academy_invitations WHERE id=? AND invitee_user_id=? AND status='PENDING'",
      )
      .get(inviteId, peer.id);
    if (!invitation)
      reject(
        "ACADEMY_INVITE_INVALID",
        "Cette invitation n’est plus disponible.",
      );
    if (!accept) {
      await this.db
        .prepare("UPDATE academy_invitations SET status='DECLINED' WHERE id=?")
        .run(inviteId);
      return;
    }
    const rows = await this.groupFor(invitation.inviter_user_id);
    if (!rows.length)
      reject(
        "ACADEMY_INVITE_INVALID",
        "Le groupe de cette invitation n’existe plus.",
      );
    if (rows.length >= TEAM_SIZE || rows.some((row) => row.user_id === peer.id))
      reject("ACADEMY_GROUP_FULL", "Ce groupe est déjà complet.");
    if (
      (await this.teamFor(peer.id)).length ||
      (await this.groupFor(peer.id)).length
    )
      reject("ACADEMY_ALREADY_GROUPED", "Tu appartiens déjà à un groupe.");
    const candidate = await this.db
      .prepare("SELECT status FROM academy_candidates WHERE user_id=?")
      .get(peer.id);
    if (!candidate || candidate.status !== "AVAILABLE")
      reject(
        "ACADEMY_NOT_AVAILABLE",
        "Cette candidature n’est plus disponible.",
      );
    const profile = await this.playerRow(peer.id);
    await this.db
      .prepare("UPDATE academy_invitations SET status='ACCEPTED' WHERE id=?")
      .run(inviteId);
    await this.db
      .prepare(
        "INSERT INTO academy_group_members(group_id,member_order,user_id,accepted,portrait_id) VALUES (?,?,?,?,?)",
      )
      .run(
        invitation.group_id,
        rows.length,
        peer.id,
        1,
        playerProfile(profile).portraitId,
      );
    await this.db
      .prepare(
        "UPDATE academy_candidates SET status='FORMING',updated=? WHERE user_id=?",
      )
      .run(time(), peer.id);
  }

  async confirm(peer) {
    const rows = await this.groupFor(peer.id);
    if (!rows.length || Number(rows[0].owner_user_id) !== Number(peer.id))
      reject(
        "ACADEMY_NOT_OWNER",
        "Le responsable du groupe doit confirmer l’équipe.",
      );
    if (
      rows.length !== TEAM_SIZE ||
      rows.some((row) => Number(row.accepted) !== 1)
    )
      reject(
        "ACADEMY_INCOMPLETE",
        "Les trois membres doivent accepter avant la création.",
      );
    for (const row of rows) {
      if (row.user_id && (await this.teamFor(row.user_id)).length)
        reject(
          "ACADEMY_ALREADY_TEAM",
          "Un membre appartient déjà à une équipe.",
        );
    }
    const next = await this.db
      .prepare(
        "SELECT COALESCE(MAX(team_number),0)+1 AS next FROM academy_teams",
      )
      .get();
    const number = Number(next.next || 1);
    const used = await this.db
      .prepare("SELECT sensei_id FROM academy_teams WHERE status='ACTIVE'")
      .all();
    const usedSenseis = new Set(used.map((row) => row.sensei_id));
    const sensei =
      SENSEIS.find((value) => !usedSenseis.has(value.id)) ||
      SENSEIS[(number - 1) % SENSEIS.length];
    const created = await this.db
      .prepare(
        "INSERT INTO academy_teams(team_number,sensei_id,status,created) VALUES (?,?,?,?)",
      )
      .run(number, sensei.id, "ACTIVE", time());
    const teamId = Number(created.lastInsertRowid);
    for (const row of rows)
      await this.db
        .prepare(
          "INSERT INTO academy_team_members(team_id,member_order,user_id,npc_id,portrait_id) VALUES (?,?,?,?,?)",
        )
        .run(
          teamId,
          row.member_order,
          row.user_id || null,
          row.npc_id || null,
          row.portrait_id,
        );
    await this.db
      .prepare("DELETE FROM academy_invitations WHERE group_id=?")
      .run(rows[0].id);
    await this.db
      .prepare("DELETE FROM academy_groups WHERE id=?")
      .run(rows[0].id);
    for (const row of rows)
      if (row.user_id)
        await this.db
          .prepare("DELETE FROM academy_candidates WHERE user_id=?")
          .run(row.user_id);
    await this.db
      .prepare("INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)")
      .run(
        peer.id,
        "academy_team_created",
        peer.id,
        JSON.stringify({ teamNumber: number, sensei: sensei.id }),
      );
  }
}
