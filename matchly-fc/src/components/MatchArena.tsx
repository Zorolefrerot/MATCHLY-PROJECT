import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Flag, RotateCcw, Sparkles, Shield, Crosshair, SlidersHorizontal } from 'lucide-react';
import { EuroTeam, FormationId, SquadPlayer } from '../data/teams';
import { DEFAULT_SETTINGS, GameSettings, TURF_PALETTES } from '../lib/settings';
import {
  applyShotToBoard,
  cloneBoard,
  computeBotShot,
  createInitialBoard,
  DiscPiece,
  isBoardAtRest,
  MatchBoardState,
  PITCH,
  Side,
  stepPhysics,
} from '../engine/physics';
import { soundEngine } from '../engine/audio';
import { DualRoomConnection, newMsgId, patchRoomRecord, RealtimePacket } from '../lib/roomSync';
import { TeamCrest } from './TeamCrest';

export interface MatchFinishSummary {
  winner: Side;
  hostScore: number;
  guestScore: number;
  forfeited?: boolean;
}

interface Props {
  mode: 'online_room' | 'solo_cup';
  roomCode?: string;
  mySide: Side; // 'host' in solo_cup, 'host' or 'guest' in online_room
  hostName: string;
  hostTeam: EuroTeam;
  hostFormation: FormationId;
  guestName: string;
  guestTeam: EuroTeam;
  guestFormation: FormationId;
  targetGoals: number;
  turnSeconds: number;
  botDifficulty?: 'pro' | 'elite' | 'legend';
  cupStageLabel?: string;
  initialBoard?: MatchBoardState;
  settings?: GameSettings;
  onOpenSettings?: () => void;
  onMatchFinished: (summary: MatchFinishSummary) => void;
  onExitArena: () => void;
}

interface GoalBannerInfo {
  scoringSide: Side;
  scorer: SquadPlayer;
  team: EuroTeam;
  hostScore: number;
  guestScore: number;
}

interface BallTrailPoint {
  x: number;
  y: number;
  alpha: number;
}

const QUICK_CHATS = ['Bien joué !', 'Quel tir !', 'Poteau !', 'Solide !', 'Encore un !'];

