import React, { useEffect, useRef, useState } from 'react';
import { sfx } from '../engine/audio';

interface IntroScene {
  start: number;
  end: number;
  image: string;
  kicker: string;
  title: string;
  subtitle: string;
  badge: string;
  statLine: string;
  accent: string;
  panClass: string;
}

const INTRO_DURATION = 30.0;

const SCENES: IntroScene[] = [
  {
    start: 0.0,
    end: 4.0,
    image: '/cinematic/stadium.jpg',
    kicker: 'MATCHLY SPORTS INTERACTIVE PRÉSENTE',
    title: 'NUITS D’EUROPE',
    subtitle: '80 000 supporters. Cinq joueurs sur le gazon. Un seul vainqueur.',
    badge: 'FC 27 ENGINE',
    statLine: 'HYPERMOTION 2D · PHYSIQUE TEMPS RÉEL · 60 FPS',
    accent: '#B8FF00',
    panClass: 'cine-pan-zoom-in',
  },
  {
    start: 4.0,
    end: 8.0,
    image: '/cinematic/mbappe.jpg',
    kicker: 'REAL MADRID CF · ÉQUIPE DE FRANCE',
    title: 'KYLIAN MBAPPÉ',
    subtitle: 'Accélération foudroyante et finition chirurgicale dans la surface.',
    badge: 'OVR 94 · #9',
    statLine: 'TIR 95 · VITESSE 97 · PLAYSTYLE+ TIR EN FINESSE',
    accent: '#00E5FF',
    panClass: 'cine-pan-left',
  },
  {
    start: 8.0,
    end: 11.8,
    image: '/cinematic/yamal.jpg',
    kicker: 'FC BARCELONA · LA ROJA',
    title: 'LAMINE YAMAL',
    subtitle: 'Le prodige européen qui réinvente le dribble et les angles impossibles.',
    badge: 'OVR 93 · #19',
    statLine: 'CONTRÔLE 96 · COURBE 94 · PLAYSTYLE+ TECHNIQUE',
    accent: '#B8FF00',
    panClass: 'cine-pan-right',
  },
  {
    start: 11.8,
    end: 15.5,
    image: '/cinematic/bellingham.jpg',
    kicker: 'ANGLETERRE · CASA BLANCA',
    title: 'JUDE BELLINGHAM',
    subtitle: 'Sang-froid dans le temps additionnel et impact total au cœur du jeu.',
    badge: 'OVR 93 · #5',
    statLine: 'PHYSIQUE 91 · CONTRÔLE 94 · LEADER D’ARÈNE',
    accent: '#F2C14E',
    panClass: 'cine-pan-zoom-out',
  },
  {
    start: 15.5,
    end: 19.2,
    image: '/cinematic/haaland.jpg',
    kicker: 'MANCHESTER CITY · CYBORG DU BUT',
    title: 'ERLING HAALAND',
    subtitle: 'Une puissance de frappe capable de faire trembler chaque montant.',
    badge: 'OVR 94 · #9',
    statLine: 'FRAPPE LOURDE 97 · IMPACT 95 · 132 KM/H',
    accent: '#38BDF8',
    panClass: 'cine-pan-left',
  },
  {
    start: 19.2,
    end: 22.6,
    image: '/cinematic/vinicius.jpg',
    kicker: 'REAL MADRID · MAGIE BRÉSILIENNE EN EUROPE',
    title: 'VINÍCIUS JR.',
    subtitle: 'Un contre un dévastateur sous les projecteurs des finales.',
    badge: 'OVR 93 · #7',
    statLine: 'EXPLOSIVITÉ 96 · TIR CROISÉ 92 · DÉCISIF',
    accent: '#F2C14E',
    panClass: 'cine-pan-right',
  },
  {
    start: 22.6,
    end: 24.5,
    image: '/cinematic/salah.jpg',
    kicker: 'LIVERPOOL FC · ANFIELD KING',
    title: 'MOHAMED SALAH',
    subtitle: 'Précision millimétrée dans la lucarne opposée.',
    badge: 'OVR 92 · #11',
    statLine: 'TIR ENROULÉ 94 · SANG-FROID 95',
    accent: '#FF4D6D',
    panClass: 'cine-pan-zoom-in',
  },
  {
    start: 24.5,
    end: 26.8,
    image: '/cinematic/ronaldo.jpg',
    kicker: 'SELEÇÃO PORTUGAL · ICÔNE DES RECORDS',
    title: 'CRISTIANO RONALDO',
    subtitle: 'L’instinct absolu des grandes soirées internationales.',
    badge: 'ICÔNE · #7',
    statLine: 'PUISSANCE PURE 96 · MENTALITÉ CHAMPION',
    accent: '#B8FF00',
    panClass: 'cine-pan-left',
  },
  {
    start: 26.8,
    end: 30.1,
    image: '/cinematic/stadium.jpg',
    kicker: '18 CLUBS & SÉLECTIONS · MULTIJOUEUR PAR CODE · COUPES',
    title: 'MATCHLY FC 27',
    subtitle: 'Prenez le contrôle du terrain. Votre saison européenne commence maintenant.',
    badge: 'SAISON 1 ACTIVE',
    statLine: 'ENTRÉE DANS LE HUB OFFICIEL...',
    accent: '#B8FF00',
    panClass: 'cine-pan-zoom-out',
  },
];

