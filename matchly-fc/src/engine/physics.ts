import { BotDifficulty, EuroTeam, FormationId, FORMATIONS } from '../data/teams';

export type Side = 'host' | 'guest';

export const PITCH = {
  W: 600,
  H: 960,
  LEFT: 36,
  RIGHT: 564,
  TOP: 64,
  BOTTOM: 896,
  GOAL_LEFT: 204,
  GOAL_RIGHT: 396,
  GOAL_TOP_BACK: 14,
  GOAL_BOTTOM_BACK: 946,
  POST_R: 6.5,
  CORNER_BEVEL: 26,
  BALL_R: 16,
  CAP_R: 26.5,
  GK_R: 28,
};

export interface DiscPiece {
  id: string;
  side: Side;
  slotIndex: number; // tactical slot: 0 = GK, 1..4 = outfield
  playerIndex: number; // index in the 15-player squad
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  mass: number;
  maxSpeed: number;
  aimLength: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  mass: number;
  spinAngle: number;
}

export interface MatchBoardState {
  pieces: DiscPiece[];
  ball: BallState;
  turn: Side;
  turnNumber: number;
  hostScore: number;
  guestScore: number;
  targetGoals: number;
  lastTouch: { side: Side; slotIndex: number; playerIndex: number } | null;
}

export interface StepEvents {
  capHitIntensity: number;
  ballKickIntensity: number;
  postHit: boolean;
  goalScoredBy: Side | null;
  ownGoal: boolean;
  goalTouch: { side: Side; slotIndex: number; playerIndex: number } | null;
}

export function createInitialBoard(
  hostTeam: EuroTeam,
  hostFormation: FormationId,
  guestTeam: EuroTeam,
  guestFormation: FormationId,
  kickoffSide: Side = 'host',
  hostScore = 0,
  guestScore = 0,
  targetGoals = 3,
  turnNumber = 1,
  hostLineup: number[] = [0, 1, 2, 3, 4],
  guestLineup: number[] = [0, 1, 2, 3, 4],
): MatchBoardState {
  const pieces: DiscPiece[] = [];
  const playW = PITCH.RIGHT - PITCH.LEFT;
  const playH = PITCH.BOTTOM - PITCH.TOP;

  const hCoords = FORMATIONS[hostFormation]?.homeCoords || FORMATIONS['1-2-2'].homeCoords;
  hostLineup.slice(0, 5).forEach((playerIndex, idx) => {
    const p = hostTeam.players[playerIndex] || hostTeam.players[idx];
    const c = hCoords[idx];
    const isGk = idx === 0;
    pieces.push({
      id: `host-${idx}`,
      side: 'host',
      slotIndex: idx,
      playerIndex,
      x: PITCH.LEFT + c.x * playW,
      y: PITCH.TOP + c.y * playH,
      vx: 0,
      vy: 0,
      r: isGk ? PITCH.GK_R : PITCH.CAP_R,
      mass: (isGk ? 1.18 : 1.02) * (0.85 + p.stats.phy / 280),
      maxSpeed: 1020 * (0.91 + (p.stats.tir - 75) * 0.0085),
      aimLength: 138 + (p.stats.ctr - 75) * 3.8,
    });
  });

  const gCoords = FORMATIONS[guestFormation]?.homeCoords || FORMATIONS['1-2-2'].homeCoords;
  guestLineup.slice(0, 5).forEach((playerIndex, idx) => {
    const p = guestTeam.players[playerIndex] || guestTeam.players[idx];
    const c = gCoords[idx];
    const isGk = idx === 0;
    // Mirror vertically & horizontally for away side
    pieces.push({
      id: `guest-${idx}`,
      side: 'guest',
      slotIndex: idx,
      playerIndex,
      x: PITCH.LEFT + (1 - c.x) * playW,
      y: PITCH.TOP + (1 - c.y) * playH,
      vx: 0,
      vy: 0,
      r: isGk ? PITCH.GK_R : PITCH.CAP_R,
      mass: (isGk ? 1.18 : 1.02) * (0.85 + p.stats.phy / 280),
      maxSpeed: 1020 * (0.91 + (p.stats.tir - 75) * 0.0085),
      aimLength: 138 + (p.stats.ctr - 75) * 3.8,
    });
  });

  return {
    pieces,
    ball: {
      x: PITCH.W / 2,
      y: PITCH.H / 2,
      vx: 0,
      vy: 0,
      r: PITCH.BALL_R,
      mass: 0.46,
      spinAngle: 0,
    },
    turn: kickoffSide,
    turnNumber,
    hostScore,
    guestScore,
    targetGoals,
    lastTouch: null,
  };
}

