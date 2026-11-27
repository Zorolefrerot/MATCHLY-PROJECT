export type PlayerRole = 'GK' | 'DEF' | 'MIL' | 'ATT';

export interface PlayerStats {
  tir: number; // 75 - 97: puissance maximale de frappe
  phy: number; // 75 - 96: masse / impact dans les duels
  ctr: number; // 75 - 97: précision de visée / contrôle
}

export interface SquadPlayer {
  id: string;
  name: string;
  shortName: string;
  number: number;
  role: PlayerRole;
  photo: string;
  stats: PlayerStats;
}

export type KitPattern = 'solid' | 'stripes' | 'halves' | 'sash' | 'centerband';
export type CrestShape = 'shield' | 'round' | 'crown' | 'diamond' | 'hex';

export interface EuroTeam {
  id: string;
  name: string;
  shortName: string;
  code: string;
  category: 'club' | 'nation' | 'special';
  logoUrl?: string;
  country: string;
  league: string;
  unlockTrophies: number;
  unlockHint?: string;
  kitPrimary: string;
  kitSecondary: string;
  kitTrim: string;
  gkColor: string;
  kitPattern: KitPattern;
  crestShape: CrestShape;
  rating: number;
  playstyle: string;
  players: SquadPlayer[]; // 15 maximum: 5 titulaires + 10 remplaçants
}

export type BotDifficulty = 'rookie' | 'pro' | 'elite' | 'legend';
export const BOT_DIFFICULTIES: { id: BotDifficulty; label: string; detail: string; skill: number }[] = [
  { id: 'rookie', label: 'Débutant', detail: 'IA douce pour apprendre les angles', skill: 0.34 },
  { id: 'pro', label: 'Professionnel', detail: 'IA équilibrée et tactique', skill: 0.58 },
  { id: 'elite', label: 'Élite', detail: 'IA précise, gros pressing physique', skill: 0.78 },
  { id: 'legend', label: 'Légende', detail: 'IA quasi chirurgicale', skill: 0.94 },
];

export type FormationId = '1-4' | '1-2-2' | '1-3-1' | '1-1-3';

export interface FormationDef {
  id: FormationId;
  name: string;
  subtitle: string;
  // Normalized coordinates for HOME side (defending bottom goal at y=1, attacking top y=0)
  // Index 0 is always GK; indices 1..4 are outfielders
  homeCoords: [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ];
}

export const FORMATIONS: Record<FormationId, FormationDef> = {
  '1-4': {
    id: '1-4',
    name: '1-4 Rideau Classique',
    subtitle: 'Ligne de 4 équilibrée devant la surface',
    homeCoords: [
      { x: 0.50, y: 0.915 },
      { x: 0.19, y: 0.755 },
      { x: 0.39, y: 0.755 },
      { x: 0.61, y: 0.755 },
      { x: 0.81, y: 0.755 },
    ],
  },
  '1-2-2': {
    id: '1-2-2',
    name: '1-2-2 Carré Tactique',
    subtitle: 'Double pivot défensif et deux pointes',
    homeCoords: [
      { x: 0.50, y: 0.915 },
      { x: 0.28, y: 0.79 },
      { x: 0.72, y: 0.79 },
      { x: 0.34, y: 0.635 },
      { x: 0.66, y: 0.635 },
    ],
  },
  '1-3-1': {
    id: '1-3-1',
    name: '1-3-1 Losange Compact',
    subtitle: 'Bloc axial dense et avant-centre avancé',
    homeCoords: [
      { x: 0.50, y: 0.915 },
      { x: 0.22, y: 0.76 },
      { x: 0.50, y: 0.79 },
      { x: 0.78, y: 0.76 },
      { x: 0.50, y: 0.605 },
    ],
  },
  '1-1-3': {
    id: '1-1-3',
    name: '1-1-3 Trident Haut',
    subtitle: 'Libéro de couverture et trois attaquants',
    homeCoords: [
      { x: 0.50, y: 0.915 },
      { x: 0.50, y: 0.80 },
      { x: 0.21, y: 0.64 },
      { x: 0.50, y: 0.60 },
      { x: 0.79, y: 0.64 },
    ],
  },
};

export const STARTER_TEAM_IDS = ['oly', 'ben', 'bvb'];

