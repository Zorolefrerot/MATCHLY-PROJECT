// Solo orientation only: never awards money, inventory, combat stats or powers.
export const welcomePlaces = Object.freeze(["academy", "market", "hokage"]);
export const welcomeEvents = Object.freeze([
  "accept",
  "read_academy",
  "read_market",
  "read_hokage",
  "report",
]);
export function welcomeState(row) {
  return {
    schemaVersion: 1,
    missionId: "konoha_welcome",
    status: row?.phase || "available",
    visited: welcomePlaces.filter(
      (_, i) => ((row?.visited || 0) & (1 << i)) !== 0,
    ),
    revision: row?.revision || 0,
  };
}
const reject = (code, message) => {
  throw Object.assign(new Error(message), { status: 409, gameCode: code });
};
export function advanceWelcome(current, event, expectedRevision) {
  const state = welcomeState(current);
  const place = event.startsWith("read_") ? event.slice(5) : null;
  // Semantic idempotency: a lost acknowledgement can be retried safely.
  if (
    (event === "accept" && state.status !== "available") ||
    (place && state.visited.includes(place)) ||
    (event === "report" && state.status === "completed")
  )
    return null;
  if (expectedRevision !== state.revision)
    reject(
      "MISSION_CONFLICT",
      "La mission a changé. Actualise le journal avant de continuer.",
    );
  if (event !== "accept" && state.status !== "active")
    reject(
      "MISSION_NOT_STARTED",
      "Parle à Aoi pour accepter la mission d’accueil.",
    );
  if (event === "report" && state.visited.length !== 3)
    reject(
      "MISSION_INCOMPLETE",
      "Lis les trois panneaux avant de revenir auprès d’Aoi.",
    );
  return {
    phase: event === "report" ? "completed" : "active",
    visited:
      (current?.visited || 0) | (place ? 1 << welcomePlaces.indexOf(place) : 0),
    revision: state.revision + 1,
  };
}
