import React, { useState } from 'react';
import { EuroTeam } from '../data/teams';
import { sfx } from '../engine/audio';

interface Props { team: EuroTeam; lineup: number[]; onSave: (lineup:number[])=>void; onClose:()=>void; }
export const SquadManagerModal: React.FC<Props>=({team,lineup,onSave,onClose})=>{
 const [draft,setDraft]=useState<number[]>(lineup.length===5?lineup:[0,1,2,3,4]);
 const [selected,setSelected]=useState<number|null>(null);
 const swap=(playerIndex:number)=>{ if(selected===null){ setSelected(playerIndex); return; } const slot=draft.indexOf(selected); const targetSlot=draft.indexOf(playerIndex); if(slot>=0&&targetSlot>=0){ const next=[...draft]; next[slot]=playerIndex; next[targetSlot]=selected; setDraft(next);} else if(slot>=0){ const next=[...draft]; next[slot]=playerIndex; setDraft(next);} setSelected(null); sfx.uiClick(); };
 const starterSet=new Set(draft);
 return <div className="modal-backdrop" onClick={onClose}><div className="modal-card fc27-settings-modal squad-manager" onClick={e=>e.stopPropagation()}>
  <div className="modal-header"><div><span className="fc27-skew-tag"><span>CLASSEMENT DE L’ÉQUIPE</span></span><h2>{team.name} · 15 joueurs</h2><p>Choisissez vos 5 titulaires. Touchez un joueur sélectionné puis un autre joueur pour échanger leurs places.</p></div><button className="icon-close" onClick={onClose}>✕</button></div>
  <div className="squad-manager-grid">
   <section><h3>Titulaires (5)</h3>{draft.map((idx,slot)=>{ const p=team.players[idx]; return <button key={slot} type="button" className={`squad-row ${selected===idx?'active':''}`} onClick={()=>swap(idx)}><b>{slot===0?'GK':`Poste ${slot+1}`}</b><span>#{p.number} {p.name}</span><small>{p.role} · TIR {p.stats.tir} · PHY {p.stats.phy} · CTR {p.stats.ctr}</small></button>; })}</section>
   <section><h3>Banc ({team.players.length-5})</h3>{team.players.map((p,idx)=> starterSet.has(idx)?null:<button key={p.id} type="button" className={`squad-row ${selected===idx?'active':''}`} onClick={()=>swap(idx)}><b>Banc</b><span>#{p.number} {p.name}</span><small>{p.role} · TIR {p.stats.tir} · PHY {p.stats.phy} · CTR {p.stats.ctr}</small></button>)}</section>
  </div>
  <p className="subs-note">Le poste 1 doit rester un gardien. Pendant le match, vous aurez encore droit à 3 remplacements maximum.</p>
  <div className="unlock-modal-actions"><button type="button" className="fc27-ghost-btn" onClick={onClose}>Annuler</button><button type="button" className="fc27-volt-btn" onClick={()=>{ if(team.players[draft[0]]?.role!=='GK'){ alert('Le premier titulaire doit être un gardien.'); return;} onSave(draft); onClose(); }}>Valider le cinq de départ</button></div>
 </div></div>;
};
