import React, { useMemo, useState } from 'react';
import { CAREER_DIVISIONS, CareerSave, CAPTAIN_OPTIONS, careerOpponent, careerToTeam, createCareer, generateMarket, playerValue } from '../lib/career';
import { SquadManagerModal } from './SquadManagerModal';
import { sfx } from '../engine/audio';

interface Props {
  save: CareerSave | null;
  coins: number;
  lineup: number[];
  onSave: (save: CareerSave | null) => void;
  onLineupChange: (lineup:number[])=>void;
  onSpendCoins: (amount:number)=>boolean;
  onEarnCoins: (amount:number)=>void;
  onPlay: (save: CareerSave, fixtureIndex:number)=>void;
}
export const CareerView: React.FC<Props>=({save,coins,lineup,onSave,onLineupChange,onSpendCoins,onEarnCoins,onPlay})=>{
 const [clubName,setClubName]=useState(''); const [coachName,setCoachName]=useState(''); const [captain,setCaptain]=useState(CAPTAIN_OPTIONS[0].name); const [logoUrl,setLogoUrl]=useState('');
 const [market,setMarket]=useState(()=> save?generateMarket(save):[]); const [showSquad,setShowSquad]=useState(false);
 const team=useMemo(()=>save?careerToTeam(save):null,[save]);
 const nextFixture=save?.fixtures.findIndex(f=>!f.played) ?? -1;
 const handleLogo=(file:File|undefined)=>{ if(!file)return; const reader=new FileReader(); reader.onload=()=>{ const img=new Image(); img.onload=()=>{ const canvas=document.createElement('canvas'); canvas.width=canvas.height=256; const ctx=canvas.getContext('2d'); if(ctx){ ctx.drawImage(img,0,0,256,256); setLogoUrl(canvas.toDataURL('image/png')); } }; img.src=String(reader.result); }; reader.readAsDataURL(file); };
 if(!save){ return <section className="career-shell"><div className="career-hero"><img src="/brand/matchly-fc27-logo-512.png" alt="Matchly FC 27"/><div><span className="fc27-skew-tag"><span>MODE CARRIÈRE</span></span><h2>Créez votre club et partez de la Division 3</h2><p>Logo importé, coach, capitaine star et 14 jeunes talents aléatoires venus d’Arabie Saoudite, RDC, Croatie, Slovénie, États-Unis, Japon et d’autres nations. Chaque carrière est différente.</p></div></div>
 <div className="career-form card-panel"><label>Nom du club<input value={clubName} onChange={e=>setClubName(e.target.value)} placeholder="Ex : Kinshasa City FC"/></label><label>Nom du coach<input value={coachName} onChange={e=>setCoachName(e.target.value)} placeholder="Votre nom de coach"/></label><label>Logo du club<input type="file" accept="image/*" onChange={e=>handleLogo(e.target.files?.[0])}/></label>{logoUrl&&<img className="career-logo-preview" src={logoUrl} alt="Logo importé"/>}
 <h3>Choisissez votre capitaine star</h3><div className="captain-grid">{CAPTAIN_OPTIONS.map(c=><button key={c.name} type="button" className={captain===c.name?'active':''} onClick={()=>setCaptain(c.name)}><strong>{c.name}</strong><span>{c.nation} · {c.role}</span><small>TIR {c.stats.tir} · PHY {c.stats.phy} · CTR {c.stats.ctr}</small></button>)}</div>
 <button type="button" className="fc27-volt-btn full-w" disabled={clubName.trim().length<2||coachName.trim().length<2} onClick={()=>{ const created=createCareer(clubName.trim(),coachName.trim(),logoUrl,captain); onSave(created); setMarket(generateMarket(created)); sfx.fanfare(); }}>Créer mon club et tirer mon effectif aléatoire</button></div></section>; }
 return <section className="career-shell">
  <div className="career-hero compact-hero">{save.logoUrl?<img src={save.logoUrl} alt="Logo du club"/>:<img src="/brand/matchly-fc27-logo-512.png" alt="Matchly FC 27"/>}<div><span className="fc27-skew-tag"><span>{CAREER_DIVISIONS[save.division]} · SAISON {save.season}</span></span><h2>{save.clubName}</h2><p>Coach {save.coachName} · Capitaine {save.captainName} · Budget {coins} Crédits FC</p><small>{save.message}</small></div><button type="button" className="fc27-ghost-btn" onClick={()=>setShowSquad(true)}>Cinq de départ</button></div>
  <div className="career-grid">
   <article className="card-panel"><h3>Championnat · {CAREER_DIVISIONS[save.division]}</h3><div className="career-table">{save.table.slice().sort((a,b)=>b.points-a.points|| (b.gf-b.ga)-(a.gf-a.ga)).map((r,i)=><div key={r.name} className={r.name===save.clubName?'me':''}><span>{i+1}. {r.name}</span><small>{r.played} MJ · {r.wins}V {r.losses}D · {r.gf}-{r.ga}</small><b>{r.points} pts</b></div>)}</div>
   {nextFixture>=0?<button type="button" className="fc27-volt-btn full-w" onClick={()=>onPlay(save,nextFixture)}>Jouer : {save.clubName} vs {save.fixtures[nextFixture].opponent}</button>:<p className="subs-note">Saison terminée : classement et promotion sont calculés automatiquement après le dernier match.</p>}
   <div className="fixture-list">{save.fixtures.map((f,i)=><span key={i} className={f.played?'done':''}>{f.played?`✓ ${f.result}`:`J${i+1} · ${f.opponent} (OVR ${f.rating})`}</span>)}</div></article>
   <article className="card-panel"><h3>Effectif carrière (15 max)</h3><div className="career-player-list">{save.squad.map((p,i)=><div key={p.id}><span>#{p.number} {p.name}</span><small>{p.nation} · {p.role} · TIR {p.stats.tir} PHY {p.stats.phy} CTR {p.stats.ctr} · Potentiel +{p.potential}</small><div><button type="button" onClick={()=>{ const cost=90+p.stats.tir; if(!onSpendCoins(cost))return; const squad=save.squad.map(x=>x.id===p.id?{...x,stats:{tir:Math.min(97,x.stats.tir+1),phy:Math.min(97,x.stats.phy+1),ctr:Math.min(97,x.stats.ctr+1)},value:playerValue({...x.stats,tir:x.stats.tir+1},x.potential)}:x); onSave({...save,squad,message:`${p.name} progresse après l’entraînement.`}); }}>Entraîner ({90+p.stats.tir} 🪙)</button><button type="button" disabled={p.name===save.captainName||save.squad.length<=11} onClick={()=>{ onEarnCoins(p.value); onSave({...save,squad:save.squad.filter(x=>x.id!==p.id),message:`${p.name} vendu pour ${p.value} crédits.`}); }}>Vendre {p.value} 🪙</button></div></div>)}</div></article>
   <article className="card-panel"><h3>Marché des transferts</h3><button type="button" className="fc27-ghost-btn" onClick={()=>setMarket(generateMarket(save))}>Actualiser le marché</button><div className="career-player-list">{market.map(p=><div key={p.id}><span>{p.name}</span><small>{p.nation} · {p.role} · TIR {p.stats.tir} PHY {p.stats.phy} CTR {p.stats.ctr}</small><button type="button" disabled={save.squad.length>=15} onClick={()=>{ if(!onSpendCoins(p.value))return; onSave({...save,squad:[...save.squad,p],message:`${p.name} rejoint ${save.clubName}.`}); setMarket(market.filter(x=>x.id!==p.id)); }}>Acheter {p.value} 🪙</button></div>)}</div><p className="subs-note">Vous pouvez acheter, faire évoluer puis revendre vos joueurs. Effectif limité à 15.</p><button type="button" className="danger-subtle fc27-ghost-btn" onClick={()=>{ if(confirm('Supprimer cette carrière ?')) onSave(null); }}>Réinitialiser la carrière</button></article>
  </div>
  {showSquad&&team&&<SquadManagerModal team={team} lineup={lineup} onSave={onLineupChange} onClose={()=>setShowSquad(false)}/>}
 </section>;
};
