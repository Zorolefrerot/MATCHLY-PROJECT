import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  ChevronRight,
  Coins,
  Crown,
  Film,
  Globe,
  HelpCircle,
  Lock,
  Music,
  Play,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Target,
  Trophy,
  User,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  EURO_TEAMS,
  BotDifficulty,
  EuroTeam,
  FormationId,
  getTeamById,
  SOLO_CUPS,
  SoloCupDef,
} from './data/teams';
import { Side } from './engine/physics';
import { EA_TRAX_PLAYLIST, sfx, soundEngine, TraxItem } from './engine/audio';
import {
  enrollInCompetition,
  fetchProfileByUserId,
  getDefaultGuestProfile,
  logCompletedMatch,
  OnlineCompetition,
  persistProfileUpdate,
  PlayerProfile,
  setCompetitionRoomCode,
  supabase,
  updateCompetitionResultForUser,
} from './lib/supabase';
import { createOnlineRoom, joinOnlineRoom, RoomRecord } from './lib/roomSync';
import { GameSettings, loadGameSettings, saveGameSettings } from './lib/settings';
import { TeamCrest } from './components/TeamCrest';
import { MatchArena, MatchFinishSummary } from './components/MatchArena';
import { LockerRoomView } from './components/LockerRoomView';
import { CompetitionsView } from './components/CompetitionsView';
import { ActiveCupRun, SoloCupsView } from './components/SoloCupsView';
import { OnlineRoomLobbyModal } from './components/OnlineRoomLobbyModal';
import { AccountModal } from './components/AccountModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import {
  BeforeInstallPromptEvent,
  isRunningStandalone,
  PwaInstallGate,
} from './components/PwaInstallGate';
import { IntroCinematic } from './components/IntroCinematic';
import { TitleScreen } from './components/TitleScreen';
import { MainMenu } from './components/MainMenu';
import { SettingsModal } from './components/SettingsModal';
import { countClaimableObjectives, ObjectivesModal } from './components/ObjectivesModal';
import { QuickMatchModal } from './components/QuickMatchModal';
import { CareerView } from './components/CareerView';
import { ChallengesModal } from './components/ChallengesModal';
import { CAREER_DIVISIONS, CareerSave, careerOpponent, careerToTeam, loadCareer, makeSeason, saveCareer } from './lib/career';
import { ChallengeDef, ChallengeProgress, loadChallenges, recordChallengeMatch, saveChallenges } from './lib/challenges';

type NavTab = 'play' | 'competitions' | 'cups' | 'locker' | 'career';

interface ActiveMatchSession {
  mode: 'online_room' | 'solo_cup';
  isQuickExhibition?: boolean;
  room?: RoomRecord;
  mySide: Side;
  hostName: string;
  hostTeam: EuroTeam;
  hostFormation: FormationId;
  guestName: string;
  guestTeam: EuroTeam;
  guestFormation: FormationId;
  targetGoals: number;
  turnSeconds: number;
  botDifficulty?: BotDifficulty;
  hostLineup?: number[];
  guestLineup?: number[];
  careerFixtureIndex?: number;
  cupRun?: ActiveCupRun;
  cupStageLabel?: string;
  competition?: OnlineCompetition;
}

const STAGE_LABELS = ['Quart de finale', 'Demi-finale', 'Finale Européenne'];

const COVER_STARS = [
  {
    name: 'KYLIAN MBAPPÉ',
    club: 'Real Madrid · France',
    ovr: 94,
    tag: 'PLAYSTYLE+ VITESSE PURE',
    img: '/cinematic/mbappe.jpg',
  },
  {
    name: 'LAMINE YAMAL',
    club: 'FC Barcelona · Espagne',
    ovr: 93,
    tag: 'PLAYSTYLE+ FINESSE',
    img: '/cinematic/yamal.jpg',
  },
  {
    name: 'JUDE BELLINGHAM',
    club: 'Real Madrid · Angleterre',
    ovr: 93,
    tag: 'PLAYSTYLE+ VISION TOTALE',
    img: '/cinematic/bellingham.jpg',
  },
  {
    name: 'ERLING HAALAND',
    club: 'Manchester City',
    ovr: 94,
    tag: 'PLAYSTYLE+ FRAPPE LOURDE',
    img: '/cinematic/haaland.jpg',
  },
  {
    name: 'VINÍCIUS JR.',
    club: 'Real Madrid CF',
    ovr: 93,
    tag: 'PLAYSTYLE+ EXPLOSIVITÉ',
    img: '/cinematic/vinicius.jpg',
  },
];

