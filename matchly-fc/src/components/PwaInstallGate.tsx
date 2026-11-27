import React, { useEffect, useState } from 'react';
import { sfx } from '../engine/audio';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneMedia =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(standaloneMedia || iosStandalone);
}

interface PwaInstallGateProps {
  deferredPrompt: BeforeInstallPromptEvent | null;
  onTriggerInstall: () => Promise<boolean>;
  onBypassForPreview: () => void;
}

export const PwaInstallGate: React.FC<PwaInstallGateProps> = ({
  deferredPrompt,
  onTriggerInstall,
  onBypassForPreview,
}) => {
  const [installing, setInstalling] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else setPlatform('desktop');

    try {
      setInIframe(window.self !== window.top);
    } catch {
      setInIframe(true);
    }
  }, []);

  const handleInstallClick = async () => {
    sfx.unlockFromGesture();
    sfx.uiClick();
    setInstalling(true);
    const accepted = await onTriggerInstall();
    setInstalling(false);
    if (accepted) {
      onBypassForPreview();
    }
  };

  return (
    <div className="pwa-gate-root">
      <div
        className="pwa-gate-bg"
        style={{ backgroundImage: "url('/cinematic/stadium.jpg')" }}
      />
      <div className="pwa-gate-vignette" />

      <div className="pwa-gate-card">
        <div className="pwa-gate-hero-strip">
          <img src="/cinematic/mbappe.jpg" alt="Mbappé" />
          <img src="/cinematic/yamal.jpg" alt="Yamal" />
          <img src="/cinematic/bellingham.jpg" alt="Bellingham" />
          <div className="pwa-gate-hero-overlay">
            <span className="fc27-skew-tag volt">APPLICATION OFFICIELLE PWA</span>
          </div>
        </div>

        <div className="pwa-gate-body">
          <div className="pwa-app-badge-row">
            <img src="/icons/icon-192.png" alt="Matchly FC" className="pwa-app-icon" />
            <div>
              <div className="pwa-kicker">EA SPORTS FC™ 27 INSPIRED EDITION</div>
              <h1 className="pwa-title">MATCHLY FC 27</h1>
              <p className="pwa-meta">Plein écran · 60 FPS · Audio Trax · Multijoueur Temps Réel</p>
            </div>
          </div>

          <div className="pwa-notice-box">
            <strong>📲 Installation sur l'écran d'accueil requise</strong>
            <p>
              Pour jouer en plein écran vertical sans barre d'adresse, profiter des vibrations
              haptiques et de la visée tactile précise, ajoutez <strong>Matchly FC</strong> sur
              votre écran d'accueil puis lancez l'icône de l'application.
            </p>
          </div>

          {deferredPrompt ? (
            <button
              type="button"
              className="fc27-volt-btn full-w"
              onClick={handleInstallClick}
              disabled={installing}
            >
              {installing
                ? 'INSTALLATION EN COURS...'
                : "📲 INSTALLER SUR L'ÉCRAN D'ACCUEIL"}
            </button>
          ) : platform === 'ios' ? (
            <div className="pwa-steps-list">
              <div className="pwa-step-item">
                <span className="pwa-step-num">1</span>
                <div>
                  <strong>Touchez le bouton Partager</strong>
                  <span>Icône carrée avec flèche vers le haut en bas de Safari</span>
                </div>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-num">2</span>
                <div>
                  <strong>Sélectionnez « Sur l'écran d'accueil »</strong>
                  <span>Faites défiler le menu d'options vers le bas</span>
                </div>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-num">3</span>
                <div>
                  <strong>Touchez « Ajouter » puis ouvrez Matchly FC</strong>
                  <span>Lancez le jeu directement depuis votre écran d'accueil iPhone</span>
                </div>
              </div>
            </div>
          ) : platform === 'android' ? (
            <div className="pwa-steps-list">
              <div className="pwa-step-item">
                <span className="pwa-step-num">1</span>
                <div>
                  <strong>Ouvrez le menu Chrome (⋮) en haut à droite</strong>
                  <span>Dans votre navigateur mobile Android</span>
                </div>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-num">2</span>
                <div>
                  <strong>Touchez « Installer l'application » ou « Ajouter à l'écran d'accueil »</strong>
                  <span>Validez l'installation puis ouvrez l'icône Matchly FC</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pwa-steps-list">
              <div className="pwa-step-item">
                <span className="pwa-step-num">📲</span>
                <div>
                  <strong>Sur téléphone (iOS / Android)</strong>
                  <span>
                    Ouvrez ce lien sur votre smartphone et ajoutez l'app à l'écran d'accueil, ou
                    cliquez sur l'icône d'installation dans la barre d'adresse Chrome/Edge.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="pwa-gate-footer">
            {inIframe || platform === 'desktop' ? (
              <button
                type="button"
                className="fc27-ghost-btn full-w"
                onClick={() => {
                  sfx.unlockFromGesture();
                  sfx.uiClick();
                  onBypassForPreview();
                }}
              >
                ▶ LANCER L'APERÇU WEB / PC (CINÉMATIQUE 30S + JEU)
              </button>
            ) : (
              <button
                type="button"
                className="pwa-subtle-bypass"
                onClick={() => {
                  sfx.unlockFromGesture();
                  sfx.uiClick();
                  onBypassForPreview();
                }}
              >
                Continuer temporairement dans le navigateur mobile →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