export const EURO_TEAMS: EuroTeam[] = [
  {
    id: 'oly',
    name: 'Olympique Lyonnais',
    shortName: 'Lyon',
    code: 'OLY',
    category: 'club',
    country: 'France',
    league: 'Ligue 1',
    unlockTrophies: 0,
    kitPrimary: '#FFFFFF',
    kitSecondary: '#163B88',
    kitTrim: '#D62828',
    gkColor: '#F26419',
    kitPattern: 'centerband',
    crestShape: 'shield',
    rating: 82,
    playstyle: 'Transitions rapides & technique',
    players: [
      { id: 'oly-1', name: 'Lucas Perri', shortName: 'Perri', number: 23, role: 'GK', photo: '/players/perri.jpg', stats: { tir: 76, phy: 84, ctr: 80 } },
      { id: 'oly-2', name: 'Moussa Niakhaté', shortName: 'Niakhaté', number: 19, role: 'DEF', photo: '/players/niakhate.jpg', stats: { tir: 75, phy: 87, ctr: 78 } },
      { id: 'oly-3', name: 'Nicolás Tagliafico', shortName: 'Tagliafico', number: 3, role: 'DEF', photo: '/players/tagliafico.jpg', stats: { tir: 78, phy: 83, ctr: 83 } },
      { id: 'oly-4', name: 'Corentin Tolisso', shortName: 'Tolisso', number: 8, role: 'MIL', photo: '/players/tolisso.jpg', stats: { tir: 84, phy: 83, ctr: 85 } },
      { id: 'oly-5', name: 'Alexandre Lacazette', shortName: 'Lacazette', number: 10, role: 'ATT', photo: '/players/lacazette.jpg', stats: { tir: 87, phy: 81, ctr: 86 } },
    ],
  },
  {
    id: 'ben',
    name: 'SL Benfica',
    shortName: 'Benfica',
    code: 'BEN',
    category: 'club',
    country: 'Portugal',
    league: 'Liga Portugal',
    unlockTrophies: 0,
    kitPrimary: '#D91E2A',
    kitSecondary: '#FFFFFF',
    kitTrim: '#F4B942',
    gkColor: '#1E293B',
    kitPattern: 'solid',
    crestShape: 'round',
    rating: 83,
    playstyle: 'Finesse de passe & coups de patte',
    players: [
      { id: 'ben-1', name: 'Anatoliy Trubin', shortName: 'Trubin', number: 1, role: 'GK', photo: '/players/trubin.jpg', stats: { tir: 76, phy: 86, ctr: 81 } },
      { id: 'ben-2', name: 'Nicolás Otamendi', shortName: 'Otamendi', number: 30, role: 'DEF', photo: '/players/otamendi.jpg', stats: { tir: 77, phy: 88, ctr: 79 } },
      { id: 'ben-3', name: 'Orkun Kökçü', shortName: 'Kökçü', number: 10, role: 'MIL', photo: '/players/kokcu.jpg', stats: { tir: 85, phy: 79, ctr: 87 } },
      { id: 'ben-4', name: 'Ángel Di María', shortName: 'Di María', number: 11, role: 'ATT', photo: '/players/dimaria.jpg', stats: { tir: 86, phy: 76, ctr: 92 } },
      { id: 'ben-5', name: 'Vangelis Pavlidis', shortName: 'Pavlidis', number: 14, role: 'ATT', photo: '/players/pavlidis.jpg', stats: { tir: 86, phy: 84, ctr: 82 } },
    ],
  },
  {
    id: 'bvb',
    name: 'Borussia Dortmund',
    shortName: 'Dortmund',
    code: 'BVB',
    category: 'club',
    country: 'Allemagne',
    league: 'Bundesliga',
    unlockTrophies: 0,
    kitPrimary: '#FDE100',
    kitSecondary: '#141414',
    kitTrim: '#141414',
    gkColor: '#E85D04',
    kitPattern: 'stripes',
    crestShape: 'round',
    rating: 84,
    playstyle: 'Intensité verticale & frappes lourdes',
    players: [
      { id: 'bvb-1', name: 'Gregor Kobel', shortName: 'Kobel', number: 1, role: 'GK', photo: '/players/kobel.jpg', stats: { tir: 77, phy: 88, ctr: 82 } },
      { id: 'bvb-2', name: 'Nico Schlotterbeck', shortName: 'Schlotterbeck', number: 4, role: 'DEF', photo: '/players/schlotterbeck.jpg', stats: { tir: 78, phy: 87, ctr: 82 } },
      { id: 'bvb-3', name: 'Julian Brandt', shortName: 'Brandt', number: 10, role: 'MIL', photo: '/players/brandt.jpg', stats: { tir: 84, phy: 79, ctr: 88 } },
      { id: 'bvb-4', name: 'Karim Adeyemi', shortName: 'Adeyemi', number: 27, role: 'ATT', photo: '/players/adeyemi.jpg', stats: { tir: 86, phy: 78, ctr: 85 } },
      { id: 'bvb-5', name: 'Serhou Guirassy', shortName: 'Guirassy', number: 9, role: 'ATT', photo: '/players/guirassy.jpg', stats: { tir: 89, phy: 87, ctr: 83 } },
    ],
  },
  {
    id: 'mil',
    name: 'AC Milan',
    shortName: 'AC Milan',
    code: 'MIL',
    category: 'club',
    country: 'Italie',
    league: 'Serie A',
    unlockTrophies: 80,
    unlockHint: '80 Trophées ou Coupe Challenger',
    kitPrimary: '#C8102E',
    kitSecondary: '#111111',
    kitTrim: '#D4AF37',
    gkColor: '#2A9D8F',
    kitPattern: 'stripes',
    crestShape: 'shield',
    rating: 86,
    playstyle: 'Puissance de couloir & contre-attaque',
    players: [
      { id: 'mil-1', name: 'Mike Maignan', shortName: 'Maignan', number: 16, role: 'GK', photo: '/players/maignan.jpg', stats: { tir: 82, phy: 89, ctr: 86 } },
      { id: 'mil-2', name: 'Theo Hernández', shortName: 'Theo', number: 19, role: 'DEF', photo: '/players/theo.jpg', stats: { tir: 87, phy: 88, ctr: 84 } },
      { id: 'mil-3', name: 'Tijjani Reijnders', shortName: 'Reijnders', number: 14, role: 'MIL', photo: '/players/reijnders.jpg', stats: { tir: 84, phy: 82, ctr: 87 } },
      { id: 'mil-4', name: 'Christian Pulisic', shortName: 'Pulisic', number: 11, role: 'ATT', photo: '/players/pulisic.jpg', stats: { tir: 85, phy: 78, ctr: 88 } },
      { id: 'mil-5', name: 'Rafael Leão', shortName: 'R. Leão', number: 10, role: 'ATT', photo: '/players/leao.jpg', stats: { tir: 88, phy: 86, ctr: 89 } },
    ],
  },
  {
    id: 'int',
    name: 'Inter Milan',
    shortName: 'Inter',
    code: 'INT',
    category: 'club',
    country: 'Italie',
    league: 'Serie A',
    unlockTrophies: 150,
    kitPrimary: '#00529F',
    kitSecondary: '#101418',
    kitTrim: '#D4AF37',
    gkColor: '#F59E0B',
    kitPattern: 'stripes',
    crestShape: 'round',
    rating: 88,
    playstyle: 'Bloc tactique italien & réalisme',
    players: [
      { id: 'int-1', name: 'Yann Sommer', shortName: 'Sommer', number: 1, role: 'GK', photo: '/players/sommer.jpg', stats: { tir: 77, phy: 85, ctr: 87 } },
      { id: 'int-2', name: 'Alessandro Bastoni', shortName: 'Bastoni', number: 95, role: 'DEF', photo: '/players/bastoni.jpg', stats: { tir: 79, phy: 89, ctr: 86 } },
      { id: 'int-3', name: 'Nicolò Barella', shortName: 'Barella', number: 23, role: 'MIL', photo: '/players/barella.jpg', stats: { tir: 85, phy: 84, ctr: 90 } },
      { id: 'int-4', name: 'Hakan Çalhanoğlu', shortName: 'Çalhanoğlu', number: 20, role: 'MIL', photo: '/players/calhanoglu.jpg', stats: { tir: 91, phy: 81, ctr: 91 } },
      { id: 'int-5', name: 'Lautaro Martínez', shortName: 'Lautaro', number: 10, role: 'ATT', photo: '/players/lautaro.jpg', stats: { tir: 91, phy: 86, ctr: 87 } },
    ],
  },
  {
    id: 'ars',
    name: 'Arsenal FC',
    shortName: 'Arsenal',
    code: 'ARS',
    category: 'club',
    country: 'Angleterre',
    league: 'Premier League',
    unlockTrophies: 230,
    unlockHint: '230 Trophées ou Coupe Europa',
    kitPrimary: '#EF0107',
    kitSecondary: '#FFFFFF',
    kitTrim: '#063672',
    gkColor: '#1E293B',
    kitPattern: 'solid',
    crestShape: 'shield',
    rating: 89,
    playstyle: 'Maîtrise collective & charnière d’acier',
    players: [
      { id: 'ars-1', name: 'David Raya', shortName: 'Raya', number: 22, role: 'GK', photo: '/players/raya.jpg', stats: { tir: 79, phy: 84, ctr: 88 } },
      { id: 'ars-2', name: 'William Saliba', shortName: 'Saliba', number: 2, role: 'DEF', photo: '/players/saliba.jpg', stats: { tir: 77, phy: 92, ctr: 86 } },
      { id: 'ars-3', name: 'Declan Rice', shortName: 'Rice', number: 41, role: 'MIL', photo: '/players/rice.jpg', stats: { tir: 86, phy: 90, ctr: 87 } },
      { id: 'ars-4', name: 'Martin Ødegaard', shortName: 'Ødegaard', number: 8, role: 'MIL', photo: '/players/odegaard.jpg', stats: { tir: 85, phy: 78, ctr: 93 } },
      { id: 'ars-5', name: 'Bukayo Saka', shortName: 'Saka', number: 7, role: 'ATT', photo: '/players/saka.jpg', stats: { tir: 89, phy: 82, ctr: 91 } },
    ],
  },
  {
    id: 'liv',
    name: 'Liverpool FC',
    shortName: 'Liverpool',
    code: 'LIV',
    category: 'club',
    country: 'Angleterre',
    league: 'Premier League',
    unlockTrophies: 320,
    kitPrimary: '#C8102E',
    kitSecondary: '#F6EB61',
    kitTrim: '#FFFFFF',
    gkColor: '#16A34A',
    kitPattern: 'solid',
    crestShape: 'shield',
    rating: 90,
    playstyle: 'Gegenpressing & tirs longue distance',
    players: [
      { id: 'liv-1', name: 'Alisson Becker', shortName: 'Alisson', number: 1, role: 'GK', photo: '/players/alisson.jpg', stats: { tir: 80, phy: 90, ctr: 89 } },
      { id: 'liv-2', name: 'Virgil van Dijk', shortName: 'Van Dijk', number: 4, role: 'DEF', photo: '/players/vandijk.jpg', stats: { tir: 82, phy: 95, ctr: 86 } },
      { id: 'liv-3', name: 'Trent Alexander-Arnold', shortName: 'Trent', number: 66, role: 'DEF', photo: '/players/trent.jpg', stats: { tir: 89, phy: 80, ctr: 92 } },
      { id: 'liv-4', name: 'Alexis Mac Allister', shortName: 'Mac Allister', number: 10, role: 'MIL', photo: '/players/macallister.jpg', stats: { tir: 87, phy: 83, ctr: 90 } },
      { id: 'liv-5', name: 'Mohamed Salah', shortName: 'Salah', number: 11, role: 'ATT', photo: '/players/salah.jpg', stats: { tir: 93, phy: 84, ctr: 92 } },
    ],
  },
  {
    id: 'psg',
    name: 'Paris Saint-Germain',
    shortName: 'Paris SG',
    code: 'PSG',
    category: 'club',
    country: 'France',
    league: 'Ligue 1',
    unlockTrophies: 420,
    kitPrimary: '#004170',
    kitSecondary: '#DA291C',
    kitTrim: '#FFFFFF',
    gkColor: '#10B981',
    kitPattern: 'centerband',
    crestShape: 'round',
    rating: 90,
    playstyle: 'Vitesse pure & percussion technique',
    players: [
      { id: 'psg-1', name: 'Gianluigi Donnarumma', shortName: 'Donnarumma', number: 1, role: 'GK', photo: '/players/donnarumma.jpg', stats: { tir: 78, phy: 92, ctr: 85 } },
      { id: 'psg-2', name: 'Achraf Hakimi', shortName: 'Hakimi', number: 2, role: 'DEF', photo: '/players/hakimi.jpg', stats: { tir: 87, phy: 84, ctr: 87 } },
      { id: 'psg-3', name: 'Vitinha', shortName: 'Vitinha', number: 17, role: 'MIL', photo: '/players/vitinha.jpg', stats: { tir: 86, phy: 79, ctr: 93 } },
      { id: 'psg-4', name: 'Ousmane Dembélé', shortName: 'Dembélé', number: 10, role: 'ATT', photo: '/players/dembele.jpg', stats: { tir: 88, phy: 78, ctr: 92 } },
      { id: 'psg-5', name: 'Bradley Barcola', shortName: 'Barcola', number: 29, role: 'ATT', photo: '/players/barcola.jpg', stats: { tir: 86, phy: 80, ctr: 88 } },
    ],
  },
  {
    id: 'bay',
    name: 'Bayern Munich',
    shortName: 'Bayern',
    code: 'BAY',
    category: 'club',
    country: 'Allemagne',
    league: 'Bundesliga',
    unlockTrophies: 520,
    kitPrimary: '#DC052D',
    kitSecondary: '#FFFFFF',
    kitTrim: '#0066B2',
    gkColor: '#15803D',
    kitPattern: 'solid',
    crestShape: 'round',
    rating: 91,
    playstyle: 'Finition chirurgicale & domination',
    players: [
      { id: 'bay-1', name: 'Manuel Neuer', shortName: 'Neuer', number: 1, role: 'GK', photo: '/players/neuer.jpg', stats: { tir: 84, phy: 90, ctr: 90 } },
      { id: 'bay-2', name: 'Joshua Kimmich', shortName: 'Kimmich', number: 6, role: 'DEF', photo: '/players/kimmich.jpg', stats: { tir: 85, phy: 84, ctr: 92 } },
      { id: 'bay-3', name: 'Jamal Musiala', shortName: 'Musiala', number: 42, role: 'MIL', photo: '/players/musiala.jpg', stats: { tir: 87, phy: 79, ctr: 95 } },
      { id: 'bay-4', name: 'Michael Olise', shortName: 'Olise', number: 17, role: 'ATT', photo: '/players/olise.jpg', stats: { tir: 88, phy: 80, ctr: 91 } },
      { id: 'bay-5', name: 'Harry Kane', shortName: 'Kane', number: 9, role: 'ATT', photo: '/players/kane.jpg', stats: { tir: 96, phy: 89, ctr: 90 } },
    ],
  },
  {
    id: 'ita',
    name: 'Italie',
    shortName: 'Italie',
    code: 'ITA',
    category: 'nation',
    country: 'Italie',
    league: 'Sélection UEFA',
    unlockTrophies: 600,
    kitPrimary: '#0064AA',
    kitSecondary: '#FFFFFF',
    kitTrim: '#009246',
    gkColor: '#EAB308',
    kitPattern: 'solid',
    crestShape: 'shield',
    rating: 89,
    playstyle: 'Catenaccio moderne & relance propre',
    players: [
      { id: 'ita-1', name: 'Gianluigi Donnarumma', shortName: 'Donnarumma', number: 1, role: 'GK', photo: '/players/donnarumma.jpg', stats: { tir: 78, phy: 92, ctr: 86 } },
      { id: 'ita-2', name: 'Alessandro Bastoni', shortName: 'Bastoni', number: 23, role: 'DEF', photo: '/players/bastoni.jpg', stats: { tir: 79, phy: 90, ctr: 86 } },
      { id: 'ita-3', name: 'Federico Dimarco', shortName: 'Dimarco', number: 3, role: 'DEF', photo: '/players/dimarco.jpg', stats: { tir: 88, phy: 82, ctr: 89 } },
      { id: 'ita-4', name: 'Nicolò Barella', shortName: 'Barella', number: 18, role: 'MIL', photo: '/players/barella.jpg', stats: { tir: 86, phy: 84, ctr: 91 } },
      { id: 'ita-5', name: 'Federico Chiesa', shortName: 'Chiesa', number: 14, role: 'ATT', photo: '/players/chiesa.jpg', stats: { tir: 88, phy: 81, ctr: 88 } },
    ],
  },
  {
    id: 'bar',
    name: 'FC Barcelone',
    shortName: 'Barcelone',
    code: 'BAR',
    category: 'club',
    country: 'Espagne',
    league: 'LaLiga',
    unlockTrophies: 640,
    kitPrimary: '#004D98',
    kitSecondary: '#A50044',
    kitTrim: '#EDBB00',
    gkColor: '#10B981',
    kitPattern: 'halves',
    crestShape: 'shield',
    rating: 92,
    playstyle: 'Tiki-taka millimétré & prodige créatif',
    players: [
      { id: 'bar-1', name: 'Marc-André ter Stegen', shortName: 'Ter Stegen', number: 1, role: 'GK', photo: '/players/terstegen.jpg', stats: { tir: 81, phy: 88, ctr: 90 } },
      { id: 'bar-2', name: 'Jules Koundé', shortName: 'Koundé', number: 23, role: 'DEF', photo: '/players/kounde.jpg', stats: { tir: 79, phy: 88, ctr: 86 } },
      { id: 'bar-3', name: 'Pedri', shortName: 'Pedri', number: 8, role: 'MIL', photo: '/players/pedri.jpg', stats: { tir: 84, phy: 79, ctr: 96 } },
      { id: 'bar-4', name: 'Lamine Yamal', shortName: 'Yamal', number: 19, role: 'ATT', photo: '/players/yamal.jpg', stats: { tir: 90, phy: 79, ctr: 95 } },
      { id: 'bar-5', name: 'Robert Lewandowski', shortName: 'Lewandowski', number: 9, role: 'ATT', photo: '/players/lewandowski.jpg', stats: { tir: 95, phy: 89, ctr: 89 } },
    ],
  },
  {
    id: 'ger',
    name: 'Allemagne',
    shortName: 'Allemagne',
    code: 'GER',
    category: 'nation',
    country: 'Allemagne',
    league: 'Sélection UEFA',
    unlockTrophies: 720,
    kitPrimary: '#FFFFFF',
    kitSecondary: '#141414',
    kitTrim: '#DD0000',
    gkColor: '#16A34A',
    kitPattern: 'sash',
    crestShape: 'round',
    rating: 91,
    playstyle: 'Rigueur collective & créativité axiale',
    players: [
      { id: 'ger-1', name: 'Marc-André ter Stegen', shortName: 'Ter Stegen', number: 1, role: 'GK', photo: '/players/terstegen.jpg', stats: { tir: 81, phy: 88, ctr: 90 } },
      { id: 'ger-2', name: 'Antonio Rüdiger', shortName: 'Rüdiger', number: 2, role: 'DEF', photo: '/players/rudiger.jpg', stats: { tir: 80, phy: 95, ctr: 81 } },
      { id: 'ger-3', name: 'Joshua Kimmich', shortName: 'Kimmich', number: 6, role: 'MIL', photo: '/players/kimmich.jpg', stats: { tir: 85, phy: 84, ctr: 92 } },
      { id: 'ger-4', name: 'Florian Wirtz', shortName: 'Wirtz', number: 17, role: 'MIL', photo: '/players/wirtz.jpg', stats: { tir: 88, phy: 80, ctr: 94 } },
      { id: 'ger-5', name: 'Jamal Musiala', shortName: 'Musiala', number: 10, role: 'ATT', photo: '/players/musiala.jpg', stats: { tir: 88, phy: 79, ctr: 95 } },
    ],
  },
  {
    id: 'mci',
    name: 'Manchester City',
    shortName: 'Man City',
    code: 'MCI',
    category: 'club',
    country: 'Angleterre',
    league: 'Premier League',
    unlockTrophies: 760,
    kitPrimary: '#6CABDD',
    kitSecondary: '#1C2C5B',
    kitTrim: '#FFFFFF',
    gkColor: '#EC4899',
    kitPattern: 'solid',
    crestShape: 'round',
    rating: 93,
    playstyle: 'Contrôle total & cyborg de surface',
    players: [
      { id: 'mci-1', name: 'Ederson', shortName: 'Ederson', number: 31, role: 'GK', photo: '/players/ederson.jpg', stats: { tir: 86, phy: 88, ctr: 91 } },
      { id: 'mci-2', name: 'Rúben Dias', shortName: 'R. Dias', number: 3, role: 'DEF', photo: '/players/rubendias.jpg', stats: { tir: 78, phy: 93, ctr: 85 } },
      { id: 'mci-3', name: 'Rodri', shortName: 'Rodri', number: 16, role: 'MIL', photo: '/players/rodri.jpg', stats: { tir: 90, phy: 92, ctr: 94 } },
      { id: 'mci-4', name: 'Kevin De Bruyne', shortName: 'De Bruyne', number: 17, role: 'MIL', photo: '/players/debruyne.jpg', stats: { tir: 93, phy: 83, ctr: 96 } },
      { id: 'mci-5', name: 'Erling Haaland', shortName: 'Haaland', number: 9, role: 'ATT', photo: '/players/haaland.jpg', stats: { tir: 97, phy: 95, ctr: 86 } },
    ],
  },
  {
    id: 'por',
    name: 'Portugal',
    shortName: 'Portugal',
    code: 'POR',
    category: 'nation',
    country: 'Portugal',
    league: 'Sélection UEFA',
    unlockTrophies: 850,
    kitPrimary: '#B81D24',
    kitSecondary: '#006633',
    kitTrim: '#E5A93C',
    gkColor: '#1E293B',
    kitPattern: 'halves',
    crestShape: 'shield',
    rating: 92,
    playstyle: 'Virtuosité lusitanienne & frappe létale',
    players: [
      { id: 'por-1', name: 'Diogo Costa', shortName: 'Diogo Costa', number: 22, role: 'GK', photo: '/players/diogocosta.jpg', stats: { tir: 80, phy: 88, ctr: 88 } },
      { id: 'por-2', name: 'Rúben Dias', shortName: 'R. Dias', number: 4, role: 'DEF', photo: '/players/rubendias.jpg', stats: { tir: 78, phy: 93, ctr: 85 } },
      { id: 'por-3', name: 'Vitinha', shortName: 'Vitinha', number: 23, role: 'MIL', photo: '/players/vitinha.jpg', stats: { tir: 86, phy: 79, ctr: 93 } },
      { id: 'por-4', name: 'Bruno Fernandes', shortName: 'Bruno F.', number: 8, role: 'MIL', photo: '/players/bruno.jpg', stats: { tir: 92, phy: 82, ctr: 93 } },
      { id: 'por-5', name: 'Cristiano Ronaldo', shortName: 'Ronaldo', number: 7, role: 'ATT', photo: '/players/ronaldo.jpg', stats: { tir: 96, phy: 90, ctr: 89 } },
    ],
  },
  {
    id: 'rma',
    name: 'Real Madrid',
    shortName: 'Real Madrid',
    code: 'RMA',
    category: 'club',
    country: 'Espagne',
    league: 'LaLiga',
    unlockTrophies: 900,
    unlockHint: '900 Trophées ou Ligue des Géants',
    kitPrimary: '#F8FAFC',
    kitSecondary: '#1E293B',
    kitTrim: '#D4AF37',
    gkColor: '#15803D',
    kitPattern: 'solid',
    crestShape: 'crown',
    rating: 95,
    playstyle: 'ADN Rois d’Europe & galactiques',
    players: [
      { id: 'rma-1', name: 'Thibaut Courtois', shortName: 'Courtois', number: 1, role: 'GK', photo: '/players/courtois.jpg', stats: { tir: 79, phy: 94, ctr: 89 } },
      { id: 'rma-2', name: 'Antonio Rüdiger', shortName: 'Rüdiger', number: 22, role: 'DEF', photo: '/players/rudiger.jpg', stats: { tir: 80, phy: 95, ctr: 81 } },
      { id: 'rma-3', name: 'Jude Bellingham', shortName: 'Bellingham', number: 5, role: 'MIL', photo: '/players/bellingham.jpg', stats: { tir: 91, phy: 90, ctr: 93 } },
      { id: 'rma-4', name: 'Vinícius Júnior', shortName: 'Vinícius Jr', number: 7, role: 'ATT', photo: '/players/vinicius.jpg', stats: { tir: 92, phy: 82, ctr: 95 } },
      { id: 'rma-5', name: 'Kylian Mbappé', shortName: 'Mbappé', number: 9, role: 'ATT', photo: '/players/mbappe.jpg', stats: { tir: 96, phy: 86, ctr: 94 } },
    ],
  },
  {
    id: 'eng',
    name: 'Angleterre',
    shortName: 'Angleterre',
    code: 'ENG',
    category: 'nation',
    country: 'Angleterre',
    league: 'Sélection UEFA',
    unlockTrophies: 980,
    kitPrimary: '#F8FAFC',
    kitSecondary: '#1D3557',
    kitTrim: '#CE1124',
    gkColor: '#F59E0B',
    kitPattern: 'solid',
    crestShape: 'shield',
    rating: 93,
    playstyle: 'Puissance athlétique & artilleurs d’élite',
    players: [
      { id: 'eng-1', name: 'Jordan Pickford', shortName: 'Pickford', number: 1, role: 'GK', photo: '/players/pickford.jpg', stats: { tir: 84, phy: 86, ctr: 86 } },
      { id: 'eng-2', name: 'Declan Rice', shortName: 'Rice', number: 4, role: 'DEF', photo: '/players/rice.jpg', stats: { tir: 86, phy: 91, ctr: 87 } },
      { id: 'eng-3', name: 'Jude Bellingham', shortName: 'Bellingham', number: 10, role: 'MIL', photo: '/players/bellingham.jpg', stats: { tir: 91, phy: 90, ctr: 93 } },
      { id: 'eng-4', name: 'Bukayo Saka', shortName: 'Saka', number: 7, role: 'ATT', photo: '/players/saka.jpg', stats: { tir: 89, phy: 82, ctr: 91 } },
      { id: 'eng-5', name: 'Harry Kane', shortName: 'Kane', number: 9, role: 'ATT', photo: '/players/kane.jpg', stats: { tir: 96, phy: 89, ctr: 90 } },
    ],
  },
  {
    id: 'esp',
    name: 'Espagne',
    shortName: 'Espagne',
    code: 'ESP',
    category: 'nation',
    country: 'Espagne',
    league: 'Sélection UEFA',
    unlockTrophies: 1120,
    kitPrimary: '#C60B1E',
    kitSecondary: '#FFC400',
    kitTrim: '#1B263B',
    gkColor: '#2563EB',
    kitPattern: 'solid',
    crestShape: 'crown',
    rating: 94,
    playstyle: 'Champions d’Europe · Précision absolue',
    players: [
      { id: 'esp-1', name: 'Unai Simón', shortName: 'Unai Simón', number: 23, role: 'GK', photo: '/players/unaisimon.jpg', stats: { tir: 78, phy: 88, ctr: 87 } },
      { id: 'esp-2', name: 'Dani Carvajal', shortName: 'Carvajal', number: 2, role: 'DEF', photo: '/players/carvajal.jpg', stats: { tir: 82, phy: 88, ctr: 87 } },
      { id: 'esp-3', name: 'Rodri', shortName: 'Rodri', number: 16, role: 'MIL', photo: '/players/rodri.jpg', stats: { tir: 90, phy: 92, ctr: 94 } },
      { id: 'esp-4', name: 'Pedri', shortName: 'Pedri', number: 20, role: 'MIL', photo: '/players/pedri.jpg', stats: { tir: 84, phy: 79, ctr: 96 } },
      { id: 'esp-5', name: 'Lamine Yamal', shortName: 'Yamal', number: 19, role: 'ATT', photo: '/players/yamal.jpg', stats: { tir: 90, phy: 79, ctr: 95 } },
    ],
  },
  {
    id: 'fra',
    name: 'France',
    shortName: 'France',
    code: 'FRA',
    category: 'nation',
    country: 'France',
    league: 'Sélection UEFA',
    unlockTrophies: 1250,
    unlockHint: '1250 Trophées ou Euro des Nations',
    kitPrimary: '#002654',
    kitSecondary: '#FFFFFF',
    kitTrim: '#ED2939',
    gkColor: '#EAB308',
    kitPattern: 'solid',
    crestShape: 'hex',
    rating: 95,
    playstyle: 'Muraille défensive & attaque fulgurante',
    players: [
      { id: 'fra-1', name: 'Mike Maignan', shortName: 'Maignan', number: 16, role: 'GK', photo: '/players/maignan.jpg', stats: { tir: 82, phy: 89, ctr: 87 } },
      { id: 'fra-2', name: 'William Saliba', shortName: 'Saliba', number: 17, role: 'DEF', photo: '/players/saliba.jpg', stats: { tir: 77, phy: 93, ctr: 86 } },
      { id: 'fra-3', name: 'Jules Koundé', shortName: 'Koundé', number: 5, role: 'DEF', photo: '/players/kounde.jpg', stats: { tir: 79, phy: 88, ctr: 86 } },
      { id: 'fra-4', name: 'Ousmane Dembélé', shortName: 'Dembélé', number: 11, role: 'ATT', photo: '/players/dembele.jpg', stats: { tir: 89, phy: 79, ctr: 92 } },
      { id: 'fra-5', name: 'Kylian Mbappé', shortName: 'Mbappé', number: 10, role: 'ATT', photo: '/players/mbappe.jpg', stats: { tir: 96, phy: 86, ctr: 94 } },
    ],
  },
];

