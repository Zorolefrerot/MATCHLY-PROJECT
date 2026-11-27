import { RealtimeChannel } from '@supabase/supabase-js';
import { FormationId } from '../data/teams';
import { MatchBoardState, Side } from '../engine/physics';
import { PlayerProfile, supabase } from './supabase';

export interface RoomRecord {
  code: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  competition_id: string | null;
  host_token: string;
  host_user_id: string | null;
  host_name: string;
  host_team: string;
  host_formation: FormationId;
  host_trophies: number;
  guest_token: string | null;
  guest_user_id: string | null;
  guest_name: string | null;
  guest_team: string | null;
  guest_formation: FormationId;
  guest_trophies: number;
  target_goals: number;
  turn_seconds: number;
  host_score: number;
  guest_score: number;
  winner_side: Side | null;
  state_json: {
    board?: MatchBoardState;
    guestReady?: boolean;
  };
}

export type RealtimePacket =
  | {
      type: 'shot';
      msgId: string;
      side: Side;
      turnNumber: number;
      pieceId: string;
      vx: number;
      vy: number;
      boardBefore: MatchBoardState;
    }
  | {
      type: 'aim_focus';
      msgId: string;
      side: Side;
      pieceId: string | null;
      power01: number;
    }
  | {
      type: 'turn_timeout';
      msgId: string;
      nextTurn: Side;
      turnNumber: number;
    }
  | {
      type: 'sync_board';
      msgId: string;
      board: MatchBoardState;
    }
  | {
      type: 'room_patch';
      msgId?: string;
      room: Partial<RoomRecord>;
    }
  | {
      type: 'emote';
      msgId: string;
      side: Side;
      text: string;
    }
  | {
      type: 'rematch_request';
      msgId: string;
      side: Side;
    };

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(len = 5): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function getClientSessionToken(): string {
  const key = 'matchly_fc_client_token';
  try {
    let tok = sessionStorage.getItem(key);
    if (!tok) {
      tok = 'tok_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
      sessionStorage.setItem(key, tok);
    }
    return tok;
  } catch {
    return 'tok_' + Math.random().toString(36).slice(2, 11);
  }
}

export async function createOnlineRoom(
  profile: PlayerProfile,
  targetGoals = 3,
  turnSeconds = 18,
  competitionId: string | null = null,
): Promise<{ room?: RoomRecord; error?: string }> {
  const code = generateRoomCode(5);
  const hostToken = getClientSessionToken();

  const payload: RoomRecord = {
    code,
    status: 'waiting',
    competition_id: competitionId,
    host_token: hostToken,
    host_user_id: profile.isGuest ? null : profile.id,
    host_name: profile.display_name,
    host_team: profile.favorite_team_id,
    host_formation: profile.selected_formation,
    host_trophies: profile.trophies,
    guest_token: null,
    guest_user_id: null,
    guest_name: null,
    guest_team: null,
    guest_formation: '1-2-2',
    guest_trophies: 0,
    target_goals: targetGoals,
    turn_seconds: turnSeconds,
    host_score: 0,
    guest_score: 0,
    winner_side: null,
    state_json: { guestReady: false },
  };

  // Mirror locally on same-origin /api/rooms (non-blocking)
  fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});

  const { data, error } = await supabase
    .from('fc_rooms')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    // Fallback to local room if Supabase unreachable
    return { room: payload };
  }

  return { room: data as RoomRecord };
}

