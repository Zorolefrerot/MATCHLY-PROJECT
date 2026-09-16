// Server-side progression model for mission 2. The client owns only the
// private star presentation; this module owns the durable state and the one
// report/reward transition.
export const CLAN_MISSION_ID = "clan_stars";
export const clanMissionStatuses = Object.freeze([
  "NOT_STARTED",
  "ACCEPTED",
  "IN_PROGRESS",
  "TIME_EXPIRED",
  "REPORT_PENDING",
  "COMPLETED",
]);
export const clanMissionEvents = Object.freeze([
  "accept",
  "start",
  "expire",
  "report_pending",
  "report",
]);

export function rewardForStars(score) {
  if (!Number.isSafeInteger(score) || score < 0)
    throw Object.assign(new Error("Score d’étoiles invalide."), {
      status: 400,
      gameCode: "INVALID_STAR_SCORE",
    });
  if (score < 5) return { idremGold: 5, level: 0, tier: "0-4" };
  if (score < 10) return { idremGold: 10, level: 0, tier: "5-9" };
  if (score < 20) return { idremGold: 0, level: 1, tier: "10-19" };
  if (score < 30) return { idremGold: 10, level: 1, tier: "20-29" };
  if (score < 50) return { idremGold: 10, level: 1, tier: "30-49" };
  return { idremGold: 30, level: 2, tier: "50+" };
}

export function clanMissionState(row) {
  const score = row?.score == null ? null : Number(row.score);
  const reward =
    score == null
      ? { idremGold: 0, level: 0, tier: "none" }
      : rewardForStars(score);
  return {
    schemaVersion: 1,
    missionId: CLAN_MISSION_ID,
    status: row?.status || "NOT_STARTED",
    score,
    revision: Number(row?.revision || 0),
    startedAt: row?.started_at == null ? null : Number(row.started_at),
    rewardClaimed: Boolean(Number(row?.reward_claimed || 0)),
    reward,
  };
}

const reject = (code, message) => {
  throw Object.assign(new Error(message), { status: 409, gameCode: code });
};

// Returns null for safe duplicate acknowledgements. The caller must persist
// only a returned next row, inside the same account transaction as rewards.
export function advanceClanMission(current, event, expectedRevision, score = null) {
  const state = clanMissionState(current);
  if (!clanMissionEvents.includes(event))
    throw Object.assign(new Error("Événement de mission invalide."), {
      status: 400,
      gameCode: "INVALID_MISSION_EVENT",
    });

  const duplicate =
    (event === "accept" && state.status !== "NOT_STARTED") ||
    (event === "start" && state.status === "IN_PROGRESS") ||
    (event === "expire" && ["TIME_EXPIRED", "REPORT_PENDING", "COMPLETED"].includes(state.status)) ||
    (event === "report_pending" && ["REPORT_PENDING", "COMPLETED"].includes(state.status)) ||
    (event === "report" && state.status === "COMPLETED");
  if (duplicate) return null;
  if (expectedRevision !== state.revision)
    reject("CLAN_MISSION_CONFLICT", "La mission de clan a changé. Actualise le journal.");

  if (event === "accept" && state.status !== "NOT_STARTED")
    reject("CLAN_MISSION_NOT_AVAILABLE", "Cette mission de clan a déjà commencé.");
  if (event === "start" && state.status !== "ACCEPTED")
    reject("CLAN_MISSION_NOT_ACCEPTED", "Accepte d’abord la mission auprès de ton chef.");
  if (event === "expire" && state.status !== "IN_PROGRESS")
    reject("CLAN_MISSION_NOT_ACTIVE", "La collecte n’est pas active.");
  if (event === "report_pending" && state.status !== "TIME_EXPIRED")
    reject("CLAN_MISSION_NOT_EXPIRED", "Le temps de collecte n’est pas terminé.");
  if (event === "report" && state.status !== "REPORT_PENDING")
    reject("CLAN_MISSION_REPORT_REQUIRED", "Retourne voir ton chef pour faire le rapport.");

  let nextScore = state.score;
  if (event === "expire") {
    if (!Number.isSafeInteger(score) || score < 0 || score > 1000000)
      throw Object.assign(new Error("Score d’étoiles invalide."), {
        status: 400,
        gameCode: "INVALID_STAR_SCORE",
      });
    nextScore = score;
  }
  const nextStatus = {
    accept: "ACCEPTED",
    start: "IN_PROGRESS",
    expire: "TIME_EXPIRED",
    report_pending: "REPORT_PENDING",
    report: "COMPLETED",
  }[event];
  return {
    status: nextStatus,
    score: nextScore,
    revision: state.revision + 1,
    started_at: event === "start" ? Date.now() : current?.started_at || null,
    reward_claimed: event === "report" ? 1 : Number(current?.reward_claimed || 0),
  };
}