// ---------- FC 27 database expansion: 15-player squads, 50 clubs, 50 nations, Blue Lock ----------
const BENCH_FIRST = ['Alex','Lucas','Noah','Adam','Liam','Hugo','Nathan','Leo','Milan','Sacha','Enzo','Rayan','Mateo','Ivan','Omar','Yanis'];
const BENCH_LAST = ['Moreau','Kovac','Silva','Ndiaye','Petrov','Costa','Diallo','Novak','Meyer','Sow','Benali','Rossi','Kane','Marek','Diallo','Santos','Ricci','Vidal'];
const ROLE_SEQUENCE: PlayerRole[] = ['GK','DEF','DEF','MIL','MIL','ATT','DEF','MIL','ATT','ATT'];
function seededNumber(seed: string, salt: number): number { let h = salt * 2654435761; for (let i=0;i<seed.length;i++) h = (h ^ (seed.charCodeAt(i) * (i+11))) >>> 0; return ((h >> 8) % 1000) / 1000; }
function generatedPlayer(teamId: string, index: number, rating: number, role: PlayerRole, firstNames = BENCH_FIRST, lastNames = BENCH_LAST): SquadPlayer {
  const a = firstNames[Math.floor(seededNumber(teamId+index, 3) * firstNames.length)];
  const b = lastNames[Math.floor(seededNumber(teamId+index, 7) * lastNames.length)];
  const drop = Math.floor(index / 3);
  const base = Math.max(55, Math.min(94, rating - 3 - drop + Math.floor(seededNumber(teamId+index, 13) * 5)));
  return { id: `${teamId}-g${index+1}`, name: `${a} ${b}`, shortName: b, number: index + 2, role, photo: '', stats: { tir: Math.max(52, Math.min(96, base + (role === 'ATT' ? 3 : role === 'GK' ? -5 : 0))), phy: Math.max(52, Math.min(96, base + (role === 'DEF' || role === 'GK' ? 3 : 0))), ctr: Math.max(52, Math.min(96, base + (role === 'MIL' ? 3 : 0))) } };
}
function expandSquad(team: EuroTeam) {
  team.players = team.players.map((pl, i) => ({ ...pl, stats: { tir: Math.min(97, pl.stats.tir + (i === 0 ? 1 : 2)), phy: Math.min(96, pl.stats.phy + 1), ctr: Math.min(97, pl.stats.ctr + 2) } }));
  for (let i = 0; i < 10; i++) team.players.push(generatedPlayer(team.id, i + 5, team.rating, ROLE_SEQUENCE[i]));
  team.players = team.players.slice(0, 15);
}
EURO_TEAMS.forEach(expandSquad);

