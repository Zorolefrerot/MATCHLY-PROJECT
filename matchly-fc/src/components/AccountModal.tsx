import React, { useState } from 'react';
import { LogOut, ShieldCheck, Trophy, UserCheck, X } from 'lucide-react';
import { EURO_TEAMS, getTeamById } from '../data/teams';
import {
  loginAccount,
  logoutAccount,
  persistProfileUpdate,
  PlayerProfile,
  registerAccount,
} from '../lib/supabase';
import { TeamCrest } from './TeamCrest';

interface Props {
  profile: PlayerProfile;
  onProfileChange: (next: PlayerProfile) => void;
  onClose: () => void;
}

export const AccountModal: React.FC<Props> = ({ profile, onProfileChange, onClose }) => {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [identifier, setIdentifier] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [editName, setEditName] = useState(profile.display_name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const favTeam = getTeamById(profile.favorite_team_id);

  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (tab === 'register') {
        const res = await registerAccount(identifier, password, displayName || identifier, profile);
        if (res.error || !res.profile) {
          setError(res.error || 'Erreur lors de l’inscription.');
        } else {
          onProfileChange(res.profile);
          onClose();
        }
      } else {
        const res = await loginAccount(identifier, password);
        if (res.error || !res.profile) {
          setError(res.error || 'Identifiants invalides.');
        } else {
          onProfileChange(res.profile);
          onClose();
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCoachName = async () => {
    if (editName.trim().length < 2) return;
    setBusy(true);
    const updated = await persistProfileUpdate({
      ...profile,
      display_name: editName.trim(),
    });
    onProfileChange(updated);
    setBusy(false);
    setSavedMsg('Profil mis à jour.');
    setTimeout(() => setSavedMsg(null), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow-tag">LICENCE MANAGER UEFA</span>
            <h2>{profile.isGuest ? 'COMPTE JOUEUR EN LIGNE' : 'MON PROFIL MANAGER'}</h2>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!profile.isGuest ? (
          <div className="account-body">
            <div className="profile-hero-box">
              <TeamCrest team={favTeam} size={56} />
              <div className="profile-hero-meta">
                <div className="verified-pill">
                  <ShieldCheck size={14} /> Compte certifié en ligne
                </div>
                <h3>{profile.display_name}</h3>
                <p>@{profile.username}</p>
              </div>
            </div>

            <div className="stats-grid-4">
              <div className="stat-tile">
                <span>Trophées</span>
                <strong className="gold-text">{profile.trophies}</strong>
              </div>
              <div className="stat-tile">
                <span>Victoires</span>
                <strong>{profile.wins}</strong>
              </div>
              <div className="stat-tile">
                <span>Buts marqués</span>
                <strong>{profile.goals_for}</strong>
              </div>
              <div className="stat-tile">
                <span>Équipes</span>
                <strong>
                  {profile.unlocked_teams.length}/{EURO_TEAMS.length}
                </strong>
              </div>
            </div>

            <div className="field-group">
              <label>Nom d’affichage en match</label>
              <div className="inline-input-row">
                <input
                  type="text"
                  value={editName}
                  maxLength={22}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={handleSaveCoachName}
                >
                  Enregistrer
                </button>
              </div>
              {savedMsg && <small className="ok-msg">{savedMsg}</small>}
            </div>

            <div className="account-footer-row">
              <button
                type="button"
                className="btn-danger-outline"
                onClick={async () => {
                  await logoutAccount();
                  window.location.reload();
                }}
              >
                <LogOut size={15} /> Se déconnecter
              </button>
              <button type="button" className="btn-primary" onClick={onClose}>
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div className="account-body">
            <div className="guest-notice">
              <Trophy size={18} />
              <p>
                Vous jouez actuellement en mode invité (<strong>{profile.trophies} trophées</strong> locaux).
                Créez un compte pour sauvegarder vos équipes débloquées et participer aux{' '}
                <strong>Compétitions en ligne officielles</strong>.
              </p>
            </div>

            <div className="segmented-tabs">
              <button
                type="button"
                className={tab === 'register' ? 'active' : ''}
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
              >
                Créer un compte
              </button>
              <button
                type="button"
                className={tab === 'login' ? 'active' : ''}
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
              >
                Se connecter
              </button>
            </div>

            <form onSubmit={handleSubmitAuth} className="auth-form">
              <div className="field-group">
                <label>Pseudo unique (ou adresse e-mail)</label>
                <input
                  type="text"
                  required
                  placeholder="ex: ZoroKin10"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              {tab === 'register' && (
                <div className="field-group">
                  <label>Nom de Coach affiché sur le terrain</label>
                  <input
                    type="text"
                    placeholder="ex: Coach Zoro"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              )}

              <div className="field-group">
                <label>Mot de passe (6 caractères min.)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <div className="form-error-box">{error}</div>}

              <button type="submit" className="btn-primary full-width" disabled={busy}>
                <UserCheck size={16} />
                {busy
                  ? 'Connexion au serveur…'
                  : tab === 'register'
                    ? 'Créer mon compte & transférer mes trophées'
                    : 'Accéder à mon compte'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
