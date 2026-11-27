import React from 'react';

interface MainMenuProps {
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
}

interface Hotspot {
  id: string;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  onClick: () => void;
  badge?: number;
}

/**
 * FC 27 Main Menu — official user artwork (1168×1346) with invisible,
 * fully clickable hotspots over every baked-in button. Same navy /
 * blue / magenta design language as the title screen.
 */
export const MainMenu: React.FC<MainMenuProps> = (props) => {
  const hotspots: Hotspot[] = [
    { id: 'profile', label: 'Profil du joueur', left: 51, top: 3, width: 25, height: 6.6, onClick: props.onProfile },
    { id: 'rewards', label: 'Pièces et récompenses', left: 78.5, top: 3, width: 20.5, height: 5.6, onClick: props.onShop },
    { id: 'career', label: 'Carrière — construisez votre légende', left: 0.8, top: 26.9, width: 41.2, height: 7, onClick: props.onCareer },
    { id: 'online', label: 'En ligne — jouez avec le monde', left: 0.8, top: 34.3, width: 41.2, height: 7, onClick: props.onOnline },
    { id: 'championship', label: 'Championnat — remportez le titre', left: 0.8, top: 41.7, width: 41.2, height: 7, onClick: props.onChampionship },
    { id: 'quick', label: 'Match rapide', left: 0.8, top: 49.1, width: 41.2, height: 7, onClick: props.onQuickMatch },
    { id: 'modes', label: 'Modes de jeu', left: 0.8, top: 56.5, width: 41.2, height: 7, onClick: props.onModes },
    { id: 'shop', label: 'Boutique — obtenez des récompenses', left: 0.8, top: 63.9, width: 41.2, height: 7, onClick: props.onShop, badge: props.claimableCount },
    { id: 'settings', label: 'Paramètres', left: 0.8, top: 71.3, width: 41.2, height: 7, onClick: props.onSettings },
    { id: 'quit', label: "Quitter — retour à l'écran titre", left: 0.8, top: 78.7, width: 41.2, height: 7, onClick: props.onQuit },
    { id: 'ucl', label: 'UEFA Champions League — coupes européennes', left: 37, top: 69.9, width: 23.2, height: 22.2, onClick: props.onChampionsLeague },
    { id: 'events', label: 'Événements spéciaux — défis', left: 60.2, top: 69.9, width: 19, height: 22.2, onClick: props.onEvents },
    { id: 'myteam', label: 'Mon équipe — gérez votre équipe', left: 79.4, top: 69.9, width: 19.9, height: 22.2, onClick: props.onMyTeam },
  ];

  return (
    <div className="screen-stage menu-stage">
      <div
        className="screen-frame menu-frame"
        style={{
          aspectRatio: '1168 / 1346',
          width: 'min(100vw, calc(100dvh * 1168 / 1346))',
        }}
      >
        <img src="/brand/menu-screen.jpg" alt="Matchly FC 27 — Menu principal" draggable={false} />
        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            className="menu-hotspot"
            style={{
              left: `${h.left}%`,
              top: `${h.top}%`,
              width: `${h.width}%`,
              height: `${h.height}%`,
            }}
            onClick={h.onClick}
            aria-label={h.label}
            title={h.label}
          >
            {h.badge !== undefined && h.badge > 0 && <span className="menu-live-badge">{h.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};
