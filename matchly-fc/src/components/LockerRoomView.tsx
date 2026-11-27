import React, { useState } from 'react';
import { CheckCircle2, Coins, Lock, Shield, Sparkles } from 'lucide-react';
import { EURO_TEAMS, EuroTeam, FormationId, FORMATIONS, SquadPlayer } from '../data/teams';
import { PlayerProfile } from '../lib/supabase';
import { TeamCrest } from './TeamCrest';
import { sfx } from '../engine/audio';

interface Props {
  profile: PlayerProfile;
  onSelectTeamAndFormation: (teamId: string, formation: FormationId) => void;
  onRecruitWithCoins?: (teamId: string, coinCost: number) => void;
}

function getPlayStyleBadge(pl: SquadPlayer): { label: string; gold: boolean } {
  if (pl.role === 'GK') {
    return {
      label: pl.stats.ctr >= 89 ? '◆ RÉFLEXES+' : '◇ GARDIEN LIGNE',
      gold: pl.stats.ctr >= 89,
    };
  }
  if (pl.stats.tir >= 92) return { label: '◆ FRAPPE LOURDE+', gold: true };
  if (pl.stats.ctr >= 92) return { label: '◆ FINESSE+', gold: true };
  if (pl.stats.phy >= 90) return { label: '◆ ROC PHYSIQUE+', gold: true };
  if (pl.stats.tir >= pl.stats.ctr) return { label: '◇ BUTEUR PRÉCIS', gold: false };
  return { label: '◇ MAESTRO PASSES', gold: false };
}

