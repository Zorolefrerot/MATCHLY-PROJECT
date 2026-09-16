import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { openStore } from "../server/store.js";
import {
  SENSEI_CEREMONY_WINDOW_MS,
  TEAM_MAX_MEMBERS,
  TEAM_NPC_CANDIDATES,
  TEAM_RECEPTION,
  TEAM_RECRUITMENT_TEST_MODE,
  TEAM_SCHEMA,
  TEAM_SENSEI,
  TeamService,
  clanAffinity,
  teamStateForUser,
} from "../server/team-system.js";
import { validAppearance } from "../server/game.js";

const APPEARANCE = {
  model: 0,
  hair: 1,
  hair_color: 3,
  eyes: 2,
  skin: 2,
  top: 0,
  top_color: 5,
  bottom: 0,
  bottom_color: 1,
};
const AT_RECEPTION = [TEAM_RECEPTION.x, 0.55, TEAM_RECEPTION.z];
const FAR_AWAY = [0, 0.55, 78];

async function fixture(playerCount = 2) {
  const dir = mkdtempSync(join(tmpdir(), "idrem-teams-"));
  const db = await openStore(join(dir, "test.sqlite"));
  const users = [];
  const applications = [];
  const clans = [];
  const progress = [];
  for (let id = 1; id <= playerCount; id += 1) {
    users.push(`(${id},'Genin${id}','g${id}@test.invalid','x','player')`);
    applications.push(
      `(${id},'Genin${id}','x','x','x','x','{}','{}',10,'accepted',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    );
    clans.push(
      `(${id},'COMPLETED',20,5,1,CURRENT_TIMESTAMP)`,
    );
    progress.push(
      `(${id},${100 + id},${id + 4},CURRENT_TIMESTAMP)`,
    );
  }
  await db
    .prepare(
      `INSERT INTO users(id,name,email,password,role) VALUES ${users.join(",")}`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score,status,created,updated) VALUES ${applications.join(",")}`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO clan_missions(user_id,status,score,revision,reward_claimed,updated) VALUES ${clans.join(",")}`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO player_progress(user_id,idrem_gold,level,updated) VALUES ${progress.join(",")}`,
    )
    .run();
  let clock = 1_700_000_000_000;
  const service = new TeamService(db, { now: () => clock });
  return {
    db,
    dir,
    service,
    advance: (ms) => {
      clock += ms;
    },
    clock: () => clock,
  };
}

function peer(id, { unlocked = true, p = AT_RECEPTION } = {}) {
  return {
    id,
    name: `Genin${id}`,
    clan: id % 2 === 0 ? "Hyuga" : "Uchiwa",
    appearance: { ...APPEARANCE },
    secondaryUnlocked: unlocked,
    combatLevel: 0,
    state: { p: [...p], yaw: 0, motion: "idle" },
  };
}

const act = (service, p, action, targetKey = "") =>
  service.action(p, { type: "team_action", action, targetKey, revision: 0 });

async function rejection(promise) {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

async function formTeam(service, ids) {
  const [leader, second, third] = ids;
  await act(service, peer(leader), "invite", `p${second}`);
  await act(service, peer(second), "accept");
  if (third !== undefined) {
    await act(service, peer(leader), "invite", `p${third}`);
    await act(service, peer(third), "accept");
  }
  return act(service, peer(leader), "form");
}

test("1. L’Accès suit le déblocage de l’Académie et la présence physique à la réception", async () => {
  const { db, dir, service } = await fixture(2);
  try {
    const locked = peer(1, { unlocked: false });
    const state = service.stateForPeer(locked);
    assert.equal(state.schemaVersion, TEAM_SCHEMA);
    assert.equal(state.unlocked, false);
    assert.equal(state.candidates.length, 0);
    const lockedError = await rejection(act(service, locked, "apply"));
    assert.equal(lockedError.gameCode, "TEAM_LOCKED");

    const far = peer(1, { p: FAR_AWAY });
    const farError = await rejection(act(service, far, "apply"));
    assert.equal(farError.gameCode, "TEAM_NOT_AT_RECEPTION");
    assert.equal(farError.status, 409);

    const applied = await act(service, peer(1), "apply");
    assert.equal(applied.state.unlocked, true);
    assert.equal(applied.state.self.status, "recherche");
    assert.equal(applied.state.nearReception, true);
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("2. Candidature enregistrée côté serveur avec le portrait du compte ; double candidature refusée", async () => {
  const { db, dir, service } = await fixture(2);
  try {
    const applied = await act(service, peer(1), "apply");
    assert.deepEqual(applied.state.self.appearance, APPEARANCE);
    assert.equal(applied.state.self.name, "Genin1");
    assert.equal(applied.state.self.level, 5, "niveau durable lu dans player_progress");
    assert.equal(applied.state.self.affinity, clanAffinity("Uchiwa"));
    const row = await db
      .prepare("SELECT * FROM team_candidates WHERE key='p1'")
      .get();
    assert.equal(row.kind, "player");
    assert.deepEqual(JSON.parse(row.appearance), APPEARANCE);
    const twice = await rejection(act(service, peer(1), "apply"));
    assert.equal(twice.gameCode, "TEAM_ALREADY_CANDIDATE");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("3. Mode test : Kaito et Renji pré-inscrits, portraits uniques, joueurs réels d’abord", async () => {
  const { db, dir, service } = await fixture(2);
  try {
    assert.equal(TEAM_RECRUITMENT_TEST_MODE, true);
    assert.equal(TEAM_NPC_CANDIDATES.length, 2, "petit vivier, jamais une salle remplie de PNJ");
    await act(service, peer(1), "apply");
    const state = service.stateForPeer(peer(2));
    const keys = state.candidates.map((row) => row.key);
    assert.deepEqual(keys, ["p1", "nkaito", "nrenji"], "joueurs réels triés avant les PNJ");
    const kaito = state.candidates.find((row) => row.key === "nkaito");
    const renji = state.candidates.find((row) => row.key === "nrenji");
    assert.equal(kaito.name, "Kaito");
    assert.equal(kaito.level, 8);
    assert.equal(kaito.clan, "Senju");
    assert.equal(kaito.affinity, "Suiton");
    assert.equal(kaito.style, "Soutien défensif");
    assert.equal(renji.name, "Renji");
    assert.equal(renji.level, 9);
    assert.equal(renji.clan, "Hyuga");
    assert.equal(renji.affinity, "Raiton");
    assert.equal(renji.style, "Reconnaissance et combat rapproché");
    assert.ok(validAppearance(kaito.appearance));
    assert.ok(validAppearance(renji.appearance));
    assert.notDeepEqual(kaito.appearance, renji.appearance, "visuels distincts");
    assert.notEqual(kaito.personality, renji.personality);
    assert.notEqual(kaito.idle, renji.idle);
    // Les définitions PNJ restent compatibles avec le vivier joueur.
    for (const npc of TEAM_NPC_CANDIDATES) {
      for (const field of ["id", "name", "clan", "level", "affinity", "style", "personality", "idle", "appearance"])
        assert.ok(Object.hasOwn(npc, field), `champ ${field} du PNJ ${npc.id}`);
    }
    const twice = await rejection(service.refresh());
    assert.equal(twice, null, "refresh est idempotent");
    await service.refresh();
    const count = await db.prepare("SELECT COUNT(*) AS n FROM team_candidates WHERE kind='npc'").get();
    assert.equal(Number(count.n), 2, "pas de double injection");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("4. Chaque fiche candidat porte portrait, nom, niveau, clan, affinité, style et statut", async () => {
  const { db, dir, service } = await fixture(3);
  try {
    await act(service, peer(1), "apply");
    await act(service, peer(2), "apply");
    const state = service.stateForPeer(peer(3));
    assert.ok(state.candidates.length >= 4);
    for (const row of state.candidates) {
      assert.ok(row.key.length > 0);
      assert.ok(row.name.length > 0);
      assert.ok(Number(row.level) >= 1);
      assert.ok(row.clan.length > 0);
      assert.ok(row.appearance && typeof row.appearance === "object");
      assert.equal(row.status, "recherche");
      assert.equal(typeof row.affinity, "string");
      assert.equal(typeof row.style, "string");
    }
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("5. La liste des candidats n’est visible qu’à la réception ; l’invitation reste notifiée partout", async () => {
  const { db, dir, service } = await fixture(2);
  try {
    await act(service, peer(1), "apply");
    await act(service, peer(2), "apply");
    await act(service, peer(1), "invite", "p2");
    const away = service.stateForPeer(peer(2, { p: FAR_AWAY }));
    assert.deepEqual(away.candidates, [], "pas de portraits hors du comptoir");
    assert.equal(away.invites.length, 1, "notification d’invitation avec portrait du destinateur");
    assert.deepEqual(away.invites[0].fromAppearance, APPEARANCE);
    assert.equal(away.invites[0].fromName, "Genin1");
    const near = service.stateForPeer(peer(2));
    assert.ok(near.candidates.length >= 3);
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("6. Invitation, acceptation puis groupe en formation ; refus supprimé", async () => {
  const { db, dir, service } = await fixture(3);
  try {
    await act(service, peer(1), "apply");
    await act(service, peer(2), "apply");
    await act(service, peer(1), "invite", "p2");
    const declined = await act(service, peer(2), "decline");
    assert.equal(declined.state.invites.length, 0);
    await act(service, peer(1), "invite", "p2");
    const accepted = await act(service, peer(2), "accept");
    assert.equal(accepted.state.self.status, "forming");
    assert.equal(accepted.state.team.status, "forming");
    assert.equal(accepted.state.team.number, 0, "aucun numéro avant trois confirmés");
    assert.equal(accepted.state.team.members.length, 2);
    const list = service.stateForPeer(peer(3));
    const keys = list.candidates.map((row) => row.key);
    assert.ok(!keys.includes("p1") && !keys.includes("p2"), "membres retirés de la liste des candidats");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("7. Invitations doubles incompatibles et croisées refusées", async () => {
  const { db, dir, service } = await fixture(3);
  try {
    for (const id of [1, 2, 3]) await act(service, peer(id), "apply");
    await act(service, peer(1), "invite", "p2");
    const second = await rejection(act(service, peer(3), "invite", "p2"));
    assert.equal(second.gameCode, "TEAM_INVITE_CONFLICT");
    // Invitation croisée : p1 est déjà membre de son groupe en formation, la
    // candidature inverse est donc aussi refusée (double protection serveur).
    const crossed = await rejection(act(service, peer(2), "invite", "p1"));
    assert.ok(
      ["TEAM_TARGET_BUSY", "TEAM_INVITE_CONFLICT"].includes(crossed.gameCode),
      crossed.gameCode,
    );
    await act(service, peer(2), "decline");
    const declined = service.stateForPeer(peer(2));
    assert.equal(declined.invites.length, 0, "refus enregistré");
    const now = await act(service, peer(2), "invite", "p3");
    assert.equal(now.state.invites.length, 0);
    const invited = service.stateForPeer(peer(3));
    assert.equal(invited.invites.length, 1, "nouvelle invitation possible après refus");
    assert.equal(invited.invites[0].fromName, "Genin2");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("8. Une équipe ne dépasse jamais trois membres, y compris en acceptations simultanées", async () => {
  const { db, dir, service } = await fixture(5);
  try {
    for (const id of [1, 2, 3, 4, 5]) await act(service, peer(id), "apply");
    await act(service, peer(1), "invite", "p2");
    await act(service, peer(2), "accept");
    await act(service, peer(1), "invite", "p3");
    await act(service, peer(1), "invite", "p4");
    await act(service, peer(3), "accept");
    const late = await rejection(act(service, peer(4), "accept"));
    assert.equal(late.gameCode, "TEAM_FULL");
    const fifth = await rejection(act(service, peer(1), "invite", "p5"));
    assert.equal(fifth.gameCode, "TEAM_FULL");
    const rows = await db.prepare("SELECT COUNT(*) AS n FROM team_members").get();
    assert.equal(Number(rows.n), TEAM_MAX_MEMBERS);
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("9. Un groupe de un ou deux reste provisoire ; la validation exige exactement trois membres", async () => {
  const { db, dir, service } = await fixture(2);
  try {
    await act(service, peer(1), "apply");
    await act(service, peer(2), "apply");
    await act(service, peer(1), "invite", "p2");
    await act(service, peer(2), "accept");
    const incomplete = await rejection(act(service, peer(1), "form"));
    assert.equal(incomplete.gameCode, "TEAM_INCOMPLETE");
    const state = service.stateForPeer(peer(1));
    assert.equal(state.team.status, "forming");
    assert.equal(state.team.number, 0);
    assert.equal(state.self.status, "forming", "🟢 Groupe en formation");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("10. Trois confirmés à la réception : ÉQUIPE 001 avec Daichi Kurogane, cérémonie et répliques", async () => {
  const { db, dir, service } = await fixture(3);
  try {
    for (const id of [1, 2, 3]) await act(service, peer(id), "apply");
    const formed = await formTeam(service, [1, 2, 3]);
    const team = formed.state.team;
    assert.equal(team.status, "official");
    assert.equal(team.number, 1);
    assert.equal(team.label, "ÉQUIPE 001");
    assert.equal(team.senseiId, "daichi", "Daichi Kurogane imposé à l’Équipe 001");
    assert.equal(team.members.length, 3);
    assert.equal(formed.state.self.status, "official");
    const ceremony = team.ceremony;
    assert.ok(ceremony, "cérémonie active envoyée aux membres");
    assert.equal(ceremony.senseiName, "Daichi Kurogane");
    assert.ok(ceremony.senseiTitle.includes("Défense"));
    assert.ok(validAppearance(ceremony.senseiAppearance));
    assert.equal(ceremony.senseiAppearance.top_color, 4, "tenue verte de Konoha");
    assert.ok(ceremony.lines[0].includes("équipe 001"), ceremony.lines[0]);
    assert.ok(ceremony.lines[1].includes("Daichi Kurogane"));
    assert.ok(ceremony.lines[1].includes("votre Sensei"));
    assert.ok(ceremony.lines.some((line) => line.includes("Apprenez à vous connaître")));
    assert.ok(Number.isFinite(ceremony.x) && Number.isFinite(ceremony.z));
    const row = await db.prepare("SELECT * FROM teams WHERE id=?").get(team.id);
    assert.equal(Number(row.number), 1);
    assert.equal(row.sensei_id, "daichi");
    assert.equal(row.status, "official");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("11. Membres officiels retirés de la liste, non sélectionnables, jamais dans deux équipes", async () => {
  const { db, dir, service } = await fixture(5);
  try {
    for (const id of [1, 2, 3, 4, 5]) await act(service, peer(id), "apply");
    await formTeam(service, [1, 2, 3]);
    const list = service.stateForPeer(peer(4));
    const keys = list.candidates.map((row) => row.key);
    assert.ok(!keys.includes("p1") && !keys.includes("p2") && !keys.includes("p3"));
    await act(service, peer(4), "invite", "p5");
    await act(service, peer(5), "accept");
    const busy = await rejection(act(service, peer(4), "invite", "p1"));
    assert.equal(busy.gameCode, "TEAM_TARGET_BUSY");
    const applied = await rejection(act(service, peer(1), "apply"));
    assert.equal(applied.gameCode, "TEAM_ALREADY_CANDIDATE");
    const official = await rejection(act(service, peer(1), "withdraw"));
    assert.equal(official.gameCode, "TEAM_OFFICIAL");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("12. La deuxième équipe reçoit un numéro unique et un Sensei différent", async () => {
  const { db, dir, service } = await fixture(6);
  try {
    for (const id of [1, 2, 3, 4, 5, 6]) await act(service, peer(id), "apply");
    const first = await formTeam(service, [1, 2, 3]);
    const second = await formTeam(service, [4, 5, 6]);
    assert.equal(first.state.team.number, 1);
    assert.equal(second.state.team.number, 2);
    assert.equal(second.state.team.label, "ÉQUIPE 002");
    assert.notEqual(second.state.team.senseiId, "daichi");
    assert.ok(
      second.state.team.ceremony.lines[0].includes("002"),
      "répliques personnalisées avec le numéro : " + second.state.team.ceremony.lines[0],
    );
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("13. Vingt joueurs : six équipes numérotées, Sensei variés, les derniers restent candidats", async () => {
  const { db, dir, service, advance } = await fixture(20);
  try {
    for (let id = 1; id <= 20; id += 1) await act(service, peer(id), "apply");
    const senseiByNumber = new Map();
    for (let batch = 0; batch < 6; batch += 1) {
      const base = batch * 3 + 1;
      advance(SENSEI_CEREMONY_WINDOW_MS + 60_000);
      const formed = await formTeam(service, [base, base + 1, base + 2]);
      assert.equal(formed.state.team.number, batch + 1);
      assert.equal(formed.state.team.status, "official");
      senseiByNumber.set(batch + 1, formed.state.team.senseiId);
    }
    assert.equal(senseiByNumber.get(1), "daichi");
    assert.equal(
      new Set([...senseiByNumber.values()].slice(0, 4)).size,
      4,
      "quatre premiers Sensei tous distincts",
    );
    assert.ok(senseiByNumber.get(5), "réutilisation maîtrisée quand le vivier est épuisé");
    const leftovers = service.stateForPeer(peer(19));
    const keys = leftovers.candidates.map((row) => row.key);
    assert.deepEqual(keys, ["p19", "p20", "nkaito", "nrenji"]);
    assert.equal(leftovers.self.status, "recherche", "🟡 toujours candidat");
    const teams = await db.prepare("SELECT number FROM teams ORDER BY number").all();
    assert.deepEqual(teams.map((row) => Number(row.number)), [1, 2, 3, 4, 5, 6]);
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("14. Peu de joueurs : personne n’est placé de force, les PNJ restent de simples candidats", async () => {
  const { db, dir, service } = await fixture(2);
  try {
    await act(service, peer(1), "apply");
    const state = service.stateForPeer(peer(1));
    assert.equal(state.candidates.length, 3, "joueur + Kaito + Renji");
    const teams = await db.prepare("SELECT COUNT(*) AS n FROM teams").get();
    assert.equal(Number(teams.n), 0, "aucune équipe automatique");
    const npcMembers = await db.prepare("SELECT COUNT(*) AS n FROM team_members").get();
    assert.equal(Number(npcMembers.n), 0);
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("15. Un candidat PNJ complète rarement un groupe, sur invitation explicite seulement", async () => {
  const { db, dir, service } = await fixture(2);
  try {
    await act(service, peer(1), "apply");
    await act(service, peer(1), "invite", "nkaito");
    const state = service.stateForPeer(peer(1));
    assert.equal(state.team.members.length, 2);
    assert.ok(state.team.members.some((row) => row.key === "nkaito" && row.name === "Kaito"));
    const listed = state.candidates.map((row) => row.key);
    assert.ok(!listed.includes("nkaito"), "PNJ recruté retiré de la liste");
    assert.ok(listed.includes("nrenji"), "Renji reste disponible");
    const incomplete = await rejection(act(service, peer(1), "form"));
    assert.equal(incomplete.gameCode, "TEAM_INCOMPLETE");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("16. Retrait de candidature jusqu’à l’équipe complète ; le groupe survivant reste provisoire", async () => {
  const { db, dir, service } = await fixture(3);
  try {
    await act(service, peer(1), "apply");
    const withdrawn = await act(service, peer(1), "withdraw");
    assert.equal(withdrawn.state.self, null);
    const again = await act(service, peer(1), "apply");
    assert.equal(again.state.self.status, "recherche");

    await act(service, peer(2), "apply");
    await act(service, peer(3), "apply");
    await act(service, peer(1), "invite", "p2");
    await act(service, peer(2), "accept");
    const left = await act(service, peer(2), "withdraw");
    assert.equal(left.state.self, null);
    const remaining = service.stateForPeer(peer(1));
    assert.equal(remaining.team.status, "forming");
    assert.equal(remaining.team.members.length, 1);
    assert.equal(remaining.self.status, "forming");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("17. Trois joueurs arrivés ensemble forment directement leur équipe, validée par n’importe lequel des trois", async () => {
  const { db, dir, service } = await fixture(3);
  try {
    for (const id of [1, 2, 3]) await act(service, peer(id), "apply");
    await act(service, peer(1), "invite", "p2");
    await act(service, peer(2), "accept");
    await act(service, peer(1), "invite", "p3");
    await act(service, peer(3), "accept");
    const formed = await act(service, peer(3), "form");
    assert.equal(formed.state.team.status, "official");
    assert.equal(formed.state.team.number, 1);
    const allSee = service.stateForPeer(peer(2));
    assert.equal(allSee.team.members.length, 3);
    for (const member of allSee.team.members)
      assert.ok(member.appearance && typeof member.appearance === "object");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("18. Numéros uniques jamais réattribués ; cibles et actions invalides refusées", async () => {
  const { db, dir, service } = await fixture(7);
  try {
    for (const id of [1, 2, 3, 4, 5, 6]) await act(service, peer(id), "apply");
    await formTeam(service, [1, 2, 3]);
    const second = await formTeam(service, [4, 5, 6]);
    assert.equal(second.state.team.number, 2);
    await act(service, peer(7), "apply");
    const unknown = await rejection(act(service, peer(7), "invite", "p999"));
    assert.equal(unknown.gameCode, "TEAM_TARGET_UNKNOWN");
    const malformed = await rejection(act(service, peer(7), "invite", "hackp1"));
    assert.equal(malformed.gameCode, "TEAM_TARGET_INVALID");
    const selfInvite = await rejection(act(service, peer(7), "invite", "p7"));
    assert.equal(selfInvite.gameCode, "TEAM_TARGET_INVALID");
    const action = await rejection(
      service.action(peer(7), { type: "team_action", action: "teleport", targetKey: "", revision: 0 }),
    );
    assert.equal(action.gameCode, "TEAM_ACTION_INVALID");
    const noInvite = await rejection(act(service, peer(7), "accept"));
    assert.equal(noInvite.gameCode, "TEAM_NO_INVITE");
    const noGroup = await rejection(act(service, peer(7), "form"));
    assert.equal(noGroup.gameCode, "TEAM_NOT_CANDIDATE");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("19. Deux créations rapprochées n’utilisent jamais le même Sensei ; le profil HTTP suit l’état", async () => {
  const { db, dir, service, advance } = await fixture(18);
  try {
    for (let id = 1; id <= 18; id += 1) await act(service, peer(id), "apply");
    const sensei = [];
    for (let batch = 0; batch < 5; batch += 1) {
      const base = batch * 3 + 1;
      if (batch > 0) advance(SENSEI_CEREMONY_WINDOW_MS + 60_000);
      const formed = await formTeam(service, [base, base + 1, base + 2]);
      sensei.push(formed.state.team.senseiId);
    }
    assert.equal(sensei[0], "daichi");
    assert.equal(
      new Set(sensei.slice(0, 4)).size,
      4,
      "quatre Sensei distincts, jamais le même sur des créations simultanées",
    );
    assert.equal(
      sensei[4],
      "daichi",
      "réutilisation maîtrisée une fois le vivier épuisé : la cérémonie la plus ancienne",
    );
    const profile = await teamStateForUser(db, 1);
    assert.equal(profile.unlocked, true);
    assert.equal(profile.self.status, "official");
    assert.equal(profile.team.label, "ÉQUIPE 001");
    assert.equal(profile.team.senseiId, "daichi");
    const outsider = await teamStateForUser(db, 18);
    assert.equal(outsider.self.status, "recherche");
    assert.equal(outsider.team, null);
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("20. Profils HTTP verrouillés avant l’Académie ; le vivier Sensei est original et différencié", async () => {
  const { db, dir } = await fixture(2);
  try {
    await db
      .prepare("UPDATE clan_missions SET reward_claimed=0 WHERE user_id=2")
      .run();
    const locked = await teamStateForUser(db, 2);
    assert.equal(locked.unlocked, false);
    assert.equal(locked.self, null);
    assert.equal(locked.team, null);

    assert.equal(TEAM_SENSEI.length, 4);
    assert.equal(new Set(TEAM_SENSEI.map((item) => item.id)).size, 4);
    assert.equal(new Set(TEAM_SENSEI.map((item) => item.name)).size, 4, "noms tous différents");
    assert.deepEqual(
      TEAM_SENSEI.map((item) => item.id),
      ["daichi", "ayame", "genzo", "natsumi"],
      "Daichi Kurogane en premier : imposé à l’Équipe 001",
    );
    const appearances = TEAM_SENSEI.map((item) => JSON.stringify(item.appearance));
    assert.equal(new Set(appearances).size, 4, "portraits et silhouettes distincts");
    for (const sensei of TEAM_SENSEI) {
      assert.ok(validAppearance(sensei.appearance), sensei.id);
      assert.equal(sensei.appearance.top_color, 4, "gilet vert de Konoha");
      assert.ok(sensei.dialogue.length >= 4);
      assert.ok(sensei.dialogue[0].includes("{number}"));
      assert.ok(sensei.personality.length > 0);
      assert.ok(sensei.title.startsWith("Sensei"));
    }
    assert.equal(clanAffinity("Senju"), "Suiton");
    assert.equal(clanAffinity("Hyuga"), "Raiton");
  } finally {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  }
});