export function cloneBoard(b: MatchBoardState): MatchBoardState {
  return {
    ...b,
    pieces: b.pieces.map((p) => ({ ...p })),
    ball: { ...b.ball },
    lastTouch: b.lastTouch ? { ...b.lastTouch } : null,
  };
}

export function applyShotToBoard(
  board: MatchBoardState,
  pieceId: string,
  vx: number,
  vy: number,
): boolean {
  const piece = board.pieces.find((p) => p.id === pieceId);
  if (!piece) return false;
  const speed = Math.hypot(vx, vy);
  if (speed < 12) return false;
  const clampedSpeed = Math.min(speed, piece.maxSpeed);
  const scale = clampedSpeed / speed;
  piece.vx = vx * scale;
  piece.vy = vy * scale;
  return true;
}

const POSTS = [
  { x: PITCH.GOAL_LEFT, y: PITCH.TOP },
  { x: PITCH.GOAL_RIGHT, y: PITCH.TOP },
  { x: PITCH.GOAL_LEFT, y: PITCH.BOTTOM },
  { x: PITCH.GOAL_RIGHT, y: PITCH.BOTTOM },
];

// Corner bevel normals pointing inward
const BEVELS = [
  // Top-left
  { x0: PITCH.LEFT + PITCH.CORNER_BEVEL, y0: PITCH.TOP, nx: 0.7071, ny: 0.7071 },
  // Top-right
  { x0: PITCH.RIGHT - PITCH.CORNER_BEVEL, y0: PITCH.TOP, nx: -0.7071, ny: 0.7071 },
  // Bottom-left
  { x0: PITCH.LEFT + PITCH.CORNER_BEVEL, y0: PITCH.BOTTOM, nx: 0.7071, ny: -0.7071 },
  // Bottom-right
  { x0: PITCH.RIGHT - PITCH.CORNER_BEVEL, y0: PITCH.BOTTOM, nx: -0.7071, ny: -0.7071 },
];

function resolvePostCollision(
  obj: { x: number; y: number; vx: number; vy: number; r: number },
  restitution: number,
): boolean {
  let hit = false;
  for (const post of POSTS) {
    const dx = obj.x - post.x;
    const dy = obj.y - post.y;
    const dist = Math.hypot(dx, dy);
    const minDist = obj.r + PITCH.POST_R;
    if (dist > 0.0001 && dist < minDist) {
      const nx = dx / dist;
      const ny = dy / dist;
      obj.x = post.x + nx * minDist;
      obj.y = post.y + ny * minDist;
      const vn = obj.vx * nx + obj.vy * ny;
      if (vn < 0) {
        if (Math.abs(vn) > 95) hit = true;
        obj.vx -= (1 + restitution) * vn * nx;
        obj.vy -= (1 + restitution) * vn * ny;
      }
    }
  }
  return hit;
}

function resolveBevels(
  obj: { x: number; y: number; vx: number; vy: number; r: number },
  restitution: number,
) {
  for (const b of BEVELS) {
    const signedDist = (obj.x - b.x0) * b.nx + (obj.y - b.y0) * b.ny;
    if (signedDist < obj.r) {
      const push = obj.r - signedDist;
      obj.x += b.nx * push;
      obj.y += b.ny * push;
      const vn = obj.vx * b.nx + obj.vy * b.ny;
      if (vn < 0) {
        obj.vx -= (1 + restitution) * vn * b.nx;
        obj.vy -= (1 + restitution) * vn * b.ny;
      }
    }
  }
}