export const LockerRoomView: React.FC<Props> = ({
  profile,
  onSelectTeamAndFormation,
  onRecruitWithCoins,
}) => {
  const [filter, setFilter] = useState<'all' | 'club' | 'nation' | 'unlocked'>('all');
  const [inspectedId, setInspectedId] = useState<string>(profile.favorite_team_id);

  const unlockedSet = new Set(profile.unlocked_teams);

  const filteredTeams = EURO_TEAMS.filter((t) => {
    if (filter === 'club') return t.category === 'club';
    if (filter === 'nation') return t.category === 'nation';
    if (filter === 'unlocked') return unlockedSet.has(t.id);
    return true;
  });

  const inspectedTeam: EuroTeam =
    EURO_TEAMS.find((t) => t.id === inspectedId) || EURO_TEAMS[0];
  const isInspectedUnlocked = unlockedSet.has(inspectedTeam.id);
  const isEquipped = profile.favorite_team_id === inspectedTeam.id;
  const activeFormation = FORMATIONS[profile.selected_formation] || FORMATIONS['1-2-2'];

  const progressPct =
    inspectedTeam.unlockTrophies === 0
      ? 100
      : Math.min(100, Math.round((profile.trophies / inspectedTeam.unlockTrophies) * 100));

  const recruitCost = Math.max(220, Math.round(inspectedTeam.unlockTrophies * 1.15));
  const canAffordRecruit = profile.coins >= recruitCost;

  return (
    <div className="locker-layout">
      {/* Left Column: Team Roster Grid */}
      <section className="locker-roster-col">
        <div className="section-head-row">
          <div>
            <span className="fc27-skew-tag volt">
              FC 27 ULTIMATE VESTIAIRE · {profile.unlocked_teams.length}/{EURO_TEAMS.length}
            </span>
            <h2 style={{ marginTop: 6 }}>CLUBS & SÉLECTIONS D’EUROPE</h2>
          </div>

          <div className="filter-pills">
            <button
              type="button"
              className={filter === 'all' ? 'active' : ''}
              onClick={() => {
                sfx.uiClick();
                setFilter('all');
              }}
            >
              Toutes ({EURO_TEAMS.length})
            </button>
            <button
              type="button"
              className={filter === 'club' ? 'active' : ''}
              onClick={() => {
                sfx.uiClick();
                setFilter('club');
              }}
            >
              Clubs (12)
            </button>
            <button
              type="button"
              className={filter === 'nation' ? 'active' : ''}
              onClick={() => {
                sfx.uiClick();
                setFilter('nation');
              }}
            >
              Nations (6)
            </button>
            <button
              type="button"
              className={filter === 'unlocked' ? 'active' : ''}
              onClick={() => {
                sfx.uiClick();
                setFilter('unlocked');
              }}
            >
              Mon Club ({profile.unlocked_teams.length})
            </button>
          </div>
        </div>

        <div className="team-cards-grid">
          {filteredTeams.map((team) => {
            const unlocked = unlockedSet.has(team.id);
            const selected = team.id === inspectedTeam.id;
            const equipped = team.id === profile.favorite_team_id;

            return (
              <button
                key={team.id}
                type="button"
                className={`team-tile ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                onClick={() => {
                  sfx.uiClick();
                  setInspectedId(team.id);
                }}
              >
                <div className="team-tile-top">
                  <span className="ovr-badge">OVR {team.rating}</span>
                  {equipped ? (
                    <span className="status-chip equipped">
                      <CheckCircle2 size={12} /> Titulaire
                    </span>
                  ) : !unlocked ? (
                    <span className="status-chip locked-chip">
                      <Lock size={11} /> {team.unlockTrophies}
                    </span>
                  ) : (
                    <span className="status-chip open-chip">Débloqué</span>
                  )}
                </div>

                <div className="team-tile-crest">
                  <TeamCrest team={team} size={50} />
                </div>

                <div className="team-tile-name">{team.shortName}</div>
                <div className="team-tile-sub">
                  {team.category === 'nation' ? 'Sélection UEFA' : team.league}
                </div>

                <div className="mini-avatar-stack">
                  {team.players.map((p) => (
                    <img
                      key={p.id}
                      src={p.photo}
                      alt={p.shortName}
                      title={`${p.name} (#${p.number})`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Right Column: Detailed Squad Sheet & Formation */}
      <aside className="locker-detail-col">
        <div className="squad-sheet-card">
          <div className="squad-sheet-header">
            <TeamCrest team={inspectedTeam} size={64} />
            <div className="squad-sheet-title">
              <div className="league-tag-row">
                <span>{inspectedTeam.country.toUpperCase()}</span>
                <span>•</span>
                <span>{inspectedTeam.league}</span>
              </div>
              <h3>{inspectedTeam.name}</h3>
              <p>{inspectedTeam.playstyle}</p>
            </div>
            <div className="big-ovr-box">
              <span>NOTE</span>
              <strong>{inspectedTeam.rating}</strong>
            </div>
          </div>

          {isInspectedUnlocked ? (
            <div className="equip-bar">
              {isEquipped ? (
                <div className="equipped-banner">
                  <CheckCircle2 size={17} /> Équipe titulaire équipée pour vos matchs
                </div>
              ) : (
                <button
                  type="button"
                  className="fc27-volt-btn full-w"
                  onClick={() => {
                    sfx.fanfare();
                    onSelectTeamAndFormation(inspectedTeam.id, profile.selected_formation);
                  }}
                >
                  <Shield size={16} /> ÉQUIPER {inspectedTeam.shortName.toUpperCase()} COMME TITULAIRE
                </button>
              )}
            </div>
          ) : (
            <div className="locked-progress-box">
              <div className="lp-top">
                <span>
                  <Lock size={14} />{' '}
                  {inspectedTeam.unlockHint || `${inspectedTeam.unlockTrophies} Trophées requis`}
                </span>
                <strong>
                  {profile.trophies} / {inspectedTeam.unlockTrophies} 🏆
                </strong>
              </div>
              <div className="lp-bar-track">
                <div className="lp-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <small>
                Déblocage gratuit à <strong>{inspectedTeam.unlockTrophies} trophées</strong> ou
                recrutement immédiat via vos Crédits FC ({profile.coins} 🪙 disponibles).
              </small>
              {onRecruitWithCoins && (
                <button
                  type="button"
                  className="fc27-gold-btn full-w"
                  style={{ marginTop: 10 }}
                  disabled={!canAffordRecruit}
                  onClick={() => {
                    sfx.fanfare();
                    onRecruitWithCoins(inspectedTeam.id, recruitCost);
                  }}
                >
                  <Coins size={15} />{' '}
                  {canAffordRecruit
                    ? `RECRUTER IMMÉDIATEMENT (${recruitCost} CRÉDITS FC)`
                    : `CRÉDITS INSUFFISANTS (${profile.coins}/${recruitCost} 🪙)`}
                </button>
              )}
            </div>
          )}

          {/* 5 Real Players List with FC 27 PlayStyles+ */}
          <div className="squad-section-label">
            <Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            CARTES JOUEURS & PLAYSTYLES+ FC 27
          </div>
          <div className="players-list">
            {inspectedTeam.players.map((pl) => {
              const ps = getPlayStyleBadge(pl);
              const playerOvr = Math.round(
                (pl.stats.tir * 0.36 + pl.stats.phy * 0.28 + pl.stats.ctr * 0.36),
              );
              return (
                <div key={pl.id} className="player-row-card">
                  <div className="fc27-mini-shield">
                    <span className="fc27-card-ovr">{playerOvr}</span>
                    <img src={pl.photo} alt={pl.name} className="player-portrait-img" />
                    <span className="player-num-pill">#{pl.number}</span>
                  </div>

                  <div className="player-main-info">
                    <div className="player-name-line">
                      <strong>{pl.name}</strong>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span className={`playstyle-chip ${ps.gold ? 'gold' : ''}`}>
                          {ps.label}
                        </span>
                        <span className={`role-tag role-${pl.role.toLowerCase()}`}>{pl.role}</span>
                      </div>
                    </div>
                    <div className="player-stat-bars">
                      <div className="mini-stat">
                        <span>TIR</span>
                        <div className="ms-track">
                          <div className="ms-fill tir" style={{ width: `${pl.stats.tir}%` }} />
                        </div>
                        <b>{pl.stats.tir}</b>
                      </div>
                      <div className="mini-stat">
                        <span>PHY</span>
                        <div className="ms-track">
                          <div className="ms-fill phy" style={{ width: `${pl.stats.phy}%` }} />
                        </div>
                        <b>{pl.stats.phy}</b>
                      </div>
                      <div className="mini-stat">
                        <span>CTR</span>
                        <div className="ms-track">
                          <div className="ms-fill ctr" style={{ width: `${pl.stats.ctr}%` }} />
                        </div>
                        <b>{pl.stats.ctr}</b>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tactical Formation Picker + Mini Pitch Preview */}
          <div className="squad-section-label">FC IQ · DISPOSITIF TACTIQUE ({activeFormation.id})</div>
          <div className="formation-picker-grid">
            {(Object.keys(FORMATIONS) as FormationId[]).map((fid) => {
              const f = FORMATIONS[fid];
              return (
                <button
                  key={fid}
                  type="button"
                  className={`formation-chip ${profile.selected_formation === fid ? 'active' : ''}`}
                  onClick={() => {
                    sfx.uiClick();
                    onSelectTeamAndFormation(
                      isInspectedUnlocked ? inspectedTeam.id : profile.favorite_team_id,
                      fid,
                    );
                  }}
                >
                  <strong>{fid}</strong>
                  <span>{f.name.replace(fid + ' ', '')}</span>
                </button>
              );
            })}
          </div>

          <div className="mini-tactical-board">
            <div className="mtb-halfline" />
            <div className="mtb-circle" />
            <div className="mtb-box" />
            {activeFormation.homeCoords.map((coord, i) => {
              const pl = inspectedTeam.players[i];
              const topPct = ((coord.y - 0.52) / 0.46) * 76 + 10;
              const leftPct = coord.x * 84 + 8;
              return (
                <div
                  key={pl.id}
                  className="mtb-pin"
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                >
                  <img src={pl.photo} alt={pl.shortName} />
                  <span>{pl.shortName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
};
