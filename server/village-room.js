import { randomUUID } from "node:crypto";

export const VILLAGE = Object.freeze({
  protocol: 1,
  capacity: 20,
  radius: 12,
  spawn: Object.freeze([0, 0.25, 22]),
  leaseMs: 5000,
});
const motions = ["idle", "walk", "run", "jump"];
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

// One ephemeral room in one Render process. No position/chat DB writes, no loot,
// combat, mission completion, clan roll, admission, or client-supplied identity.
export class VillageRoom {
  constructor({ now = Date.now } = {}) {
    this.now = now;
    this.peers = new Map();
    this.frame = 0;
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
    const now = this.now();
    const peer = {
      ...identity,
      transport,
      leaseUntil: now + VILLAGE.leaseMs,
      state: { id: identity.id, p: [...VILLAGE.spawn], yaw: 0, motion: "idle" },
      seq: -1,
      chatSeq: -1,
      lastPacket: now,
      lastMove: now,
      packetTokens: 40,
      chatTokens: 3,
      lastChat: now,
      distanceBudget: 2,
      lastRespawn: now - 5000,
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
    this.peers.delete(peer.id);
    peer.transport.close(code, reason);
    this.roster();
  }
  reject(peer, code, error) {
    this.send(peer, { type: "error", code, error });
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
    for (const peer of this.peers.values()) {
      if (!this.active(peer))
        this.leave(
          peer,
          this.now() >= peer.expires ? 4003 : 1013,
          "Session expirée ou non vérifiée",
        );
      else if (this.now() - peer.lastPacket > 15000)
        this.leave(peer, 4000, "Connexion interrompue");
      else if (this.now() - peer.lastPacket > 2000) peer.state.motion = "idle";
    }
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
