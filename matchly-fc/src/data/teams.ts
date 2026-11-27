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
  category: 'club' | 'nation';
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
  players: [SquadPlayer, SquadPlayer, SquadPlayer, SquadPlayer, SquadPlayer];
}

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

export interface SoloCupDef {
  id: string;
  title: string;
  subtitle: string;
  minTrophies: number;
  rewardTrophies: number;
  rewardCoins: number;
  unlockTeamId: string;
  difficulty: 'pro' | 'elite' | 'legend';
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