interface IntroCinematicProps {
  onFinish: () => void;
}

export const IntroCinematic: React.FC<IntroCinematicProps> = ({ onFinish }) => {
  const [elapsed, setElapsed] = useState(0);
  const [needsTap, setNeedsTap] = useState(false);
  const [muted, setMuted] = useState(sfx.muted);
  const rafRef = useRef<number | null>(null);
  const startPerfRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishedRef = useRef(false);

  const completeIntro = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    sfx.stopIntroScoreAndStartMenu();
    onFinish();
  };

  const beginPlayback = () => {
    setNeedsTap(false);
    startPerfRef.current = performance.now();
    const audio = sfx.startIntroScore();
    audioRef.current = audio;

    const tick = () => {
      if (finishedRef.current) return;
      const wallElapsed = (performance.now() - startPerfRef.current) / 1000;
      // Sync to audio clock when playing smoothly, fallback to wall clock
      const a = audioRef.current;
      const t =
        a && !a.paused && a.currentTime > 0.05 && Math.abs(a.currentTime - wallElapsed) < 1.5
          ? a.currentTime
          : wallElapsed;

      setElapsed(Math.min(INTRO_DURATION, t));

      if (t >= INTRO_DURATION) {
        completeIntro();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    // Preload cinematic images for instant zero-flicker cuts
    SCENES.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });

    // Attempt immediate playback; if browser blocks unmuted autoplay on fresh cold start, show FC27 ignition gate
    const probe = new Audio('/audio/fc27-intro-30s.mp3');
    probe.volume = 0.01;
    probe
      .play()
      .then(() => {
        probe.pause();
        beginPlayback();
      })
      .catch(() => {
        setNeedsTap(true);
      });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (!finishedRef.current) {
        sfx.stopIntroScoreAndStartMenu();
      }
    };
  }, []);

  if (needsTap) {
    return (
      <div
        className="cine-root cine-tap-gate"
        onClick={() => {
          sfx.unlockFromGesture();
          beginPlayback();
        }}
      >
        <div
          className="cine-bg cine-pan-zoom-in"
          style={{ backgroundImage: "url('/cinematic/mbappe.jpg')" }}
        />
        <div className="cine-vignette" />
        <div className="cine-tap-center">
          <div className="fc27-delta-emblem">Δ</div>
          <span className="fc27-skew-tag volt">CINÉMATIQUE OFFICIELLE · 30 SECONDES</span>
          <h1>MATCHLY FC 27</h1>
          <p>Son bande-originale & superstars européennes</p>
          <button type="button" className="fc27-volt-btn">
            ▶ APPUYEZ POUR LANCER AVEC LE SON
          </button>
          <button
            type="button"
            className="cine-skip-inline"
            onClick={(e) => {
              e.stopPropagation();
              sfx.unlockFromGesture();
              completeIntro();
            }}
          >
            Aller directement au menu →
          </button>
        </div>
      </div>
    );
  }

  const activeIndex = Math.max(
    0,
    SCENES.findIndex((s) => elapsed >= s.start && elapsed < s.end),
  );
  const scene = SCENES[activeIndex] || SCENES[SCENES.length - 1];
  const sceneAge = elapsed - scene.start;
  const cutFlash = sceneAge < 0.18 && activeIndex > 0;
  const pct = Math.min(100, (elapsed / INTRO_DURATION) * 100);

  const fmt = (sec: number) => {
    const s = Math.floor(sec);
    return `00:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="cine-root">
      {/* Real player / stadium full-bleed shot with Ken Burns motion */}
      <div
        key={`${activeIndex}-${scene.image}`}
        className={`cine-bg ${scene.panClass}`}
        style={{ backgroundImage: `url('${scene.image}')` }}
      />

      {/* Stadium light beams & cinematic letterbox */}
      <div className="cine-beams" />
      <div className="cine-vignette" />
      {cutFlash && <div className="cine-cut-flash" />}

      {/* Top HUD bar */}
      <div className="cine-top-bar">
        <div className="cine-brand-pill">
          <span className="cine-live-dot" style={{ background: scene.accent }} />
          <span>FC 27 INTRO OFFICIELLE</span>
          <span className="cine-sep">/</span>
          <span>ACTE {activeIndex + 1} SUR {SCENES.length}</span>
        </div>

        <div className="cine-top-actions">
          <button
            type="button"
            className="cine-ctrl-btn"
            onClick={() => setMuted(sfx.toggleMute())}
          >
            {muted ? '🔇 Muet' : '🔊 Audio HD'}
          </button>
          <button
            type="button"
            className="cine-skip-btn"
            onClick={() => {
              sfx.uiClick();
              completeIntro();
            }}
          >
            PASSER ⏭
          </button>
        </div>
      </div>

      {/* HyperMotion telemetry brackets */}
      <div className="cine-telemetry-frame">
        <span className="cine-corner tl" style={{ borderColor: scene.accent }} />
        <span className="cine-corner tr" style={{ borderColor: scene.accent }} />
        <span className="cine-corner bl" style={{ borderColor: scene.accent }} />
        <span className="cine-corner br" style={{ borderColor: scene.accent }} />
      </div>

      {/* Final act superstar strip */}
      {activeIndex === SCENES.length - 1 && (
        <div className="cine-finale-strip">
          <img src="/cinematic/mbappe.jpg" alt="Mbappé" />
          <img src="/cinematic/yamal.jpg" alt="Yamal" />
          <img src="/cinematic/bellingham.jpg" alt="Bellingham" />
          <img src="/cinematic/haaland.jpg" alt="Haaland" />
          <img src="/cinematic/vinicius.jpg" alt="Vinícius" />
        </div>
      )}

      {/* Lower-third EA SPORTS FC 27 kinetic broadcast typography */}
      <div key={`txt-${activeIndex}`} className="cine-lower-third">
        <div className="cine-badge-row">
          <span
            className="fc27-skew-tag"
            style={{ background: scene.accent, color: '#060A0E' }}
          >
            {scene.badge}
          </span>
          <span className="cine-kicker">{scene.kicker}</span>
        </div>

        <h1 className="cine-hero-title">{scene.title}</h1>
        <p className="cine-hero-sub">{scene.subtitle}</p>

        <div className="cine-stat-ticker">
          <span className="cine-delta" style={{ color: scene.accent }}>
            ▲
          </span>
          <span>{scene.statLine}</span>
        </div>
      </div>

      {/* Bottom 30-second progress bar */}
      <div className="cine-progress-wrap">
        <div className="cine-timecode">
          <span>♫ MATCHLY FC 27 ANTHEM</span>
          <span>
            {fmt(elapsed)} / {fmt(INTRO_DURATION)}
          </span>
        </div>
        <div className="cine-progress-track">
          <div
            className="cine-progress-fill"
            style={{ width: `${pct}%`, background: scene.accent }}
          />
        </div>
      </div>
    </div>
  );
};
