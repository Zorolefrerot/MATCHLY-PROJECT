import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const SLIDES = [
  {
    step: '01 / 06',
    title: '5 titulaires par équipe sur le terrain',
    body: 'Chaque équipe aligne 1 gardien et 4 joueurs de champ avec leurs vraies photos et spécialités (Puissance de tir, Impact physique, Contrôle).',
    diagram: 'formation',
  },
  {
    step: '02 / 06',
    title: 'Glissez en arrière pour viser et doser',
    body: 'Touchez l’un de vos 5 pions, tirez vers l’arrière pour régler l’angle et la jauge de puissance, puis relâchez pour frapper.',
    diagram: 'slingshot',
  },
  {
    step: '03 / 06',
    title: 'Chacun son tour · 1er à 3 buts',
    body: 'Les managers alternent à chaque coup de pied (chrono par tour). Après chaque but, le ballon revient au centre pour le coup d’envoi.',
    diagram: 'turns',
  },
  {
    step: '04 / 06',
    title: 'Duel à deux en ligne par Code',
    body: 'Créez un salon privé et partagez le code à 5 caractères. Votre ami saisit le même code sur son téléphone pour lancer le match en direct.',
    diagram: 'code',
  },
  {
    step: '05 / 06',
    title: 'Compétitions entre comptes inscrits',
    body: 'Créez un compte gratuit pour disputer les Ligues et Coupes en ligne officielles, défier les autres inscrits et grimper au classement.',
    diagram: 'comp',
  },
  {
    step: '06 / 06',
    title: 'Débloquez les géants d’Europe',
    body: 'Remportez des trophées en Coupes Solo et en Ligne pour libérer le Real, le Barça, le PSG, City, le Bayern et les grandes sélections nationales.',
    diagram: 'unlock',
  },
];

export const HowToPlayModal: React.FC<Props> = ({ onClose }) => {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];

  const renderDiagram = (kind: string) => {
    return (
      <svg viewBox="0 0 280 185" className="howto-svg">
        {/* Mini stadium backdrop */}
        <rect x="0" y="0" width="280" height="185" rx="12" fill="#13221B" />
        {/* Pitch */}
        <rect x="78" y="16" width="124" height="153" rx="6" fill="#217841" stroke="#E2E8F0" strokeWidth="2" />
        <line x1="78" y1="92.5" x2="202" y2="92.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
        <circle cx="140" cy="92.5" r="18" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
        <rect x="118" y="8" width="44" height="8" fill="none" stroke="#60A5FA" strokeWidth="1.8" />
        <rect x="118" y="169" width="44" height="8" fill="none" stroke="#F87171" strokeWidth="1.8" />

        {kind === 'formation' && (
          <>
            {/* Top away caps */}
            {[96, 124, 156, 184].map((x, i) => (
              <circle key={i} cx={x} cy="44" r="7.5" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.8" />
            ))}
            <circle cx="140" cy="26" r="8" fill="#0284C7" stroke="#F8FAFC" strokeWidth="1.8" />
            {/* Bottom home caps */}
            {[96, 124, 156, 184].map((x, i) => (
              <circle key={i} cx={x} cy="138" r="7.5" fill="#EF4444" stroke="#F8FAFC" strokeWidth="1.8" />
            ))}
            <circle cx="140" cy="158" r="8" fill="#F59E0B" stroke="#F8FAFC" strokeWidth="1.8" />
            <circle cx="140" cy="92.5" r="5.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
          </>
        )}

        {kind === 'slingshot' && (
          <>
            <circle cx="140" cy="92.5" r="5.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
            <line x1="154" y1="134" x2="141" y2="98" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="154" y1="134" x2="168" y2="164" stroke="#FFFFFF" strokeDasharray="3,3" strokeWidth="2" />
            <circle cx="154" cy="134" r="9" fill="#EF4444" stroke="#F8FAFC" strokeWidth="2" />
            <circle cx="168" cy="164" r="6" fill="#FBBF24" />
          </>
        )}

        {kind === 'turns' && (
          <>
            <circle cx="115" cy="52" r="8" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.8" />
            <circle cx="162" cy="128" r="8" fill="#EF4444" stroke="#F8FAFC" strokeWidth="1.8" />
            <circle cx="140" cy="14" r="5.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
            <path d="M162 120 Q152 65 140 18" fill="none" stroke="#34D399" strokeWidth="2.5" strokeDasharray="4,3" />
          </>
        )}

        {kind === 'code' && (
          <>
            <rect x="44" y="64" width="192" height="58" rx="10" fill="#0B1215" stroke="#E5A93C" strokeWidth="2" />
            <text x="140" y="86" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="700">
              CODE DU SALON EN LIGNE
            </text>
            <text
              x="140"
              y="110"
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="22"
              fontWeight="800"
              letterSpacing="5"
              fontFamily="monospace"
            >
              K9M4X
            </text>
          </>
        )}

        {kind === 'comp' && (
          <>
            <rect x="38" y="42" width="204" height="102" rx="10" fill="#0B1215" stroke="#38BDF8" strokeWidth="1.8" />
            <text x="140" y="66" textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="800">
              LIGUE DES COMPTES · CLASSEMENT
            </text>
            <text x="60" y="90" fill="#F8FAFC" fontSize="11" fontWeight="700">
              1. Coach_RMA · 18 pts
            </text>
            <text x="60" y="110" fill="#CBD5E1" fontSize="11" fontWeight="600">
              2. Maestro_PSG · 15 pts
            </text>
            <text x="60" y="130" fill="#94A3B8" fontSize="11" fontWeight="600">
              3. Tactico_BAR · 12 pts
            </text>
          </>
        )}

        {kind === 'unlock' && (
          <>
            <circle cx="140" cy="84" r="32" fill="#E5A93C" opacity="0.2" />
            <circle cx="140" cy="84" r="24" fill="#E5A93C" />
            <text x="140" y="91" textAnchor="middle" fill="#0B1215" fontSize="20" fontWeight="900">
              ★
            </text>
            <rect x="52" y="126" width="176" height="26" rx="6" fill="#0B1215" />
            <text x="140" y="143" textAnchor="middle" fill="#FDE047" fontSize="11" fontWeight="800">
              REAL · BARÇA · PSG · FRANCE
            </text>
          </>
        )}
      </svg>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card howto-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow-tag">GUIDE TACTIQUE · {slide.step}</span>
            <h2>COMMENT JOUER</h2>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="howto-stage">
          {renderDiagram(slide.diagram)}
          <h3>{slide.title}</h3>
          <p>{slide.body}</p>
        </div>

        <div className="howto-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`howto-dot ${i === idx ? 'active' : ''}`}
              onClick={() => setIdx(i)}
              aria-label={`Étape ${i + 1}`}
            />
          ))}
        </div>

        <div className="howto-footer">
          <button
            type="button"
            className="btn-secondary"
            disabled={idx === 0}
            onClick={() => setIdx((v) => Math.max(0, v - 1))}
          >
            <ChevronLeft size={16} /> Précédent
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Compris
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={idx === SLIDES.length - 1}
            onClick={() => setIdx((v) => Math.min(SLIDES.length - 1, v + 1))}
          >
            Suivant <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
