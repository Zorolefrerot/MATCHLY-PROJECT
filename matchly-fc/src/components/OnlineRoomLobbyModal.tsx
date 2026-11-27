import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Link2, Play, Share2, Users, X } from 'lucide-react';
import { EURO_TEAMS, FormationId, FORMATIONS, getTeamById } from '../data/teams';
import { createInitialBoard, Side } from '../engine/physics';
import {
  DualRoomConnection,
  newMsgId,
  patchRoomRecord,
  RealtimePacket,
  RoomRecord,
} from '../lib/roomSync';
import { PlayerProfile } from '../lib/supabase';
import { TeamCrest } from './TeamCrest';

interface Props {
  room: RoomRecord;
  mySide: Side;
  profile: PlayerProfile;
  onUpdateTeamOrFormation: (teamId: string, formation: FormationId) => void;
  onMatchStart: (updatedRoom: RoomRecord) => void;
  onCancelLobby: () => void;
}

export const OnlineRoomLobbyModal: React.FC<Props> = ({
  room: initialRoom,
  mySide,
  profile,
  onUpdateTeamOrFormation,
  onMatchStart,
  onCancelLobby,
}) => {
  const [room, setRoom] = useState<RoomRecord>(initialRoom);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [peerOnline, setPeerOnline] = useState(Boolean(initialRoom.guest_name));
  const connRef = useRef<DualRoomConnection | null>(null);
  const startedRef = useRef(false);

  const unlockedTeams = EURO_TEAMS.filter((t) => profile.unlocked_teams.includes(t.id));

  useEffect(() => {
    const conn = new DualRoomConnection(
      room.code,
      mySide,
      (pkt: RealtimePacket) => {
        if (pkt.type === 'room_patch' && pkt.room) {
          setRoom((prev) => {
            const next = { ...prev, ...pkt.room } as RoomRecord;
            if (next.status === 'playing' && !startedRef.current) {
              startedRef.current = true;
              setTimeout(() => onMatchStart(next), 60);
            }
            return next;
          });
        }
      },
      (online) => setPeerOnline(online),
    );
    connRef.current = conn;

    // Poll fallback every 2s while waiting in lobby so code join is 100% instant even if WebSocket is warming up
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${encodeURIComponent(room.code)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.room) {
            setRoom((prev) => {
              const merged = { ...prev, ...json.room } as RoomRecord;
              if (merged.status === 'playing' && !startedRef.current) {
                startedRef.current = true;
                setTimeout(() => onMatchStart(merged), 60);
              }
              return merged;
            });
          }
        }
      } catch {
        // ignore
      }
    }, 1800);

    return () => {
      clearInterval(poll);
      conn.destroy();
    };
  }, [room.code, mySide]);

  const handleChangeMySetup = async (teamId: string, formation: FormationId) => {
    onUpdateTeamOrFormation(teamId, formation);
    const patch: Partial<RoomRecord> =
      mySide === 'host'
        ? { host_team: teamId, host_formation: formation }
        : { guest_team: teamId, guest_formation: formation };

    setRoom((prev) => ({ ...prev, ...patch }));
    await patchRoomRecord(room.code, patch);
    connRef.current?.send({
      type: 'room_patch',
      msgId: newMsgId(),
      room: patch,
    });
  };

  const handleHostKickoff = async () => {
    if (mySide !== 'host' || !room.guest_name || !room.guest_team) return;
    const hTeam = getTeamById(room.host_team);
    const gTeam = getTeamById(room.guest_team);
    const board = createInitialBoard(
      hTeam,
      room.host_formation,
      gTeam,
      room.guest_formation || '1-2-2',
      'host',
      0,
      0,
      room.target_goals,
      1,
    );

    const patch: Partial<RoomRecord> = {
      status: 'playing',
      state_json: { board, guestReady: true },
    };

    const nextRoom = { ...room, ...patch } as RoomRecord;
    startedRef.current = true;
    await patchRoomRecord(room.code, patch);
    connRef.current?.send({
      type: 'room_patch',
      msgId: newMsgId(),
      room: patch,
    });
    onMatchStart(nextRoom);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const copyInviteUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const hostTeam = getTeamById(room.host_team);
  const guestTeam = room.guest_team ? getTeamById(room.guest_team) : null;
  const myCurrentTeamId = mySide === 'host' ? room.host_team : room.guest_team || profile.favorite_team_id;
  const myCurrentFormation =
    mySide === 'host' ? room.host_formation : room.guest_formation || profile.selected_formation;

  return (
    <div className="modal-backdrop">
      <div className="modal-card lobby-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow-tag">VESTIAIRE D’AVANT-MATCH · MULTIJOUEUR TEMPS RÉEL</span>
            <h2>SALON DE MATCH EN LIGNE</h2>
          </div>
          <button type="button" className="icon-close-btn" onClick={onCancelLobby}>
            <X size={18} />
          </button>
        </div>

        {/* Shared Room Code Banner */}
        <div className="room-code-showcase">
          <div className="rcs-left">
            <span className="rcs-label">CODE À SAISIR PAR VOTRE ADVERSAIRE</span>
            <div className="rcs-digits">{room.code}</div>
            <small>
              1er à {room.target_goals} buts · {room.turn_seconds}s par coup de pied
            </small>
          </div>
          <div className="rcs-buttons">
            <button type="button" className="btn-secondary" onClick={copyCode}>
              {copiedCode ? <Check size={15} /> : <Copy size={15} />}
              {copiedCode ? 'Code copié' : 'Copier le code'}
            </button>
            <button type="button" className="btn-secondary" onClick={copyInviteUrl}>
              {copiedLink ? <Check size={15} /> : <Link2 size={15} />}
              {copiedLink ? 'Lien copié' : 'Lien direct'}
            </button>
          </div>
        </div>

        {/* VS Face-off Cards */}
        <div className="lobby-vs-grid">
          {/* Host Box */}
          <div className={`lobby-player-box ${mySide === 'host' ? 'is-me' : ''}`}>
            <span className="lp-role-tag">HÔTE · DOMICILE</span>
            <TeamCrest team={hostTeam} size={58} />
            <h3>{hostTeam.name}</h3>
            <p className="lp-coach-name">
              {room.host_name} · <span>{room.host_formation}</span>
            </p>
            <div className="mini-avatar-stack center">
              {hostTeam.players.slice(0,5).map((p) => (
                p.photo ? <img key={p.id} src={p.photo} alt={p.shortName} title={p.name} /> : <span key={p.id} className="mini-avatar-fallback" title={p.name}>{p.shortName.slice(0,2).toUpperCase()}</span>
              ))}
            </div>
          </div>

          <div className="lobby-vs-badge">VS</div>

          {/* Guest Box */}
          <div className={`lobby-player-box ${mySide === 'guest' ? 'is-me' : ''}`}>
            <span className="lp-role-tag">
              INVITÉ · EXTÉRIEUR {peerOnline && <b className="live-pill-dot">EN LIGNE</b>}
            </span>
            {guestTeam && room.guest_name ? (
              <>
                <TeamCrest team={guestTeam} size={58} />
                <h3>{guestTeam.name}</h3>
                <p className="lp-coach-name">
                  {room.guest_name} · <span>{room.guest_formation}</span>
                </p>
                <div className="mini-avatar-stack center">
                  {guestTeam.players.slice(0,5).map((p) => (
                    p.photo ? <img key={p.id} src={p.photo} alt={p.shortName} title={p.name} /> : <span key={p.id} className="mini-avatar-fallback" title={p.name}>{p.shortName.slice(0,2).toUpperCase()}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="waiting-opponent-slot">
                <Users size={28} />
                <strong>En attente du joueur 2…</strong>
                <small>Demandez-lui d’entrer le code {room.code}</small>
              </div>
            )}
          </div>
        </div>

        {/* Quick Team & Formation Selector inside Lobby */}
        <div className="lobby-setup-strip">
          <div className="field-group">
            <label>Votre équipe ({unlockedTeams.length} débloquées)</label>
            <select
              value={myCurrentTeamId}
              onChange={(e) => handleChangeMySetup(e.target.value, myCurrentFormation)}
            >
              {unlockedTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (OVR {t.rating} · {t.category === 'nation' ? 'Sélection' : t.league})
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Votre formation</label>
            <select
              value={myCurrentFormation}
              onChange={(e) => handleChangeMySetup(myCurrentTeamId, e.target.value as FormationId)}
            >
              {(Object.keys(FORMATIONS) as FormationId[]).map((fid) => (
                <option key={fid} value={fid}>
                  {FORMATIONS[fid].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="lobby-footer-actions">
          <button type="button" className="btn-secondary" onClick={onCancelLobby}>
            Quitter le salon
          </button>

          {mySide === 'host' ? (
            <button
              type="button"
              className="btn-primary"
              disabled={!room.guest_name}
              onClick={handleHostKickoff}
            >
              <Play size={16} />
              {room.guest_name ? 'Lancer le coup d’envoi !' : 'Attente de l’adversaire…'}
            </button>
          ) : (
            <div className="guest-ready-pill">
              <Share2 size={15} /> Connecté ! En attente du coup d’envoi de {room.host_name}…
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