export function evacuatePieceFromGoal(piece: DiscPiece): boolean {
  const insideTop = piece.y < PITCH.TOP + 2 && piece.x > PITCH.GOAL_LEFT - piece.r && piece.x < PITCH.GOAL_RIGHT + piece.r;
  const insideBottom = piece.y > PITCH.BOTTOM - 2 && piece.x > PITCH.GOAL_LEFT - piece.r && piece.x < PITCH.GOAL_RIGHT + piece.r;
  if (!insideTop && !insideBottom) return false;
  const defensiveOffset = piece.r + 24;
  if (insideTop) {
    piece.y = PITCH.TOP + defensiveOffset;
    piece.x = Math.max(PITCH.LEFT + piece.r + 8, Math.min(PITCH.RIGHT - piece.r - 8, piece.x + (piece.x < PITCH.W / 2 ? -18 : 18)));
    piece.vy = Math.abs(piece.vy) * 0.25;
  } else {
    piece.y = PITCH.BOTTOM - defensiveOffset;
    piece.x = Math.max(PITCH.LEFT + piece.r + 8, Math.min(PITCH.RIGHT - piece.r - 8, piece.x + (piece.x < PITCH.W / 2 ? -18 : 18)));
    piece.vy = -Math.abs(piece.vy) * 0.25;
  }
  piece.vx *= 0.35;
  return true;
}

export function applySubstitution(board: MatchBoardState, team: EuroTeam, side: Side, slotIndex: number, playerIndex: number): boolean {
  const piece = board.pieces.find((p) => p.side === side && p.slotIndex === slotIndex);
  const player = team.players[playerIndex];
  if (!piece || !player || piece.playerIndex === playerIndex) return false;
  if (board.pieces.some((p) => p.side === side && p.playerIndex === playerIndex)) return false;
  if (slotIndex === 0 && player.role !== 'GK') return false;
  piece.playerIndex = playerIndex;
  piece.r = slotIndex === 0 ? PITCH.GK_R : PITCH.CAP_R;
  piece.mass = (slotIndex === 0 ? 1.18 : 1.02) * (0.85 + player.stats.phy / 280);
  piece.maxSpeed = 1020 * (0.91 + (player.stats.tir - 75) * 0.0085);
  piece.aimLength = 138 + (player.stats.ctr - 75) * 3.8;
  piece.vx = 0; piece.vy = 0;
  evacuatePieceFromGoal(piece);
  return true;
}

