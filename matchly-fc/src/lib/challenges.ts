export interface ChallengeProgress { day: string; matchesToday: number; winsToday: number; goalsToday: number; onlineMatches: number; onlineWins: number; specialWins: number; claimed: string[]; }
const KEY='matchly_fc27_challenges_v1';
const today=()=>new Date().toISOString().slice(0,10);
export function loadChallenges(): ChallengeProgress { try{ const raw=localStorage.getItem(KEY); if(raw){ const p=JSON.parse(raw) as ChallengeProgress; if(p.day!==today()) return {...p,day:today(),matchesToday:0,winsToday:0,goalsToday:0,claimed:p.claimed.filter(id=>!id.startsWith('daily-'))}; return p; } }catch{} return {day:today(),matchesToday:0,winsToday:0,goalsToday:0,onlineMatches:0,onlineWins:0,specialWins:0,claimed:[]}; }
export function saveChallenges(p:ChallengeProgress){ try{localStorage.setItem(KEY,JSON.stringify(p));}catch{} }
export function recordChallengeMatch(p:ChallengeProgress, online:boolean, won:boolean, goals:number): ChallengeProgress { const next={...p, day:today(), matchesToday:p.day===today()?p.matchesToday+1:1, winsToday:(p.day===today()?p.winsToday:0)+(won?1:0), goalsToday:(p.day===today()?p.goalsToday:0)+goals, onlineMatches:p.onlineMatches+(online?1:0), onlineWins:p.onlineWins+(online&&won?1:0), specialWins:p.specialWins+(won?1:0)}; saveChallenges(next); return next; }
export interface ChallengeDef { id:string; group:'Quotidien'|'En ligne'|'Spécial'; title:string; desc:string; current:(p:ChallengeProgress,totalWins:number,totalGoals:number)=>number; target:number; coins:number; trophies:number; unlockTeamId?:string; }
export const CHALLENGES: ChallengeDef[]=[
 {id:'daily-play3',group:'Quotidien',title:'Échauffement du jour',desc:'Jouer 3 matchs aujourd’hui.',current:p=>p.matchesToday,target:3,coins:90,trophies:15},
 {id:'daily-win2',group:'Quotidien',title:'Double victoire',desc:'Gagner 2 matchs aujourd’hui.',current:p=>p.winsToday,target:2,coins:140,trophies:25},
 {id:'daily-goals5',group:'Quotidien',title:'Attaque du jour',desc:'Marquer 5 buts aujourd’hui.',current:p=>p.goalsToday,target:5,coins:120,trophies:20},
 {id:'online-play3',group:'En ligne',title:'Soirée en ligne',desc:'Jouer 3 matchs en ligne.',current:p=>p.onlineMatches,target:3,coins:180,trophies:35},
 {id:'online-win2',group:'En ligne',title:'Roi du salon',desc:'Gagner 2 matchs en ligne.',current:p=>p.onlineWins,target:2,coins:260,trophies:55},
 {id:'special-wins10',group:'Spécial',title:'Série de champion',desc:'Atteindre 10 victoires dans votre progression spéciale.',current:p=>p.specialWins,target:10,coins:320,trophies:80},
 {id:'special-blue-lock',group:'Spécial',title:'Projet Blue Lock',desc:'Marquer 30 buts au total pour attirer le Blue Lock XI.',current:(_p,_w,g)=>g,target:30,coins:250,trophies:70,unlockTeamId:'blue-lock'},
];
