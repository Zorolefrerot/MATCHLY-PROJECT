import React from 'react';
import { EuroTeam } from '../data/teams';

interface Props {
  team: EuroTeam;
  size?: number;
  className?: string;
}

export const TeamCrest: React.FC<Props> = ({ team, size = 44, className = '' }) => {
  const uid = `crest-${team.id}-${Math.round(size)}`;
  const isLightPrimary =
    team.kitPrimary.toUpperCase() === '#FFFFFF' ||
    team.kitPrimary.toUpperCase() === '#F8FAFC' ||
    team.kitPrimary.toUpperCase() === '#FDE100';

  const textColor = isLightPrimary ? team.kitSecondary : '#FFFFFF';

  const getClipPath = () => {
    switch (team.crestShape) {
      case 'round':
        return <circle cx="50" cy="50" r="44" />;
      case 'crown':
        return (
          <path d="M50 8 L64 18 L82 14 L86 34 C88 64 74 84 50 94 C26 84 12 64 14 34 L18 14 L36 18 Z" />
        );
      case 'hex':
        return <polygon points="50,6 90,26 90,72 50,94 10,72 10,26" />;
      case 'diamond':
        return <polygon points="50,6 92,50 50,94 8,50" />;
      case 'shield':
      default:
        return <path d="M14 12 H86 V48 C86 73 69 87 50 95 C31 87 14 73 14 48 Z" />;
    }
  };

  const renderOutline = () => {
    switch (team.crestShape) {
      case 'round':
        return <circle cx="50" cy="50" r="44" fill="none" stroke={team.kitTrim} strokeWidth="4.5" />;
      case 'crown':
        return (
          <path
            d="M50 8 L64 18 L82 14 L86 34 C88 64 74 84 50 94 C26 84 12 64 14 34 L18 14 L36 18 Z"
            fill="none"
            stroke={team.kitTrim}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        );
      case 'hex':
        return (
          <polygon
            points="50,6 90,26 90,72 50,94 10,72 10,26"
            fill="none"
            stroke={team.kitTrim}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        );
      case 'diamond':
        return (
          <polygon
            points="50,6 92,50 50,94 8,50"
            fill="none"
            stroke={team.kitTrim}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        );
      case 'shield':
      default:
        return (
          <path
            d="M14 12 H86 V48 C86 73 69 87 50 95 C31 87 14 73 14 48 Z"
            fill="none"
            stroke={team.kitTrim}
            strokeWidth="4.2"
            strokeLinejoin="round"
          />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.45))' }}
      aria-label={team.name}
    >
      <defs>
        <clipPath id={uid}>{getClipPath()}</clipPath>
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${uid})`}>
        <rect x="0" y="0" width="100" height="100" fill={team.kitPrimary} />

        {team.kitPattern === 'stripes' && (
          <>
            <rect x="18" y="0" width="14" height="100" fill={team.kitSecondary} />
            <rect x="43" y="0" width="14" height="100" fill={team.kitSecondary} />
            <rect x="68" y="0" width="14" height="100" fill={team.kitSecondary} />
          </>
        )}

        {team.kitPattern === 'halves' && (
          <rect x="50" y="0" width="50" height="100" fill={team.kitSecondary} />
        )}

        {team.kitPattern === 'centerband' && (
          <>
            <rect x="38" y="0" width="24" height="100" fill={team.kitSecondary} />
            <rect x="35" y="0" width="3" height="100" fill={team.kitTrim} />
            <rect x="62" y="0" width="3" height="100" fill={team.kitTrim} />
          </>
        )}

        {team.kitPattern === 'sash' && (
          <polygon points="-10,75 75,-10 95,10 10,95" fill={team.kitSecondary} />
        )}

        {team.kitPattern === 'solid' && (
          <path d="M0 68 L100 52 L100 100 L0 100 Z" fill={team.kitSecondary} opacity="0.26" />
        )}

        {/* Center ribbon for code */}
        <rect x="6" y="37" width="88" height="26" fill="rgba(9, 14, 18, 0.78)" />
        <line x1="6" y1="37" x2="94" y2="37" stroke={team.kitTrim} strokeWidth="1.8" />
        <line x1="6" y1="63" x2="94" y2="63" stroke={team.kitTrim} strokeWidth="1.8" />

        <text
          x="50"
          y="55.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="'Barlow Condensed', sans-serif"
          fontWeight="800"
          fontSize="21"
          letterSpacing="1.5"
        >
          {team.code}
        </text>

        {team.category === 'nation' && (
          <circle cx="50" cy="24" r="5" fill={team.kitTrim} />
        )}
        {team.rating >= 92 && (
          <polygon
            points="50,17 52.2,22 57.5,22.4 53.4,25.8 54.8,31 50,28.1 45.2,31 46.6,25.8 42.5,22.4 47.8,22"
            fill="#F5B841"
          />
        )}

        <rect x="0" y="0" width="100" height="100" fill={`url(#${uid}-sheen)`} />
      </g>

      {renderOutline()}
    </svg>
  );
};