export function stepPhysics(board: MatchBoardState, dt: number): StepEvents {
  const events: StepEvents = {
    capHitIntensity: 0,
    ballKickIntensity: 0,
    postHit: false,
    goalScoredBy: null,
    ownGoal: false,
    goalTouch: null,
  };

  const substeps = 4;
  const subDt = dt / substeps;

  for (let s = 0; s < substeps; s++) {
    // 1. Integrate positions
    for (const p of board.pieces) {
      p.x += p.vx * subDt;
      p.y += p.vy * subDt;

      // Damping (table-turf friction)
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 0) {
        const decel = 360 * subDt;
        const factor = Math.pow(0.24, subDt);
        const nextSpeed = Math.max(0, speed * factor - decel);
        if (nextSpeed < 6) {
          p.vx = 0;
          p.vy = 0;
        } else {
          p.vx = (p.vx / speed) * nextSpeed;
          p.vy = (p.vy / speed) * nextSpeed;
        }
      }
    }

    const ball = board.ball;
    ball.x += ball.vx * subDt;
    ball.y += ball.vy * subDt;
    const bSpeed = Math.hypot(ball.vx, ball.vy);
    ball.spinAngle += bSpeed * subDt * 0.032;

    const inGoalPocket = ball.y < PITCH.TOP || ball.y > PITCH.BOTTOM;
    if (bSpeed > 0) {
      const decel = (inGoalPocket ? 920 : 210) * subDt;
      const factor = Math.pow(inGoalPocket ? 0.03 : 0.42, subDt);
      const nextSpeed = Math.max(0, bSpeed * factor - decel);
      if (nextSpeed < 5) {
        ball.vx = 0;
        ball.vy = 0;
      } else {
        ball.vx = (ball.vx / bSpeed) * nextSpeed;
        ball.vy = (ball.vy / bSpeed) * nextSpeed;
      }
    }

    // 2. Player cap wall collisions (caps stay on main pitch, cannot camp deep inside goal net)
    for (const p of board.pieces) {
      if (p.x - p.r < PITCH.LEFT) {
        p.x = PITCH.LEFT + p.r;
        if (p.vx < 0) p.vx = -p.vx * 0.76;
      } else if (p.x + p.r > PITCH.RIGHT) {
        p.x = PITCH.RIGHT - p.r;
        if (p.vx > 0) p.vx = -p.vx * 0.76;
      }

      if (p.y - p.r < PITCH.TOP) {
        p.y = PITCH.TOP + p.r;
        if (p.vy < 0) p.vy = -p.vy * 0.76;
      } else if (p.y + p.r > PITCH.BOTTOM) {
        p.y = PITCH.BOTTOM - p.r;
        if (p.vy > 0) p.vy = -p.vy * 0.76;
      }

      resolveBevels(p, 0.74);
      resolvePostCollision(p, 0.78);
    }

    // 3. Ball wall & goal pocket collisions
    const inGoalMouthX =
      ball.x > PITCH.GOAL_LEFT + PITCH.POST_R * 0.4 &&
      ball.x < PITCH.GOAL_RIGHT - PITCH.POST_R * 0.4;

    if (ball.y >= PITCH.TOP && ball.y <= PITCH.BOTTOM) {
      if (ball.x - ball.r < PITCH.LEFT) {
        ball.x = PITCH.LEFT + ball.r;
        if (ball.vx < 0) ball.vx = -ball.vx * 0.86;
      } else if (ball.x + ball.r > PITCH.RIGHT) {
        ball.x = PITCH.RIGHT - ball.r;
        if (ball.vx > 0) ball.vx = -ball.vx * 0.86;
      }

      if (!inGoalMouthX) {
        if (ball.y - ball.r < PITCH.TOP) {
          ball.y = PITCH.TOP + ball.r;
          if (ball.vy < 0) ball.vy = -ball.vy * 0.86;
        } else if (ball.y + ball.r > PITCH.BOTTOM) {
          ball.y = PITCH.BOTTOM - ball.r;
          if (ball.vy > 0) ball.vy = -ball.vy * 0.86;
        }
      }
      resolveBevels(ball, 0.86);
    } else {
      // Inside top or bottom goal net
      if (ball.x - ball.r < PITCH.GOAL_LEFT) {
        ball.x = PITCH.GOAL_LEFT + ball.r;
        if (ball.vx < 0) ball.vx = -ball.vx * 0.35;
      } else if (ball.x + ball.r > PITCH.GOAL_RIGHT) {
        ball.x = PITCH.GOAL_RIGHT - ball.r;
        if (ball.vx > 0) ball.vx = -ball.vx * 0.35;
      }
      if (ball.y - ball.r < PITCH.GOAL_TOP_BACK) {
        ball.y = PITCH.GOAL_TOP_BACK + ball.r;
        if (ball.vy < 0) ball.vy = -ball.vy * 0.25;
      } else if (ball.y + ball.r > PITCH.GOAL_BOTTOM_BACK) {
        ball.y = PITCH.GOAL_BOTTOM_BACK - ball.r;
        if (ball.vy > 0) ball.vy = -ball.vy * 0.25;
      }
    }

    if (resolvePostCollision(ball, 0.88)) {
      events.postHit = true;
    }

    // 4. Cap-to-Cap elastic collisions
    for (let i = 0; i < board.pieces.length; i++) {
      for (let j = i + 1; j < board.pieces.length; j++) {
        const a = board.pieces[i];
        const b = board.pieces[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.r + b.r;
        if (dist > 0.0001 && dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          const totalMass = a.mass + b.mass;
          a.x -= nx * overlap * (b.mass / totalMass);
          a.y -= ny * overlap * (b.mass / totalMass);
          b.x += nx * overlap * (a.mass / totalMass);
          b.y += ny * overlap * (a.mass / totalMass);

          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;
          if (velAlongNormal < 0) {
            const e = 0.83;
            const jImpulse = (-(1 + e) * velAlongNormal) / (1 / a.mass + 1 / b.mass);
            a.vx -= (jImpulse / a.mass) * nx;
            a.vy -= (jImpulse / a.mass) * ny;
            b.vx += (jImpulse / b.mass) * nx;
            b.vy += (jImpulse / b.mass) * ny;
            events.capHitIntensity = Math.max(
              events.capHitIntensity,
              Math.min(1, Math.abs(velAlongNormal) / 700),
            );
          }
        }
      }
    }

    // 5. Cap-to-Ball elastic collisions
    for (const p of board.pieces) {
      const dx = ball.x - p.x;
      const dy = ball.y - p.y;
      const dist = Math.hypot(dx, dy);
      const minDist = p.r + ball.r;
      if (dist > 0.0001 && dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        const totalMass = p.mass + ball.mass;
        p.x -= nx * overlap * (ball.mass / totalMass);
        p.y -= ny * overlap * (ball.mass / totalMass);
        ball.x += nx * overlap * (p.mass / totalMass);
        ball.y += ny * overlap * (p.mass / totalMass);

        const rvx = ball.vx - p.vx;
        const rvy = ball.vy - p.vy;
        const velAlongNormal = rvx * nx + rvy * ny;
        if (velAlongNormal < 0) {
          const e = 0.91;
          const jImpulse = (-(1 + e) * velAlongNormal) / (1 / p.mass + 1 / ball.mass);
          p.vx -= (jImpulse / p.mass) * nx;
          p.vy -= (jImpulse / p.mass) * ny;
          ball.vx += (jImpulse / ball.mass) * nx;
          ball.vy += (jImpulse / ball.mass) * ny;

          board.lastTouch = { side: p.side, slotIndex: p.slotIndex, playerIndex: p.playerIndex };
          events.ballKickIntensity = Math.max(
            events.ballKickIntensity,
            Math.min(1, Math.abs(velAlongNormal) / 680),
          );
        }
      }
    }

    // 5b. Safety: no player may remain inside a goal cage; slide them to a defensive spot outside.
    for (const p of board.pieces) evacuatePieceFromGoal(p);

    // 6. Goal Line Technology check (whole ball crossed line)
    if (!events.goalScoredBy) {
      if (ball.y < PITCH.TOP - ball.r * 0.55 && inGoalMouthX) {
        events.goalScoredBy = 'host'; // Host attacks upward into top goal
        events.goalTouch = board.lastTouch ? { ...board.lastTouch } : null;
        events.ownGoal = Boolean(board.lastTouch && board.lastTouch.side !== 'host');
      } else if (ball.y > PITCH.BOTTOM + ball.r * 0.55 && inGoalMouthX) {
        events.goalScoredBy = 'guest'; // Guest attacks downward into bottom goal
        events.goalTouch = board.lastTouch ? { ...board.lastTouch } : null;
        events.ownGoal = Boolean(board.lastTouch && board.lastTouch.side !== 'guest');
      }
    }
  }

  return events;
}