type TeamSeed = [string,string,string,string,string,string,number,string,string,string];
function makeGeneratedTeam(seed: TeamSeed, category: 'club'|'nation', index: number): EuroTeam {
  const [id,name,shortName,code,country,league,rating,primary,secondary,trim] = seed;
  const unlockTrophies = id === 'blue-lock' ? 1500 : Math.round((index + 2) * 42 + rating * 2);
  const benchRoles: PlayerRole[] = ['DEF','DEF','MIL','MIL','ATT','DEF','MIL','ATT','ATT','DEF','MIL','ATT','MIL','ATT']; const players = Array.from({length:15},(_,i)=> generatedPlayer(id, i, rating, i===0?'GK':benchRoles[i-1]));
  return { id, name, shortName, code, category, country, league, unlockTrophies, unlockHint: id==='blue-lock' ? 'Défi spécial Blue Lock ou 1500 trophées' : `${unlockTrophies} trophées, défis ou championnat`, kitPrimary: primary, kitSecondary: secondary, kitTrim: trim, gkColor: '#FF7A1A', kitPattern: index % 4 === 0 ? 'stripes' : index % 4 === 1 ? 'sash' : 'solid', crestShape: index % 5 === 0 ? 'crown' : index % 3 === 0 ? 'round' : 'shield', rating, playstyle: category==='nation' ? 'Sélection complète · banc de 10 joueurs' : 'Effectif FC 27 · 5 titulaires et 10 remplaçants', players };
}
const EXTRA_CLUBS: TeamSeed[] = [
['nap','SSC Napoli','Napoli','NAP','Italie','Serie A',89,'#12A0D7','#FFFFFF','#001C82'],['rom','AS Roma','Roma','ROM','Italie','Serie A',85,'#8E1F2F','#F0BC42','#F0BC42'],['ata','Atalanta BC','Atalanta','ATA','Italie','Serie A',86,'#1E71B8','#111111','#FFFFFF'],['juv','Juventus FC','Juventus','JUV','Italie','Serie A',88,'#FFFFFF','#111111','#C8A951'],['laz','SS Lazio','Lazio','LAZ','Italie','Serie A',84,'#87D8F7','#FFFFFF','#001E44'],['fio','ACF Fiorentina','Fiorentina','FIO','Italie','Serie A',83,'#582C83','#FFFFFF','#F2C14E'],['new','Newcastle United','Newcastle','NEW','Angleterre','Premier League',87,'#111111','#FFFFFF','#C8A951'],['tot','Tottenham Hotspur','Spurs','TOT','Angleterre','Premier League',87,'#FFFFFF','#132257','#132257'],['che','Chelsea FC','Chelsea','CHE','Angleterre','Premier League',88,'#034694','#FFFFFF','#D4AF37'],['mun','Manchester United','Man United','MUN','Angleterre','Premier League',88,'#DA291C','#FFFFFF','#FBE122'],['avl','Aston Villa','Aston Villa','AVL','Angleterre','Premier League',86,'#670E36','#95BFE5','#F5D67B'],['bha','Brighton & Hove Albion','Brighton','BHA','Angleterre','Premier League',84,'#0057B8','#FFFFFF','#FFCD00'],['whu','West Ham United','West Ham','WHU','Angleterre','Premier League',83,'#7A263A','#1BB1E7','#F3D459'],['atm','Atlético de Madrid','Atlético','ATM','Espagne','LaLiga',89,'#CB3524','#FFFFFF','#272E61'],['sev','Sevilla FC','Séville','SEV','Espagne','LaLiga',84,'#F43333','#FFFFFF','#C8A951'],['val','Valencia CF','Valence','VAL','Espagne','LaLiga',82,'#FFFFFF','#111111','#F5A300'],['ath','Athletic Club','Athletic','ATH','Espagne','LaLiga',84,'#EE2523','#FFFFFF','#009933'],['soc','Real Sociedad','Real Sociedad','RSO','Espagne','LaLiga',84,'#0067B1','#FFFFFF','#FFFFFF'],['bet','Real Betis','Betis','BET','Espagne','LaLiga',83,'#00954C','#FFFFFF','#00954C'],['rbl','RB Leipzig','Leipzig','RBL','Allemagne','Bundesliga',86,'#DD001F','#FFFFFF','#FFCC00'],['b04','Bayer Leverkusen','Leverkusen','B04','Allemagne','Bundesliga',89,'#E32221','#111111','#FFFFFF'],['sge','Eintracht Francfort','Francfort','SGE','Allemagne','Bundesliga',84,'#E1000F','#111111','#FFFFFF'],['vfb','VfB Stuttgart','Stuttgart','VFB','Allemagne','Bundesliga',84,'#FFFFFF','#E32219','#E32219'],['wob','VfL Wolfsburg','Wolfsburg','WOB','Allemagne','Bundesliga',82,'#65B32E','#FFFFFF','#001E50'],['om','Olympique de Marseille','Marseille','OM','France','Ligue 1',85,'#2FAEE0','#FFFFFF','#D4AF37'],['asm','AS Monaco','Monaco','ASM','France','Ligue 1',85,'#E63312','#FFFFFF','#C8A951'],['losc','LOSC Lille','Lille','LOS','France','Ligue 1',84,'#E01E13','#FFFFFF','#001E62'],['ren','Stade Rennais','Rennes','REN','France','Ligue 1',82,'#E1000F','#111111','#FFFFFF'],['ogc','OGC Nice','Nice','NCE','France','Ligue 1',82,'#E30613','#111111','#FFFFFF'],['aja','AFC Ajax','Ajax','AJA','Pays-Bas','Eredivisie',84,'#D2122E','#FFFFFF','#111111'],['psv','PSV Eindhoven','PSV','PSV','Pays-Bas','Eredivisie',85,'#ED1C24','#FFFFFF','#004A9F'],['fey','Feyenoord','Feyenoord','FEY','Pays-Bas','Eredivisie',83,'#FF0000','#FFFFFF','#111111'],['scp','Sporting CP','Sporting','SCP','Portugal','Liga Portugal',85,'#008057','#FFFFFF','#F7D038'],['por2','FC Porto','Porto','FCP','Portugal','Liga Portugal',85,'#003DA5','#FFFFFF','#FFFFFF'],['cel','Celtic FC','Celtic','CEL','Écosse','Premiership',82,'#018749','#FFFFFF','#F7D038'],['gal','Galatasaray','Galatasaray','GAL','Turquie','Süper Lig',84,'#FFA900','#A32638','#A32638'],['fen','Fenerbahçe','Fenerbahçe','FEN','Turquie','Süper Lig',84,'#FFED00','#002D72','#002D72'],['sal','RB Salzburg','Salzburg','SAL','Autriche','Bundesliga AUT',81,'#E30613','#FFFFFF','#FFCC00']];
const EXTRA_NATIONS: TeamSeed[] = [
['bra','Brésil','Brésil','BRA','Brésil','Sélection mondiale',93,'#FFDF00','#009C3B','#002776'],['arg','Argentine','Argentine','ARG','Argentine','Sélection mondiale',94,'#75AADB','#FFFFFF','#F6B40E'],['uru','Uruguay','Uruguay','URU','Uruguay','Sélection mondiale',87,'#5CADD6','#FFFFFF','#001A4D'],['col','Colombie','Colombie','COL','Colombie','Sélection mondiale',86,'#FCD116','#003893','#CE1126'],['chi','Chili','Chili','CHI','Chili','Sélection mondiale',82,'#D52B1E','#0039A6','#FFFFFF'],['per','Pérou','Pérou','PER','Pérou','Sélection mondiale',80,'#FFFFFF','#D91023','#D91023'],['ecu','Équateur','Équateur','ECU','Équateur','Sélection mondiale',81,'#FFDD00','#034EA2','#ED1C24'],['par','Paraguay','Paraguay','PAR','Paraguay','Sélection mondiale',80,'#D52B1E','#0038A8','#FFFFFF'],['usa','États-Unis','USA','USA','États-Unis','Sélection mondiale',84,'#FFFFFF','#3C3B6E','#B22234'],['mex','Mexique','Mexique','MEX','Mexique','Sélection mondiale',83,'#006847','#FFFFFF','#CE1126'],['can','Canada','Canada','CAN','Canada','Sélection mondiale',82,'#FF0000','#FFFFFF','#111111'],['cro','Croatie','Croatie','CRO','Croatie','Sélection UEFA',88,'#FFFFFF','#E8112D','#0A2A5E'],['bel','Belgique','Belgique','BEL','Belgique','Sélection UEFA',89,'#ED2939','#111111','#FDDA24'],['ned','Pays-Bas','Pays-Bas','NED','Pays-Bas','Sélection UEFA',90,'#FF7A1A','#FFFFFF','#21468B'],['den','Danemark','Danemark','DEN','Danemark','Sélection UEFA',85,'#C8102E','#FFFFFF','#FFFFFF'],['sui','Suisse','Suisse','SUI','Suisse','Sélection UEFA',84,'#DA291C','#FFFFFF','#FFFFFF'],['aut','Autriche','Autriche','AUT','Autriche','Sélection UEFA',84,'#ED2939','#FFFFFF','#111111'],['pol','Pologne','Pologne','POL','Pologne','Sélection UEFA',84,'#FFFFFF','#DC143C','#DC143C'],['sco','Écosse','Écosse','SCO','Écosse','Sélection UEFA',82,'#0065BF','#FFFFFF','#FFD700'],['wal','Pays de Galles','Galles','WAL','Pays de Galles','Sélection UEFA',81,'#00AB66','#FFFFFF','#D21034'],['irl','Irlande','Irlande','IRL','Irlande','Sélection UEFA',80,'#169B62','#FFFFFF','#FF883E'],['nor','Norvège','Norvège','NOR','Norvège','Sélection UEFA',84,'#BA0C2F','#FFFFFF','#00205B'],['swe','Suède','Suède','SWE','Suède','Sélection UEFA',83,'#006AA7','#FECC00','#FECC00'],['ukr','Ukraine','Ukraine','UKR','Ukraine','Sélection UEFA',82,'#005BBB','#FFD500','#FFD500'],['tur','Turquie','Turquie','TUR','Turquie','Sélection UEFA',84,'#E30A17','#FFFFFF','#FFFFFF'],['cze','Tchéquie','Tchéquie','CZE','Tchéquie','Sélection UEFA',82,'#11457E','#FFFFFF','#D7141A'],['srb','Serbie','Serbie','SRB','Serbie','Sélection UEFA',82,'#C6363C','#0C4076','#FFFFFF'],['hun','Hongrie','Hongrie','HUN','Hongrie','Sélection UEFA',81,'#CE2939','#477050','#FFFFFF'],['svk','Slovaquie','Slovaquie','SVK','Slovaquie','Sélection UEFA',80,'#0B4EA2','#FFFFFF','#EE1C25'],['svn','Slovénie','Slovénie','SVN','Slovénie','Sélection UEFA',80,'#FFFFFF','#005DA4','#ED1C24'],['gre','Grèce','Grèce','GRE','Grèce','Sélection UEFA',80,'#0D5EAF','#FFFFFF','#FFFFFF'],['mar','Maroc','Maroc','MAR','Maroc','Sélection CAF',87,'#C1272D','#006233','#006233'],['sen','Sénégal','Sénégal','SEN','Sénégal','Sélection CAF',85,'#00853F','#FFFFFF','#FDEF42'],['nga','Nigeria','Nigeria','NGA','Nigeria','Sélection CAF',84,'#008751','#FFFFFF','#FFFFFF'],['cmr','Cameroun','Cameroun','CMR','Cameroun','Sélection CAF',83,'#007A5E','#CE1126','#FCD116'],['civ','Côte d’Ivoire','Côte d’Ivoire','CIV','Côte d’Ivoire','Sélection CAF',84,'#F77F00','#FFFFFF','#009E60'],['alg','Algérie','Algérie','ALG','Algérie','Sélection CAF',83,'#006233','#FFFFFF','#D21034'],['egy','Égypte','Égypte','EGY','Égypte','Sélection CAF',82,'#CE1126','#FFFFFF','#C09300'],['gha','Ghana','Ghana','GHA','Ghana','Sélection CAF',82,'#006B3F','#FCD116','#CE1126'],['rdc','RD Congo','RD Congo','RDC','RD Congo','Sélection CAF',81,'#007FFF','#CE1021','#F7D618'],['rsa','Afrique du Sud','Afrique du Sud','RSA','Afrique du Sud','Sélection CAF',80,'#007749','#FFFFFF','#FFB612'],['jpn','Japon','Japon','JPN','Japon','Sélection AFC',84,'#001E60','#FFFFFF','#E03A3A'],['kor','Corée du Sud','Corée du Sud','KOR','Corée du Sud','Sélection AFC',83,'#FFFFFF','#CD2E3A','#0047A0'],['ksa','Arabie Saoudite','Arabie Saoudite','KSA','Arabie Saoudite','Sélection AFC',79,'#006C35','#FFFFFF','#FFFFFF']];
EURO_TEAMS.push(...EXTRA_CLUBS.map((seed,i)=>makeGeneratedTeam(seed,'club',i)));
EURO_TEAMS.push(...EXTRA_NATIONS.map((seed,i)=>makeGeneratedTeam(seed,'nation',i)));
const blueLock = makeGeneratedTeam(['blue-lock','Blue Lock XI','Blue Lock','BLU','Japon','Équipe spéciale manga',96,'#00A8FF','#050B2E','#FFD21F'],'club',99);
blueLock.category = 'special'; blueLock.playstyle = 'Équipe spéciale Blue Lock · égoïsme créatif et frappes dévastatrices';
const BLUE_LOCK_NAMES: [string,PlayerRole][] = [['Yoichi Isagi','ATT'],['Rin Itoshi','ATT'],['Seishiro Nagi','ATT'],['Bachira','MIL'],['Hyoma Chigiri','ATT'],['Rensuke Kunigami','ATT'],['Shoei Baro','ATT'],['Reo Mikage','MIL'],['Jingo Raichi','MIL'],['Gin Gagamaru','GK'],['Aryu','DEF'],['Ikki Niko','DEF'],['Tabito Karasu','MIL'],['Eita Otoya','ATT'],['Kenyu Yukimiya','ATT']];
blueLock.players = BLUE_LOCK_NAMES.map(([name,role],i)=>({ id:`blue-lock-${i+1}`, name, shortName: name.split(' ').slice(-1)[0], number:i+1, role, photo:'', stats:{ tir: role==='ATT'?94:86, phy: role==='DEF'||role==='GK'?89:83, ctr:95 } }));
EURO_TEAMS.push(blueLock);
export const TEAM_COUNTS = { clubs: EURO_TEAMS.filter(t=>t.category==='club').length, nations: EURO_TEAMS.filter(t=>t.category==='nation').length, special: EURO_TEAMS.filter(t=>t.category==='special').length, total: EURO_TEAMS.length };
export function getStarters(team: EuroTeam, lineup?: number[]): SquadPlayer[] { const ids = lineup && lineup.length===5 ? lineup : [0,1,2,3,4]; return ids.map(i=>team.players[i] || team.players[0]); }
export function effectiveTeam(team: EuroTeam, lineup?: number[]): EuroTeam { return { ...team, players: getStarters(team, lineup) }; }

