import React, { useState } from 'react';
import { PlayerProfile } from '../lib/supabase';
import { sfx } from '../engine/audio';

export interface FcObjective {
  id: string;
  title: string;
  desc: string;
  category: 'CARRIÈRE' | 'BUTEUR' | 'EUROPE';
  current: (p: PlayerProfile) => number;
  target: number;
  rewardTrophies: number;
  rewardCoins: number;
}

export const FC27_OBJECTIVES: FcObjective[] = [
  {
    id: 'first_win',
    title: 'Première Victoire Officielle',
    desc: 'Remporter 1 match tous modes confondus.',
    category: 'CARRIÈRE',
    current: (p) => p.wins,
    target: 1,
    rewardTrophies: 35,
    rewardCoins: 100,
  },
  {
    id: 'goals_10',
    title: 'Soulier de Bronze Européen',
    desc: 'Inscrire 10 buts cumulés avec votre effectif.',
    category: 'BUTEUR',
    current: (p) => p.goals_for,
    target: 10,
    rewardTrophies: 60,
    rewardCoins: 160,
  },
  {
    id: 'wins_5',
    title: 'Série Invincible FC 27',
    desc: 'Atteindre 5 victoires sur la saison.',
    category: 'CARRIÈRE',
    current: (p) => p.wins,
    target: 5,
    rewardTrophies: 90,
    rewardCoins: 240,
  },
  {
    id: 'collector_6',
    title: 'Scouting UEFA (6 Équipes)',
    desc: 'Posséder au moins 6 clubs ou sélections débloqués.',
    category: 'EUROPE',
    current: (p) => p.unlocked_teams.length,
    target: 6,
    rewardTrophies: 80,
    rewardCoins: 220,
  },
  {
    id: 'cup_winner',
    title: 'Roi d’une Coupe Européenne',
    desc: 'Remporter une coupe complète en finale.',
    category: 'EUROPE',
    current: (p) => p.won_competitions.length,
    target: 1,
    rewardTrophies: 110,
    rewardCoins: 300,
  },
  {
    id: 'goals_30',
    title: 'Soulier d’Or Continental',
    desc: 'Franchir la barre des 30 buts inscrits.',
    category: 'BUTEUR',
    current: (p) => p.goals_for,
    target: 30,
    rewardTrophies: 140,
    rewardCoins: 400,
  },
];

const CLAIMED_KEY = 'matchly_fc27_claimed_objectives_v1';

export function loadClaimedObjectives(): string[] {
  try {
    const raw = localStorage.getItem(CLAIMED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveClaimedObjectives(ids: string[]) {
  try {
    localStorage.setItem(CLAIMED_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function countClaimableObjectives(profile: PlayerProfile): number {
  const claimed = loadClaimedObjectives();
  return FC27_OBJECTIVES.filter(
    (obj) => !claimed.includes(obj.id) && obj.current(profile) >= obj.target,
  ).length;
}

interface ObjectivesModalProps {
  profile: PlayerProfile;
  onClaimReward: (trophies: number, coins: number) => void;
  onClose: () => void;
}

export const ObjectivesModal: React.FC<ObjectivesModalProps> = ({
  profile,
  onClaimReward,
  onClose,
}) => {
  const [claimed, setClaimed] = useState<string[]>(loadClaimedObjectives);

  const xp = profile.wins * 120 + profile.goals_for * 25 + profile.trophies;
  const seasonLevel = Math.min(30, Math.floor(xp / 250) + 1);
  const levelProgress = Math.round(((xp % 250) / 250) * 100);

  const handleClaim = (obj: FcObjective) => {
    if (claimed.includes(obj.id)) return;
    const next = [...claimed, obj.id];
    setClaimed(next);
    saveClaimedObjectives(next);
    sfx.fanfare();
    onClaimReward(obj.rewardTrophies, obj.rewardCoins);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card fc27-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="fc27-skew-tag volt">FC 27 SAISON 1</span>
            <h2 style={{ marginTop: 6 }}>OBJECTIFS & PASSE SAISON</h2>
          </div>
          <button className="icon-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="season-xp-banner">
          <div className="season-lvl-badge">
            <span>NIV.</span>
            <strong>{seasonLevel}</strong>
          </div>
          <div className="season-xp-info">
            <div className="season-xp-top">
              <strong>PASSE EUROPÉEN FC 27</strong>
              <span>{xp} XP</span>
            </div>
            <div className="season-xp-bar">
              <div style={{ width: `${levelProgress}%` }} />
            </div>
            <small>
              {profile.wins} victoires · {profile.goals_for} buts marqués · {profile.coins} Crédits FC
            </small>
          </div>
        </div>

        <div className="objectives-list">
          {FC27_OBJECTIVES.map((obj) => {
            const val = obj.current(profile);
            const done = val >= obj.target;
            const isClaimed = claimed.includes(obj.id);
            const pct = Math.min(100, Math.round((val / obj.target) * 100));

            return (
              <div
                key={obj.id}
                className={`objective-card ${done && !isClaimed ? 'ready' : ''} ${
                  isClaimed ? 'claimed' : ''
                }`}
              >
                <div className="objective-main">
                  <div className="objective-head">
                    <span className="obj-cat">{obj.category}</span>
                    <strong>{obj.title}</strong>
                  </div>
                  <p>{obj.desc}</p>
                  <div className="obj-prog-row">
                    <div className="obj-prog-track">
                      <div style={{ width: `${pct}%` }} />
                    </div>
                    <span>
                      {Math.min(val, obj.target)}/{obj.target}
                    </span>
                  </div>
                </div>

                <div className="objective-side">
                  <div className="obj-rewards">
                    <span>🏆 +{obj.rewardTrophies}</span>
                    <span>🪙 +{obj.rewardCoins}</span>
                  </div>
                  {isClaimed ? (
                    <span className="obj-done-pill">✓ RÉCLAMÉ</span>
                  ) : done ? (
                    <button
                      type="button"
                      className="fc27-volt-btn compact"
                      onClick={() => handleClaim(obj)}
                    >
                      RÉCLAMER
                    </button>
                  ) : (
                    <span className="obj-locked-pill">EN COURS</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
