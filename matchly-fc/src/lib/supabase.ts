import { createClient } from '@supabase/supabase-js';
import { computeUnlockedTeams, FormationId, STARTER_TEAM_IDS } from '../data/teams';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://qtqqfebpjeozmqldbjde.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cXFmZWJwamVvem1xbGRiamRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3MzI2NDgsImV4cCI6MjExMTMwODY0OH0.ZX7Gn5tERVB-P4rA4F1sKgPiBjPC9rLaMsYqjv4D834';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 25,
    },
  },
});

export interface PlayerProfile {
  id: string;
  username: string;
  display_name: string;
  favorite_team_id: string;
  selected_formation: FormationId;
  trophies: number;
  coins: number;
  wins: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  unlocked_teams: string[];
  won_competitions: string[];
  isGuest?: boolean;
}

export interface OnlineCompetition {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  comp_type: 'league' | 'cup' | 'nations';
  min_trophies: number;
  reward_trophies: number;
  reward_team_id: string | null;
  max_players: number;
  status: string;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
}

export interface CompetitionEntry {
  id: string;
  competition_id: string;
  user_id: string;
  display_name: string;
  team_id: string;
  points: number;
  played: number;
  wins: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  active_room_code: string | null;
  updated_at: string;
}

export interface MatchRecord {
  id: string;
  room_code: string | null;
  mode: string;
  competition_id: string | null;
  p1_name: string;
  p1_team: string;
  p1_score: number;
  p2_name: string;
  p2_team: string;
  p2_score: number;
  created_at: string;
}

const LOCAL_PROFILE_KEY = 'matchly_fc_local_profile_v1';

export function getDefaultGuestProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlayerProfile;
      parsed.unlocked_teams = computeUnlockedTeams(parsed.trophies || 0, parsed.unlocked_teams || STARTER_TEAM_IDS);
      return { ...parsed, isGuest: true };
    }
  } catch {
    // ignore
  }
  const randSuffix = Math.floor(100 + Math.random() * 900);
  const guest: PlayerProfile = {
    id: `guest-${randSuffix}`,
    username: `coach_${randSuffix}`,
    display_name: `Coach #${randSuffix}`,
    favorite_team_id: 'oly',
    selected_formation: '1-2-2',
    trophies: 0,
    coins: 150,
    wins: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    unlocked_teams: [...STARTER_TEAM_IDS],
    won_competitions: [],
    isGuest: true,
  };
  saveLocalGuestProfile(guest);
  return guest;
}

export function saveLocalGuestProfile(profile: PlayerProfile) {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

function identifierToEmail(identifier: string): string {
  const clean = identifier.trim().toLowerCase();
  if (clean.includes('@')) return clean;
  const slug = clean.replace(/[^a-z0-9._-]/g, '');
  return `${slug}@matchly-fc.player`;
}

export async function fetchProfileByUserId(userId: string): Promise<PlayerProfile | null> {
  const { data, error } = await supabase
    .from('fc_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    ...(data as PlayerProfile),
    unlocked_teams: computeUnlockedTeams(data.trophies || 0, data.unlocked_teams || STARTER_TEAM_IDS),
    isGuest: false,
  };
}

export async function registerAccount(
  pseudoOrEmail: string,
  password: string,
  displayName: string,
  guestCarryOver?: PlayerProfile,
): Promise<{ profile?: PlayerProfile; error?: string }> {
  const cleanPseudo = pseudoOrEmail.trim();
  if (cleanPseudo.length < 3) {
    return { error: 'Choisissez un identifiant d’au moins 3 caractères.' };
  }
  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };
  }

  const email = identifierToEmail(cleanPseudo);
  const finalDisplay = (displayName || cleanPseudo.split('@')[0]).trim();
  const cleanUsername = cleanPseudo
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: cleanUsername,
        display_name: finalDisplay,
      },
    },
  });

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes('already registered')) {
      return { error: 'Ce pseudo ou cet e-mail est déjà pris. Connectez-vous ou choisissez un autre pseudo.' };
    }
    return { error: error?.message || 'Impossible de créer le compte.' };
  }

  const userId = data.user.id;
  // Wait briefly for DB trigger, then merge guest progress if any
  const mergedTrophies = guestCarryOver?.trophies || 0;
  const mergedUnlocks = computeUnlockedTeams(
    mergedTrophies,
    guestCarryOver?.unlocked_teams || STARTER_TEAM_IDS,
  );

  const upsertPayload = {
    id: userId,
    username: `${cleanUsername}_${userId.slice(0, 4)}`,
    display_name: finalDisplay,
    favorite_team_id: guestCarryOver?.favorite_team_id || 'oly',
    selected_formation: guestCarryOver?.selected_formation || '1-2-2',
    trophies: mergedTrophies,
    coins: Math.max(150, guestCarryOver?.coins || 150),
    wins: guestCarryOver?.wins || 0,
    losses: guestCarryOver?.losses || 0,
    goals_for: guestCarryOver?.goals_for || 0,
    goals_against: guestCarryOver?.goals_against || 0,
    unlocked_teams: mergedUnlocks,
    won_competitions: guestCarryOver?.won_competitions || [],
  };

  await supabase.from('fc_profiles').upsert(upsertPayload, { onConflict: 'id' });
  const profile = await fetchProfileByUserId(userId);
  return { profile: profile || { ...upsertPayload, isGuest: false } };
}