export async function joinOnlineRoom(
  rawCode: string,
  profile: PlayerProfile,
): Promise<{ room?: RoomRecord; side?: Side; error?: string }> {
  const code = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  if (code.length < 4) {
    return { error: 'Veuillez saisir un code de salon valide (ex: K9M4X).' };
  }

  const myToken = getClientSessionToken();

  // Try Supabase first, then fallback to /api/rooms/:code
  let existing: RoomRecord | null = null;
  const { data } = await supabase
    .from('fc_rooms')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (data) {
    existing = data as RoomRecord;
  } else {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(code)}`);
      if (res.ok) {
        const json = await res.json();
        existing = json.room || null;
      }
    } catch {
      // ignore
    }
  }

  if (!existing) {
    return { error: `Aucun salon actif trouvé pour le code "${code}". Vérifiez le code avec votre adversaire.` };
  }

  // Reconnect as host if token or user matches
  if (existing.host_token === myToken || (!profile.isGuest && existing.host_user_id === profile.id)) {
    return { room: existing, side: 'host' };
  }

  // Reconnect as guest if token or user matches
  if (existing.guest_token === myToken || (!profile.isGuest && existing.guest_user_id === profile.id)) {
    return { room: existing, side: 'guest' };
  }

  if (existing.guest_token && existing.status === 'playing') {
    return { error: 'Ce salon est déjà complet et un match est en cours.' };
  }

  const patch: Partial<RoomRecord> = {
    status: existing.status === 'playing' ? 'playing' : 'ready',
    guest_token: myToken,
    guest_user_id: profile.isGuest ? null : profile.id,
    guest_name: profile.display_name,
    guest_team: profile.favorite_team_id,
    guest_formation: profile.selected_formation,
    guest_trophies: profile.trophies,
    state_json: {
      ...(existing.state_json || {}),
      guestReady: true,
    },
  };

  await patchRoomRecord(code, patch);
  return {
    room: { ...existing, ...patch } as RoomRecord,
    side: 'guest',
  };
}

export async function patchRoomRecord(code: string, patch: Partial<RoomRecord>) {
  fetch(`/api/rooms/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).catch(() => {});

  await supabase
    .from('fc_rooms')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('code', code);
}

export class DualRoomConnection {
  private code: string;
  private side: Side;
  private supaChannel: RealtimeChannel | null = null;
  private ws: WebSocket | null = null;
  private seenIds = new Set<string>();
  private onPacket: (pkt: RealtimePacket) => void;
  private onPeerOnline?: (online: boolean) => void;
  private closed = false;

  constructor(
    code: string,
    side: Side,
    onPacket: (pkt: RealtimePacket) => void,
    onPeerOnline?: (online: boolean) => void,
  ) {
    this.code = code.toUpperCase();
    this.side = side;
    this.onPacket = onPacket;
    this.onPeerOnline = onPeerOnline;
    this.connectSupabase();
    this.connectLocalWs();
  }

  private handleIncoming(pkt: RealtimePacket) {
    if (this.closed) return;
    if (pkt.msgId) {
      if (this.seenIds.has(pkt.msgId)) return;
      this.seenIds.add(pkt.msgId);
      if (this.seenIds.size > 400) {
        const first = this.seenIds.values().next().value;
        if (first) this.seenIds.delete(first);
      }
    }
    this.onPacket(pkt);
  }

  private connectSupabase() {
    const channel = supabase.channel(`match-room:${this.code}`, {
      config: {
        broadcast: { self: false },
        presence: { key: this.side },
      },
    });

    channel
      .on('broadcast', { event: 'game_pkt' }, ({ payload }) => {
        if (payload) this.handleIncoming(payload as RealtimePacket);
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fc_rooms',
          filter: `code=eq.${this.code}`,
        },
        (chg) => {
          if (chg.new) {
            this.handleIncoming({
              type: 'room_patch',
              room: chg.new as Partial<RoomRecord>,
            });
          }
        },
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherSide: Side = this.side === 'host' ? 'guest' : 'host';
        const isOnline = Boolean(state[otherSide] && state[otherSide].length > 0);
        this.onPeerOnline?.(isOnline);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ side: this.side, at: Date.now() });
        }
      });

    this.supaChannel = channel;
  }

  private connectLocalWs() {
    if (typeof window === 'undefined') return;
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join_room', code: this.code, side: this.side }));
      };
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(String(ev.data));
          if (data.type === 'peer_presence') {
            this.onPeerOnline?.(Boolean(data.online));
            return;
          }
          this.handleIncoming(data as RealtimePacket);
        } catch {
          // ignore
        }
      };
      this.ws = ws;
    } catch {
      // ignore if static hosting without /ws
    }
  }

  public send(pkt: RealtimePacket) {
    if (pkt.msgId) this.seenIds.add(pkt.msgId);

    if (this.supaChannel) {
      this.supaChannel
        .send({
          type: 'broadcast',
          event: 'game_pkt',
          payload: pkt,
        })
        .catch(() => {});
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(pkt));
    }
  }

  public destroy() {
    this.closed = true;
    if (this.supaChannel) {
      supabase.removeChannel(this.supaChannel);
      this.supaChannel = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }
}

export function newMsgId(): string {
  return Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
}
