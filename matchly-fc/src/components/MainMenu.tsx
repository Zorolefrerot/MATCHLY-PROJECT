import React from 'react';
import {
  ChevronRight,
  Coins,
  Crown,
  Gamepad2,
  Gem,
  Globe,
  LogOut,
  Plus,
  Settings,
  Shirt,
  ShoppingCart,
  Trophy,
} from 'lucide-react';

interface MainMenuProps {
  playerName: string;
  level: number;
  xpProgress: number; // 0..1
  coins: number;
  gems: number;
  claimableCount: number;
  onProfile: () => void;
  onShop: () => void;
  onCareer: () => void;
  onOnline: () => void;
  onChampionship: () => void;
  onQuickMatch: () => void;
  onModes: () => void;
  onSettings: () => void;
  onQuit: () => void;
  onChampionsLeague: () => void;
  onEvents: () => void;
  onMyTeam: () => void;
  onNotifications: () => void;
}

interface MenuEntry {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  highlight?: boolean;
  alert?: boolean;
  badge?: number;
}

/**
 * FC 27 Main Menu — fully coded UI recreating the official user mockup:
 * navy stadium, Olise & Doué background art, magenta highlight,
 * « PLAY • DREAM • WIN ». Every entry is a real, clickable button.
 */
export const MainMenu: React.FC<MainMenuProps> = (props) => {
  const entries: MenuEntry[] = [
    { id: 'career', title: 'Carrière', subtitle: 'Construisez votre légende', icon: <Crown size={24} />, onClick: props.onCareer, highlight: true },
    { id: 'online', title: 'En ligne', subtitle: 'Jouez avec le monde', icon: <Globe size={24} />, onClick: props.onOnline },
    { id: 'championship', title: 'Championnat', subtitle: 'Remportez le titre', icon: <Trophy size={24} />, onClick: props.onChampionship },
    { id: 'quick', title: 'Match Rapide', subtitle: 'Un match sans prise de tête', icon: <Shirt size={24} />, onClick: props.onQuickMatch },
    { id: 'modes', title: 'Modes de jeu', subtitle: 'Découvrez plus de modes', icon: <Gamepad2 size={24} />, onClick: props.onModes },
    { id: 'shop', title: 'Boutique', subtitle: 'Obtenez des récompenses', icon: <ShoppingCart size={24} />, onClick: props.onShop, alert: true, badge: props.claimableCount },
    { id: 'settings', title: 'Paramètres', subtitle: 'Personnalisez votre jeu', icon: <Settings size={24} />, onClick: props.onSettings },
    { id: 'quit', title: 'Quitter', subtitle: 'Fermez le jeu', icon: <LogOut size={24} />, onClick: props.onQuit },
  ];

  const initials = props.playerName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="screen-stage menu-stage">
      <div className="coded-menu">
        <img className="coded-menu-bg" src="/brand/menu-players.jpg" alt="" aria-hidden="true" draggable={false} />
        <div className="coded-menu-shade" aria-hidden="true" />

        <div className="coded-menu-content">
          {/* Header — logo, profil, monnaies */}
          <header className="cm-header">
            <div className="cm-brand">
              <img className="cm-brand-logo" src="/brand/matchly-fc27-logo-256.png" alt="Matchly FC 27" draggable={false} />
              <div className="cm-brand-titles">
                <strong>
                  Matchly <span>FC 27</span>
                </strong>
                <small>PLAY • DREAM • WIN</small>
              </div>
            </div>

            <div className="cm-hud">
              <button type="button" className="cm-profile" onClick={props.onProfile} aria-label="Profil du joueur">
                <span className="cm-avatar">{initials || 'M'}</span>
                <span className="cm-profile-meta">
                  <span className="cm-profile-name">{props.playerName}</span>
                  <span className="cm-profile-level">Niveau {props.level}</span>
                  <span className="cm-xp">
                    <i style={{ width: `${Math.round(props.xpProgress * 100)}%` }} />
                  </span>
                </span>
              </button>

              <button type="button" className="cm-wallet" onClick={props.onShop} aria-label="Pièces, gemmes et récompenses">
                <span className="cm-currency">
                  <Coins size={16} className="cm-coin" /> {props.coins.toLocaleString('fr-FR')}
                </span>
                <span className="cm-currency">
                  <Gem size={16} className="cm-gem" /> {props.gems.toLocaleString('fr-FR')}
                </span>
                <span className="cm-plus">
                  <Plus size={15} />
                </span>
              </button>
            </div>
          </header>

          {/* Corps — menu à gauche, cartes en bas à droite (comme la maquette) */}
          <div className="cm-body">
            <nav className="cm-nav" aria-label="Menu principal">
              {entries.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={`cm-item${e.highlight ? ' cm-item-highlight' : ''}`}
                  onClick={e.onClick}
                >
                  <span className="cm-item-icon">{e.icon}</span>
                  <span className="cm-item-text">
                    <strong>{e.title}</strong>
                    <small>{e.subtitle}</small>
                  </span>
                  {e.alert && <span className="cm-alert">!</span>}
                  {e.badge !== undefined && e.badge > 0 && <span className="cm-count">{e.badge}</span>}
                  <ChevronRight size={22} className="cm-chevron" />
                </button>
              ))}
            </nav>

            <div className="cm-cards">
              <button type="button" className="cm-card" onClick={props.onChampionsLeague} aria-label="UEFA Champions League — coupes européennes">
                <img src="/brand/card-ucl.jpg" alt="UEFA Champions League" draggable={false} />
              </button>
              <button type="button" className="cm-card" onClick={props.onEvents} aria-label="Événements spéciaux — défis">
                <img src="/brand/card-events.jpg" alt="Événements spéciaux" draggable={false} />
              </button>
              <button type="button" className="cm-card" onClick={props.onMyTeam} aria-label="Mon équipe — gérez votre équipe">
                <img src="/brand/card-team.jpg" alt="Mon équipe" draggable={false} />
              </button>
            </div>
          </div>

          {/* Pied — aides manette de la maquette */}
          <footer className="cm-footer">
            <div className="cm-hints">
              <span className="cm-hint">
                <i className="cm-key cm-key-x">✕</i> Confirmer
              </span>
              <span className="cm-hint">
                <i className="cm-key cm-key-o" /> Retour
              </span>
              <button type="button" className="cm-hint cm-hint-btn" onClick={props.onNotifications}>
                <i className="cm-key cm-key-t">▲</i> Notifications
                {props.claimableCount > 0 && <span className="cm-count">{props.claimableCount}</span>}
              </button>
            </div>
            <span className="cm-tm">™ Merdi Madimba</span>
          </footer>
        </div>
      </div>
    </div>
  );
};