export interface SoloCupDef {
  id: string;
  title: string;
  subtitle: string;
  minTrophies: number;
  rewardTrophies: number;
  rewardCoins: number;
  unlockTeamId: string;
  difficulty: BotDifficulty;
  accent: string;
  opponents: [string, string, string]; // Quarts, Demi-finale, Finale
}

export const SOLO_CUPS: SoloCupDef[] = [
  {
    id: 'challenger-cup',
    title: 'Coupe Challenger',
    subtitle: '3 tours à élimination directe · Quarts, Demie & Finale',
    minTrophies: 0,
    rewardTrophies: 95,
    rewardCoins: 120,
    unlockTeamId: 'mil',
    difficulty: 'pro',
    accent: '#2A9D8F',
    opponents: ['ben', 'bvb', 'mil'],
  },
  {
    id: 'europa-cup',
    title: 'Coupe Europa Tactique',
    subtitle: 'Affrontez les cadors européens en phase finale',
    minTrophies: 100,
    rewardTrophies: 165,
    rewardCoins: 220,
    unlockTeamId: 'ars',
    difficulty: 'pro',
    accent: '#E5A93C',
    opponents: ['mil', 'int', 'ars'],
  },
  {
    id: 'champions-cup',
    title: 'Ligue des Géants',
    subtitle: 'Le sommet des clubs européens · IA haute précision',
    minTrophies: 320,
    rewardTrophies: 260,
    rewardCoins: 380,
    unlockTeamId: 'rma',
    difficulty: 'elite',
    accent: '#3B82F6',
    opponents: ['psg', 'mci', 'rma'],
  },
  {
    id: 'euro-nations-cup',
    title: 'Euro des Nations',
    subtitle: 'Tournoi continental des sélections nationales',
    minTrophies: 600,
    rewardTrophies: 350,
    rewardCoins: 500,
    unlockTeamId: 'fra',
    difficulty: 'legend',
    accent: '#EF4444',
    opponents: ['por', 'esp', 'fra'],
  },
];

export function getTeamById(id: string): EuroTeam {
  return EURO_TEAMS.find((t) => t.id === id) || EURO_TEAMS[0];
}

export function computeUnlockedTeams(trophies: number, explicitUnlocks: string[]): string[] {
  const set = new Set<string>([...STARTER_TEAM_IDS, ...explicitUnlocks]);
  for (const t of EURO_TEAMS) {
    if (trophies >= t.unlockTrophies) {
      set.add(t.id);
    }
  }
  return Array.from(set);
}
