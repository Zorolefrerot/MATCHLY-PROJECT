import React, { useState } from 'react';
import { EURO_TEAMS, FORMATIONS, FormationId, getTeamById } from '../data/teams';
import { TeamCrest } from './TeamCrest';
import { sfx } from '../engine/audio';

interface QuickMatchModalProps {
  myTeamId: string;
  myFormation: FormationId;
  unlockedTeams: string[];
  onStartQuickMatch: (config: {
    myTeamId: string;
    myFormation: FormationId;
    aiTeamId: string;
    aiSkill: number;
    targetGoals: number;
  }) => void;
  onClose: () => void;
}

export const QuickMatchModal: React.FC<QuickMatchModalProps> = ({
  myTeamId,
  myFormation,
  unlockedTeams,
  onStartQuickMatch,
  onClose,
}) => {
  const [selectedMyTeam, setSelectedMyTeam] = useState(myTeamId);
  const [selectedFormation, setSelectedFormation] = useState<FormationId>(myFormation);
  const [aiTeamId, setAiTeamId] = useState(
    myTeamId === 'rma' ? 'bar' : 'rma',
  );
  const [difficulty, setDifficulty] = useState<'amateur' | 'pro' | 'legend'>('pro');
  const [targetGoals, setTargetGoals] = useState(3);

  const myTeam = getTeamById(selectedMyTeam);
  const aiTeam = getTeamById(aiTeamId);

  const skillMap = {
    amateur: 0.42,
    pro: 0.68,
    legend: 0.92,
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card fc27-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="fc27-skew-tag volt">COUP D’ENVOI FC 27</span>
            <h2 style={{ marginTop: 6 }}>MATCH D’EXHIBITION</h2>
          </div>
          <button className="icon-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="quick-match-versus">
          <div className="qm-side">
            <TeamCrest team={myTeam} size={56} />
            <strong>{myTeam.shortName}</strong>
            <span>OVR {myTeam.rating} · VOUS</span>
          </div>
          <div className="qm-vs-badge">VS</div>
          <div className="qm-side">
            <TeamCrest team={aiTeam} size={56} />
            <strong>{aiTeam.shortName}</strong>
            <span>OVR {aiTeam.rating} · IA</span>
          </div>
        </div>

        <div className="settings-group-list" style={{ marginTop: 12 }}>
          <div className="setting-block">
            <strong>Votre équipe ({unlockedTeams.length} disponibles)</strong>
            <div className="qm-team-strip">
              {EURO_TEAMS.filter((t) => unlockedTeams.includes(t.id)).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`qm-team-chip ${selectedMyTeam === t.id ? 'active' : ''}`}
                  onClick={() => {
                    sfx.uiClick();
                    setSelectedMyTeam(t.id);
                  }}
                >
                  <TeamCrest team={t} size={24} />
                  <span>{t.code}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setting-block">
            <strong>Adversaire européen (18 clubs & nations)</strong>
            <div className="qm-team-strip">
              {EURO_TEAMS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`qm-team-chip ${aiTeamId === t.id ? 'active' : ''}`}
                  onClick={() => {
                    sfx.uiClick();
                    setAiTeamId(t.id);
                  }}
                >
                  <TeamCrest team={t} size={24} />
                  <span>{t.code}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setting-block">
            <strong>Tactique & Difficulté IA</strong>
            <div className="seg-choice-grid three" style={{ marginBottom: 8 }}>
              {(
                [
                  ['amateur', 'Amateur'],
                  ['pro', 'Pro UEFA'],
                  ['legend', 'Légende FC 27'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={difficulty === id ? 'active' : ''}
                  onClick={() => {
                    sfx.uiClick();
                    setDifficulty(id);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="seg-choice-grid two">
              <select
                className="fc27-select"
                value={selectedFormation}
                onChange={(e) => setSelectedFormation(e.target.value as FormationId)}
              >
                {Object.values(FORMATIONS).map((f) => (
                  <option key={f.id} value={f.id}>
                    Formation {f.name}
                  </option>
                ))}
              </select>

              <select
                className="fc27-select"
                value={targetGoals}
                onChange={(e) => setTargetGoals(Number(e.target.value))}
              >
                <option value={2}>Premier à 2 buts</option>
                <option value={3}>Premier à 3 buts</option>
                <option value={5}>Premier à 5 buts</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="fc27-volt-btn full-w"
            onClick={() => {
              sfx.uiClick();
              onStartQuickMatch({
                myTeamId: selectedMyTeam,
                myFormation: selectedFormation,
                aiTeamId,
                aiSkill: skillMap[difficulty],
                targetGoals,
              });
            }}
          >
            ⚽ COUP D’ENVOI IMMÉDIAT (+25 🏆 EN CAS DE VICTOIRE)
          </button>
        </div>
      </div>
    </div>
  );
};