export const App: React.FC = () => {
  const [profile, setProfile] = useState<PlayerProfile>(() => getDefaultGuestProfile());
  const [settings, setSettings] = useState<GameSettings>(() => loadGameSettings());
  const [navTab, setNavTab] = useState<NavTab>('play');
  const [lineups, setLineups] = useState<Record<string, number[]>>(() => { try { return JSON.parse(localStorage.getItem('matchly_fc27_lineups_v1') || '{}'); } catch { return {}; } });
  const [careerSave, setCareerSave] = useState<CareerSave | null>(() => loadCareer());
  const [challengeProgress, setChallengeProgress] = useState<ChallengeProgress>(() => loadChallenges());
  const [showChallenges, setShowChallenges] = useState(false);

  // PWA & 30-second Cinematic state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState<boolean>(() => isRunningStandalone());
  const [pwaBypassed, setPwaBypassed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('matchly_pwa_bypassed') === '1';
    } catch {
      return false;
    }
  });
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('matchly_intro_seen') !== '1';
    } catch {
      return true;
    }
  });

  // FC 27 Title Screen (blinking PRESS TO START) → Main Menu flow
  const [showTitle, setShowTitle] = useState(true);
  const [showMainMenu, setShowMainMenu] = useState(false);

  // Cover star rotator
  const [starIdx, setStarIdx] = useState(0);

  // Modals
  const [showHowTo, setShowHowTo] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);
  const [showQuickMatch, setShowQuickMatch] = useState(false);
  const [unlockedToastTeams, setUnlockedToastTeams] = useState<EuroTeam[]>([]);

  // EA Trax toast
  const [currentTrack, setCurrentTrack] = useState<TraxItem>(() => sfx.getCurrentTrack());
  const [traxToast, setTraxToast] = useState<TraxItem | null>(null);

  // Online Room Join / Create Controls
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [roomTargetGoals, setRoomTargetGoals] = useState<number>(3);
  const [roomTurnSeconds, setRoomTurnSeconds] = useState<number>(18);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [roomBusy, setRoomBusy] = useState(false);

  // Lobby & Match Sessions
  const [lobbyState, setLobbyState] = useState<{
    room: RoomRecord;
    mySide: Side;
    competition?: OnlineCompetition;
  } | null>(null);
  const [activeMatch, setActiveMatch] = useState<ActiveMatchSession | null>(null);

  // Solo Cup progress
  const [activeCupRun, setActiveCupRun] = useState<ActiveCupRun | null>(() => {
    try {
      const saved = localStorage.getItem('matchly_fc_cup_run');
      return saved ? (JSON.parse(saved) as ActiveCupRun) : null;
    } catch {
      return null;
    }
  });

  const [muted, setMuted] = useState<boolean>(soundEngine.muted);

  // Capture PWA beforeinstallprompt + standalone media listener + audio gesture unlock
  useEffect(() => {
    sfx.applySettings(settings);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setStandalone(true);
      setDeferredPrompt(null);
    };
    const onFirstPointer = () => {
      sfx.unlockFromGesture();
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('pointerdown', onFirstPointer, { passive: true });

    const unsubTrack = sfx.onTrackChange((track, playing) => {
      setCurrentTrack(track);
      if (playing) {
        setTraxToast(track);
        setTimeout(() => {
          setTraxToast((prev) => (prev?.id === track.id ? null : prev));
        }, 3800);
      }
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('pointerdown', onFirstPointer);
      unsubTrack();
    };
  }, []);

  // The soundtrack must cut as soon as the player leaves/quits the game tab.
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) sfx.stopAllAudio(); else sfx.resumeAfterVisibility(); };
    const onPageHide = () => sfx.stopAllAudio();
    const onBlur = () => sfx.stopAllAudio();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('blur', onBlur);
    return () => { document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('pagehide', onPageHide); window.removeEventListener('blur', onBlur); };
  }, []);

  // Rotate superstar hero every 5.5s
  useEffect(() => {
    const id = setInterval(() => {
      setStarIdx((prev) => (prev + 1) % COVER_STARS.length);
    }, 5500);
    return () => clearInterval(id);
  }, []);

  // Restore Supabase Auth Session if logged in + check ?room= URL invite
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const dbProf = await fetchProfileByUserId(data.session.user.id);
        if (dbProf) setProfile(dbProf);
      }
    });

    const params = new URLSearchParams(window.location.search);
    const invitedRoom = params.get('room');
    if (invitedRoom) {
      setJoinCodeInput(invitedRoom.toUpperCase().trim());
      // If arriving via direct room invite link, skip intro straight to hub so joining is instant
      setPwaBypassed(true);
      setShowIntro(false);
      setShowTitle(false);
    }
  }, []);

  const handleSettingsChange = (next: GameSettings) => {
    setSettings(next);
    saveGameSettings(next);
    sfx.applySettings(next);
    setMuted(sfx.muted);
  };

  const updateLineup = (teamId: string, lineup: number[]) => {
    setLineups((prev) => { const next = { ...prev, [teamId]: lineup }; try { localStorage.setItem('matchly_fc27_lineups_v1', JSON.stringify(next)); } catch {} return next; });
  };
  const updateCareer = (next: CareerSave | null) => { setCareerSave(next); saveCareer(next); };
  const applyCoinsDelta = (delta: number): boolean => {
    if (profile.coins + delta < 0) return false;
    const updated = { ...profile, coins: profile.coins + delta };
    setProfile(updated); persistProfileUpdate(updated).then(setProfile).catch(() => {});
    return true;
  };
  const handleChallengeClaim = async (challenge: ChallengeDef) => {
    if (challengeProgress.claimed.includes(challenge.id)) return;
    const nextProgress = { ...challengeProgress, claimed: [...challengeProgress.claimed, challenge.id] };
    setChallengeProgress(nextProgress); saveChallenges(nextProgress);
    const unlocks = challenge.unlockTeamId && !profile.unlocked_teams.includes(challenge.unlockTeamId) ? [...profile.unlocked_teams, challenge.unlockTeamId] : profile.unlocked_teams;
    const updated = await persistProfileUpdate({ ...profile, coins: profile.coins + challenge.coins, trophies: profile.trophies + challenge.trophies, unlocked_teams: unlocks });
    setProfile(updated);
    if (challenge.unlockTeamId) setUnlockedToastTeams([getTeamById(challenge.unlockTeamId)]);
  };
  const handleStartCareerMatch = (save: CareerSave, fixtureIndex: number) => {
    const fixture = save.fixtures[fixtureIndex]; if (!fixture || fixture.played) return;
    const difficulty: BotDifficulty = save.division >= 4 ? 'legend' : save.division >= 2 ? 'elite' : save.division === 1 ? 'pro' : 'rookie';
    setActiveMatch({ mode:'solo_cup', mySide:'host', hostName:save.coachName, hostTeam:careerToTeam(save), hostFormation:profile.selected_formation, guestName:fixture.opponent, guestTeam:careerOpponent(save, fixture), guestFormation:'1-2-2', targetGoals:3, turnSeconds:20, botDifficulty:difficulty, cupStageLabel:`${CAREER_DIVISIONS[save.division]} · ${save.clubName}`, hostLineup:lineups['career-custom'] || [0,1,2,3,4], guestLineup:[0,1,2,3,4], careerFixtureIndex:fixtureIndex });
  };

  const handleTriggerPwaInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setStandalone(true);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  };

  const saveCupRun = (run: ActiveCupRun | null) => {
    setActiveCupRun(run);
    try {
      if (run) localStorage.setItem('matchly_fc_cup_run', JSON.stringify(run));
      else localStorage.removeItem('matchly_fc_cup_run');
    } catch {
      // ignore
    }
  };

  const handleSelectTeamAndFormation = async (teamId: string, formation: FormationId) => {
    if (!profile.unlocked_teams.includes(teamId)) return;
    const updated = await persistProfileUpdate({
      ...profile,
      favorite_team_id: teamId,
      selected_formation: formation,
    });
    setProfile(updated);
  };

  const handleRecruitWithCoins = async (teamId: string, coinCost: number) => {
    if (profile.coins < coinCost || profile.unlocked_teams.includes(teamId)) return;
    const updated = await persistProfileUpdate({
      ...profile,
      coins: profile.coins - coinCost,
      favorite_team_id: teamId,
      unlocked_teams: [...profile.unlocked_teams, teamId],
    });
    setProfile(updated);
    setUnlockedToastTeams([getTeamById(teamId)]);
  };

  const handleClaimObjectiveReward = async (bonusTrophies: number, bonusCoins: number) => {
    const beforeUnlocks = new Set(profile.unlocked_teams);
    const updated = await persistProfileUpdate({
      ...profile,
      trophies: profile.trophies + bonusTrophies,
      coins: profile.coins + bonusCoins,
    });
    setProfile(updated);
    const newlyUnlockedIds = updated.unlocked_teams.filter((id) => !beforeUnlocks.has(id));
    if (newlyUnlockedIds.length > 0) {
      setUnlockedToastTeams(newlyUnlockedIds.map((id) => getTeamById(id)));
    }
  };

  const handleCreateRoom = async (competition?: OnlineCompetition) => {
    setRoomError(null);
    setRoomBusy(true);
    try {
      const res = await createOnlineRoom(
        profile,
        competition ? 3 : roomTargetGoals,
        competition ? 18 : roomTurnSeconds,
        competition?.id || null,
      );
      if (res.error || !res.room) {
        setRoomError(res.error || 'Impossible de créer le salon.');
        return;
      }

      if (competition && !profile.isGuest) {
        await enrollInCompetition(competition.id, profile);
        await setCompetitionRoomCode(
          competition.id,
          profile.id,
          res.room.code,
          profile.favorite_team_id,
        );
      }

      setLobbyState({
        room: res.room,
        mySide: 'host',
        competition,
      });
    } finally {
      setRoomBusy(false);
    }
  };

  const handleJoinRoomByCode = async (rawCode: string, competition?: OnlineCompetition) => {
    setRoomError(null);
    setRoomBusy(true);
    try {
      const res = await joinOnlineRoom(rawCode, profile);
      if (res.error || !res.room || !res.side) {
        setRoomError(res.error || 'Code introuvable.');
        return;
      }

      if (competition && !profile.isGuest) {
        await enrollInCompetition(competition.id, profile);
      }

      if (res.room.status === 'playing' && res.room.guest_team) {
        launchOnlineMatchFromRoom(res.room, res.side, competition);
      } else {
        setLobbyState({
          room: res.room,
          mySide: res.side,
          competition,
        });
      }
    } finally {
      setRoomBusy(false);
    }
  };

  const launchOnlineMatchFromRoom = (
    room: RoomRecord,
    mySide: Side,
    competition?: OnlineCompetition,
  ) => {
    setLobbyState(null);
    const hTeam = getTeamById(room.host_team);
    const gTeam = getTeamById(room.guest_team || 'ben');

    setActiveMatch({
      mode: 'online_room',
      room,
      mySide,
      hostName: room.host_name,
      hostTeam: hTeam,
      hostFormation: room.host_formation || '1-2-2',
      guestName: room.guest_name || 'Adversaire',
      guestTeam: gTeam,
      guestFormation: room.guest_formation || '1-2-2',
      targetGoals: room.target_goals || 3,
      turnSeconds: room.turn_seconds || 18,
      hostLineup: lineups[hTeam.id] || [0,1,2,3,4],
      guestLineup: lineups[gTeam.id] || [0,1,2,3,4],
      competition,
    });
  };

  const handleStartSoloCupMatch = (cup: SoloCupDef, stageIndex: 0 | 1 | 2) => {
    const run: ActiveCupRun = { cupId: cup.id, stageIndex };
    saveCupRun(run);

    const myTeam = getTeamById(profile.favorite_team_id);
    let oppId = cup.opponents[stageIndex];
    if (oppId === myTeam.id) {
      oppId = oppId === 'ben' ? 'bvb' : 'int';
    }
    const oppTeam = getTeamById(oppId);
    const botFormations: FormationId[] = ['1-4', '1-2-2', '1-3-1', '1-1-3'];
    const oppForm = botFormations[stageIndex % botFormations.length];

    setActiveMatch({
      mode: 'solo_cup',
      mySide: 'host',
      hostName: profile.display_name,
      hostTeam: myTeam,
      hostFormation: profile.selected_formation,
      guestName: `IA · ${oppTeam.shortName}`,
      guestTeam: oppTeam,
      guestFormation: oppForm,
      targetGoals: 3,
      turnSeconds: 20,
      botDifficulty: cup.difficulty,
      cupRun: run,
      hostLineup: lineups[myTeam.id] || [0,1,2,3,4],
      guestLineup: [0,1,2,3,4],
      cupStageLabel: `${cup.title} · ${STAGE_LABELS[stageIndex]}`,
    });
  };

  const handleStartQuickExhibition = (cfg: { myTeamId: string; myFormation: FormationId; aiTeamId: string; botDifficulty: BotDifficulty; targetGoals: number; lineup: number[] }) => {
    setShowQuickMatch(false);
    const myTeam = getTeamById(cfg.myTeamId); const oppTeam = getTeamById(cfg.aiTeamId);
    updateLineup(cfg.myTeamId, cfg.lineup);
    setActiveMatch({ mode:'solo_cup', isQuickExhibition:true, mySide:'host', hostName:profile.display_name, hostTeam:myTeam, hostFormation:cfg.myFormation, guestName:`Bot ${cfg.botDifficulty} · ${oppTeam.shortName}`, guestTeam:oppTeam, guestFormation:'1-2-2', targetGoals:cfg.targetGoals, turnSeconds:20, botDifficulty:cfg.botDifficulty, hostLineup:cfg.lineup, guestLineup:[0,1,2,3,4], cupStageLabel:'MATCH AMICAL · MODE NORMAL' });
  };

  const handleMatchFinished = async (summary: MatchFinishSummary) => {
    if (!activeMatch) return;
    const didWin = summary.winner === activeMatch.mySide;
    const myGoals = activeMatch.mySide === 'host' ? summary.hostScore : summary.guestScore;
    const oppGoals = activeMatch.mySide === 'host' ? summary.guestScore : summary.hostScore;

    setChallengeProgress((prev) => recordChallengeMatch(prev, activeMatch.mode === 'online_room', didWin, myGoals));
    if (activeMatch.careerFixtureIndex !== undefined && careerSave) {
      const fixtureIndex = activeMatch.careerFixtureIndex;
      const fixture = careerSave.fixtures[fixtureIndex];
      if (fixture && !fixture.played) {
        const table = careerSave.table.map((row) => ({ ...row }));
        const mine = table.find((r) => r.name === careerSave.clubName); const theirs = table.find((r) => r.name === fixture.opponent);
        if (mine && theirs) { mine.played++; theirs.played++; mine.gf += myGoals; mine.ga += oppGoals; theirs.gf += oppGoals; theirs.ga += myGoals; if (didWin) { mine.wins++; mine.points += 3; theirs.losses++; } else { mine.losses++; theirs.wins++; theirs.points += 3; } }
        table.filter((r) => r.name !== careerSave.clubName && r.name !== fixture.opponent).forEach((row) => { if (Math.random() > 0.45) { row.played++; const gf = Math.floor(Math.random()*4); const ga = Math.floor(Math.random()*4); row.gf += gf; row.ga += ga; if (gf >= ga) { row.wins++; row.points += 3; } else row.losses++; } });
        const fixtures = careerSave.fixtures.map((f, i) => i === fixtureIndex ? { ...f, played:true, result:`${careerSave.clubName} ${myGoals}-${oppGoals} ${f.opponent}` } : f);
        let nextSave: CareerSave = { ...careerSave, table, fixtures, message: didWin ? 'Victoire de championnat : votre club progresse au classement.' : 'Défaite de championnat : entraînez ou recrutez pour repartir.' };
        if (fixtures.every((f) => f.played)) {
          const ranking = table.slice().sort((a,b)=>b.points-a.points || (b.gf-b.ga)-(a.gf-a.ga)); const rank = ranking.findIndex((r)=>r.name===careerSave.clubName)+1;
          const promoted = rank <= 2 && careerSave.division < CAREER_DIVISIONS.length-1; const division = promoted ? careerSave.division+1 : careerSave.division;
          const season = careerSave.season + 1;
          const freshSeason = makeSeason(division, careerSave.clubName);
          nextSave = { ...nextSave, division, season, table: freshSeason.table, fixtures: freshSeason.fixtures, message: promoted ? `Promotion ! Vous montez en ${CAREER_DIVISIONS[division]}.` : `Saison terminée à la ${rank}e place. Nouvelle saison en ${CAREER_DIVISIONS[division]}.` };
        }
        updateCareer(nextSave);
      }
    }
    setChallengeProgress((prev) => recordChallengeMatch(prev, activeMatch.mode === 'online_room', didWin, myGoals));
    if (activeMatch.careerFixtureIndex !== undefined && careerSave) {
      const fixtureIndex = activeMatch.careerFixtureIndex;
      const fixture = careerSave.fixtures[fixtureIndex];
      if (fixture && !fixture.played) {
        const table = careerSave.table.map((row) => ({ ...row }));
        const mine = table.find((r) => r.name === careerSave.clubName); const theirs = table.find((r) => r.name === fixture.opponent);
        if (mine && theirs) { mine.played++; theirs.played++; mine.gf += myGoals; mine.ga += oppGoals; theirs.gf += oppGoals; theirs.ga += myGoals; if (didWin) { mine.wins++; mine.points += 3; theirs.losses++; } else { mine.losses++; theirs.wins++; theirs.points += 3; } }
        table.filter((r) => r.name !== careerSave.clubName && r.name !== fixture.opponent).forEach((row) => { if (Math.random() > 0.45) { row.played++; const gf = Math.floor(Math.random()*4); const ga = Math.floor(Math.random()*4); row.gf += gf; row.ga += ga; if (gf >= ga) { row.wins++; row.points += 3; } else row.losses++; } });
        const fixtures = careerSave.fixtures.map((f, i) => i === fixtureIndex ? { ...f, played:true, result:`${careerSave.clubName} ${myGoals}-${oppGoals} ${f.opponent}` } : f);
        let nextSave: CareerSave = { ...careerSave, table, fixtures, message: didWin ? 'Victoire de championnat : votre club progresse au classement.' : 'Défaite de championnat : entraînez ou recrutez pour repartir.' };
        if (fixtures.every((f) => f.played)) {
          const ranking = table.slice().sort((a,b)=>b.points-a.points || (b.gf-b.ga)-(a.gf-a.ga)); const rank = ranking.findIndex((r)=>r.name===careerSave.clubName)+1;
          const promoted = rank <= 2 && careerSave.division < CAREER_DIVISIONS.length-1; const division = promoted ? careerSave.division+1 : careerSave.division;
          const season = careerSave.season + 1;
          const generated = division === careerSave.division ? { table: table.map(r=>({...r,played:0,wins:0,losses:0,gf:0,ga:0,points:0})), fixtures: careerSave.fixtures.map(f=>({...f,played:false,result:undefined})) } : { table: [careerSave.clubName].map(name=>({name,played:0,wins:0,losses:0,gf:0,ga:0,points:0})), fixtures: [] };
          nextSave = { ...nextSave, division, season, table: generated.table, fixtures: generated.fixtures, message: promoted ? `Promotion ! Vous montez en ${CAREER_DIVISIONS[division]}.` : `Saison terminée à la ${rank}e place. Nouvelle saison en ${CAREER_DIVISIONS[division]}.` };
          if (promoted) {
            // New division opponents are generated on demand from the career database at match launch; store a fresh fixture list names safely.
            const names = ['Nouvel adversaire 1','Nouvel adversaire 2','Nouvel adversaire 3','Nouvel adversaire 4','Nouvel adversaire 5','Nouvel adversaire 6','Nouvel adversaire 7'];
            nextSave.table = [careerSave.clubName,...names].map(name=>({name,played:0,wins:0,losses:0,gf:0,ga:0,points:0})); nextSave.fixtures = names.map((opponent,i)=>({opponent,rating:66+division*6+i,played:false}));
          }
        }
        updateCareer(nextSave);
      }
    }
    const beforeUnlocks = new Set(profile.unlocked_teams);
    let gainedTrophies = 0;
    let gainedCoins = 0;
    const extraExplicitUnlocks = [...profile.unlocked_teams];
    const nextWonComps = [...(profile.won_competitions || [])];

    if (activeMatch.mode === 'online_room') {
      gainedTrophies = didWin ? (activeMatch.competition ? 55 : 42) : summary.forfeited ? 0 : 8;
      gainedCoins = didWin ? 65 : 15;

      if (activeMatch.mySide === 'host') {
        logCompletedMatch({
          room_code: activeMatch.room?.code || null,
          mode: activeMatch.competition ? 'online_comp' : 'online_code',
          competition_id: activeMatch.competition?.id || activeMatch.room?.competition_id || null,
          p1_name: activeMatch.hostName,
          p1_team: activeMatch.hostTeam.id,
          p1_score: summary.hostScore,
          p2_name: activeMatch.guestName,
          p2_team: activeMatch.guestTeam.id,
          p2_score: summary.guestScore,
        }).catch(() => {});
      }

      const compId = activeMatch.competition?.id || activeMatch.room?.competition_id;
      if (compId && !profile.isGuest) {
        await updateCompetitionResultForUser(compId, profile.id, myGoals, oppGoals);
      }
    } else if (activeMatch.isQuickExhibition) {
      gainedTrophies = didWin ? 25 : summary.forfeited ? 0 : 5;
      gainedCoins = didWin ? 45 : 12;
    } else if (activeMatch.careerFixtureIndex !== undefined) {
      gainedTrophies = didWin ? 30 : 6; gainedCoins = didWin ? 70 : 20;
    } else if (activeMatch.mode === 'solo_cup' && activeMatch.cupRun) {
      const cup = SOLO_CUPS.find((c) => c.id === activeMatch.cupRun!.cupId);
      if (didWin && cup) {
        if (activeMatch.cupRun.stageIndex < 2) {
          gainedTrophies = 28;
          gainedCoins = 40;
          saveCupRun({
            cupId: cup.id,
            stageIndex: (activeMatch.cupRun.stageIndex + 1) as 0 | 1 | 2,
          });
        } else {
          gainedTrophies = cup.rewardTrophies;
          gainedCoins = cup.rewardCoins;
          if (!extraExplicitUnlocks.includes(cup.unlockTeamId)) {
            extraExplicitUnlocks.push(cup.unlockTeamId);
          }
          if (!nextWonComps.includes(cup.id)) {
            nextWonComps.push(cup.id);
          }
          saveCupRun(null);
        }
      } else {
        gainedTrophies = summary.forfeited ? 0 : 6;
        gainedCoins = 10;
        saveCupRun(null);
      }
    }

    const updatedProfile = await persistProfileUpdate({
      ...profile,
      trophies: profile.trophies + gainedTrophies,
      coins: profile.coins + gainedCoins,
      wins: profile.wins + (didWin ? 1 : 0),
      losses: profile.losses + (didWin ? 0 : 1),
      goals_for: profile.goals_for + myGoals,
      goals_against: profile.goals_against + oppGoals,
      unlocked_teams: extraExplicitUnlocks,
      won_competitions: nextWonComps,
    });

    setProfile(updatedProfile);

    const newlyUnlockedIds = updatedProfile.unlocked_teams.filter((id) => !beforeUnlocks.has(id));
    if (newlyUnlockedIds.length > 0) {
      setUnlockedToastTeams(newlyUnlockedIds.map((id) => getTeamById(id)));
    }
  };

  // STEP 1: PWA Home-Screen Installation Gate (when not installed as Standalone PWA)
  if (!standalone && !pwaBypassed && settings.requirePwaOnMobile) {
    return (
      <PwaInstallGate
        deferredPrompt={deferredPrompt}
        onTriggerInstall={handleTriggerPwaInstall}
        onBypassForPreview={() => {
          setPwaBypassed(true);
          try {
            sessionStorage.setItem('matchly_pwa_bypassed', '1');
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  // STEP 2: 30-Second Real-Player Opening Cinematic
  if (showIntro) {
    return (
      <IntroCinematic
        onFinish={() => {
          setShowIntro(false);
          try {
            sessionStorage.setItem('matchly_intro_seen', '1');
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  // STEP 2B: FC 27 Title Screen — blinking PRESS TO START (user artwork)
  if (showTitle) {
    return (
      <TitleScreen
        onStart={() => {
          sfx.uiClick();
          setShowTitle(false);
          setShowMainMenu(true);
        }}
      />
    );
  }

  // STEP 3: Live Match Arena (with in-match FC 27 Settings overlay support)
  if (activeMatch) {
    return (
      <>
        <MatchArena
          mode={activeMatch.mode}
          roomCode={activeMatch.room?.code}
          mySide={activeMatch.mySide}
          hostName={activeMatch.hostName}
          hostTeam={activeMatch.hostTeam}
          hostFormation={activeMatch.hostFormation}
          guestName={activeMatch.guestName}
          guestTeam={activeMatch.guestTeam}
          guestFormation={activeMatch.guestFormation}
          targetGoals={activeMatch.targetGoals}
          turnSeconds={activeMatch.turnSeconds}
          botDifficulty={activeMatch.botDifficulty}
          hostLineup={activeMatch.hostLineup}
          guestLineup={activeMatch.guestLineup}
          cupStageLabel={activeMatch.cupStageLabel}
          initialBoard={activeMatch.room?.state_json?.board}
          settings={settings}
          onOpenSettings={() => setShowSettings(true)}
          onMatchFinished={handleMatchFinished}
          onExitArena={() => setActiveMatch(null)}
        />
        {showSettings && (
          <SettingsModal
            settings={settings}
            onChange={handleSettingsChange}
            onClose={() => setShowSettings(false)}
            onReplayIntro={() => {
              setActiveMatch(null);
              setShowIntro(true);
            }}
            deferredPrompt={deferredPrompt}
            onTriggerInstall={handleTriggerPwaInstall}
          />
        )}
      </>
    );
  }

  const activeTeam = getTeamById(profile.favorite_team_id);
  const nextLockedTeam = EURO_TEAMS.find((t) => !profile.unlocked_teams.includes(t.id));
  const claimableCount = countClaimableObjectives(profile);
  const star = COVER_STARS[starIdx];
  const enterApp = (tab: NavTab) => {
    sfx.uiClick();
    setNavTab(tab);
    setShowMainMenu(false);
  };

  return (
    <div className="app-shell fc27-shell">
      {/* FC 27 Main Menu — user artwork with clickable hotspots (same design as title screen) */}
      {showMainMenu && (
        <MainMenu
          claimableCount={claimableCount}
          onProfile={() => { sfx.uiClick(); setShowAccount(true); }}
          onShop={() => { sfx.uiClick(); setShowObjectives(true); }}
          onCareer={() => enterApp('career')}
          onOnline={() => enterApp('play')}
          onChampionship={() => enterApp('competitions')}
          onQuickMatch={() => { sfx.uiClick(); setShowQuickMatch(true); }}
          onModes={() => enterApp('play')}
          onSettings={() => { sfx.uiClick(); setShowSettings(true); }}
          onQuit={() => { sfx.uiClick(); setShowMainMenu(false); setShowTitle(true); }}
          onChampionsLeague={() => enterApp('cups')}
          onEvents={() => { sfx.uiClick(); setShowChallenges(true); }}
          onMyTeam={() => enterApp('locker')}
        />
      )}

      {/* Ambient Floodlit Night Stadium Backdrop */}
      <div
        className="fc27-ambient-stadium"
        style={{ backgroundImage: "url('/cinematic/stadium.jpg')" }}
      />

      {/* Top Broadcast Navigation Header */}
      <header className="top-nav-bar">
        <div
          className="brand-cluster"
          onClick={() => {
            sfx.uiClick();
            setShowMainMenu(true);
          }}
        >
<img className="brand-logo-img" src="/brand/matchly-fc27-logo-512.png" alt="Matchly FC 27" />
          <div className="brand-titles">
            <h1>MATCHLY FC</h1>
            <span>HYPERMOTION 2D · EUROPE</span>
          </div>
        </div>

        <nav className="desktop-nav-tabs">
          <button
            type="button"
            className={navTab === 'play' ? 'active' : ''}
            onClick={() => {
              sfx.uiClick();
              setNavTab('play');
            }}
          >
            <Swords size={15} /> Hub Central
          </button>
          <button
            type="button"
            className={navTab === 'competitions' ? 'active' : ''}
            onClick={() => {
              sfx.uiClick();
              setNavTab('competitions');
            }}
          >
            <Globe size={15} /> Compétitions
          </button>
          <button
            type="button"
            className={navTab === 'cups' ? 'active' : ''}
            onClick={() => {
              sfx.uiClick();
              setNavTab('cups');
            }}
          >
            <Trophy size={15} /> Coupes UEFA
          </button>
          <button type="button" className={navTab === 'career' ? 'active' : ''} onClick={() => { sfx.uiClick(); setNavTab('career'); }}>
            <Crown size={15} /> Carrière
          </button>
          <button
            type="button"
            className={navTab === 'locker' ? 'active' : ''}
            onClick={() => {
              sfx.uiClick();
              setNavTab('locker');
            }}
          >
            <Shield size={15} /> Vestiaire ({profile.unlocked_teams.length}/{EURO_TEAMS.length})
          </button>
        </nav>

        <div className="top-hud-right">
          <div className="hud-stat-pill gold" title="Trophées UEFA">
            <Award size={14} />
            <strong>{profile.trophies}</strong>
          </div>

          <div className="hud-stat-pill volt-subtle hide-sm" title="Crédits FC">
            <Coins size={14} />
            <strong>{profile.coins}</strong>
          </div>

          <button
            type="button"
            className="icon-pill-btn badge-host"
            onClick={() => {
              sfx.uiClick();
              setShowObjectives(true);
            }}
            title="Objectifs & Passe Saison FC 27"
          >
            <Target size={15} />
            <span className="hide-md">Objectifs</span>
            {claimableCount > 0 && <span className="notif-dot">{claimableCount}</span>}
          </button>

          <button
            type="button"
            className="icon-pill-btn hide-sm"
            onClick={() => {
              sfx.uiClick();
              sfx.nextTrack(true);
            }}
            title={`FC Trax : ${currentTrack.title} (Cliquer pour changer de piste)`}
          >
            <Music size={15} />
          </button>

          <button
            type="button"
            className="icon-pill-btn hide-sm"
            onClick={() => {
              sfx.uiClick();
              setShowIntro(true);
            }}
            title="Revoir la cinématique d'ouverture 30s"
          >
            <Film size={15} />
          </button>

          <button
            type="button"
            className="icon-pill-btn"
            onClick={() => {
              sfx.uiClick();
              setShowSettings(true);
            }}
            title="Paramètres FC 27"
          >
            <SlidersHorizontal size={15} />
          </button>

          <button
            type="button"
            className="icon-pill-btn hide-sm"
            onClick={() => setMuted(soundEngine.toggleMute())}
            title={muted ? 'Activer le son' : 'Couper le son'}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            type="button"
            className={`account-trigger-btn ${profile.isGuest ? 'guest' : 'logged'}`}
            onClick={() => {
              sfx.uiClick();
              setShowAccount(true);
            }}
          >
            <User size={14} />
            <span>{profile.isGuest ? 'Compte' : profile.display_name}</span>
          </button>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="main-stage">
        {navTab === 'play' && (<>
          <section className="mode-home-grid" aria-label="Modes principaux">
            <button type="button" onClick={() => setShowQuickMatch(true)}><Zap size={22}/><strong>Match amical</strong><span>Clubs, nations, Blue Lock · bot 4 niveaux</span></button>
            <button type="button" onClick={() => setNavTab('career')}><Crown size={22}/><strong>Carrière & Championnat</strong><span>Division 3 → Légende · transferts</span></button>
            <button type="button" onClick={() => setNavTab('cups')}><Trophy size={22}/><strong>Coupes</strong><span>Quarts, demies, finales</span></button>
            <button type="button" onClick={() => setShowChallenges(true)}><Target size={22}/><strong>Défis</strong><span>Quotidiens, en ligne & Blue Lock</span></button>
          </section>
          <div className="home-hub-grid">
            {/* Primary Column: FC 27 Superstar Hero + Online Room Multiplayer */}
            <section className="hub-primary-card fc27-hero-card">
              {/* Superstar Cover Athlete Showcase Strip */}
              <div className="fc27-cover-banner">
                <img
                  key={star.img}
                  src={star.img}
                  alt={star.name}
                  className="fc27-cover-photo"
                />
                <div className="fc27-cover-gradient" />
                <div className="fc27-cover-content">
                  <div className="fc27-cover-tags">
                    <span className="fc27-skew-tag volt">SAISON 1 · FC 27</span>
                    <span className="fc27-ovr-pill">OVR {star.ovr}</span>
                  </div>
                  <h3>{star.name}</h3>
                  <p>
                    {star.club} · <span>{star.tag}</span>
                  </p>
                </div>
                <div className="fc27-cover-dots">
                  {COVER_STARS.map((s, idx) => (
                    <button
                      key={s.name}
                      type="button"
                      className={idx === starIdx ? 'active' : ''}
                      onClick={() => setStarIdx(idx)}
                      aria-label={s.name}
                    />
                  ))}
                </div>
              </div>

              <div className="hub-card-badge-row">
                <span className="live-broadcast-tag">
                  <span className="pulse-dot" /> DUEL MULTIJOUEUR EN LIGNE PAR CODE
                </span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="text-link-btn"
                    onClick={() => setShowIntro(true)}
                  >
                    <Film size={13} /> Intro 30s
                  </button>
                  <button
                    type="button"
                    className="text-link-btn"
                    onClick={() => setShowHowTo(true)}
                  >
                    <BookOpen size={13} /> Règles
                  </button>
                </div>
              </div>

              <h2 className="hub-headline">JOUER EN LIGNE SUR 2 TÉLÉPHONES</h2>
              <p className="hub-lead">
                Partagez un code à 5 caractères pour affronter un ami en temps réel chacun sur
                votre écran, avec vos vrais joueurs et formations tactiques.
              </p>

              {/* Join Existing Code Box */}
              <div className="code-join-panel">
                <label htmlFor="join-code-input">REJOINDRE UN SALON AVEC UN CODE</label>
                <div className="code-input-group">
                  <input
                    id="join-code-input"
                    type="text"
                    maxLength={6}
                    placeholder="EX : K9M4X"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    className="fc27-volt-btn compact-pad"
                    disabled={roomBusy || joinCodeInput.trim().length < 4}
                    onClick={() => {
                      sfx.uiClick();
                      handleJoinRoomByCode(joinCodeInput);
                    }}
                  >
                    <Play size={15} /> REJOINDRE
                  </button>
                </div>
              </div>

              <div className="or-divider">
                <span>OU HÉBERGER UN MATCH EN LIGNE</span>
              </div>

              {/* Create Room Settings + CTA */}
              <div className="create-room-panel">
                <div className="room-rules-row">
                  <div className="rule-selector">
                    <span>Score gagnant</span>
                    <div className="mini-seg">
                      {[3, 5].map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={roomTargetGoals === g ? 'active' : ''}
                          onClick={() => {
                            sfx.uiClick();
                            setRoomTargetGoals(g);
                          }}
                        >
                          {g} buts
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rule-selector">
                    <span>Chrono par tour</span>
                    <div className="mini-seg">
                      {[15, 18, 25].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={roomTurnSeconds === s ? 'active' : ''}
                          onClick={() => {
                            sfx.uiClick();
                            setRoomTurnSeconds(s);
                          }}
                        >
                          {s}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {roomError && <div className="form-error-box">{roomError}</div>}

                <button
                  type="button"
                  className="fc27-volt-btn full-w"
                  disabled={roomBusy}
                  onClick={() => {
                    sfx.uiClick();
                    handleCreateRoom();
                  }}
                >
                  <Swords size={17} />
                  {roomBusy ? 'CRÉATION DU SALON…' : 'CRÉER UN SALON & OBTENIR UN CODE'}
                </button>
              </div>
            </section>

            {/* Secondary Column: Active Team Squad + FC 27 Modes */}
            <aside className="hub-side-stack">
              {/* Equipped European Squad Card */}
              <div className="active-squad-widget">
                <div className="asw-top">
                  <div className="asw-team-ident">
                    <TeamCrest team={activeTeam} size={52} />
                    <div>
                      <span className="fc27-skew-tag volt">
                        TITULAIRE · {profile.selected_formation}
                      </span>
                      <h3 style={{ marginTop: 4 }}>{activeTeam.name}</h3>
                      <small>
                        {activeTeam.country} · OVR {activeTeam.rating}
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary compact"
                    onClick={() => {
                      sfx.uiClick();
                      setNavTab('locker');
                    }}
                  >
                    Vestiaire <ChevronRight size={14} />
                  </button>
                </div>

                <div className="asw-five-players">
                  {(lineups[activeTeam.id] || [0,1,2,3,4]).map((idx) => activeTeam.players[idx]).filter(Boolean).map((p) => (
                    <div key={p.id} className="asw-player-chip">
                      <div className="asw-avatar-ring" style={{ borderColor: activeTeam.kitPrimary }}>
                        {p.photo ? <img src={p.photo} alt={p.name} /> : <span className="avatar-initials">{p.shortName.slice(0,2).toUpperCase()}</span>}
                        <b>{p.number}</b>
                      </div>
                      <span>{p.shortName}</span>
                      <small>{p.role}</small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Team Unlock Road */}
              {nextLockedTeam && (
                <div
                  className="next-unlock-widget"
                  onClick={() => {
                    sfx.uiClick();
                    setNavTab('locker');
                  }}
                >
                  <div className="nuw-left">
                    <TeamCrest team={nextLockedTeam} size={42} />
                    <div>
                      <span className="eyebrow-tag gold">PROCHAIN CLUB À DÉBLOQUER</span>
                      <strong>{nextLockedTeam.name}</strong>
                      <div className="nuw-bar">
                        <div
                          className="nuw-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((profile.trophies / nextLockedTeam.unlockTrophies) * 100),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="nuw-right">
                    <Lock size={14} />
                    <span>
                      {profile.trophies}/{nextLockedTeam.unlockTrophies}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Modes Trio */}
              <div className="quick-modes-duo">
                <button
                  type="button"
                  className="mode-launch-card quick-kickoff"
                  onClick={() => {
                    sfx.uiClick();
                    setShowQuickMatch(true);
                  }}
                >
                  <Zap size={21} />
                  <div>
                    <strong>Coup d’Envoi Rapide FC 27</strong>
                    <p>Affrontez n’importe lequel des 18 clubs ou sélections</p>
                  </div>
                  <ChevronRight size={18} />
                </button>

                <button
                  type="button"
                  className="mode-launch-card online-comp"
                  onClick={() => {
                    sfx.uiClick();
                    setNavTab('competitions');
                  }}
                >
                  <Crown size={21} />
                  <div>
                    <strong>Compétitions des Comptes</strong>
                    <p>Ligues & classements en direct entre joueurs inscrits</p>
                  </div>
                  <ChevronRight size={18} />
                </button>

                <button
                  type="button"
                  className="mode-launch-card solo-cup"
                  onClick={() => {
                    sfx.uiClick();
                    setNavTab('cups');
                  }}
                >
                  <Trophy size={21} />
                  <div>
                    <strong>Coupes Européennes</strong>
                    <p>Quarts, demies & finales pour libérer l’élite UEFA</p>
                  </div>
                  <ChevronRight size={18} />
                </button>
              </div>
            </aside>
          </div>
        </>)}


        {navTab === 'career' && <CareerView save={careerSave} coins={profile.coins} lineup={lineups['career-custom'] || [0,1,2,3,4]} onSave={updateCareer} onLineupChange={(lineup)=>updateLineup('career-custom', lineup)} onSpendCoins={(amount)=>applyCoinsDelta(-amount)} onEarnCoins={(amount)=>applyCoinsDelta(amount)} onPlay={handleStartCareerMatch} />}

        {navTab === 'competitions' && (
          <CompetitionsView
            profile={profile}
            onOpenAuthModal={() => setShowAccount(true)}
            onHostCompetitionMatch={(comp) => handleCreateRoom(comp)}
            onJoinCompetitionRoomCode={(code, comp) => handleJoinRoomByCode(code, comp)}
          />
        )}

        {navTab === 'cups' && (
          <SoloCupsView
            profile={profile}
            activeCupRun={activeCupRun}
            onStartOrContinueCup={handleStartSoloCupMatch}
            onResetCupRun={() => saveCupRun(null)}
          />
        )}

        {navTab === 'locker' && (
          <LockerRoomView
            profile={profile}
            onSelectTeamAndFormation={handleSelectTeamAndFormation}
            onRecruitWithCoins={handleRecruitWithCoins}
            lineups={lineups}
            onLineupChange={updateLineup}
          />
        )}
      </main>

      {/* EA SPORTS FC TRAX Floating Toast */}
      {traxToast && (
        <div
          className="fc27-trax-toast"
          onClick={() => {
            sfx.nextTrack(true);
          }}
          title="Cliquer pour passer à la piste suivante"
        >
          <div className="trax-toast-eq">
            <span />
            <span />
            <span />
          </div>
          <div>
            <small>FC TRAX · EN LECTURE</small>
            <strong>{traxToast.title}</strong>
            <span>{traxToast.artist}</span>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={navTab === 'play' ? 'active' : ''}
          onClick={() => {
            sfx.uiClick();
            setNavTab('play');
          }}
        >
          <Swords size={18} />
          <span>Hub</span>
        </button>
        <button
          type="button"
          className={navTab === 'competitions' ? 'active' : ''}
          onClick={() => {
            sfx.uiClick();
            setNavTab('competitions');
          }}
        >
          <Globe size={18} />
          <span>En ligne</span>
        </button>
        <button
          type="button"
          className={navTab === 'cups' ? 'active' : ''}
          onClick={() => {
            sfx.uiClick();
            setNavTab('cups');
          }}
        >
          <Trophy size={18} />
          <span>Coupes</span>
        </button>
        <button
          type="button"
          className={navTab === 'locker' ? 'active' : ''}
          onClick={() => {
            sfx.uiClick();
            setNavTab('locker');
          }}
        >
          <Shield size={18} />
          <span>Vestiaire</span>
        </button>
        <button
          type="button"
          onClick={() => {
            sfx.uiClick();
            setShowSettings(true);
          }}
        >
          <SlidersHorizontal size={18} />
          <span>Options</span>
        </button>
      </nav>

      {/* Pre-Match Online Room Lobby */}
      {lobbyState && (
        <OnlineRoomLobbyModal
          room={lobbyState.room}
          mySide={lobbyState.mySide}
          profile={profile}
          onUpdateTeamOrFormation={handleSelectTeamAndFormation}
          onMatchStart={(startedRoom) =>
            launchOnlineMatchFromRoom(startedRoom, lobbyState.mySide, lobbyState.competition)
          }
          onCancelLobby={() => {
            if (lobbyState.competition && !profile.isGuest) {
              setCompetitionRoomCode(lobbyState.competition.id, profile.id, null);
            }
            setLobbyState(null);
          }}
        />
      )}

      {/* FC 27 Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
          onReplayIntro={() => setShowIntro(true)}
          deferredPrompt={deferredPrompt}
          onTriggerInstall={handleTriggerPwaInstall}
        />
      )}

      {/* FC 27 Season Objectives Modal */}
      {showObjectives && (
        <ObjectivesModal
          profile={profile}
          onClaimReward={handleClaimObjectiveReward}
          onClose={() => setShowObjectives(false)}
        />
      )}

      {/* FC 27 Quick Exhibition Match Modal */}
      {showQuickMatch && (
        <QuickMatchModal
          myTeamId={profile.favorite_team_id}
          myFormation={profile.selected_formation}
          unlockedTeams={profile.unlocked_teams}
          lineups={lineups}
          onLineupChange={updateLineup}
          onStartQuickMatch={handleStartQuickExhibition}
          onClose={() => setShowQuickMatch(false)}
        />
      )}

      {showChallenges && <ChallengesModal profile={profile} progress={challengeProgress} onClaim={handleChallengeClaim} onClose={() => setShowChallenges(false)} />}

      {/* Account Login/Register Modal */}
      {showAccount && (
        <AccountModal
          profile={profile}
          onProfileChange={setProfile}
          onClose={() => setShowAccount(false)}
        />
      )}

      {/* How To Play Visual Carousel */}
      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}

      {/* Newly Unlocked European Team Walkout Modal */}
      {unlockedToastTeams.length > 0 && (
        <div className="modal-backdrop" onClick={() => setUnlockedToastTeams([])}>
          <div className="modal-card unlock-celebration-card" onClick={(e) => e.stopPropagation()}>
            <span className="fc27-skew-tag volt">
              <Sparkles size={12} /> WALKOUT FC 27 · NOUVELLE ÉQUIPE !
            </span>
            <h2 style={{ marginTop: 8 }}>CLUB AJOUTÉ À VOTRE VESTIAIRE</h2>

            {unlockedToastTeams.map((team) => (
              <div key={team.id} className="unlocked-team-showcase">
                <TeamCrest team={team} size={74} />
                <h3>{team.name}</h3>
                <p>
                  {team.league} · Note globale {team.rating}
                </p>
                <div className="mini-avatar-stack center large">
                  {team.players.slice(0,5).map((p) => p.photo ? <img key={p.id} src={p.photo} alt={p.name} title={p.name} /> : <span key={p.id} className="avatar-initials">{p.shortName.slice(0,2).toUpperCase()}</span>)}
                </div>
              </div>
            ))}

            <div className="unlock-modal-actions">
              <button
                type="button"
                className="fc27-volt-btn full-w"
                onClick={() => {
                  const latest = unlockedToastTeams[unlockedToastTeams.length - 1];
                  handleSelectTeamAndFormation(latest.id, profile.selected_formation);
                  setUnlockedToastTeams([]);
                  setNavTab('locker');
                }}
              >
                ÉQUIPER {unlockedToastTeams[unlockedToastTeams.length - 1].shortName.toUpperCase()} MAINTENANT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
