import { test } from "node:test";
import assert from "node:assert/strict";
import { VillageRoom, VILLAGE } from "../server/village-room.js";
function fixture() {
  let now = 10000;
  const room = new VillageRoom({ now: () => now });
  function join(id) {
    const events = [],
      closes = [];
    const peer = room.join(
      {
        id,
        name: `Genin ${id}`,
        appearance: null,
        tokenHash: `secret${id}`,
        expires: 1000000,
      },
      {
        send: (e) => events.push(structuredClone(e)),
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
const move = (seq, p, motion = "walk") => ({
  type: "move",
  seq,
  p,
  yaw: 0,
  motion,
});
const chat = (seq, text = "Bonjour", channel = "RP") => ({
  type: "chat",
  seq,
  text,
  channel,
});
test("room publishes only server identity, bounded positions and distinct movement states", () => {
  const { room, join, advance } = fixture();
  const a = join(1),
    b = join(2);
  assert.deepEqual(
    a.events.find((e) => e.type === "welcome").spawn,
    [0, 0.25, 22],
  );
  assert.deepEqual(
    b.events.find((e) => e.type === "roster").players.map((p) => p.id),
    [1, 2],
  );
  for (const [i, motion] of ["walk", "run", "jump", "idle"].entries()) {
    advance(100);
    room.receive(
      a.peer,
      move(i, [0, motion === "jump" ? 1 : 0.25, 22 - (i + 1) * 0.4], motion),
    );
    room.tick();
    assert.equal(b.events.at(-1).players[0].motion, motion);
  }
  const serialized = JSON.stringify(b.events);
  for (const secret of [
    "tokenHash",
    "secret1",
    "expires",
    "email",
    "mokuton",
    "clan",
    "mission",
    "password",
  ])
    assert.ok(!serialized.includes(secret));
  room.receive(a.peer, move(0, [0, 0.25, 22]));
  assert.equal(a.peer.seq, 3);
  room.receive(a.peer, move(5, [20, 0.25, 22]));
  assert.equal(a.events.at(-1).type, "correction");
  assert.ok(a.peer.state.p[0] === 0);
  room.receive(a.peer, { ...move(6, [0, 0.25, 22]), id: 2 });
  assert.equal(a.closes.at(-1)[0], 1008);
});
test("one socket per account; late departure cannot erase its replacement", () => {
  const { room, join } = fixture();
  const a = join(1),
    b = join(2),
    replacement = join(1);
  assert.equal(a.closes[0][0], 4001);
  assert.equal(room.peers.size, 2);
  room.leave(a.peer);
  assert.equal(room.peers.get(1), replacement.peer);
  room.receive(a.peer, chat(1));
  assert.ok(!b.events.some((e) => e.type === "chat"));
  room.leave(replacement.peer);
  assert.equal(room.peers.size, 1);
  assert.deepEqual(b.events.at(-1), {
    type: "roster",
    players: [{ id: 2, name: "Genin 2", appearance: null }],
  });
});
test("proximity RP/HRP chat is plaintext, deduplicated, limited and has no catch-up history", () => {
  const { room, join, advance } = fixture();
  const a = join(1),
    b = join(2),
    far = join(3);
  far.peer.state.p = [20, 0.25, 22];
  room.receive(a.peer, chat(0, "[b]Salut[/b]", "HRP"));
  assert.equal(b.events.filter((e) => e.type === "chat").length, 1);
  assert.equal(b.events.find((e) => e.type === "chat").text, "[b]Salut[/b]");
  assert.equal(b.events.find((e) => e.type === "chat").channel, "HRP");
  assert.equal(far.events.filter((e) => e.type === "chat").length, 0);
  room.receive(a.peer, chat(0));
  assert.equal(b.events.filter((e) => e.type === "chat").length, 1);
  room.receive(a.peer, chat(1));
  room.receive(a.peer, chat(2));
  room.receive(a.peer, chat(3));
  assert.equal(a.events.at(-1).code, "CHAT_RATE");
  advance(2100);
  room.receive(a.peer, chat(3));
  assert.equal(a.events.at(-1).type, "chat_ack");
  assert.ok(!join(4).events.some((e) => e.type === "chat"));
  room.receive(a.peer, chat(4, "fake\nidentity"));
  assert.equal(a.closes.at(-1)[0], 1008);
});
test("finite/strict packets, flood ceiling, expiry, capacity and shutdown fail closed", () => {
  for (const bad of [
    move(0, [NaN, 0, 0]),
    move(0, [0, Infinity, 0]),
    move(0, [32, 0, 0]),
    move(-1, [0, 0, 0]),
    chat(0, "x".repeat(241)),
    chat(0, "unsafe\u2028text"),
    chat(0, "unsafe\u202etext"),
    chat(0, "😀".repeat(121)),
    chat(0, "test", "GLOBAL"),
    { type: "damage", target: 1 },
    null,
    [],
  ]) {
    const { room, join } = fixture();
    const a = join(1);
    room.receive(a.peer, bad);
    assert.equal(room.peers.size, 0);
  }
  const { room, join, advance } = fixture();
  const a = join(1);
  for (let i = 0; i < 41; i++)
    room.receive(a.peer, move(i, [0, 0.25, 22], "idle"));
  assert.equal(a.closes.at(-1)[0], 1008);
  const b = join(2);
  advance(VILLAGE.leaseMs);
  room.tick();
  assert.equal(b.closes.at(-1)[0], 1013);
  for (let i = 0; i < 20; i++) join(i + 10);
  const excess = join(99);
  assert.equal(excess.peer, null);
  assert.equal(excess.closes[0][0], 1013);
  room.leave(room.peers.get(10));
  assert.ok(join(99).peer);
  assert.equal(room.peers.size, 20);
  room.close();
  assert.equal(room.peers.size, 0);
});

test("inactivity idles then removes presence; respawn and UTF-16 text limits remain bounded", () => {
  const { room, join, advance } = fixture();
  const a = join(1);
  room.receive(a.peer, {
    type: "chat",
    seq: 0,
    channel: "RP",
    text: "😀".repeat(120),
  });
  assert.equal(a.events.at(-1).type, "chat_ack");
  room.receive(a.peer, {
    type: "move",
    seq: 0,
    p: [1, 0.25, 22],
    yaw: 0,
    motion: "run",
  });
  advance(2100);
  room.tick();
  assert.equal(a.peer.state.motion, "idle");
  room.receive(a.peer, { type: "respawn" });
  assert.deepEqual(a.peer.state.p, [0, 0.25, 22]);
  assert.equal(a.events.at(-1).type, "correction");
  a.peer.state.p = [1, 0.25, 22];
  room.receive(a.peer, { type: "respawn" });
  assert.deepEqual(a.peer.state.p, [1, 0.25, 22]);
  a.peer.leaseUntil = 1000000;
  advance(15001);
  room.tick();
  assert.equal(a.closes.at(-1)[0], 4000);
  assert.equal(room.peers.size, 0);
});

test("lease loss is retryable even when a packet precedes the next tick; expiry remains terminal", () => {
  const { room, join, advance } = fixture();
  const a = join(1),
    b = join(2);
  advance(VILLAGE.leaseMs);
  room.receive(a.peer, move(0, [0, 0.25, 22]));
  assert.equal(a.closes.at(-1)[0], 1013);
  assert.equal(room.peers.has(1), false);
  b.peer.expires = 0;
  room.receive(b.peer, move(0, [0, 0.25, 22]));
  assert.equal(b.closes.at(-1)[0], 4003);
  assert.equal(room.peers.size, 0);
});