export function isBoardAtRest(board: MatchBoardState): boolean {
  if (Math.hypot(board.ball.vx, board.ball.vy) > 4) return false;
  for (const p of board.pieces) {
    if (Math.hypot(p.vx, p.vy) > 4) return false;
  }
  return true;
}

// Tactical AI shot planner for Solo Cups (Guest side: defends TOP goal y=64, attacks BOTTOM goal y=896)
export function computeBotShot(
  board: MatchBoardState,
  difficulty: BotDifficulty = 'pro',
): { pieceId: string; vx: number; vy: number } {
  const myPieces = board.pieces.filter((p) => p.side === 'guest');
  const ball = board.ball;
  const targetGoalY = PITCH.BOTTOM + 14;
  const goalTargets = [245, 275, 300, 325, 355];

  interface Candidate {
    pieceId: string;
    vx: number;
    vy: number;
    score: number;
  }

  const candidates: Candidate[] = [];

  // Helper: check if another piece blocks a segment
  const countBlockers = (x1: number, y1: number, x2: number, y2: number, ignoreId: string): number => {
    let blockers = 0;
    const segDx = x2 - x1;
    const segDy = y2 - y1;
    const segLenSq = segDx * segDx + segDy * segDy;
    if (segLenSq < 1) return 0;

    for (const p of board.pieces) {
      if (p.id === ignoreId) continue;
      const t = Math.max(0, Math.min(1, ((p.x - x1) * segDx + (p.y - y1) * segDy) / segLenSq));
      const projX = x1 + t * segDx;
      const projY = y1 + t * segDy;
      const dist = Math.hypot(p.x - projX, p.y - projY);
      if (dist < p.r + PITCH.BALL_R + 4) {
        blockers++;
      }
    }
    return blockers;
  };

  for (const p of myPieces) {
    // 1. Direct cut shots toward goal targets
    for (const gx of goalTargets) {
      const toGoalX = gx - ball.x;
      const toGoalY = targetGoalY - ball.y;
      const toGoalLen = Math.hypot(toGoalX, toGoalY);
      const dirX = toGoalX / toGoalLen;
      const dirY = toGoalY / toGoalLen;

      // Impact point on ball opposite to goal direction
      const contactX = ball.x - dirX * (p.r + ball.r - 1);
      const contactY = ball.y - dirY * (p.r + ball.r - 1);

      const shotDx = contactX - p.x;
      const shotDy = contactY - p.y;
      const shotDist = Math.hypot(shotDx, shotDy);
      if (shotDist < 8) continue;

      const sDirX = shotDx / shotDist;
      const sDirY = shotDy / shotDist;

      // Alignment dot product (> 0.25 means clean forward cut, < 0 means impossible back-hit)
      const align = sDirX * dirX + sDirY * dirY;
      if (align < 0.22) continue;

      const blockersToBall = countBlockers(p.x, p.y, contactX, contactY, p.id);
      const blockersToGoal = countBlockers(ball.x, ball.y, gx, targetGoalY, p.id);

      // Avoid pulling GK out of goal unless ball is very close to own box
      const gkPenalty = p.slotIndex === 0 && ball.y > 260 ? 55 : 0;

      const powerFrac = Math.min(0.98, Math.max(0.58, (shotDist + toGoalLen * 0.65) / 680));
      const speed = p.maxSpeed * powerFrac;

      const score =
        align * 110 -
        shotDist * 0.11 -
        toGoalLen * 0.05 -
        blockersToBall * 75 -
        blockersToGoal * 38 -
        gkPenalty;

      candidates.push({
        pieceId: p.id,
        vx: sDirX * speed,
        vy: sDirY * speed,
        score,
      });
    }

    // 2. Emergency defensive clearance if ball is near Guest's own top goal (y < 290)
    if (ball.y < 310 && p.y < ball.y + 45) {
      const dx = ball.x - p.x;
      const dy = ball.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5 && dy > -15) {
        const speed = p.maxSpeed * 0.88;
        candidates.push({
          pieceId: p.id,
          vx: (dx / dist) * speed,
          vy: (dy / dist) * speed,
          score: 88 - dist * 0.15,
        });
      }
    }

    // 3. Fallback push ball forward downfield
    const dx = ball.x - p.x;
    const dy = ball.y - 12 - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 6) {
      const speed = p.maxSpeed * 0.76;
      const forwardBonus = p.y < ball.y ? 35 : -20;
      candidates.push({
        pieceId: p.id,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        score: forwardBonus - dist * 0.09 - (p.slotIndex === 0 ? 35 : 0),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const chosen = candidates[0] || {
    pieceId: myPieces[4].id,
    vx: 0,
    vy: 680,
    score: 0,
  };

  // Subtle human jitter depending on AI tier
  const jitterRad =
    difficulty === 'legend' ? 0.012 : difficulty === 'elite' ? 0.03 : difficulty === 'pro' ? 0.055 : 0.105;
  const angle = Math.atan2(chosen.vy, chosen.vx) + (Math.random() * 2 - 1) * jitterRad;
  const mag = Math.hypot(chosen.vx, chosen.vy) * (0.96 + Math.random() * 0.07);

  return {
    pieceId: chosen.pieceId,
    vx: Math.cos(angle) * mag,
    vy: Math.sin(angle) * mag,
  };
}
