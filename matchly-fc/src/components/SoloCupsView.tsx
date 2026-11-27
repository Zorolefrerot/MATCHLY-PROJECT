import React from 'react';
import { Award, CheckCircle2, Lock, Play, Shield, Trophy } from 'lucide-react';
import { getTeamById, SOLO_CUPS, SoloCupDef } from '../data/teams';
import { PlayerProfile } from '../lib/supabase';
import { TeamCrest } from './TeamCrest';

export interface ActiveCupRun {
  cupId: string;
  stageIndex: 0 | 1 | 2; // 0: Quarts, 1: Demi-finale, 2: Finale
}

interface Props {
  profile: PlayerProfile;
  activeCupRun: ActiveCupRun | null;
  onStartOrContinueCup: (cup: SoloCupDef, stageIndex: 0 | 1 | 2) => void;
  onResetCupRun: () => void;
}

const STAGE_NAMES = ['Quart de finale', 'Demi-finale', 'Finale Européenne'];

export const SoloCupsView: React.FC<Props> = ({
  profile,
  activeCupRun,
  onStartOrContinueCup,
  onResetCupRun,
}) => {
  const wonSet = new Set(profile.won_competitions || []);

  return (
    <div className="cups-page">
      <div className="section-head-row">
        <div>
          <span className="eyebrow-tag">CARRIÈRE SOLO · PROGRESSION & DÉBLOCAGES</span>
          <h2>COUPES EUROPÉENNES CONTRE L’IA</h2>
        </div>
        <div className="cup-hint-pill">
          <Trophy size={15} /> Chaque victoire rapporte des Trophées + débloque directement des clubs & nations
        </div>
      </div>

      {/* Active Cup Bracket Banner if in progress */}
      {activeCupRun && (() => {
        const cup = SOLO_CUPS.find((c) => c.id === activeCupRun.cupId);
        if (!cup) return null;
        const nextOpp = getTeamById(cup.opponents[activeCupRun.stageIndex]);
        const myTeam = getTeamById(profile.favorite_team_id);

        return (
          <div className="active-cup-banner">
            <div className="acb-left">
              <span className="eyebrow-tag gold">PARCOURS EN COURS · {cup.title.toUpperCase()}</span>
              <h3>
                {STAGE_NAMES[activeCupRun.stageIndex]} : {myTeam.shortName} vs {nextOpp.name}
              </h3>
              <div className="bracket-steps">
                {cup.opponents.map((oppId, i) => {
                  const opp = getTeamById(oppId);
                  const state =
                    i < activeCupRun.stageIndex
                      ? 'done'
                      : i === activeCupRun.stageIndex
                        ? 'current'
                        : 'upcoming';
                  return (
                    <div key={oppId} className={`bracket-step ${state}`}>
                      <TeamCrest team={opp} size={22} />
                      <span>
                        {STAGE_NAMES[i].split(' ')[0]} · {opp.code}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="acb-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => onStartOrContinueCup(cup, activeCupRun.stageIndex)}
              >
                <Play size={16} /> Jouer {STAGE_NAMES[activeCupRun.stageIndex]}
              </button>
              <button type="button" className="btn-secondary" onClick={onResetCupRun}>
                Abandonner la coupe
              </button>
            </div>
          </div>
        );
      })()}

      {/* 4 Cups Grid */}
      <div className="cups-grid">
        {SOLO_CUPS.map((cup) => {
          const unlocked = profile.trophies >= cup.minTrophies;
          const alreadyWon = wonSet.has(cup.id);
          const rewardTeam = getTeamById(cup.unlockTeamId);
          const isCurrentRun = activeCupRun?.cupId === cup.id;

          return (
            <div
              key={cup.id}
              className={`cup-card ${!unlocked ? 'locked' : ''} ${alreadyWon ? 'completed' : ''}`}
            >
              <div className="cup-card-top" style={{ borderColor: cup.accent }}>
                <div className="cup-badge-row">
                  <span className="cup-diff-pill" style={{ color: cup.accent }}>
                    IA {cup.difficulty.toUpperCase()}
                  </span>
                  {alreadyWon ? (
                    <span className="cup-won-pill">
                      <CheckCircle2 size={13} /> Trophée remporté
                    </span>
                  ) : !unlocked ? (
                    <span className="cup-lock-pill">
                      <Lock size={12} /> {cup.minTrophies} Trophées requis
                    </span>
                  ) : (
                    <span className="cup-open-pill">Ouverte</span>
                  )}
                </div>

                <h3>{cup.title}</h3>
                <p>{cup.subtitle}</p>
              </div>

              <div className="cup-opponents-strip">
                <span className="strip-label">TABLEAU FINAL :</span>
                <div className="opp-crests-row">
                  {cup.opponents.map((oppId, idx) => {
                    const opp = getTeamById(oppId);
                    return (
                      <div key={oppId} className="opp-mini-item">
                        <TeamCrest team={opp} size={30} />
                        <small>
                          {idx === 0 ? '1/4' : idx === 1 ? '1/2' : 'FIN'} · {opp.code}
                        </small>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="cup-rewards-box">
                <div className="reward-item">
                  <Award size={16} className="gold-text" />
                  <div>
                    <strong>+{cup.rewardTrophies} Trophées</strong>
                    <small>+25 par tour franchi</small>
                  </div>
                </div>

                <div className="reward-item">
                  <TeamCrest team={rewardTeam} size={30} />
                  <div>
                    <strong>Débloque {rewardTeam.shortName}</strong>
                    <small>Note {rewardTeam.rating} · {rewardTeam.league}</small>
                  </div>
                </div>
              </div>

              <div className="cup-card-footer">
                {unlocked ? (
                  <button
                    type="button"
                    className="btn-primary full-width"
                    onClick={() =>
                      onStartOrContinueCup(cup, isCurrentRun ? activeCupRun.stageIndex : 0)
                    }
                  >
                    <Shield size={16} />
                    {isCurrentRun
                      ? `Reprendre (${STAGE_NAMES[activeCupRun.stageIndex]})`
                      : alreadyWon
                        ? 'Rejouer la coupe (+Trophées)'
                        : 'Entrer dans la compétition'}
                  </button>
                ) : (
                  <button type="button" className="btn-secondary full-width" disabled>
                    <Lock size={15} /> Débloqué à {cup.minTrophies} Trophées ({profile.trophies}/{cup.minTrophies})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