export const MatchArena: React.FC<Props> = ({
  mode,
  roomCode,
  mySide,
  hostName,
  hostTeam,
  hostFormation,
  guestName,
  guestTeam,
  guestFormation,
  targetGoals,
  turnSeconds,
  botDifficulty = 'pro',
  cupStageLabel,
  initialBoard,
  settings = DEFAULT_SETTINGS,
  onOpenSettings,
  onMatchFinished,
  onExitArena,
}) => {
  const settingsRef = useRef<GameSettings>(settings);
  settingsRef.current = settings;
  const shakeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardRef = useRef<MatchBoardState>(
    initialBoard
      ? cloneBoard(initialBoard)
      : createInitialBoard(hostTeam, hostFormation, guestTeam, guestFormation, 'host', 0, 0, targetGoals, 1),
  );

  const phaseRef = useRef<'aiming' | 'simulating' | 'goal_pause' | 'finished'>('aiming');
  const [phaseUi, setPhaseUi] = useState<'aiming' | 'simulating' | 'goal_pause' | 'finished'>('aiming');
  const [turnUi, setTurnUi] = useState<Side>(boardRef.current.turn);
  const [scoresUi, setScoresUi] = useState({
    host: boardRef.current.hostScore,
    guest: boardRef.current.guestScore,
  });
  const [timeLeft, setTimeLeft] = useState<number>(turnSeconds);
  const [goalBanner, setGoalBanner] = useState<GoalBannerInfo | null>(null);
  const [winnerSide, setWinnerSide] = useState<Side | null>(null);
  const [peerOnline, setPeerOnline] = useState<boolean>(mode === 'solo_cup');
  const [muted, setMuted] = useState<boolean>(soundEngine.muted);
  const [emoteToast, setEmoteToast] = useState<{ side: Side; text: string } | null>(null);
  const [rematchWantedByPeer, setRematchWantedByPeer] = useState(false);
  const [rematchSent, setRematchSent] = useState(false);

  // Drag aiming state (stored in canonical world coords)
  const dragRef = useRef<{
    pieceId: string;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Opponent live aim indicator
  const peerAimRef = useRef<{ side: Side; pieceId: string | null; power01: number } | null>(null);
  const lastAimSentAtRef = useRef<number>(0);

  // Visual FX refs
  const trailRef = useRef<BallTrailPoint[]>([]);
  const postFlashRef = useRef<number>(0);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const connRef = useRef<DualRoomConnection | null>(null);
  const finishedReportedRef = useRef<boolean>(false);

  // Coordinate transform helpers: if mySide === 'guest', mirror world <-> view so my team is always at bottom!
  const toView = (wx: number, wy: number) =>
    mySide === 'guest' ? { x: PITCH.W - wx, y: PITCH.H - wy } : { x: wx, y: wy };

  const toWorld = (vx: number, vy: number) =>
    mySide === 'guest' ? { x: PITCH.W - vx, y: PITCH.H - vy } : { x: vx, y: vy };

  // Preload all 10 player portraits
  useEffect(() => {
    const allPlayers = [...hostTeam.players, ...guestTeam.players];
    for (const p of allPlayers) {
      if (!imageCacheRef.current.has(p.photo)) {
        const img = new Image();
        img.src = p.photo;
        imageCacheRef.current.set(p.photo, img);
      }
    }
    soundEngine.playWhistle(false);
    soundEngine.startStadiumAmbience();
    return () => {
      soundEngine.stopStadiumAmbience();
    };
  }, [hostTeam, guestTeam]);

  // Trigger shot execution (local, bot, or remote packet)
  const executeShot = (
    pieceId: string,
    vx: number,
    vy: number,
    snapshotBefore?: MatchBoardState,
    broadcast = false,
  ) => {
    if (phaseRef.current === 'finished') return;

    if (snapshotBefore) {
      boardRef.current = cloneBoard(snapshotBefore);
    }

    const beforeCopy = cloneBoard(boardRef.current);
    const applied = applyShotToBoard(boardRef.current, pieceId, vx, vy);
    if (!applied) return;

    const piece = boardRef.current.pieces.find((p) => p.id === pieceId);
    const speed01 = piece ? Math.min(1, Math.hypot(vx, vy) / piece.maxSpeed) : 0.7;
    soundEngine.playKick(speed01);

    dragRef.current = null;
    peerAimRef.current = null;
    phaseRef.current = 'simulating';
    setPhaseUi('simulating');

    if (broadcast && connRef.current) {
      connRef.current.send({
        type: 'shot',
        msgId: newMsgId(),
        side: mySide,
        turnNumber: beforeCopy.turnNumber,
        pieceId,
        vx,
        vy,
        boardBefore: beforeCopy,
      });
    }
  };

  // Setup Dual Realtime Connection in online_room mode
  useEffect(() => {
    if (mode !== 'online_room' || !roomCode) return;

    const conn = new DualRoomConnection(
      roomCode,
      mySide,
      (pkt: RealtimePacket) => {
        if (pkt.type === 'shot') {
          if (pkt.side !== mySide) {
            executeShot(pkt.pieceId, pkt.vx, pkt.vy, pkt.boardBefore, false);
          }
        } else if (pkt.type === 'aim_focus') {
          if (pkt.side !== mySide) {
            peerAimRef.current = pkt.pieceId
              ? { side: pkt.side, pieceId: pkt.pieceId, power01: pkt.power01 }
              : null;
          }
        } else if (pkt.type === 'turn_timeout') {
          if (phaseRef.current === 'aiming') {
            boardRef.current.turn = pkt.nextTurn;
            boardRef.current.turnNumber = pkt.turnNumber;
            setTurnUi(pkt.nextTurn);
            setTimeLeft(turnSeconds);
          }
        } else if (pkt.type === 'sync_board') {
          if (mySide === 'guest' && phaseRef.current === 'aiming') {
            boardRef.current = cloneBoard(pkt.board);
            setTurnUi(pkt.board.turn);
            setScoresUi({ host: pkt.board.hostScore, guest: pkt.board.guestScore });
          }
        } else if (pkt.type === 'emote') {
          setEmoteToast({ side: pkt.side, text: pkt.text });
          setTimeout(() => setEmoteToast(null), 2600);
        } else if (pkt.type === 'rematch_request') {
          if (pkt.side !== mySide) {
            setRematchWantedByPeer(true);
          }
        } else if (pkt.type === 'room_patch' && pkt.room) {
          if (pkt.room.winner_side && phaseRef.current !== 'finished') {
            phaseRef.current = 'finished';
            setPhaseUi('finished');
            setWinnerSide(pkt.room.winner_side);
            if (!finishedReportedRef.current) {
              finishedReportedRef.current = true;
              onMatchFinished({
                winner: pkt.room.winner_side,
                hostScore: pkt.room.host_score ?? boardRef.current.hostScore,
                guestScore: pkt.room.guest_score ?? boardRef.current.guestScore,
              });
            }
          }
        }
      },
      (online) => setPeerOnline(online),
    );

    connRef.current = conn;
    return () => {
      conn.destroy();
      connRef.current = null;
    };
  }, [mode, roomCode, mySide]);

  // Handle Rematch handshake when both sides agree
  useEffect(() => {
    if (rematchSent && rematchWantedByPeer) {
      const fresh = createInitialBoard(
        hostTeam,
        hostFormation,
        guestTeam,
        guestFormation,
        'host',
        0,
        0,
        targetGoals,
        1,
      );
      boardRef.current = fresh;
      finishedReportedRef.current = false;
      setWinnerSide(null);
      setGoalBanner(null);
      setScoresUi({ host: 0, guest: 0 });
      setTurnUi('host');
      setTimeLeft(turnSeconds);
      setRematchSent(false);
      setRematchWantedByPeer(false);
      phaseRef.current = 'aiming';
      setPhaseUi('aiming');
      soundEngine.playWhistle(false);
      if (roomCode && mySide === 'host') {
        patchRoomRecord(roomCode, {
          status: 'playing',
          host_score: 0,
          guest_score: 0,
          winner_side: null,
          state_json: { board: fresh, guestReady: true },
        });
      }
    }
  }, [rematchSent, rematchWantedByPeer]);

  // Turn countdown timer
  useEffect(() => {
    if (phaseUi !== 'aiming') return;
    setTimeLeft(turnSeconds);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Host (or solo client) is authoritative on turn timeout
          if (mode === 'solo_cup' || mySide === 'host') {
            const nextSide: Side = boardRef.current.turn === 'host' ? 'guest' : 'host';
            const nextTurnNum = boardRef.current.turnNumber + 1;
            boardRef.current.turn = nextSide;
            boardRef.current.turnNumber = nextTurnNum;
            dragRef.current = null;
            setTurnUi(nextSide);
            if (connRef.current) {
              connRef.current.send({
                type: 'turn_timeout',
                msgId: newMsgId(),
                nextTurn: nextSide,
                turnNumber: nextTurnNum,
              });
            }
          }
          return turnSeconds;
        }
        if (prev <= 5 && boardRef.current.turn === mySide) {
          soundEngine.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phaseUi, turnUi, turnSeconds, mode, mySide]);

  // Solo Cup AI turn thinker
  useEffect(() => {
    if (mode !== 'solo_cup') return;
    if (phaseUi !== 'aiming' || turnUi !== 'guest') return;

    const delay = 650 + Math.random() * 520;
    const timer = setTimeout(() => {
      if (phaseRef.current !== 'aiming' || boardRef.current.turn !== 'guest') return;
      const shot = computeBotShot(boardRef.current, botDifficulty);
      peerAimRef.current = { side: 'guest', pieceId: shot.pieceId, power01: 0.8 };
      setTimeout(() => {
        if (phaseRef.current !== 'aiming' || boardRef.current.turn !== 'guest') return;
        executeShot(shot.pieceId, shot.vx, shot.vy, undefined, false);
      }, 360);
    }, delay);

    return () => clearTimeout(timer);
  }, [mode, phaseUi, turnUi, botDifficulty]);

  // Main 60fps Canvas Physics & Rendering Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const FIXED_DT = 1 / 60;
    let clackCooldown = 0;

    const handleGoalScored = (scoringSide: Side) => {
      phaseRef.current = 'goal_pause';
      setPhaseUi('goal_pause');
      if (settingsRef.current.cameraShake) shakeRef.current = 12;
      soundEngine.playGoalCelebration();

      const b = boardRef.current;
      if (scoringSide === 'host') b.hostScore += 1;
      else b.guestScore += 1;

      const newHostScore = b.hostScore;
      const newGuestScore = b.guestScore;
      setScoresUi({ host: newHostScore, guest: newGuestScore });

      const scoringTeam = scoringSide === 'host' ? hostTeam : guestTeam;
      let scorerIdx = 4; // default striker
      if (b.lastTouch && b.lastTouch.side === scoringSide) {
        scorerIdx = b.lastTouch.slotIndex;
      }
      const scorer = scoringTeam.players[scorerIdx] || scoringTeam.players[4];

      setGoalBanner({
        scoringSide,
        scorer,
        team: scoringTeam,
        hostScore: newHostScore,
        guestScore: newGuestScore,
      });

      const matchWon = newHostScore >= targetGoals || newGuestScore >= targetGoals;

      setTimeout(() => {
        setGoalBanner(null);
        if (matchWon) {
          const champ: Side = newHostScore > newGuestScore ? 'host' : 'guest';
          phaseRef.current = 'finished';
          setPhaseUi('finished');
          setWinnerSide(champ);
          soundEngine.playWhistle(true);

          if (mode === 'online_room' && roomCode && mySide === 'host') {
            patchRoomRecord(roomCode, {
              status: 'finished',
              host_score: newHostScore,
              guest_score: newGuestScore,
              winner_side: champ,
              state_json: { board: b, guestReady: true },
            });
          }

          if (!finishedReportedRef.current) {
            finishedReportedRef.current = true;
            onMatchFinished({
              winner: champ,
              hostScore: newHostScore,
              guestScore: newGuestScore,
            });
          }
          return;
        }

        // Conceding side gets kickoff from center
        const kickoffSide: Side = scoringSide === 'host' ? 'guest' : 'host';
        const resetBoard = createInitialBoard(
          hostTeam,
          hostFormation,
          guestTeam,
          guestFormation,
          kickoffSide,
          newHostScore,
          newGuestScore,
          targetGoals,
          b.turnNumber + 1,
        );
        boardRef.current = resetBoard;
        trailRef.current = [];
        setTurnUi(kickoffSide);
        phaseRef.current = 'aiming';
        setPhaseUi('aiming');
        soundEngine.playWhistle(false);

        if (mode === 'online_room' && roomCode && mySide === 'host') {
          patchRoomRecord(roomCode, {
            host_score: newHostScore,
            guest_score: newGuestScore,
            state_json: { board: resetBoard, guestReady: true },
          });
        }
      }, 2350);
    };

    const renderFrame = (now: number) => {
      const elapsed = Math.min(0.06, (now - lastTime) / 1000);
      lastTime = now;
      clackCooldown = Math.max(0, clackCooldown - elapsed);
      postFlashRef.current = Math.max(0, postFlashRef.current - elapsed * 2.5);

      if (phaseRef.current === 'simulating' || phaseRef.current === 'goal_pause') {
        accumulator += elapsed;
        while (accumulator >= FIXED_DT) {
          accumulator -= FIXED_DT;
          const ev = stepPhysics(boardRef.current, FIXED_DT);

          if (ev.postHit) {
            postFlashRef.current = 1;
            if (settingsRef.current.cameraShake) shakeRef.current = 8;
            soundEngine.playPostClang();
          }
          if (ev.capHitIntensity > 0.12 && clackCooldown <= 0) {
            soundEngine.playCapClack(ev.capHitIntensity);
            clackCooldown = 0.055;
          }
          if (ev.ballKickIntensity > 0.16 && clackCooldown <= 0) {
            soundEngine.playKick(ev.ballKickIntensity * 0.75);
            clackCooldown = 0.055;
          }

          const bSpeed = Math.hypot(boardRef.current.ball.vx, boardRef.current.ball.vy);
          if (settingsRef.current.highParticles && bSpeed > 320) {
            trailRef.current.push({
              x: boardRef.current.ball.x,
              y: boardRef.current.ball.y,
              alpha: Math.min(0.55, bSpeed / 1400),
            });
            if (trailRef.current.length > 14) trailRef.current.shift();
          }

          if (phaseRef.current === 'simulating' && ev.goalScoredBy) {
            handleGoalScored(ev.goalScoredBy);
          } else if (phaseRef.current === 'simulating' && isBoardAtRest(boardRef.current)) {
            // Turn finished cleanly — switch turn
            const b = boardRef.current;
            const nextTurn: Side = b.turn === 'host' ? 'guest' : 'host';
            b.turn = nextTurn;
            b.turnNumber += 1;
            setTurnUi(nextTurn);
            phaseRef.current = 'aiming';
            setPhaseUi('aiming');

            if (mode === 'online_room' && mySide === 'host') {
              connRef.current?.send({
                type: 'sync_board',
                msgId: newMsgId(),
                board: cloneBoard(b),
              });
              if (roomCode) {
                patchRoomRecord(roomCode, {
                  state_json: { board: b, guestReady: true },
                });
              }
            }
            break;
          }
        }
      }

      // Decay ball trail
      for (const pt of trailRef.current) pt.alpha *= 0.88;
      trailRef.current = trailRef.current.filter((pt) => pt.alpha > 0.03);

      // Draw Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetW = Math.round(PITCH.W * dpr);
        const targetH = Math.round(PITCH.H * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          if (shakeRef.current > 0.25 && settingsRef.current.cameraShake) {
            const sx = (Math.random() * 2 - 1) * shakeRef.current;
            const sy = (Math.random() * 2 - 1) * shakeRef.current;
            ctx.translate(sx, sy);
            shakeRef.current *= 0.86;
          } else {
            shakeRef.current = 0;
          }
          drawPitchAndEntities(ctx, now);
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    const drawPitchAndEntities = (ctx: CanvasRenderingContext2D, nowMs: number) => {
      const cfg = settingsRef.current;
      const palette = TURF_PALETTES[cfg.turfTheme] || TURF_PALETTES.ucl_night;

      // 1. Stadium surround dark turf apron
      ctx.fillStyle = palette.apron;
      ctx.fillRect(0, 0, PITCH.W, PITCH.H);

      const fieldW = PITCH.RIGHT - PITCH.LEFT;
      const fieldH = PITCH.BOTTOM - PITCH.TOP;

      // 2. Mowed turf stripes
      const numStripes = 12;
      const stripeH = fieldH / numStripes;
      for (let i = 0; i < numStripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? palette.stripeA : palette.stripeB;
        ctx.fillRect(PITCH.LEFT, PITCH.TOP + i * stripeH, fieldW, stripeH + 0.5);
      }

      // Subtle floodlight radial sheen
      const rad = ctx.createRadialGradient(PITCH.W / 2, PITCH.H / 2, 40, PITCH.W / 2, PITCH.H / 2, 540);
      rad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
      rad.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
      ctx.fillStyle = rad;
      ctx.fillRect(PITCH.LEFT, PITCH.TOP, fieldW, fieldH);

      // 3. Top & Bottom Goal Nets
      const opponentTeam = mySide === 'host' ? guestTeam : hostTeam;
      const myTeam = mySide === 'host' ? hostTeam : guestTeam;

      const drawGoalNet = (isTopViewGoal: boolean, accentColor: string) => {
        const yStart = isTopViewGoal ? PITCH.GOAL_TOP_BACK : PITCH.BOTTOM;
        const h = PITCH.TOP - PITCH.GOAL_TOP_BACK;
        const gW = PITCH.GOAL_RIGHT - PITCH.GOAL_LEFT;

        ctx.save();
        ctx.fillStyle = 'rgba(8, 15, 19, 0.62)';
        ctx.fillRect(PITCH.GOAL_LEFT, yStart, gW, h);

        // Net mesh lines
        ctx.strokeStyle = 'rgba(240, 246, 242, 0.24)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = PITCH.GOAL_LEFT + 12; x < PITCH.GOAL_RIGHT; x += 12) {
          ctx.moveTo(x, yStart);
          ctx.lineTo(x, yStart + h);
        }
        for (let y = yStart + 10; y < yStart + h; y += 10) {
          ctx.moveTo(PITCH.GOAL_LEFT, y);
          ctx.lineTo(PITCH.GOAL_RIGHT, y);
        }
        ctx.stroke();

        // Goal frame back & sides
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        if (isTopViewGoal) {
          ctx.moveTo(PITCH.GOAL_LEFT, PITCH.TOP);
          ctx.lineTo(PITCH.GOAL_LEFT, PITCH.GOAL_TOP_BACK);
          ctx.lineTo(PITCH.GOAL_RIGHT, PITCH.GOAL_TOP_BACK);
          ctx.lineTo(PITCH.GOAL_RIGHT, PITCH.TOP);
        } else {
          ctx.moveTo(PITCH.GOAL_LEFT, PITCH.BOTTOM);
          ctx.lineTo(PITCH.GOAL_LEFT, PITCH.GOAL_BOTTOM_BACK);
          ctx.lineTo(PITCH.GOAL_RIGHT, PITCH.GOAL_BOTTOM_BACK);
          ctx.lineTo(PITCH.GOAL_RIGHT, PITCH.BOTTOM);
        }
        ctx.stroke();

        // Colored team trim bar behind net
        ctx.fillStyle = accentColor;
        if (isTopViewGoal) {
          ctx.fillRect(PITCH.GOAL_LEFT, PITCH.GOAL_TOP_BACK - 4, gW, 4);
        } else {
          ctx.fillRect(PITCH.GOAL_LEFT, PITCH.GOAL_BOTTOM_BACK, gW, 4);
        }
        ctx.restore();
      };

      drawGoalNet(true, opponentTeam.kitPrimary);
      drawGoalNet(false, myTeam.kitPrimary);

      // 4. Chalk Pitch Markings
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 2.6;

      // Outer touchline with corner bevels
      const bev = PITCH.CORNER_BEVEL;
      ctx.beginPath();
      ctx.moveTo(PITCH.LEFT + bev, PITCH.TOP);
      ctx.lineTo(PITCH.RIGHT - bev, PITCH.TOP);
      ctx.lineTo(PITCH.RIGHT, PITCH.TOP + bev);
      ctx.lineTo(PITCH.RIGHT, PITCH.BOTTOM - bev);
      ctx.lineTo(PITCH.RIGHT - bev, PITCH.BOTTOM);
      ctx.lineTo(PITCH.LEFT + bev, PITCH.BOTTOM);
      ctx.lineTo(PITCH.LEFT, PITCH.BOTTOM - bev);
      ctx.lineTo(PITCH.LEFT, PITCH.TOP + bev);
      ctx.closePath();
      ctx.stroke();

      // Halfway line & center circle
      ctx.beginPath();
      ctx.moveTo(PITCH.LEFT, PITCH.H / 2);
      ctx.lineTo(PITCH.RIGHT, PITCH.H / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(PITCH.W / 2, PITCH.H / 2, 68, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#F5FAF6';
      ctx.beginPath();
      ctx.arc(PITCH.W / 2, PITCH.H / 2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Top & Bottom Penalty Boxes & Arcs
      const penW = 312;
      const penH = 128;
      const sixW = 216;
      const sixH = 48;

      // Top box
      ctx.strokeRect((PITCH.W - penW) / 2, PITCH.TOP, penW, penH);
      ctx.strokeRect((PITCH.W - sixW) / 2, PITCH.TOP, sixW, sixH);
      ctx.beginPath();
      ctx.arc(PITCH.W / 2, PITCH.TOP + 94, 52, 0.22 * Math.PI, 0.78 * Math.PI);
      ctx.stroke();

      // Bottom box
      ctx.strokeRect((PITCH.W - penW) / 2, PITCH.BOTTOM - penH, penW, penH);
      ctx.strokeRect((PITCH.W - sixW) / 2, PITCH.BOTTOM - sixH, sixW, sixH);
      ctx.beginPath();
      ctx.arc(PITCH.W / 2, PITCH.BOTTOM - 94, 52, 1.22 * Math.PI, 1.78 * Math.PI);
      ctx.stroke();

      // 5. Metallic Goalposts
      const viewPosts = [
        { x: PITCH.GOAL_LEFT, y: PITCH.TOP },
        { x: PITCH.GOAL_RIGHT, y: PITCH.TOP },
        { x: PITCH.GOAL_LEFT, y: PITCH.BOTTOM },
        { x: PITCH.GOAL_RIGHT, y: PITCH.BOTTOM },
      ];
      for (const post of viewPosts) {
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.beginPath();
        ctx.arc(post.x + 2, post.y + 3, PITCH.POST_R, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = postFlashRef.current > 0.1 ? '#FDE047' : '#F8FAFC';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(post.x, post.y, PITCH.POST_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      const b = boardRef.current;

      // 6. Slingshot Aiming Overlay (drawn beneath caps so it feels anchored to turf)
      if (dragRef.current && phaseRef.current === 'aiming' && b.turn === mySide) {
        const piece = b.pieces.find((p) => p.id === dragRef.current?.pieceId);
        if (piece) {
          const pView = toView(piece.x, piece.y);
          const curView = toView(dragRef.current.currentX, dragRef.current.currentY);

          // Pull vector: slingshot shoots opposite to drag; direct shoots toward drag
          const dirSign = cfg.aimMode === 'direct' ? -1 : 1;
          const pullDx = (pView.x - curView.x) * dirSign;
          const pullDy = (pView.y - curView.y) * dirSign;
          const pullDist = Math.hypot(pullDx, pullDy);
          const maxPull = 135 / cfg.shotSensitivity;

          if (pullDist >= 16) {
            const power01 = Math.min(1, pullDist / maxPull);
            const nx = pullDx / pullDist;
            const ny = pullDy / pullDist;
            const guideScale = cfg.aimGuide === 'off' ? 0 : cfg.aimGuide === 'short' ? 0.5 : 1.0;
            const guideLen = piece.aimLength * (0.42 + power01 * 0.58) * guideScale;

            const powerColor =
              power01 < 0.45 ? '#B8FF00' : power01 < 0.8 ? '#FBBF24' : '#F87171';

            // Power ring around cap
            ctx.save();
            ctx.strokeStyle = powerColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(
              pView.x,
              pView.y,
              piece.r + 10,
              -Math.PI / 2,
              -Math.PI / 2 + Math.PI * 2 * power01,
            );
            ctx.stroke();

            // Pull-back tension line + finger handle
            const clampedPullX = pView.x - nx * Math.min(pullDist, maxPull);
            const clampedPullY = pView.y - ny * Math.min(pullDist, maxPull);
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pView.x, pView.y);
            ctx.lineTo(clampedPullX, clampedPullY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = powerColor;
            ctx.beginPath();
            ctx.arc(clampedPullX, clampedPullY, 8, 0, Math.PI * 2);
            ctx.fill();

            // Forward trajectory tapered beam + dots
            if (guideLen > 6) {
              const endX = pView.x + nx * guideLen;
              const endY = pView.y + ny * guideLen;

              const grad = ctx.createLinearGradient(pView.x, pView.y, endX, endY);
              grad.addColorStop(0, powerColor);
              grad.addColorStop(1, 'rgba(255,255,255,0)');

              ctx.strokeStyle = grad;
              ctx.lineWidth = 5;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(pView.x + nx * (piece.r + 4), pView.y + ny * (piece.r + 4));
              ctx.lineTo(endX, endY);
              ctx.stroke();

              // Arrowhead
              const headLen = 11;
              const angle = Math.atan2(ny, nx);
              ctx.fillStyle = powerColor;
              ctx.beginPath();
              ctx.moveTo(endX, endY);
              ctx.lineTo(
                endX - headLen * Math.cos(angle - 0.45),
                endY - headLen * Math.sin(angle - 0.45),
              );
              ctx.lineTo(
                endX - headLen * Math.cos(angle + 0.45),
                endY - headLen * Math.sin(angle + 0.45),
              );
              ctx.closePath();
              ctx.fill();
            }

            // Power % tag
            const squadPlayer = (mySide === 'host' ? hostTeam : guestTeam).players[piece.slotIndex];
            ctx.fillStyle = 'rgba(11, 18, 22, 0.88)';
            ctx.beginPath();
            ctx.roundRect(pView.x - 54, pView.y - piece.r - 36, 108, 22, 6);
            ctx.fill();
            ctx.fillStyle = '#F8FAFC';
            ctx.font = "700 11px 'Plus Jakarta Sans', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(
              `${squadPlayer.shortName} · ${Math.round(power01 * 100)}%`,
              pView.x,
              pView.y - piece.r - 21,
            );
            ctx.restore();
          } else {
            // Cancel zone indicator
            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.beginPath();
            ctx.roundRect(pView.x - 48, pView.y - piece.r - 34, 96, 20, 6);
            ctx.fill();
            ctx.fillStyle = '#94A3B8';
            ctx.font = "600 10px 'Plus Jakarta Sans', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText('Annuler le tir', pView.x, pView.y - piece.r - 20);
            ctx.restore();
          }
        }
      }

      // 7. Ball Velocity Trail
      for (const pt of trailRef.current) {
        const vPt = toView(pt.x, pt.y);
        ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(vPt.x, vPt.y, PITCH.BALL_R * 0.72, 0, Math.PI * 2);
        ctx.fill();
      }

      // 8. Draw 10 Player Caps with Real Cropped Portraits
      const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.006);

      for (const p of b.pieces) {
        const vPos = toView(p.x, p.y);
        const team = p.side === 'host' ? hostTeam : guestTeam;
        const playerInfo = team.players[p.slotIndex];
        const isGk = p.slotIndex === 0;
        const isSelectable =
          phaseRef.current === 'aiming' && b.turn === mySide && p.side === mySide;
        const isPeerAiming =
          peerAimRef.current && peerAimRef.current.pieceId === p.id && phaseRef.current === 'aiming';

        // Ready aura for active player's 5 pieces
        if (isSelectable) {
          ctx.strokeStyle = `rgba(229, 169, 60, ${0.32 + pulse * 0.42})`;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(vPos.x, vPos.y, p.r + 5 + pulse * 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (isPeerAiming) {
          ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
          ctx.lineWidth = 3;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(vPos.x, vPos.y, p.r + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Turf drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.arc(vPos.x + 1.5, vPos.y + 4, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Outer tactile Subbuteo cap base
        const ringColor = isGk ? team.gkColor : team.kitPrimary;
        ctx.fillStyle = ringColor;
        ctx.beginPath();
        ctx.arc(vPos.x, vPos.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Secondary kit accent half-arc on rim
        if (!isGk) {
          ctx.strokeStyle = team.kitSecondary;
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          ctx.arc(vPos.x, vPos.y, p.r - 2.1, Math.PI * 0.15, Math.PI * 0.85);
          ctx.stroke();
        }

        // Outer crisp border differentiating sides clearly
        ctx.strokeStyle = p.side === mySide ? '#F8FAFC' : '#0F172A';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(vPos.x, vPos.y, p.r, 0, Math.PI * 2);
        ctx.stroke();

        // Portrait circular clip inside cap
        const innerR = p.r - 5.2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(vPos.x, vPos.y, innerR, 0, Math.PI * 2);
        ctx.clip();

        const img = imageCacheRef.current.get(playerInfo.photo);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, vPos.x - innerR, vPos.y - innerR, innerR * 2, innerR * 2);
        } else {
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(vPos.x - innerR, vPos.y - innerR, innerR * 2, innerR * 2);
        }
        ctx.restore();

        // Inner metallic trim ring
        ctx.strokeStyle = team.kitTrim;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(vPos.x, vPos.y, innerR, 0, Math.PI * 2);
        ctx.stroke();

        // Shirt number micro-badge
        const badgeX = vPos.x + p.r * 0.64;
        const badgeY = vPos.y + p.r * 0.62;
        ctx.fillStyle = '#0B1215';
        ctx.strokeStyle = team.kitTrim;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 8.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = "800 9px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(playerInfo.number), badgeX, badgeY + 0.5);

        // Player short name tag according to nameplate setting
        const showNameplate =
          cfg.nameplates === 'always' ||
          (cfg.nameplates === 'stationary' && Math.hypot(p.vx, p.vy) < 12);
        if (showNameplate) {
          ctx.font = "700 9.5px 'Plus Jakarta Sans', sans-serif";
          const label = playerInfo.shortName;
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(9, 14, 18, 0.74)';
          ctx.beginPath();
          ctx.roundRect(vPos.x - tw / 2 - 4.5, vPos.y + p.r + 3, tw + 9, 13.5, 4);
          ctx.fill();

          ctx.fillStyle = p.side === mySide ? '#F8FAFC' : '#CBD5E1';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, vPos.x, vPos.y + p.r + 10);
        }
      }

      // 9. Draw Match Ball
      const vBall = toView(b.ball.x, b.ball.y);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.arc(vBall.x + 2, vBall.y + 3.5, b.ball.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(vBall.x, vBall.y);
      ctx.rotate(b.ball.spinAngle);

      const ballGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, b.ball.r);
      ballGrad.addColorStop(0, '#FFFFFF');
      ballGrad.addColorStop(0.75, '#E2E8F0');
      ballGrad.addColorStop(1, '#94A3B8');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(0, 0, b.ball.r, 0, Math.PI * 2);
      ctx.fill();

      // Classic pentagon/star panels
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const px = Math.cos(a) * 5.6;
        const py = Math.sin(a) * 5.6;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 5.2, Math.sin(a) * 5.2);
        ctx.lineTo(Math.cos(a) * (b.ball.r - 1), Math.sin(a) * (b.ball.r - 1));
        ctx.stroke();
      }

      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, b.ball.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [hostTeam, guestTeam, hostFormation, guestFormation, mySide, mode, roomCode, targetGoals]);

  // Pointer event handlers on Canvas (works seamlessly for Touch & Mouse)
  const getCanvasLogicalPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * PITCH.W;
    const vy = ((e.clientY - rect.top) / rect.height) * PITCH.H;
    return toWorld(vx, vy);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'aiming') return;
    if (boardRef.current.turn !== mySide) return;

    const pt = getCanvasLogicalPoint(e);
    let closest: DiscPiece | null = null;
    let bestDist = Infinity;

    for (const p of boardRef.current.pieces) {
      if (p.side !== mySide) continue;
      const d = Math.hypot(p.x - pt.x, p.y - pt.y);
      if (d <= p.r + 18 && d < bestDist) {
        bestDist = d;
        closest = p;
      }
    }

    if (closest) {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pieceId: closest.id,
        currentX: pt.x,
        currentY: pt.y,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const pt = getCanvasLogicalPoint(e);
    dragRef.current.currentX = pt.x;
    dragRef.current.currentY = pt.y;

    // Throttled live aim focus telemetry to opponent
    const now = Date.now();
    if (mode === 'online_room' && connRef.current && now - lastAimSentAtRef.current > 110) {
      lastAimSentAtRef.current = now;
      const piece = boardRef.current.pieces.find((p) => p.id === dragRef.current?.pieceId);
      if (piece) {
        const pullDist = Math.hypot(piece.x - pt.x, piece.y - pt.y);
        connRef.current.send({
          type: 'aim_focus',
          msgId: newMsgId(),
          side: mySide,
          pieceId: piece.id,
          power01: Math.min(1, pullDist / 135),
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const drag = dragRef.current;
    dragRef.current = null;

    if (phaseRef.current !== 'aiming' || boardRef.current.turn !== mySide) return;
    const piece = boardRef.current.pieces.find((p) => p.id === drag.pieceId);
    if (!piece) return;

    const cfg = settingsRef.current;
    const dirSign = cfg.aimMode === 'direct' ? -1 : 1;
    const pullDx = (piece.x - drag.currentX) * dirSign;
    const pullDy = (piece.y - drag.currentY) * dirSign;
    const pullDist = Math.hypot(pullDx, pullDy);

    if (pullDist < 16) {
      // Cancelled shot
      if (mode === 'online_room' && connRef.current) {
        connRef.current.send({
          type: 'aim_focus',
          msgId: newMsgId(),
          side: mySide,
          pieceId: null,
          power01: 0,
        });
      }
      return;
    }

    const maxPull = 135 / cfg.shotSensitivity;
    const power01 = Math.min(1, pullDist / maxPull);
    const speed = piece.maxSpeed * (0.16 + 0.84 * Math.pow(power01, 1.08));
    const vx = (pullDx / pullDist) * speed;
    const vy = (pullDy / pullDist) * speed;

    executeShot(piece.id, vx, vy, undefined, mode === 'online_room');
  };

  const sendEmote = (text: string) => {
    setEmoteToast({ side: mySide, text });
    setTimeout(() => setEmoteToast(null), 2600);
    if (mode === 'online_room' && connRef.current) {
      connRef.current.send({
        type: 'emote',
        msgId: newMsgId(),
        side: mySide,
        text,
      });
    }
  };

  const handleForfeitOrQuit = () => {
    if (phaseRef.current !== 'finished') {
      const otherSide: Side = mySide === 'host' ? 'guest' : 'host';
      if (mode === 'online_room' && roomCode) {
        patchRoomRecord(roomCode, {
          status: 'finished',
          winner_side: otherSide,
        });
      }
      if (!finishedReportedRef.current) {
        finishedReportedRef.current = true;
        onMatchFinished({
          winner: otherSide,
          hostScore: scoresUi.host,
          guestScore: scoresUi.guest,
          forfeited: true,
        });
      }
    }
    onExitArena();
  };

  const isMyTurn = turnUi === mySide && phaseUi === 'aiming';
  const myTeamObj = mySide === 'host' ? hostTeam : guestTeam;
  const oppTeamObj = mySide === 'host' ? guestTeam : hostTeam;
  const myName = mySide === 'host' ? hostName : guestName;
  const oppName = mySide === 'host' ? guestName : hostName;
  const myScore = mySide === 'host' ? scoresUi.host : scoresUi.guest;
  const oppScore = mySide === 'host' ? scoresUi.guest : scoresUi.host;

  return (
    <div className="arena-shell">
      {/* Broadcast Top Scorebug */}
      <header className="scorebug-bar">
        <div className="scorebug-left">
          <button
            type="button"
            className="icon-pill-btn danger-subtle"
            onClick={handleForfeitOrQuit}
            title="Quitter le match"
          >
            <Flag size={15} />
            <span className="hide-xs">Quitter</span>
          </button>
          {roomCode && (
            <span className="arena-code-tag">
              SALON <strong>{roomCode}</strong>
              <span className={`online-dot ${peerOnline ? 'is-live' : ''}`} />
            </span>
          )}
          {cupStageLabel && <span className="arena-code-tag gold">{cupStageLabel}</span>}
        </div>

        <div className="scorebug-center">
          <div className={`scorebug-team ${mySide === turnUi ? 'active-turn' : ''}`}>
            <TeamCrest team={myTeamObj} size={28} />
            <div className="scorebug-team-meta">
              <span className="sb-code">{myTeamObj.code}</span>
              <span className="sb-coach">{myName}</span>
            </div>
          </div>

          <div className="scorebug-digits">
            <span>{myScore}</span>
            <span className="sb-sep">:</span>
            <span>{oppScore}</span>
          </div>

          <div className={`scorebug-team right ${mySide !== turnUi ? 'active-turn' : ''}`}>
            <div className="scorebug-team-meta align-right">
              <span className="sb-code">{oppTeamObj.code}</span>
              <span className="sb-coach">{oppName}</span>
            </div>
            <TeamCrest team={oppTeamObj} size={28} />
          </div>
        </div>

        <div className="scorebug-right">
          <div className={`turn-clock ${timeLeft <= 5 && phaseUi === 'aiming' ? 'urgent' : ''}`}>
            {phaseUi === 'aiming' ? `${timeLeft}s` : '•••'}
          </div>
          {onOpenSettings && (
            <button
              type="button"
              className="icon-pill-btn"
              onClick={onOpenSettings}
              title="Paramètres FC 27"
            >
              <SlidersHorizontal size={15} />
            </button>
          )}
          <button
            type="button"
            className="icon-pill-btn"
            onClick={() => setMuted(soundEngine.toggleMute())}
            title={muted ? 'Activer le son' : 'Couper le son'}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* Turn Status Strip */}
      <div className="arena-subbar">
        <div className={`turn-banner-pill ${isMyTurn ? 'yours' : 'theirs'}`}>
          {phaseUi === 'goal_pause' ? (
            <>BUT VALIDÉ · REMISE AU CENTRE</>
          ) : phaseUi === 'finished' ? (
            <>COUP DE SIFFLET FINAL</>
          ) : isMyTurn ? (
            <>
              <Crosshair size={14} /> À VOUS DE JOUER — Glissez un pion vers l’arrière pour viser
            </>
          ) : (
            <>
              <Shield size={14} /> Tour de {oppName} ({oppTeamObj.shortName})…
            </>
          )}
        </div>
        <span className="target-goals-hint">1er à {targetGoals} buts</span>
      </div>

      {/* Pitch Stage */}
      <div className="pitch-stage">
        <div className="pitch-canvas-frame">
          <canvas
            ref={canvasRef}
            className="pitch-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />

          {/* Quick Emote Toast */}
          {emoteToast && (
            <div className={`emote-floating ${emoteToast.side === mySide ? 'mine' : 'opp'}`}>
              <strong>{emoteToast.side === mySide ? myName : oppName} :</strong> {emoteToast.text}
            </div>
          )}

          {/* Broadcast Goal Overlay */}
          {goalBanner && (
            <div className="goal-broadcast-overlay">
              <div className="goal-broadcast-card">
                <div className="goal-wordmark">BUT !</div>
                <div className="goal-scorer-row">
                  <img
                    src={goalBanner.scorer.photo}
                    alt={goalBanner.scorer.name}
                    className="goal-scorer-avatar"
                  />
                  <div className="goal-scorer-info">
                    <span className="goal-team-tag">
                      <TeamCrest team={goalBanner.team} size={20} />
                      {goalBanner.team.name}
                    </span>
                    <h3>
                      #{goalBanner.scorer.number} {goalBanner.scorer.name}
                    </h3>
                    <div className="goal-live-score">
                      {hostTeam.code} {goalBanner.hostScore} — {goalBanner.guestScore} {guestTeam.code}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full-Time Result Modal */}
          {phaseUi === 'finished' && winnerSide && (
            <div className="fulltime-overlay">
              <div className="fulltime-card">
                <span className={`ft-badge ${winnerSide === mySide ? 'win' : 'loss'}`}>
                  {winnerSide === mySide ? 'VICTOIRE' : 'FIN DU MATCH'}
                </span>
                <h2>
                  {winnerSide === mySide
                    ? `${myTeamObj.name} s’impose !`
                    : `${oppTeamObj.name} remporte le duel`}
                </h2>

                <div className="ft-scoreboard">
                  <div className="ft-side">
                    <TeamCrest team={myTeamObj} size={50} />
                    <span>{myTeamObj.shortName}</span>
                    <small>{myName}</small>
                  </div>
                  <div className="ft-big-score">
                    {myScore} <span>-</span> {oppScore}
                  </div>
                  <div className="ft-side">
                    <TeamCrest team={oppTeamObj} size={50} />
                    <span>{oppTeamObj.shortName}</span>
                    <small>{oppName}</small>
                  </div>
                </div>

                {winnerSide === mySide && (
                  <div className="ft-reward-strip">
                    <Sparkles size={16} />
                    <span>
                      Trophées crédités sur votre palmarès · Vérifiez le Vestiaire pour les équipes débloquées !
                    </span>
                  </div>
                )}

                <div className="ft-actions">
                  {mode === 'online_room' && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={rematchSent}
                      onClick={() => {
                        setRematchSent(true);
                        connRef.current?.send({
                          type: 'rematch_request',
                          msgId: newMsgId(),
                          side: mySide,
                        });
                      }}
                    >
                      <RotateCcw size={16} />
                      {rematchSent
                        ? 'En attente de l’adversaire…'
                        : rematchWantedByPeer
                          ? 'Accepter la revanche !'
                          : 'Proposer une revanche'}
                    </button>
                  )}
                  <button type="button" className="btn-secondary" onClick={onExitArena}>
                    {mode === 'solo_cup' ? 'Continuer la compétition' : 'Retour au club'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tactical Quick-Reaction Bar */}
      {mode === 'online_room' && phaseUi !== 'finished' && (
        <div className="quick-chat-bar">
          {QUICK_CHATS.map((txt) => (
            <button key={txt} type="button" className="quick-chat-chip" onClick={() => sendEmote(txt)}>
              {txt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
