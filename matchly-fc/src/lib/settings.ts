export type TurfTheme = 'ucl_night' | 'classic_emerald' | 'wembley_dark' | 'cyber_arena';
export type AimMode = 'slingshot' | 'direct';
export type AimGuideLevel = 'full' | 'short' | 'off';
export type NameplateMode = 'always' | 'stationary' | 'hidden';

export interface GameSettings {
  masterVolume: number; // 0..100
  musicVolume: number; // 0..100
  sfxVolume: number; // 0..100
  crowdAmbience: boolean;
  musicEnabled: boolean;
  aimMode: AimMode;
  aimGuide: AimGuideLevel;
  shotSensitivity: number; // 0.85 | 1.0 | 1.15
  haptics: boolean;
  turfTheme: TurfTheme;
  cameraShake: boolean;
  nameplates: NameplateMode;
  highParticles: boolean;
  requirePwaOnMobile: boolean;
}

const SETTINGS_KEY = 'matchly_fc27_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 85,
  musicVolume: 65,
  sfxVolume: 85,
  crowdAmbience: true,
  musicEnabled: true,
  aimMode: 'slingshot',
  aimGuide: 'full',
  shotSensitivity: 1.0,
  haptics: true,
  turfTheme: 'ucl_night',
  cameraShake: true,
  nameplates: 'stationary',
  highParticles: true,
  requirePwaOnMobile: true,
};

export function loadGameSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveGameSettings(next: GameSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export const TURF_PALETTES: Record<
  TurfTheme,
  { name: string; subtitle: string; stripeA: string; stripeB: string; apron: string; line: string }
> = {
  ucl_night: {
    name: 'Nuit Ligue des Champions',
    subtitle: 'Gazon arrosé sous projecteurs LED',
    stripeA: '#1A6838',
    stripeB: '#1F7741',
    apron: '#0B1612',
    line: 'rgba(244, 250, 246, 0.86)',
  },
  classic_emerald: {
    name: 'Émeraude Classique',
    subtitle: 'Pelouse européenne ensoleillée',
    stripeA: '#227C42',
    stripeB: '#288E4C',
    apron: '#0F1F17',
    line: 'rgba(255, 255, 255, 0.88)',
  },
  wembley_dark: {
    name: 'Gazon Anglais Sombre',
    subtitle: 'Contraste élevé pour visée précise',
    stripeA: '#144F2C',
    stripeB: '#185D34',
    apron: '#08100D',
    line: 'rgba(226, 240, 232, 0.82)',
  },
  cyber_arena: {
    name: 'FC 27 Volt Turf',
    subtitle: 'Synthétique carbone & lignes électriques',
    stripeA: '#102420',
    stripeB: '#142D28',
    apron: '#060D0F',
    line: 'rgba(184, 255, 0, 0.78)',
  },
};
