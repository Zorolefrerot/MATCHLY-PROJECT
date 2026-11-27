import React from 'react';
import { CHALLENGES, ChallengeDef, ChallengeProgress } from '../lib/challenges';
import { PlayerProfile } from '../lib/supabase';
import { sfx } from '../engine/audio';

interface Props { profile: PlayerProfile; progress: ChallengeProgress; onClaim:(c:ChallengeDef)=>void; onClose:()=>void; }
export const ChallengesModal: React.FC<Props>=({profile,progress,onClaim,onClose})=> <div className="modal-backdrop" onClick={onClose}><div className="modal-card fc27-settings-modal" onClick={e=>e.stopPropagation()}>
 <div className="modal-header"><div><span className="fc27-skew-tag"><span>DÉFIS FC 27</span></span><h2>Défis quotidiens, en ligne & spéciaux</h2><p>Débloquez des pièces, trophées et le Blue Lock XI.</p></div><button className="icon-close" onClick={onClose}>✕</button></div>
 <div className="objectives-list">{CHALLENGES.map(c=>{ const val=c.current(progress,profile.wins,profile.goals_for); const done=val>=c.target; const claimed=progress.claimed.includes(c.id); return <article key={c.id} className="objective-main"><div className="objective-head"><span className="obj-cat">{c.group}</span><strong>{c.title}</strong><p>{c.desc}</p><div className="obj-prog-row"><div className="obj-prog-track"><i style={{width:`${Math.min(100,val/c.target*100)}%`}}/></div><span>{Math.min(val,c.target)}/{c.target}</span></div><div className="obj-rewards"><span>🪙 +{c.coins}</span><span>🏆 +{c.trophies}</span>{c.unlockTeamId&&<span>🔓 Blue Lock XI</span>}</div></div><div className="objective-side">{claimed?<span className="obj-done-pill">Réclamé</span>:<button type="button" className="fc27-volt-btn compact" disabled={!done} onClick={()=>{sfx.fanfare();onClaim(c);}}>{done?'Réclamer':'En cours'}</button>}</div></article>;})}</div>
</div></div>;
