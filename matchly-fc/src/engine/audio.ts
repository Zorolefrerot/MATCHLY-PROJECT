import { GameSettings, loadGameSettings } from '../lib/settings';

export interface TraxItem {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  src: string;
}

export const EA_TRAX_PLAYLIST: TraxItem[] = [
  {
    id: 'nuit-europe',
    title: 'NUIT EUROPÉENNE',
    artist: 'Matchly Sound · Arena Electro',
    bpm: 122,
    src: '/audio/trax-01-nuit-europe.mp3',
  },
  {
    id: 'afro-stadium',
    title: 'AFRO STADIUM PULSE',
    artist: 'Kinshasa × Paris Club',
    bpm: 114,
    src: '/audio/trax-02-afro-stadium.mp3',
  },
  {
    id: 'tactical-club',
    title: 'FC IQ TACTICAL CLUB',
    artist: 'HyperMotion Bassline',
    bpm: 128,
    src: '/audio/trax-03-tactical-club.mp3',
  },
];

type TrackListener = (track: TraxItem, playing: boolean) => void;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private settings: GameSettings = loadGameSettings();
  private traxAudio: HTMLAudioElement | null = null;
  private introAudio: HTMLAudioElement | null = null;
  private crowdAudio: HTMLAudioElement | null = null;
  private trackIndex = 0;
  private inCinematic = false;
  private inMatch = false;
  private unlocked = false;
  private listeners = new Set<TrackListener>();

  public muted = false;

  constructor() {
    this.muted = this.settings.masterVolume === 0;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || this.settings.masterVolume <= 0) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private sfxGainScale(): number {
    if (this.muted) return 0;
    return (this.settings.masterVolume / 100) * (this.settings.sfxVolume / 100);
  }

  private musicGainScale(): number {
    if (this.muted || !this.settings.musicEnabled) return 0;
    const base = (this.settings.masterVolume / 100) * (this.settings.musicVolume / 100);
    // Slightly duck music during live matches so stadium crowd + ball kicks cut through cleanly
    return this.inMatch ? base * 0.42 : base * 0.78;
  }

  private crowdGainScale(): number {
    if (this.muted || !this.settings.crowdAmbience) return 0;
    return (this.settings.masterVolume / 100) * (this.settings.sfxVolume / 100) * 0.52;
  }

  private vibrate(pattern: number | number[]) {
    if (!this.settings.haptics || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore on unsupported browsers
    }
  }

  onTrackChange(fn: TrackListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emitTrack() {
    const track = EA_TRAX_PLAYLIST[this.trackIndex];
    const isPlaying = Boolean(this.traxAudio && !this.traxAudio.paused && this.musicGainScale() > 0);
    this.listeners.forEach((fn) => fn(track, isPlaying));
  }

  getCurrentTrack(): TraxItem {
    return EA_TRAX_PLAYLIST[this.trackIndex];
  }

  getTrackIndex(): number {
    return this.trackIndex;
  }

  isMusicPlaying(): boolean {
    return Boolean(this.traxAudio && !this.traxAudio.paused && !this.muted && this.settings.musicEnabled);
  }

  applySettings(next: GameSettings) {
    this.settings = next;
    this.muted = next.masterVolume === 0;
    this.syncVolumes();
    if (this.unlocked && !this.inCinematic) {
      if (next.musicEnabled && !this.muted) {
        this.ensureTraxPlaying();
      } else if (this.traxAudio) {
        this.traxAudio.pause();
        this.emitTrack();
      }
    }
    if (this.inMatch) {
      if (next.crowdAmbience && !this.muted) {
        this.startStadiumAmbience();
      } else {
        this.stopStadiumAmbience();
      }
    }
  }

  private syncVolumes() {
    if (this.traxAudio) {
      this.traxAudio.volume = Math.max(0, Math.min(1, this.musicGainScale()));
    }
    if (this.introAudio) {
      const vol = this.muted ? 0 : Math.max(0, Math.min(1, (this.settings.masterVolume / 100) * 0.9));
      this.introAudio.volume = vol;
    }
    if (this.crowdAudio) {
      this.crowdAudio.volume = Math.max(0, Math.min(1, this.crowdGainScale()));
    }
  }

  unlockFromGesture() {
    if (typeof window === 'undefined') return;
    this.unlocked = true;
    this.ensureContext();
    if (!this.inCinematic && this.settings.musicEnabled && !this.muted) {
      this.ensureTraxPlaying();
    }
  }

  ensureTraxPlaying() {
    if (typeof window === 'undefined') return;
    if (this.inCinematic || this.muted || !this.settings.musicEnabled) return;

    if (!this.traxAudio) {
      this.traxAudio = new Audio(EA_TRAX_PLAYLIST[this.trackIndex].src);
      this.traxAudio.preload = 'auto';
      this.traxAudio.addEventListener('ended', () => {
        this.nextTrack(true);
      });
    }
    this.syncVolumes();
    if (this.traxAudio.paused) {
      this.traxAudio
        .play()
        .then(() => {
          this.unlocked = true;
          this.emitTrack();
        })
        .catch(() => {
          // Will start on first click/tap
        });
    } else {
      this.emitTrack();
    }
  }

  selectTrack(index: number, notify = true) {
    if (typeof window === 'undefined') return;
    this.trackIndex = ((index % EA_TRAX_PLAYLIST.length) + EA_TRAX_PLAYLIST.length) % EA_TRAX_PLAYLIST.length;
    if (!this.traxAudio) {
      this.traxAudio = new Audio();
      this.traxAudio.preload = 'auto';
      this.traxAudio.addEventListener('ended', () => this.nextTrack(true));
    }
    this.traxAudio.src = EA_TRAX_PLAYLIST[this.trackIndex].src;
    this.traxAudio.currentTime = 0;
    this.syncVolumes();
    if (!this.inCinematic && this.settings.musicEnabled && !this.muted) {
      this.traxAudio
        .play()
        .then(() => {
          this.unlocked = true;
          if (notify) this.emitTrack();
        })
        .catch(() => {});
    } else if (notify) {
      this.emitTrack();
    }
  }

  nextTrack(notify = true) {
    this.selectTrack(this.trackIndex + 1, notify);
  }

  startIntroScore(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    this.inCinematic = true;
    if (this.traxAudio && !this.traxAudio.paused) {
      this.traxAudio.pause();
    }
    if (!this.introAudio) {
      this.introAudio = new Audio('/audio/fc27-intro-30s.mp3');
      this.introAudio.preload = 'auto';
    }
    this.introAudio.currentTime = 0;
    this.syncVolumes();
    this.introAudio
      .play()
      .then(() => {
        this.unlocked = true;
      })
      .catch(() => {});
    return this.introAudio;
  }

  stopIntroScoreAndStartMenu() {
    this.inCinematic = false;
    if (this.introAudio) {
      this.introAudio.pause();
      this.introAudio.currentTime = 0;
    }
    if (this.settings.musicEnabled && !this.muted) {
      this.ensureTraxPlaying();
    }
  }

  startStadiumAmbience() {
    if (typeof window === 'undefined') return;
    this.inMatch = true;
    this.syncVolumes();
    if (this.muted || !this.settings.crowdAmbience) return;
    if (!this.crowdAudio) {
      this.crowdAudio = new Audio('/audio/stadium-crowd-loop.mp3');
      this.crowdAudio.loop = true;
      this.crowdAudio.preload = 'auto';
    }
    this.syncVolumes();
    if (this.crowdAudio.paused) {
      this.crowdAudio.play().catch(() => {});
    }
  }

  stopStadiumAmbience() {
    this.inMatch = false;
    if (this.crowdAudio) {
      this.crowdAudio.pause();
    }
    this.syncVolumes();
  }


  /** Hard-stop every audible source. Used when the tab/app is hidden or closed. */
  stopAllAudio() {
    this.traxAudio?.pause();
    this.introAudio?.pause();
    this.crowdAudio?.pause();
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
    this.emitTrack();
  }

  /** Resume only the menu soundtrack after a user gesture / returning to the visible app. */
  resumeAfterVisibility() {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.ctx && this.ctx.state === 'suspended' && this.unlocked) this.ctx.resume().catch(() => {});
    if (!this.inCinematic && !this.inMatch && this.unlocked) this.ensureTraxPlaying();
    if (this.inMatch) this.startStadiumAmbience();
  }

  setIntroVideoMuted(muted: boolean) {
    this.muted = muted;
    this.syncVolumes();
    if (muted) this.introAudio?.pause();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.syncVolumes();
    if (this.muted) {
      if (this.traxAudio) this.traxAudio.pause();
      if (this.crowdAudio) this.crowdAudio.pause();
    } else {
      if (!this.inCinematic && this.settings.musicEnabled) this.ensureTraxPlaying();
      if (this.inMatch && this.settings.crowdAmbience) this.startStadiumAmbience();
    }
    this.emitTrack();
    return this.muted;
  }

  uiClick() {
    const ctx = this.ensureContext();
    const scale = this.sfxGainScale();
    if (!ctx || scale <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(1120, now + 0.035);
    gain.gain.setValueAtTime(0.08 * scale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  fanfare() {
    const ctx = this.ensureContext();
    const scale = this.sfxGainScale();
    if (!ctx || scale <= 0) return;
    this.vibrate([25, 40, 45]);
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t0 = now + idx * 0.075;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.11 * scale, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.34);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.36);
    });
  }

  kick(intensity = 0.8) {
    const ctx = this.ensureContext();
    const scale = this.sfxGainScale();
    this.vibrate(Math.round(12 + intensity * 18));
    if (!ctx || scale <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165 + intensity * 65, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
    gain.gain.setValueAtTime(Math.min(0.42, (0.16 + intensity * 0.22) * scale), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  capHit(intensity = 0.6) {
    const ctx = this.ensureContext();
    const scale = this.sfxGainScale();
    if (intensity > 0.55) this.vibrate(10);
    if (!ctx || scale <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520 + intensity * 260, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.055);
    gain.gain.setValueAtTime(Math.min(0.28, (0.08 + intensity * 0.15) * scale), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  postHit() {
    const ctx = this.ensureContext();
    const scale = this.sfxGainScale();
    this.vibrate([28, 30, 18]);
    if (!ctx || scale <= 0) return;
    const now = ctx.currentTime;
    [940, 1410].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime((0.18 / (i + 1)) * scale, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  wallHit() {
    const ctx = this.ensureContext();
    const scale = this.sfxGainScale();
    if (!ctx || scale <= 0) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);
    gain.gain.setValueAtTime(0.14 * scale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  whistle(double = false) {
    const ctx = this.ensureContext();
    const scale = this.sfxGainScale();
    this.vibrate(double ? [35, 60, 55] : 30);
    if (!ctx || scale <= 0) return;
    const blast = (offset: number, dur: number) => {
      const now = ctx.currentTime + offset;
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2820, now);
      lfo.frequency.setValueAtTime(38, now);
      lfoGain.gain.setValueAtTime(95, now);
      lfo.connect(lfoGain).connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18 * scale, now + 0.025);
      gain.gain.setValueAtTime(0.16 * scale, now + dur - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      lfo.start(now);
      osc.stop(now + dur + 0.01);
      lfo.stop(now + dur + 0.01);
    };

    blast(0, 0.24);
    if (double) {
      blast(0.3, 0.42);
    }
  }

  goal() {
    const ctx = this.ensureContext();
    const scale = this.sfxGainScale();
    this.vibrate([50, 40, 80, 40, 120]);
    // Boost crowd audio briefly if active
    if (this.crowdAudio && !this.muted && this.settings.crowdAmbience) {
      const baseVol = this.crowdGainScale();
      this.crowdAudio.volume = Math.min(1, baseVol * 1.65);
      setTimeout(() => this.syncVolumes(), 2400);
    }
    if (!ctx || scale <= 0) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 1.45);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(720, now);
    filter.Q.setValueAtTime(0.85, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.32 * scale, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.42);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);

    [220, 277.18, 329.63, 440].forEach((freq) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.065 * scale, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.05);
      osc.connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.08);
    });
  }
  playTick() {
    this.uiClick();
  }

  playKick(intensity = 0.8) {
    this.kick(intensity);
  }

  playCapClack(intensity = 0.6) {
    this.capHit(intensity);
  }

  playPostClang() {
    this.postHit();
  }

  playWhistle(double = false) {
    this.whistle(double);
  }

  playGoalCelebration() {
    this.goal();
  }
}

export const sfx = new SoundEngine();
export const soundEngine = sfx;
