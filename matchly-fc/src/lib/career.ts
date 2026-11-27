import { EuroTeam, SquadPlayer } from '../data/teams';

export interface CareerPlayer extends SquadPlayer { value: number; potential: number; nation: string; }
export interface CareerTableRow { name: string; played: number; wins: number; losses: number; gf: number; ga: number; points: number; }
export interface CareerFixture { opponent: string; rating: number; played: boolean; result?: string; }
export interface CareerSave {
  clubName: string; coachName: string; logoUrl: string; captainName: string;
  squad: CareerPlayer[]; division: number; season: number;
  table: CareerTableRow[]; fixtures: CareerFixture[]; message: string;
}
export const CAREER_DIVISIONS = ['Division 3', 'Division 2', 'Division 1', 'Division Master', 'Division Légende'];
const KEY = 'matchly_fc27_career_v1';
const FIRST = ['Adam','Noah','Liam','Enzo','Hugo','Mateo','Ivan','Omar','Yanis','Sacha','Rayan','Kenji','Luka','Stefan','Ethan','Gabriel'];
const POOLS: Record<string,string[]> = {
  'Arabie Saoudite':['Al Harbi','Al Dossari','Al Qahtani','Al Shehri','Al Ghamdi','Al Malki'], 'RD Congo':['Mbemba','Bakambu','Muleka','Kakuta','Masuaku','Pickel'],
  Croatie:['Modric','Kovacic','Gvardiol','Sutalo','Perisic','Kramaric'], Slovénie:['Sesko','Oblak','Bijol','Stojanovic','Verbic','Lovric'],
  'États-Unis':['Pulisic','Reyna','Adams','Robinson','Musah','Balogun'], Japon:['Kubo','Mitoma','Endo','Tomiyasu','Ueda','Doan'],
  Maroc:['Hakimi','Brahim','Ounahi','Amrabat','En-Nesyri','Ezzalzouli'], Sénégal:['Mané','Sarr','Gueye','Koulibaly','Diarra','Jackson'],
};
export const CAREER_NATIONS = Object.keys(POOLS);
export const CAPTAIN_OPTIONS = [
  { name:'Kylian Mbappé', role:'ATT' as const, nation:'France', stats:{tir:97,phy:88,ctr:95} },
  { name:'Erling Haaland', role:'ATT' as const, nation:'Norvège', stats:{tir:98,phy:96,ctr:88} },
  { name:'Lamine Yamal', role:'ATT' as const, nation:'Espagne', stats:{tir:92,phy:81,ctr:97} },
  { name:'Jude Bellingham', role:'MIL' as const, nation:'Angleterre', stats:{tir:93,phy:92,ctr:95} },
  { name:'Cristiano Ronaldo', role:'ATT' as const, nation:'Portugal', stats:{tir:97,phy:91,ctr:90} },
  { name:'Mohamed Salah', role:'ATT' as const, nation:'Égypte', stats:{tir:95,phy:85,ctr:94} },
];
const rand=(min:number,max:number)=>Math.round(min+Math.random()*(max-min));
const pick=<T,>(arr:T[])=>arr[Math.floor(Math.random()*arr.length)];
export function playerValue(stats:{tir:number;phy:number;ctr:number}, potential:number){ const avg=(stats.tir+stats.phy+stats.ctr)/3; return Math.max(25, Math.round((avg-52)*16 + potential*3)); }
function makePlayer(nation:string,index:number,role:SquadPlayer['role'],captain=false): CareerPlayer {
  const last = pick(POOLS[nation] || POOLS.Japon); const name = captain ? last : `${pick(FIRST)} ${last}`;
  const base = captain?0:rand(57,73); const stats = captain?{tir:88,phy:84,ctr:90}:{tir:Math.min(78,base+rand(0,6)),phy:Math.min(78,base+rand(0,6)),ctr:Math.min(78,base+rand(0,6))};
  const potential=rand(2,12); return { id:`career-${Date.now()}-${index}-${Math.random().toString(36).slice(2,6)}`, name, shortName:last, number:index+1, role, photo:'', stats, potential, nation, value:playerValue(stats,potential) };
}
export function createCareerSquad(captainName:string): CareerPlayer[] {
  const cap = CAPTAIN_OPTIONS.find(c=>c.name===captainName) || CAPTAIN_OPTIONS[0];
  const roles: SquadPlayer['role'][] = ['GK','DEF','DEF','MIL','MIL','ATT','DEF','MIL','ATT','DEF','MIL','ATT','MIL','DEF','ATT'];
  const squad = roles.map((role,i)=> makePlayer(pick(CAREER_NATIONS), i, role));
  const capPlayer: CareerPlayer = { id:'career-captain', name:cap.name, shortName:cap.name.split(' ').slice(-1)[0], number:10, role:cap.role, photo: cap.name.includes('Mbappé')?'/players/mbappe.jpg':cap.name.includes('Haaland')?'/players/haaland.jpg':cap.name.includes('Yamal')?'/players/yamal.jpg':cap.name.includes('Bellingham')?'/players/bellingham.jpg':cap.name.includes('Ronaldo')?'/players/ronaldo.jpg':'/players/salah.jpg', stats:{...cap.stats}, potential:6, nation:cap.nation, value:playerValue(cap.stats,6) };
  squad[4]=capPlayer; // le capitaine choisi est toujours dans le cinq de départ
  return squad;
}
const OPPONENTS: Record<number,string[]> = {0:['FC Kinshasa','RDC Academy','USA Prospect','Japon Espoirs','Croatie U23','Slovénie Stars','Arabie Falcons'],1:['Casablanca Atlas','Dakar Lions','Zagreb Nord','Ljubljana FC','Tokyo City','Riyad United','Austin FC II'],2:['Rabat Royal','Kinshasa Élite','Osaka Samurai','Seattle Sound','Split Adriatic','Maribor FC','Jeddah Stars'],3:['Master Casablanca','Master Tokyo','Master Zagreb','Master Seattle','Master Riyad','Master Dakar','Master Ljubljana'],4:['Légende AFC','Légende CAF','Légende UEFA','Légende CONCACAF','Légende du Pacifique','Légende des Balkans','Légende du Golfe']};
export function makeSeason(division:number, clubName:string){ const names=OPPONENTS[division]||OPPONENTS[0]; const table=[clubName,...names].map(name=>({name,played:0,wins:0,losses:0,gf:0,ga:0,points:0})); const fixtures=names.map((opponent,i)=>({opponent,rating:66+division*6+i,played:false})); return {table,fixtures}; }
export function createCareer(clubName:string,coachName:string,logoUrl:string,captainName:string): CareerSave { const season=makeSeason(0,clubName); return {clubName,coachName,logoUrl,captainName,squad:createCareerSquad(captainName),division:0,season:1,...season,message:'Bienvenue en Division 3. Gagnez le championnat pour monter.'}; }
export function loadCareer(): CareerSave|null { try{ const raw=localStorage.getItem(KEY); return raw?JSON.parse(raw):null; }catch{return null;} }
export function saveCareer(save:CareerSave|null){ try{ if(save) localStorage.setItem(KEY,JSON.stringify(save)); else localStorage.removeItem(KEY);}catch{} }
export function careerToTeam(save:CareerSave): EuroTeam { return { id:'career-custom', name:save.clubName, shortName:save.clubName.slice(0,16), code:save.clubName.replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase()||'CAR', category:'special', country:'Club personnalisé', league:CAREER_DIVISIONS[save.division], unlockTrophies:0, kitPrimary:'#00A8FF', kitSecondary:'#050B2E', kitTrim:'#FFD21F', gkColor:'#FF2EA6', kitPattern:'sash', crestShape:'shield', rating:Math.round(save.squad.slice(0,5).reduce((n,p)=>n+(p.stats.tir+p.stats.phy+p.stats.ctr)/3,0)/5), playstyle:`Coach ${save.coachName} · Capitaine ${save.captainName}`, logoUrl:save.logoUrl, players:save.squad }; }
export function careerOpponent(save:CareerSave, fixture:CareerFixture): EuroTeam { const squad=Array.from({length:15},(_,i)=>{ const p=makePlayer(pick(CAREER_NATIONS),i, i===0?'GK':(['DEF','MIL','ATT'] as const)[i%3]); const boost=Math.round((fixture.rating-66)/3); p.stats={tir:Math.min(94,p.stats.tir+boost+8),phy:Math.min(94,p.stats.phy+boost+8),ctr:Math.min(94,p.stats.ctr+boost+8)}; p.value=playerValue(p.stats,p.potential); return p; }); return { id:`career-opp-${fixture.opponent}`, name:fixture.opponent, shortName:fixture.opponent.slice(0,16), code:fixture.opponent.replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase(), category:'special', country:'Championnat Carrière', league:CAREER_DIVISIONS[save.division], unlockTrophies:0, kitPrimary:'#FF2EA6', kitSecondary:'#14051F', kitTrim:'#00E5FF', gkColor:'#FFD21F', kitPattern:'stripes', crestShape:'diamond', rating:fixture.rating, playstyle:'Adversaire de championnat généré selon votre division', players:squad }; }
export function generateMarket(save:CareerSave): CareerPlayer[] { return Array.from({length:12},(_,i)=>{ const p=makePlayer(pick(CAREER_NATIONS),100+i, i===0?'GK':(['DEF','MIL','ATT'] as const)[i%3]); const boost=rand(4,18)+save.division*2; p.stats={tir:Math.min(95,p.stats.tir+boost),phy:Math.min(95,p.stats.phy+boost),ctr:Math.min(95,p.stats.ctr+boost)}; p.value=playerValue(p.stats,p.potential); return p; }); }
