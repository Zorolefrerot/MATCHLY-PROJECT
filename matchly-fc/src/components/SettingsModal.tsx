import React, { useState } from 'react';
import {
  DEFAULT_SETTINGS,
  GameSettings,
  TURF_PALETTES,
  TurfTheme,
} from '../lib/settings';
import { EA_TRAX_PLAYLIST, sfx } from '../engine/audio';
import { BeforeInstallPromptEvent, isRunningStandalone } from './PwaInstallGate';

interface SettingsModalProps {
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
  onReplayIntro: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onTriggerInstall: () => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onChange,
  onClose,
  onReplayIntro,
  deferredPrompt,
  onTriggerInstall,
}) => {
  const [tab, setTab] = useState<'audio' | 'gameplay' | 'pitch' | 'system'>('audio');
  const [activeTrackIdx, setActiveTrackIdx] = useState(sfx.getTrackIndex());
  const standalone = isRunningStandalone();

  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const next = { ...settings, [key]: value };
    onChange(next);
  };

  const toggleFullscreen = () => {
    sfx.uiClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card fc27-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="fc27-skew-tag volt">FC 27 CONFIGURATION</span>
            <h2 style={{ marginTop: 6 }}>PARAMÈTRES DU JEU</h2>
          </div>
          <button
            className="icon-close"
            onClick={() => {
              sfx.uiClick();
              onClose();
            }}
          >
            ✕
          </button>
        </div>

        <div className="fc27-tabs-bar">
          {(
            [
              ['audio', '🔊 Audio & Trax'],
              ['gameplay', '🎯 Commandes'],
              ['pitch', '🏟️ Pelouse'],
              ['system', '📲 App & Intro'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`fc27-tab-btn ${tab === id ? 'active' : ''}`}
              onClick={() => {
                sfx.uiClick();
                setTab(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="fc27-settings-body">
          {tab === 'audio' && (
            <div className="settings-group-list">
              <div className="setting-row">
                <div>
                  <strong>Volume général</strong>
                  <span>Niveau global de l'application ({settings.masterVolume}%)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.masterVolume}
                  onChange={(e) => update('masterVolume', Number(e.target.value))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <strong>Musique FC Trax</strong>
                  <span>Bande-son dans les menus et en fond ({settings.musicVolume}%)</span>
                </div>
                <div className="setting-inline-controls">
                  <button
                    type="button"
                    className={`chip-toggle ${settings.musicEnabled ? 'on' : ''}`}
                    onClick={() => {
                      sfx.uiClick();
                      update('musicEnabled', !settings.musicEnabled);
                    }}
                  >
                    {settings.musicEnabled ? 'ON' : 'OFF'}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.musicVolume}
                    onChange={(e) => update('musicVolume', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Effets de match & Sifflet</strong>
                  <span>Frappes, poteaux, collisions ({settings.sfxVolume}%)</span>
                </div>
                <div className="setting-inline-controls">
                  <button
                    type="button"
                    className="chip-toggle"
                    onClick={() => sfx.goal()}
                  >
                    Tester
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.sfxVolume}
                    onChange={(e) => update('sfxVolume', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Chants & Ambiance Stade</strong>
                  <span>Supporters en continu pendant les matchs</span>
                </div>
                <button
                  type="button"
                  className={`chip-toggle ${settings.crowdAmbience ? 'on' : ''}`}
                  onClick={() => {
                    sfx.uiClick();
                    update('crowdAmbience', !settings.crowdAmbience);
                  }}
                >
                  {settings.crowdAmbience ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                </button>
              </div>

              <div className="trax-jukebox-box">
                <div className="trax-jukebox-head">
                  <span>♫ JUKEBOX OFFICIEL FC TRAX</span>
                  <button
                    type="button"
                    className="mini-next-btn"
                    onClick={() => {
                      sfx.nextTrack();
                      setActiveTrackIdx(sfx.getTrackIndex());
                    }}
                  >
                    Piste suivante ⏭
                  </button>
                </div>
                <div className="trax-list">
                  {EA_TRAX_PLAYLIST.map((track, idx) => {
                    const active = activeTrackIdx === idx && settings.musicEnabled;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        className={`trax-row ${active ? 'active' : ''}`}
                        onClick={() => {
                          if (!settings.musicEnabled) update('musicEnabled', true);
                          sfx.selectTrack(idx);
                          setActiveTrackIdx(idx);
                        }}
                      >
                        <div className="trax-eq">{active ? '▮▮▮' : '▶'}</div>
                        <div className="trax-info">
                          <strong>{track.title}</strong>
                          <span>{track.artist}</span>
                        </div>
                        <span className="trax-bpm">{track.bpm} BPM</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'gameplay' && (
            <div className="settings-group-list">
              <div className="setting-block">
                <strong>Mode de visée tactile / souris</strong>
                <span>Choisissez comment orienter la flèche de tir</span>
                <div className="seg-choice-grid two">
                  <button
                    type="button"
                    className={settings.aimMode === 'slingshot' ? 'active' : ''}
                    onClick={() => {
                      sfx.uiClick();
                      update('aimMode', 'slingshot');
                    }}
                  >
                    <strong>Fronde Classique</strong>
                    <small>Tirer vers l'arrière pour propulser</small>
                  </button>
                  <button
                    type="button"
                    className={settings.aimMode === 'direct' ? 'active' : ''}
                    onClick={() => {
                      sfx.uiClick();
                      update('aimMode', 'direct');
                    }}
                  >
                    <strong>Visée Directe</strong>
                    <small>Glisser vers la cible souhaitée</small>
                  </button>
                </div>
              </div>

              <div className="setting-block">
                <strong>Laser d'assistance FC IQ</strong>
                <span>Longueur de l'indicateur de trajectoire avant le tir</span>
                <div className="seg-choice-grid three">
                  {(
                    [
                      ['full', 'Complet'],
                      ['short', 'Court'],
                      ['off', 'Pro (Sans)'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={settings.aimGuide === val ? 'active' : ''}
                      onClick={() => {
                        sfx.uiClick();
                        update('aimGuide', val);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-block">
                <strong>Sensibilité de puissance</strong>
                <span>Réactivité de la jauge de tir lors du glissement</span>
                <div className="seg-choice-grid three">
                  {(
                    [
                      [0.85, 'Précision 85%'],
                      [1.0, 'Standard 100%'],
                      [1.15, 'Explosif 115%'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={settings.shotSensitivity === val ? 'active' : ''}
                      onClick={() => {
                        sfx.uiClick();
                        update('shotSensitivity', val);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Vibrations Haptiques</strong>
                  <span>Retour physique sur mobile lors des frappes et buts</span>
                </div>
                <button
                  type="button"
                  className={`chip-toggle ${settings.haptics ? 'on' : ''}`}
                  onClick={() => {
                    sfx.uiClick();
                    update('haptics', !settings.haptics);
                  }}
                >
                  {settings.haptics ? 'ACTIVÉ' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          {tab === 'pitch' && (
            <div className="settings-group-list">
              <div className="setting-block">
                <strong>Style de pelouse du stade</strong>
                <span>Change l'ambiance visuelle du terrain 2D immédiatement</span>
                <div className="turf-grid">
                  {(Object.keys(TURF_PALETTES) as TurfTheme[]).map((key) => {
                    const p = TURF_PALETTES[key];
                    const selected = settings.turfTheme === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`turf-card ${selected ? 'selected' : ''}`}
                        onClick={() => {
                          sfx.uiClick();
                          update('turfTheme', key);
                        }}
                      >
                        <div
                          className="turf-swatch"
                          style={{
                            background: `repeating-linear-gradient(90deg, ${p.stripeA} 0 14px, ${p.stripeB} 14px 28px)`,
                            borderColor: p.line,
                          }}
                        />
                        <strong>{p.name}</strong>
                        <small>{p.subtitle}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="setting-block">
                <strong>Noms des joueurs sur le terrain</strong>
                <div className="seg-choice-grid three">
                  {(
                    [
                      ['stationary', 'À l’arrêt'],
                      ['always', 'Toujours'],
                      ['hidden', 'Masqués'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={settings.nameplates === val ? 'active' : ''}
                      onClick={() => {
                        sfx.uiClick();
                        update('nameplates', val);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Secousse caméra (Buts & Poteaux)</strong>
                  <span>Impact dynamique sur les frappes puissantes</span>
                </div>
                <button
                  type="button"
                  className={`chip-toggle ${settings.cameraShake ? 'on' : ''}`}
                  onClick={() => {
                    sfx.uiClick();
                    update('cameraShake', !settings.cameraShake);
                  }}
                >
                  {settings.cameraShake ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Traînée de balle & Effets 60 FPS</strong>
                  <span>Comète lumineuse sur les tirs rapides</span>
                </div>
                <button
                  type="button"
                  className={`chip-toggle ${settings.highParticles ? 'on' : ''}`}
                  onClick={() => {
                    sfx.uiClick();
                    update('highParticles', !settings.highParticles);
                  }}
                >
                  {settings.highParticles ? 'HAUTE' : 'ÉCO'}
                </button>
              </div>
            </div>
          )}

          {tab === 'system' && (
            <div className="settings-group-list">
              <div className="system-status-card">
                <div>
                  <span className="fc27-skew-tag volt">
                    {standalone ? 'MODE APP INSTALLÉE' : 'MODE NAVIGATEUR'}
                  </span>
                  <h4 style={{ margin: '8px 0 4px' }}>
                    {standalone
                      ? 'Matchly FC tourne depuis votre écran d’accueil'
                      : 'Installez Matchly FC sur votre écran d’accueil'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                    Application Web Progressive (PWA) optimisée pour iOS et Android avec cache
                    rapide des portraits et bande-son embarquée.
                  </p>
                </div>
                {!standalone && deferredPrompt && (
                  <button
                    type="button"
                    className="fc27-volt-btn full-w"
                    style={{ marginTop: 10 }}
                    onClick={() => onTriggerInstall()}
                  >
                    📲 INSTALLER MAINTENANT
                  </button>
                )}
              </div>

              <div className="seg-choice-grid two">
                <button
                  type="button"
                  className="action-tile-btn"
                  onClick={() => {
                    sfx.uiClick();
                    onClose();
                    onReplayIntro();
                  }}
                >
                  🎬 Rejouer la cinématique 30s
                </button>
                <button type="button" className="action-tile-btn" onClick={toggleFullscreen}>
                  ⛶ Plein écran
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Écran d'invitation PWA sur mobile</strong>
                  <span>Demander l'ajout à l'écran d'accueil à l'ouverture</span>
                </div>
                <button
                  type="button"
                  className={`chip-toggle ${settings.requirePwaOnMobile ? 'on' : ''}`}
                  onClick={() => {
                    sfx.uiClick();
                    update('requirePwaOnMobile', !settings.requirePwaOnMobile);
                  }}
                >
                  {settings.requirePwaOnMobile ? 'ON' : 'OFF'}
                </button>
              </div>

              <button
                type="button"
                className="ghost-btn full-w"
                onClick={() => {
                  sfx.uiClick();
                  onChange({ ...DEFAULT_SETTINGS });
                }}
              >
                Réinitialiser tous les paramètres par défaut
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
