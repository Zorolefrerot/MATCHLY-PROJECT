import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VillageRoom,
  COMBAT,
  TECHNIQUES_BY_CLAN,
} from "../server/village-room.js";

function fixture() {
  let now = 10000;
  const room = new VillageRoom({ now: () => now });
  function join(id, clan) {
    const events = [];
    const closes = [];
    const peer = room.join(
      {
        id,
        name: `Genin ${id}`,
        clan,
        appearance: null,
        tokenHash: `secret${id}`,
        expires: 1000000,
      },
      {
        send: (event) => events.push(structuredClone(event)),
        close: (...args) => closes.push(args),
      },
    );
    return { peer, events, closes };
  }
  return {
    room,
    join,
    advance: (ms) => {
      now += ms;
    },
  };
}
const action = (seq, kind, direction = [1, 0, 0]) => ({
  type: "combat_action",
  seq,
  kind,
  direction,
});
const last = (events, type) =>
  [...events].reverse().find((event) => event.type === type);

test("each clan has four distinct techniques and Katon/Mokuton stay clan-exclusive", () => {
  const clans = Object.keys(TECHNIQUES_BY_CLAN);
  assert.equal(clans.length, 14);
  const names = new Set();
  for (const clan of clans) {
    const techniques = TECHNIQUES_BY_CLAN[clan];
    assert.equal(techniques.length, 4, `${clan} needs four techniques`);
    for (const value of techniques) {
      assert.ok(!names.has(value.name), `duplicate technique: ${value.name}`);
      names.add(value.name);
      assert.ok(value.cost > 0 && value.cooldown > 0 && value.damage > 0);
    }
  }
  assert.ok(
    TECHNIQUES_BY_CLAN.Uchiwa.every((value) => value.element === "Katon"),
  );
  assert.ok(
    clans
      .filter((clan) => clan !== "Uchiwa")
      .every((clan) =>
        TECHNIQUES_BY_CLAN[clan].every((value) => value.element !== "Katon"),
      ),
  );
  assert.ok(
    TECHNIQUES_BY_CLAN.Senju.every((value) => value.element === "Mokuton"),
  );
  assert.ok(
    clans
      .filter((clan) => clan !== "Senju")
      .every((clan) =>
        TECHNIQUES_BY_CLAN[clan].every((value) => value.element !== "Mokuton"),
      ),
  );
});

test("two admitted peers can start an ephemeral online duel with server health and clan ultimates", () => {
  const { room, join, advance } = fixture();
  const a = join(1, "Uchiwa");
  const b = join(2, "Uzumaki");

  room.receive(a.peer, { type: "combat_join" });
  assert.equal(room.combat.started, false);
  assert.equal(last(a.events, "combat_waiting").needed, 1);
  room.receive(a.peer, { type: "combat_level", level: 10 });
  room.receive(b.peer, { type: "combat_join" });

  assert.equal(room.combat.started, true);
  const started = last(a.events, "combat_started");
  assert.deepEqual(started.players, [1, 2]);
  const initial = last(a.events, "combat_state");
  assert.deepEqual(
    initial.players.map((player) => [player.id, player.clan, player.level]),
    [
      [1, "Uchiwa", 10],
      [2, "Uzumaki", 1],
    ],
  );
  assert.deepEqual(a.peer.state.p, [-3, 0.25, 22]);
  assert.deepEqual(b.peer.state.p, [3, 0.25, 22]);

  // The server resolves damage; the client cannot submit a damage value.
  room.receive(a.peer, action(0, "skill_0"));
  const hit = last(b.events, "combat_hit");
  assert.equal(hit.target, 2);
  assert.equal(hit.damage, 26, "level 10 scales the ordinary technique too");
  assert.equal(hit.health, 94);
  assert.equal(hit.technique.element, "Katon");
  assert.equal(hit.technique.name, "Katon · Gōkakyū");
  assert.equal(last(a.events, "combat_action").attacker, 1);
  assert.equal(Object.hasOwn(last(a.events, "combat_action"), "damage"), false);

  // Uchiwa receives its own ultimate from the server catalogue. It has a real
  // windup so the target can leave the marked area before the monumental impact.
  room.receive(a.peer, action(1, "ultimate"));
  const cast = last(b.events, "combat_action");
  assert.equal(cast.ultimate.clan, "Uchiwa");
  assert.equal(cast.ultimate.name, "Envol du brasier");
  assert.equal(cast.ultimate.level, 10);
  assert.equal(cast.ultimate.damage, 82);
  assert.equal(
    last(b.events, "combat_hit"),
    hit,
    "ultimate waits through its windup",
  );
  advance(COMBAT.ultimateWindupMs + 1);
  room.tick();
  const ultimateHit = last(b.events, "combat_hit");
  assert.equal(ultimateHit.kind, "ultimate");
  assert.equal(ultimateHit.damage, 82);
  assert.equal(ultimateHit.health, 12);
});

test("online combat rejects client-forged actions, cooldown spam and out-of-range hits", () => {
  const { room, join, advance } = fixture();
  const a = join(1, "Senju");
  const b = join(2, "Hyūga");
  room.receive(a.peer, { type: "combat_join" });
  room.receive(b.peer, { type: "combat_join" });

  a.peer.state.p = [-20, 0.25, 22];
  b.peer.state.p = [20, 0.25, 22];
  room.receive(a.peer, action(0, "skill_0"));
  assert.equal(last(a.events, "error").code, "COMBAT_ACTION");
  assert.equal(last(a.events, "combat_hit"), undefined);

  a.peer.state.p = [-3, 0.25, 22];
  b.peer.state.p = [3, 0.25, 22];
  room.receive(a.peer, action(1, "skill_0"));
  assert.equal(last(a.events, "combat_action").technique.element, "Mokuton");
  const healthAfterFirst = last(b.events, "combat_hit").health;
  room.receive(a.peer, action(2, "skill_0"));
  assert.equal(last(b.events, "combat_hit").health, healthAfterFirst);
  assert.match(last(a.events, "error").error, /récupération/);

  // A second player cannot submit a foreign target, an invalid kind, or a
  // negative/zero direction without ending up with a server-side hit.
  for (const [seq, kind, direction] of [
    [3, "skill_0", [0, 0, 0]],
    [4, "not_a_skill", [1, 0, 0]],
    [5, "ultimate", [99, 0, 0]],
  ]) {
    room.receive(a.peer, action(seq, kind, direction));
    assert.equal(
      room.peers.has(1),
      false,
      "malformed combat packets fail closed",
    );
    break;
  }
  assert.equal(room.combat, null);
  advance(10000);
});