export async function loginAccount(
  pseudoOrEmail: string,
  password: string,
): Promise<{ profile?: PlayerProfile; error?: string }> {
  const email = identifierToEmail(pseudoOrEmail);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: 'Identifiant ou mot de passe incorrect.' };
  }

  const profile = await fetchProfileByUserId(data.user.id);
  if (!profile) {
    return { error: 'Profil introuvable.' };
  }
  return { profile };
}

export async function logoutAccount() {
  await supabase.auth.signOut();
}

export async function persistProfileUpdate(profile: PlayerProfile): Promise<PlayerProfile> {
  const normalized: PlayerProfile = {
    ...profile,
    unlocked_teams: computeUnlockedTeams(profile.trophies, profile.unlocked_teams),
  };

  if (normalized.isGuest) {
    saveLocalGuestProfile(normalized);
    return normalized;
  }

  await supabase
    .from('fc_profiles')
    .update({
      display_name: normalized.display_name,
      favorite_team_id: normalized.favorite_team_id,
      selected_formation: normalized.selected_formation,
      trophies: normalized.trophies,
      coins: normalized.coins,
      wins: normalized.wins,
      losses: normalized.losses,
      goals_for: normalized.goals_for,
      goals_against: normalized.goals_against,
      unlocked_teams: normalized.unlocked_teams,
      won_competitions: normalized.won_competitions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', normalized.id);

  return normalized;
}

// Competitions & Standings API
export async function fetchOnlineCompetitions(): Promise<OnlineCompetition[]> {
  const { data } = await supabase
    .from('fc_competitions')
    .select('*')
    .order('min_trophies', { ascending: true });
  return (data as OnlineCompetition[]) || [];
}

export async function fetchCompetitionEntries(competitionId: string): Promise<CompetitionEntry[]> {
  const { data } = await supabase
    .from('fc_competition_entries')
    .select('*')
    .eq('competition_id', competitionId)
    .order('points', { ascending: false })
    .order('wins', { ascending: false });
  return (data as CompetitionEntry[]) || [];
}

export async function enrollInCompetition(
  competitionId: string,
  profile: PlayerProfile,
): Promise<{ entry?: CompetitionEntry; error?: string }> {
  if (profile.isGuest) {
    return { error: 'Connectez-vous à un compte pour rejoindre les compétitions officielles en ligne.' };
  }

  const { data: existing } = await supabase
    .from('fc_competition_entries')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('user_id', profile.id)
    .maybeSingle();

  if (existing) {
    return { entry: existing as CompetitionEntry };
  }

  const { data, error } = await supabase
    .from('fc_competition_entries')
    .insert({
      competition_id: competitionId,
      user_id: profile.id,
      display_name: profile.display_name,
      team_id: profile.favorite_team_id,
    })
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { entry: data as CompetitionEntry };
}

export async function setCompetitionRoomCode(
  competitionId: string,
  userId: string,
  roomCode: string | null,
  teamId?: string,
) {
  const patch: Record<string, unknown> = {
    active_room_code: roomCode,
    updated_at: new Date().toISOString(),
  };
  if (teamId) patch.team_id = teamId;
  await supabase
    .from('fc_competition_entries')
    .update(patch)
    .eq('competition_id', competitionId)
    .eq('user_id', userId);
}

export async function updateCompetitionResultForUser(
  competitionId: string,
  userId: string,
  myGoals: number,
  oppGoals: number,
) {
  const { data: row } = await supabase
    .from('fc_competition_entries')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!row) return;
  const won = myGoals > oppGoals;
  await supabase
    .from('fc_competition_entries')
    .update({
      played: (row.played || 0) + 1,
      wins: (row.wins || 0) + (won ? 1 : 0),
      losses: (row.losses || 0) + (won ? 0 : 1),
      points: (row.points || 0) + (won ? 3 : 0),
      goals_for: (row.goals_for || 0) + myGoals,
      goals_against: (row.goals_against || 0) + oppGoals,
      active_room_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);
}

export async function createPlayerCompetition(
  profile: PlayerProfile,
  title: string,
  subtitle: string,
  compType: 'league' | 'cup' | 'nations',
  minTrophies: number,
  rewardTrophies: number,
): Promise<{ competition?: OnlineCompetition; error?: string }> {
  if (profile.isGuest) {
    return { error: 'Un compte est requis pour organiser une compétition en ligne.' };
  }
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Math.floor(1000 + Math.random() * 9000);

  const { data, error } = await supabase
    .from('fc_competitions')
    .insert({
      slug,
      title: title.trim(),
      subtitle: subtitle.trim() || `Organisé par ${profile.display_name}`,
      comp_type: compType,
      min_trophies: minTrophies,
      reward_trophies: rewardTrophies,
      max_players: 32,
      created_by: profile.id,
      created_by_name: profile.display_name,
    })
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { competition: data as OnlineCompetition };
}

export async function fetchGlobalLeaderboard(): Promise<PlayerProfile[]> {
  const { data } = await supabase
    .from('fc_profiles')
    .select('*')
    .order('trophies', { ascending: false })
    .order('wins', { ascending: false })
    .limit(30);
  return (data as PlayerProfile[]) || [];
}

export async function logCompletedMatch(record: Omit<MatchRecord, 'id' | 'created_at'>) {
  await supabase.from('fc_matches').insert(record);
}

export async function fetchRecentMatches(competitionId?: string): Promise<MatchRecord[]> {
  let query = supabase
    .from('fc_matches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(12);
  if (competitionId) {
    query = query.eq('competition_id', competitionId);
  }
  const { data } = await query;
  return (data as MatchRecord[]) || [];
}
