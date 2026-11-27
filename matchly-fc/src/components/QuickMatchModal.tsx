import React, { useMemo, useState } from 'react';
import { BOT_DIFFICULTIES, BotDifficulty, EURO_TEAMS, FORMATIONS, FormationId, getTeamById, TEAM_COUNTS } from '../data/teams';
import { TeamCrest } from './TeamCrest';
import { SquadManagerModal } from './SquadManagerModal';
import { sfx } from '../engine/audio';

interface QuickMatchModalProps {
  myTeamId: string;
  myFormation: FormationId;
  unlockedTeams: string[];
  lineups?: Record<string, number[]>;
  onLineupChange?: (teamId:string, lineup:number[])=>void;
  onStartQuickMatch: (config: { myTeamId: string; myFormation: FormationId; aiTeamId: string; botDifficulty: BotDifficulty; targetGoals: number; lineup:number[] }) => void;
  onClose: () => void;
}

export const QuickMatchModal: React.FC<QuickMatchModalProps> = ({ myTeamId, myFormation, unlockedTeams, lineups={}, onLineupChange, onStartQuickMatch, onClose }) => {
  const [selectedMyTeam, setSelectedMyTeam] = useState(myTeamId);
  const [selectedFormation, setSelectedFormation] = useState<FormationId>(myFormation);
  const [aiTeamId, setAiTeamId] = useState(myTeamId === 'rma' ? 'bar' : 'rma');
  const [difficulty, setDifficulty] = useState<BotDifficulty>('pro');
  const [targetGoals, setTargetGoals] = useState(3);
  const [category, setCategory] = useState<'club'|'nation'|'special'>('club');
  const [search, setSearch] = useState('');
  const [showSquad, setShowSquad] = useState(false);
  const myTeam = getTeamById(selectedMyTeam); const aiTeam = getTeamById(aiTeamId);
  const lineup = lineups[selectedMyTeam] || [0,1,2,3,4];
  const visibleTeams = useMemo(()=>EURO_TEAMS.filter(t=>t.category===category && (t.name.toLowerCase().includes(search.toLowerCase())||t.code.toLowerCase().includes(search.toLowerCase()))),[category,search]);
  const renderStrip=(teams:typeof EURO_TEAMS, selected:string, setter:(id:string)=>void, onlyUnlocked=false)=> <div className="qm-team-strip">{teams.filter(t=>!onlyUnlocked||unlockedTeams.includes(t.id)).map(t=>{ const locked=onlyUnlocked?false:!unlockedTeams.includes(t.id); return <button key={t.id} type="button" className={selected===t.id?'active':''} onClick={()=>{sfx.uiClick();setter(t.id);}}><TeamCrest team={t} size={24}/><span>{t.code}</span>{locked&&<small>🔒 {t.unlockTrophies}🏆</small>}</button>;})}</div>;

  return <div className="modal-backdrop" onClick={onClose}><div className="modal-card fc27-settings-modal quick-match-modal" onClick={e=>e.stopPropagation()}>
    <div className="modal-header"><div><span className="fc27-skew-tag"><span>MODE NORMAL · COUP D’ENVOI</span></span><h2>Match amical</h2><p>{TEAM_COUNTS.clubs} clubs · {TEAM_COUNTS.nations} sélections · Blue Lock XI · 15 joueurs par équipe</p></div><button className="icon-close" onClick={onClose}>✕</button></div>
    <div className="quick-match-versus"><div className="qm-side"><TeamCrest team={myTeam} size={56}/><strong>{myTeam.shortName}</strong><span>OVR {myTeam.rating} · Vous</span></div><div className="qm-vs-badge">VS</div><div className="qm-side"><TeamCrest team={aiTeam} size={56}/><strong>{aiTeam.shortName}</strong><span>OVR {aiTeam.rating} · Bot</span></div></div>
    <div className="fc27-tabs-bar"><button type="button" className={category==='club'?'active':''} onClick={()=>setCategory('club')}>Clubs ({TEAM_COUNTS.clubs})</button><button type="button" className={category==='nation'?'active':''} onClick={()=>setCategory('nation')}>Sélections ({TEAM_COUNTS.nations})</button><button type="button" className={category==='special'?'active':''} onClick={()=>setCategory('special')}>Spécial</button><input className="team-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une équipe…"/></div>
    <div className="setting-block"><strong>Votre équipe débloquée</strong>{renderStrip(visibleTeams,selectedMyTeam,setSelectedMyTeam,true)}{!visibleTeams.some(t=>unlockedTeams.includes(t.id))&&<p className="subs-note">Aucune équipe débloquée dans ce filtre pour le moment : gagnez des défis, coupes et championnats.</p>}<button type="button" className="fc27-ghost-btn" onClick={()=>setShowSquad(true)}>Choisir titulaires & banc (5 + 10)</button></div>
    <div className="setting-block"><strong>Adversaire : toutes les équipes existantes</strong>{renderStrip(visibleTeams,aiTeamId,setAiTeamId)}</div>
    <div className="setting-block"><strong>Niveau du bot · 4 niveaux</strong><div className="seg-choice-grid four">{BOT_DIFFICULTIES.map(d=><button key={d.id} type="button" className={difficulty===d.id?'active':''} onClick={()=>setDifficulty(d.id)}><b>{d.label}</b><small>{d.detail}</small></button>)}</div></div>
    <div className="seg-choice-grid two"><select className="fc27-select" value={selectedFormation} onChange={e=>setSelectedFormation(e.target.value as FormationId)}>{Object.values(FORMATIONS).map(f=><option key={f.id} value={f.id}>Formation {f.name}</option>)}</select><select className="fc27-select" value={targetGoals} onChange={e=>setTargetGoals(Number(e.target.value))}><option value={2}>Premier à 2 buts</option><option value={3}>Premier à 3 buts</option><option value={5}>Premier à 5 buts</option></select></div>
    <button type="button" className="fc27-volt-btn full-w" onClick={()=>{sfx.uiClick();onStartQuickMatch({myTeamId:selectedMyTeam,myFormation:selectedFormation,aiTeamId,botDifficulty:difficulty,targetGoals,lineup});}}>Coup d’envoi immédiat</button>
    {showSquad&&<SquadManagerModal team={myTeam} lineup={lineup} onSave={next=>onLineupChange?.(selectedMyTeam,next)} onClose={()=>setShowSquad(false)}/>}
  </div></div>;
};
