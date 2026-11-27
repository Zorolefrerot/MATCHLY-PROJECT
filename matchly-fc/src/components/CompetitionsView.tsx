import React, { useEffect, useState } from 'react';
import {
  Award,
  Crown,
  Plus,
  RefreshCw,
  Swords,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { getTeamById } from '../data/teams';
import {
  CompetitionEntry,
  createPlayerCompetition,
  enrollInCompetition,
  fetchCompetitionEntries,
  fetchGlobalLeaderboard,
  fetchOnlineCompetitions,
  fetchRecentMatches,
  MatchRecord,
  OnlineCompetition,
  PlayerProfile,
  setCompetitionRoomCode,
  supabase,
} from '../lib/supabase';
import { TeamCrest } from './TeamCrest';

interface Props {
  profile: PlayerProfile;
  onOpenAuthModal: () => void;
  onHostCompetitionMatch: (competition: OnlineCompetition) => void;
  onJoinCompetitionRoomCode: (code: string, competition: OnlineCompetition) => void;
}

export const CompetitionsView: React.FC<Props> = ({
  profile,
  onOpenAuthModal,
  onHostCompetitionMatch,
  onJoinCompetitionRoomCode,
}) => {
  const [subTab, setSubTab] = useState<'tournaments' | 'leaderboard'>('tournaments');
  const [competitions, setCompetitions] = useState<OnlineCompetition[]>([]);
  const [selectedComp, setSelectedComp] = useState<OnlineCompetition | null>(null);
  const [entries, setEntries] = useState<CompetitionEntry[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  // Create tournament modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newType, setNewType] = useState<'league' | 'cup' | 'nations'>('cup');
  const [newMinTrophies, setNewMinTrophies] = useState(0);

  const loadAll = async () => {
    setLoading(true);
    const [comps, lb, recent] = await Promise.all([
      fetchOnlineCompetitions(),
      fetchGlobalLeaderboard(),
      fetchRecentMatches(),
    ]);
    setCompetitions(comps);
    setLeaderboard(lb);
    setRecentMatches(recent);
    const active = selectedComp
      ? comps.find((c) => c.id === selectedComp.id) || comps[0]
      : comps[0];
    if (active) {
      setSelectedComp(active);
      const ent = await fetchCompetitionEntries(active.id);
      setEntries(ent);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Realtime subscription to competition entries so live match lobbies appear instantly!
  useEffect(() => {
    if (!selectedComp) return;
    fetchCompetitionEntries(selectedComp.id).then(setEntries);

    const ch = supabase
      .channel(`comp-entries:${selectedComp.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fc_competition_entries',
          filter: `competition_id=eq.${selectedComp.id}`,
        },
        () => {
          fetchCompetitionEntries(selectedComp.id).then(setEntries);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [selectedComp?.id]);

  const myEntry = selectedComp
    ? entries.find((e) => !profile.isGuest && e.user_id === profile.id)
    : undefined;

  const handleEnroll = async () => {
    if (!selectedComp) return;
    if (profile.isGuest) {
      onOpenAuthModal();
      return;
    }
    if (profile.trophies < selectedComp.min_trophies) {
      setActionMsg(`Il faut au moins ${selectedComp.min_trophies} trophées pour rejoindre cette compétition.`);
      return;
    }
    const res = await enrollInCompetition(selectedComp.id, profile);
    if (res.error) {
      setActionMsg(res.error);
    } else {
      setActionMsg('Inscription validée ! Vous pouvez maintenant lancer ou rejoindre un match officiel.');
      const ent = await fetchCompetitionEntries(selectedComp.id);
      setEntries(ent);
    }
  };

  const handleCreateComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = await createPlayerCompetition(
      profile,
      newTitle,
      newSubtitle,
      newType,
      newMinTrophies,
      140,
    );
    if (res.competition) {
      setShowCreateModal(false);
      setNewTitle('');
      setNewSubtitle('');
      await enrollInCompetition(res.competition.id, profile);
      await loadAll();
      setSelectedComp(res.competition);
    } else if (res.error) {
      setActionMsg(res.error);
    }
  };

  return (
    <div className="competitions-page">
      <div className="comp-top-header">
        <div>
          <span className="eyebrow-tag">RÉSEAU OFFICIEL DES COMPTES MATCHLY</span>
          <h2>COMPÉTITIONS EN LIGNE & PALMARÈS</h2>
        </div>

        <div className="comp-header-actions">
          <div className="segmented-tabs compact">
            <button
              type="button"
              className={subTab === 'tournaments' ? 'active' : ''}
              onClick={() => setSubTab('tournaments')}
            >
              <Trophy size={14} /> Compétitions ({competitions.length})
            </button>
            <button
              type="button"
              className={subTab === 'leaderboard' ? 'active' : ''}
              onClick={() => setSubTab('leaderboard')}
            >
              <Crown size={14} /> Classement Comptes
            </button>
          </div>

          <button type="button" className="icon-pill-btn" onClick={loadAll} title="Actualiser">
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (profile.isGuest) onOpenAuthModal();
              else setShowCreateModal(true);
            }}
          >
            <Plus size={15} /> Créer un tournoi
          </button>
        </div>
      </div>

      {profile.isGuest && (
        <div className="account-callout-strip">
          <div>
            <strong>Accès réservé aux comptes inscrits :</strong> Créez un compte en 10 secondes pour
            vous inscrire aux Ligues et Coupes en ligne, défier tous les managers inscrits et figurer au
            classement général.
          </div>
          <button type="button" className="btn-primary" onClick={onOpenAuthModal}>
            <UserPlus size={15} /> Créer / Connecter mon compte
          </button>
        </div>
      )}

      {subTab === 'tournaments' ? (
        <div className="comp-split-grid">
          {/* Left: Competitions List */}
          <div className="comp-list-col">
            {competitions.map((comp) => {
              const active = selectedComp?.id === comp.id;
              const rewardTeam = comp.reward_team_id ? getTeamById(comp.reward_team_id) : null;

              return (
                <button
                  key={comp.id}
                  type="button"
                  className={`comp-item-card ${active ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedComp(comp);
                    setActionMsg(null);
                  }}
                >
                  <div className="comp-item-top">
                    <span className={`comp-type-badge type-${comp.comp_type}`}>
                      {comp.comp_type === 'league'
                        ? 'LIGUE OUVERTE'
                        : comp.comp_type === 'nations'
                          ? 'EURO NATIONS'
                          : 'COUPE ÉLIMINATOIRE'}
                    </span>
                    <span className="comp-min-req">
                      {comp.min_trophies > 0 ? `${comp.min_trophies}+ Trophées` : 'Ouvert à tous'}
                    </span>
                  </div>
                  <h3>{comp.title}</h3>
                  <p>{comp.subtitle}</p>
                  <div className="comp-item-Bottom">
                    <span className="gold-reward-tag">
                      <Award size={14} /> +{comp.reward_trophies} Trophées
                    </span>
                    {rewardTeam && (
                      <span className="team-unlock-mini">
                        <TeamCrest team={rewardTeam} size={18} /> Libère {rewardTeam.shortName}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Selected Competition Standings & Matchmaking */}
          <div className="comp-detail-col">
            {selectedComp ? (
              <div className="comp-desk-card">
                <div className="comp-desk-header">
                  <div>
                    <span className="eyebrow-tag">
                      ORGANISÉ PAR {selectedComp.created_by_name.toUpperCase()}
                    </span>
                    <h3>{selectedComp.title}</h3>
                    <p>{selectedComp.subtitle}</p>
                  </div>

                  <div className="comp-desk-cta">
                    {!myEntry ? (
                      <button type="button" className="btn-primary" onClick={handleEnroll}>
                        <Users size={16} /> S’inscrire avec mon compte
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => onHostCompetitionMatch(selectedComp)}
                      >
                        <Swords size={16} /> Ouvrir un salon de match officiel
                      </button>
                    )}
                  </div>
                </div>

                {actionMsg && <div className="comp-alert-box">{actionMsg}</div>}

                {/* Direct competition room code join bar for registered entrants */}
                {myEntry && (
                  <div className="comp-direct-code-bar">
                    <span>Rejoindre le code d’un adversaire inscrit :</span>
                    <div className="inline-code-join">
                      <input
                        type="text"
                        placeholder="CODE (ex: M7K2P)"
                        maxLength={6}
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={manualCode.trim().length < 4}
                        onClick={() => onJoinCompetitionRoomCode(manualCode, selectedComp)}
                      >
                        Affronter
                      </button>
                      {myEntry.active_room_code && (
                        <button
                          type="button"
                          className="btn-danger-outline"
                          onClick={() =>
                            setCompetitionRoomCode(selectedComp.id, profile.id, null).then(() =>
                              fetchCompetitionEntries(selectedComp.id).then(setEntries),
                            )
                          }
                        >
                          Fermer mon salon ({myEntry.active_room_code})
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Standings Table */}
                <div className="standings-table-wrap">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Compte Manager</th>
                        <th>Équipe</th>
                        <th>MJ</th>
                        <th>V</th>
                        <th>D</th>
                        <th>Diff</th>
                        <th>Pts</th>
                        <th>Match en direct</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="empty-table-cell">
                            {loading
                              ? 'Chargement des inscrits…'
                              : 'Aucun inscrit pour le moment. Soyez le premier manager sur la feuille de match !'}
                          </td>
                        </tr>
                      ) : (
                        entries.map((ent, idx) => {
                          const t = getTeamById(ent.team_id);
                          const isMe = !profile.isGuest && ent.user_id === profile.id;
                          const diff = (ent.goals_for || 0) - (ent.goals_against || 0);

                          return (
                            <tr key={ent.id} className={isMe ? 'row-me' : ''}>
                              <td className="rank-cell">{idx + 1}</td>
                              <td>
                                <strong>{ent.display_name}</strong>
                                {isMe && <span className="me-pill">Vous</span>}
                              </td>
                              <td>
                                <div className="team-cell-inline">
                                  <TeamCrest team={t} size={22} />
                                  <span>{t.shortName}</span>
                                </div>
                              </td>
                              <td>{ent.played}</td>
                              <td>{ent.wins}</td>
                              <td>{ent.losses}</td>
                              <td>{diff > 0 ? `+${diff}` : diff}</td>
                              <td className="pts-cell">{ent.points}</td>
                              <td>
                                {ent.active_room_code && !isMe ? (
                                  <button
                                    type="button"
                                    className="btn-challenge-live"
                                    onClick={() => {
                                      if (profile.isGuest) {
                                        onOpenAuthModal();
                                        return;
                                      }
                                      onJoinCompetitionRoomCode(ent.active_room_code!, selectedComp);
                                    }}
                                  >
                                    Rejoindre ({ent.active_room_code})
                                  </button>
                                ) : ent.active_room_code && isMe ? (
                                  <span className="waiting-code-pill">
                                    Salon {ent.active_room_code} ouvert
                                  </span>
                                ) : (
                                  <span className="muted-dash">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Recent Official Matches */}
                {recentMatches.length > 0 && (
                  <div className="recent-results-box">
                    <div className="squad-section-label">DERNIERS RÉSULTATS ENREGISTRÉS</div>
                    <div className="recent-matches-list">
                      {recentMatches.slice(0, 5).map((m) => {
                        const t1 = getTeamById(m.p1_team);
                        const t2 = getTeamById(m.p2_team);
                        return (
                          <div key={m.id} className="recent-match-pill">
                            <span className="rm-side">
                              <TeamCrest team={t1} size={18} /> {m.p1_name}
                            </span>
                            <strong className="rm-score">
                              {m.p1_score} - {m.p2_score}
                            </strong>
                            <span className="rm-side">
                              {m.p2_name} <TeamCrest team={t2} size={18} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* Global Account Leaderboard */
        <div className="comp-desk-card">
          <div className="squad-section-label">CLASSEMENT GÉNÉRAL DES COMPTES (TROPHÉES UEFA)</div>
          <div className="standings-table-wrap">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Manager</th>
                  <th>Club / Sélection</th>
                  <th>Victoires</th>
                  <th>Défaites</th>
                  <th>Buts</th>
                  <th>Équipes</th>
                  <th>Trophées</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-table-cell">
                      Aucun compte classé pour l’instant. Créez votre compte pour inaugurer le palmarès !
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((pl, idx) => {
                    const t = getTeamById(pl.favorite_team_id);
                    const isMe = !profile.isGuest && pl.id === profile.id;
                    return (
                      <tr key={pl.id} className={isMe ? 'row-me' : ''}>
                        <td className="rank-cell">{idx + 1}</td>
                        <td>
                          <strong>{pl.display_name}</strong>
                          {isMe && <span className="me-pill">Vous</span>}
                        </td>
                        <td>
                          <div className="team-cell-inline">
                            <TeamCrest team={t} size={22} />
                            <span>{t.name}</span>
                          </div>
                        </td>
                        <td>{pl.wins}</td>
                        <td>{pl.losses}</td>
                        <td>
                          {pl.goals_for}:{pl.goals_against}
                        </td>
                        <td>{(pl.unlocked_teams || []).length}/18</td>
                        <td className="pts-cell gold-text">{pl.trophies}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Community Online Competition Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow-tag">ORGANISATEUR EN LIGNE</span>
                <h2>CRÉER UNE COMPÉTITION</h2>
              </div>
              <button
                type="button"
                className="icon-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateComp} className="auth-form">
              <div className="field-group">
                <label>Nom du tournoi ou de la ligue</label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  placeholder="ex: Supercoupe Kinshasa · Élite"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Description / Règlement</label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="ex: Matchs en 3 buts · Ouvert à tous les comptes"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Format</label>
                <div className="segmented-tabs">
                  <button
                    type="button"
                    className={newType === 'cup' ? 'active' : ''}
                    onClick={() => setNewType('cup')}
                  >
                    Coupe Clubs
                  </button>
                  <button
                    type="button"
                    className={newType === 'league' ? 'active' : ''}
                    onClick={() => setNewType('league')}
                  >
                    Ligue
                  </button>
                  <button
                    type="button"
                    className={newType === 'nations' ? 'active' : ''}
                    onClick={() => setNewType('nations')}
                  >
                    Sélections
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label>Trophées minimum requis ({newMinTrophies})</label>
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={50}
                  value={newMinTrophies}
                  onChange={(e) => setNewMinTrophies(Number(e.target.value))}
                />
              </div>

              <button type="submit" className="btn-primary full-width">
                Publier la compétition en ligne
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
