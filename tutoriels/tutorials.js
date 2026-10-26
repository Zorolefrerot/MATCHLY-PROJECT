const canvas = document.querySelector('#tutorial-canvas');
const ctx = canvas.getContext('2d');
const list = document.querySelector('#topic-list');
const search = document.querySelector('#topic-search');
const titleEl = document.querySelector('#guide-title');
const summaryEl = document.querySelector('#guide-summary');
const stepsEl = document.querySelector('#guide-steps');
const statusEl = document.querySelector('#play-status');
const kickerEl = document.querySelector('#player-kicker');
const playButton = document.querySelector('#play');
const replayButton = document.querySelector('#replay');
const noteEl = document.querySelector('#guide-note');
const emptyEl = document.querySelector('#empty-state');

const guides = [
  {
    id:'add', icon:'＋', title:'Comment ajouter un article ?', short:'Nom, catégorie, photo, quantité et prix.', kind:'add',
    summary:'Ajoutez les articles que vous vendez, qu’il s’agisse de bijoux, de vêtements, d’accessoires, de chaussures, d’e-books ou de produits alimentaires.',
    steps:['Ouvrez « Marchandises & Stock », puis touchez « Ajouter une marchandise ».','Saisissez le nom et choisissez la catégorie. Les catégories proposées comprennent Bijoux, Accessoires, Vêtements, Chaussures, E-books et Alimentation.','Ajoutez une photo si vous le souhaitez, puis indiquez l’unité, la quantité, le prix d’achat et le prix de vente.','Enregistrez. L’article apparaît dans votre catalogue.'],
  },
  {
    id:'stock', icon:'▤', title:'Comment vérifier le stock ?', short:'Catalogue, quantités et seuil d’alerte.', kind:'stock',
    summary:'Le catalogue rassemble les articles et leurs quantités. Le seuil d’alerte sert de repère pour les produits à vérifier.',
    steps:['Ouvrez « Marchandises & Stock ».','Repérez l’article à l’aide de la recherche ou en parcourant le catalogue.','Vérifiez la quantité affichée et comparez-la au seuil d’alerte défini.','Touchez l’action de réapprovisionnement pour ajouter les unités reçues.'],
  },
  {
    id:'sale', icon:'◎', title:'Comment enregistrer une vente ?', short:'Sélectionner des articles et finaliser la caisse.', kind:'sale',
    summary:'Exemple pédagogique avec un collier et un bracelet : choisissez les articles du panier, vérifiez les quantités et validez la vente.',
    steps:['Ouvrez « Caisse » et sélectionnez les articles concernés.','Ajustez la quantité de chaque article dans le panier.','Choisissez le mode de paiement disponible, puis vérifiez le total calculé.','Validez la vente. Le stock et l’historique se mettent à jour dans l’application.'],
  },
  {
    id:'receipt', icon:'▧', title:'Comment obtenir le reçu ?', short:'Après la vente : aperçu, partage ou impression.', kind:'receipt',
    summary:'Le reçu se prépare à partir d’une vente enregistrée. Vous pouvez vérifier les informations avant de le partager ou de l’imprimer.',
    steps:['Validez la vente dans la caisse.','Ouvrez l’aperçu du reçu associé à la vente.','Vérifiez les articles, les quantités, les coordonnées facultatives et le mode de paiement.','Choisissez le partage disponible, par exemple WhatsApp, ou l’impression compatible.'],
  },
  {
    id:'ai', icon:'✦', title:'Comment utiliser l’assistant IA ?', short:'Poser une question sur l’aide ou ses données.', kind:'ai',
    summary:'L’assistant peut répondre à des questions générales et aider à lire les informations enregistrées. Les réponses en ligne demandent Internet et un service IA disponible.',
    steps:['Ouvrez « ShopFlow AI » depuis le menu de l’application.','Posez une question précise, par exemple : « Comment ajouter un article ? » ou « Fais le point sur les données enregistrées ».','Vérifiez la réponse avant d’agir : l’assistant ne remplace pas vos contrôles de caisse ou de stock.','Les réponses IA en ligne nécessitent une connexion; aucune promesse d’usage gratuit illimité n’est faite.'],
  },
  {
    id:'shop', icon:'⌂', title:'Comment créer ou modifier ma boutique ?', short:'La création se fait dans l’application, pas sur le site.', kind:'shop',
    summary:'La vitrine publique ne crée pas de boutique. Installez ou ouvrez ShopFlow, puis saisissez les informations de votre commerce dans le parcours de démarrage ou les paramètres.',
    steps:['Installez ShopFlow sur Android ou ouvrez la web app séparée à l’adresse « /app/ ».','Au premier démarrage, suivez l’inscription dans l’application et renseignez le nom de la boutique et les informations demandées.','Pour modifier les coordonnées ou l’apparence, ouvrez « Paramètres » dans l’application.','Les données restent locales à chaque appareil : exportez une sauvegarde avant de changer de téléphone.'],
  },
  {
    id:'subscription', icon:'◇', title:'Comment consulter l’abonnement ?', short:'Ouvrir la rubrique Abonnement dans l’application.', kind:'subscription',
    summary:'Les formules et moyens de paiement doivent être confirmés avant une publication commerciale. Cette maquette n’effectue aucun paiement.',
    steps:['Dans l’application, ouvrez la rubrique « Abonnement ».','Lisez le nom de la formule, son prix, sa période et les avantages affichés avant de choisir.','Ne saisissez pas de numéro de carte, de code secret ou de PIN dans cette animation.','Le paiement réel et le verrouillage après l’essai ne sont pas démontrés par cette maquette.'],
    note:'À confirmer avant publication : prix définitifs, avantages de chaque formule, fournisseur de paiement et règle d’expiration de l’essai. Aucun paiement n’est traité ici.',
  },
  {
    id:'backup', icon:'↧', title:'Comment sauvegarder mes données ?', short:'Exporter une copie avant de changer d’appareil.', kind:'backup',
    summary:'Les données sont conservées sur l’appareil et ne se synchronisent pas automatiquement entre Android et iPhone.',
    steps:['Ouvrez « Paramètres » dans ShopFlow.','Choisissez l’option d’export ou de sauvegarde disponible.','Enregistrez le fichier dans un endroit sûr auquel vous pourrez accéder.','Sur un nouvel appareil, utilisez l’option d’import si elle est disponible et vérifiez les données restaurées.'],
  },
];

let selected = guides[0];
let playing = false;
let startAt = 0;
let raf = 0;
const duration = 11;

function drawText(text,x,y,size,color,weight=600,align='left',maxWidth) {
  ctx.font=`${weight} ${size}px Inter,system-ui,sans-serif`; ctx.fillStyle=color; ctx.textAlign=align; ctx.textBaseline='alphabetic';
  if(maxWidth) ctx.fillText(text,x,y,maxWidth); else ctx.fillText(text,x,y);
}
function rounded(x,y,w,h,r,fill,stroke) {
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function wrap(text,x,y,w,lineH,size,color,weight=500) {
  ctx.font=`${weight} ${size}px Inter,system-ui,sans-serif`;ctx.fillStyle=color;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  let line='',row=0;
  for(const word of text.split(' ')){
    const next=line?`${line} ${word}`:word;
    if(ctx.measureText(next).width>w&&line){ctx.fillText(line,x,y+row*lineH);line=word;row++;}else line=next;
  }
  if(line)ctx.fillText(line,x,y+row*lineH);
}
function ease(t){const x=Math.max(0,Math.min(1,t));return 1-Math.pow(1-x,3);}

function drawPhone(time) {
  const enter=ease(time/.6),x=130,y=185,w=460,h=940;
  ctx.save();ctx.globalAlpha=.55+.45*enter;ctx.translate((1-enter)*80,0);
  ctx.shadowColor='#0008';ctx.shadowBlur=28;ctx.shadowOffsetY=12;
  rounded(x,y,w,h,54,'#111923','#526579');ctx.shadowColor='transparent';
  rounded(x+15,y+15,w-30,h-30,42,'#f8fafc');
  rounded(x+w/2-55,y+22,110,14,8,'#1d2935');
  const sx=x+32,sy=y+62,sw=w-64;
  drawText('9:41',sx+2,sy+17,14,'#243447',800);drawText('●●●  ▰',sx+sw-2,sy+17,13,'#243447',700,'right');
  rounded(sx,sy+32,sw,65,18,'#ffffff','#e5ebf0');
  drawText('ShopFlow',sx+20,sy+73,22,'#142e47',850);drawText('•••',sx+sw-25,sy+72,20,'#51718b',800,'center');
  drawText('Tutoriel',sx+4,sy+137,15,'#75889b',650);
  drawText(selected.kind==='add'?'Ajouter un article':selected.kind==='stock'?'Catalogue & stock':selected.kind==='sale'?'Nouvelle vente':selected.kind==='receipt'?'Aperçu du reçu':selected.kind==='ai'?'ShopFlow AI':selected.kind==='shop'?'Ma boutique':selected.kind==='subscription'?'Abonnement':'Sauvegarde',sx+4,sy+177,24,'#18324b',850);
  drawTutorialScreen(sx,sy+210,sw, time);
  ctx.restore();
  // Cursor / touch ripple is scripted; it never interacts with the actual PWA.
  const p=(time%duration)/duration;
  const targets=[[423,470],[440,590],[480,720],[410,890]];
  const segment=p*targets.length,i=Math.min(targets.length-1,Math.floor(segment)),q=ease(segment-i);
  const ax=targets[i][0],ay=targets[i][1],bx=targets[Math.min(i+1,targets.length-1)][0],by=targets[Math.min(i+1,targets.length-1)][1];
  const cx=ax+(bx-ax)*q,cy=ay+(by-ay)*q;
  ctx.save();ctx.globalAlpha=.9;ctx.fillStyle='#1a75d2';ctx.beginPath();ctx.arc(cx,cy,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,22+Math.sin(time*7)*3,0,Math.PI*2);ctx.stroke();ctx.restore();
}

function drawTutorialScreen(x,y,w,time) {
  const phase=ease(time/3.4);
  if(selected.kind==='add'){
    rounded(x,y,w,430,22,'#ffffff','#e7edf2');
    const fields=[['Nom de l’article','Boucles d’oreilles'],['Catégorie','Bijoux'],['Unité','Paire'],['Quantité','12'],['Prix d’achat','À saisir'],['Prix de vente','À saisir']];
    fields.forEach((field,i)=>{
      const yy=y+28+i*60;
      drawText(field[0],x+22,yy+10,13,'#78899a',650);
      rounded(x+18,yy+18,w-36,37,10,'#f7f9fb',i===Math.min(5,Math.floor(time/1.4))?'#1776c6':'#e8edf2');
      drawText(field[1],x+32,yy+43,16,i===1?'#167856':'#263e54',i===1?800:600);
    });
    const done=ease((time-7)/1.4);
    rounded(x+20,y+390,w-40,51,14,'#126fd0');drawText(done>.7?'ARTICLE AJOUTÉ':'ENREGISTRER L’ARTICLE',x+w/2,y+422,15,'#fff',850,'center');
  } else if(selected.kind==='stock') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    const rows=[['Collier doré','Bijoux','En stock',.74],['Sac à main','Accessoires','À vérifier',.25],['E-book pratique','E-books','Disponible',.86],['Chemise','Vêtements','En stock',.56]];
    rows.forEach((r,i)=>{
      const yy=y+20+i*98;rounded(x+15,yy,w-30,82,14,'#fff','#e6edf2');
      rounded(x+28,yy+17,46,46,13,i===1?'#fff1dd':'#e9f4ff');
      drawText(i===0?'✦':i===1?'◈':i===2?'▤':'◌',x+51,yy+48,20,i===1?'#c7802c':'#357aac',850,'center');
      drawText(r[0],x+88,yy+34,16,'#20394f',800);drawText(r[1]+' · '+r[2],x+88,yy+57,13,i===1?'#b87928':'#75899c',650);
      rounded(x+28,yy+68,w-56,6,3,'#e8eff2');rounded(x+28,yy+68,(w-56)*r[3],6,3,i===1?'#efa540':'#32a77a');
    });
    if(time>5){rounded(x+20,y+414,w-40,55,13,'#fff4de');drawText('Seuil à vérifier',x+w/2,y+448,15,'#a66b1d',800,'center');}
  } else if(selected.kind==='sale'||selected.kind==='receipt') {
    rounded(x,y,w,455,22,'#ffffff','#e7edf2');
    drawText(selected.kind==='receipt'?'Vente enregistrée':'Choisissez les articles',x+22,y+35,17,'#18324b',800);
    [['Collier artisanal','Bijoux'],['Bracelet perlé','Bijoux'],['Sac à main','Accessoires']].forEach((r,i)=>{
      const yy=y+54+i*78;rounded(x+15,yy,w-30,65,13,'#fff','#e6edf2');
      rounded(x+27,yy+12,41,41,12,['#fff1d8','#e9f7f0','#f0eaff'][i]);drawText('✦',x+47,yy+39,18,['#b78128','#22846c','#7654b0'][i],850,'center');
      drawText(r[0],x+82,yy+29,15,'#223a50',800);drawText(r[1],x+82,yy+49,12,'#8393a1',600);
      drawText(time>2+i*.45?'✓':'+',x+w-39,yy+39,20,time>2+i*.45?'#21815d':'#126fd0',900,'center');
    });
    rounded(x+17,y+305,w-34,72,15,'#edf5fc');drawText('Panier · total calculé par l’application',x+34,y+334,14,'#466780',700);drawText('Vérifier avant validation',x+34,y+358,13,'#18344d',750);
    rounded(x+20,y+389,w-40,51,14,'#126fd0');drawText(selected.kind==='receipt'?'OUVRIR LE REÇU':'VALIDER LA VENTE',x+w/2,y+421,15,'#fff',850,'center');
    if(time>7){rounded(x+65,y+455,w-130,62,15,'#eaf8f0','#bcdfc8');drawText('Reçu prêt · aperçu à vérifier',x+w/2,y+493,14,'#20724f',800,'center');}
  } else if(selected.kind==='ai') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    rounded(x+15,y+18,w-30,83,17,'#eaf3ff');drawText('Vous',x+32,y+44,13,'#2471b2',850);wrap('Aide-moi à faire le point sur mon activité.',x+32,y+69,w-70,20,15,'#1e3449',650);
    const reply=ease((time-2)/2);
    if(reply>.03){rounded(x+15,y+121,w-30,170,17,'#f1f8f4');drawText('ShopFlow AI',x+32,y+150,13,'#20805a',850);wrap('Je peux résumer les informations que vous avez enregistrées. Vérifiez les données avant toute décision.',x+32,y+180,w-70,24,15,'#263f52',600);}
    rounded(x+15,y+316,w-30,62,15,'#f7f9fb','#e5ebf0');drawText('Écrivez votre question…',x+34,y+354,14,'#8594a2',600);
    drawPillSmall('Connexion requise pour les réponses IA en ligne',x+15,y+393,w-30,40,'#fff5df','#93661e');
  } else if(selected.kind==='shop') {
    rounded(x,y,w,460,22,'#ffffff','#e7edf2');
    drawText(time<4?'Créer ma boutique':'Modifier les informations',x+22,y+38,18,'#18324b',850);
    const fields=[['Nom de la boutique','Ma Boutique'],['Nom du propriétaire','À saisir'],['Ville','À choisir'],['WhatsApp','À saisir']];
    fields.forEach((f,i)=>{const yy=y+59+i*78;drawText(f[0],x+22,yy+9,13,'#78899a',650);rounded(x+18,yy+18,w-36,46,12,'#f8fafb','#e9edf1');drawText(f[1],x+33,yy+47,15,'#2b4258',650);});
    rounded(x+20,y+383,w-40,53,14,'#126fd0');drawText('ENREGISTRER DANS L’APPLICATION',x+w/2,y+416,13,'#fff',850,'center');
  } else if(selected.kind==='subscription') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    drawText('Formules disponibles',x+22,y+38,18,'#18324b',850);
    [['Starter','Pour les besoins essentiels'],['Pro IA','Pour les fonctions avancées'],['Business','Pour une équipe / activité élargie']].forEach((p,i)=>{
      const yy=y+58+i*83;rounded(x+16,yy,w-32,70,14,'#f8fafc',i===1?'#5594cf':'#e4eaf0');
      drawText(p[0],x+34,yy+28,16,'#223b51',850);drawText(p[1],x+34,yy+51,13,'#718395',550);drawText('›',x+w-40,yy+42,22,'#2474b9',800,'center');
    });
    drawPillSmall('Vérifier tarifs et paiement dans l’application',x+15,y+327,w-30,44,'#fff3dc','#95651d');
  } else {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    drawText('Sauvegarde des données',x+22,y+39,18,'#18324b',850);
    wrap('Vos informations sont enregistrées localement sur cet appareil.',x+22,y+85,w-44,24,15,'#6c7f91',600);
    rounded(x+22,y+150,w-44,115,18,'#edf5fc');drawText('Paramètres',x+44,y+187,16,'#506f89',700);drawText('Exporter une sauvegarde',x+44,y+225,19,'#1d405d',800);
    rounded(x+22,y+286,w-44,55,15,'#126fd0');drawText('EXPORTER LE FICHIER',x+w/2,y+321,15,'#fff',850,'center');
    drawText('À conserver avant de changer de téléphone.',x+22,y+378,14,'#7c8e9f',600);
  }
}

function drawPillSmall(text,x,y,w,h,bg,fg){rounded(x,y,w,h,h/2,bg);drawText(text,x+w/2,y+h*.64,12,fg,800,'center',w-20);}

function drawFrame(t=0){
  ctx.fillStyle='#f2f7fa';ctx.fillRect(0,0,720,1280);
  const g=ctx.createLinearGradient(0,0,720,1280);g.addColorStop(0,'#071827');g.addColorStop(1,'#123653');ctx.fillStyle=g;ctx.fillRect(0,0,720,1280);
  ctx.globalAlpha=.16;ctx.fillStyle='#67deb0';ctx.beginPath();ctx.arc(630,165,230,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  drawText('SHOPFLOW · GUIDE VISUEL',42,70,16,'#81e1b4',900);
  wrap(selected.title,42,125,620,39,31,'#f8fbff',850);
  drawText('ÉTAPES SIMULÉES · AUCUNE ACTION RÉELLE',42,166,12,'#9eb5c7',700);
  drawPhone(t);
  const p=Math.min(1,t/duration);rounded(42,1168,636,4,2,'#27435a');rounded(42,1168,636*p,4,2,'#70dca9');
  drawText(selected.kind==='subscription'?'Maquette informative · paiement non effectué':'Tutoriel illustratif · aucun article réel',360,1215,14,'#a8bdcd',650,'center');
}

function stop() { playing=false; cancelAnimationFrame(raf); playButton.textContent='▶ Relancer le guide'; }
function frame(now) {
  if(!playing)return;
  const t=(now-startAt)/1000;
  drawFrame(Math.min(t,duration));
  if(t>=duration){stop();statusEl.textContent='Tutoriel terminé. Les étapes écrites restent visibles ci-dessous.';return;}
  raf=requestAnimationFrame(frame);
}
function play() { stop(); playing=true; startAt=performance.now(); statusEl.textContent='Lecture du tutoriel…'; playButton.textContent='● Lecture…'; raf=requestAnimationFrame(frame); }
function selectGuide(guide) {
  selected=guide;
  document.querySelectorAll('.topic').forEach((button)=>button.setAttribute('aria-current',String(button.dataset.id===guide.id)));
  kickerEl.textContent=guide.kind==='subscription'?'INFORMATION ABONNEMENT':'TUTORIEL SHOPFLOW';
  titleEl.textContent=guide.title;summaryEl.textContent=guide.summary;
  stepsEl.replaceChildren(...guide.steps.map((step)=>{const li=document.createElement('li');li.textContent=step;return li;}));
  noteEl.textContent=guide.note||'Les gestes à l’écran sont simulés pour expliquer le parcours. Ils ne modifient pas la boutique et ne traitent aucun paiement.';
  statusEl.textContent='Tutoriel prêt. Lancez l’animation ou relisez les étapes.';
  drawFrame(0);play();
}
function paintList(filter='') {
  const q=filter.trim().toLocaleLowerCase('fr');
  const visible=guides.filter((g)=>`${g.title} ${g.short} ${g.summary}`.toLocaleLowerCase('fr').includes(q));
  list.replaceChildren(...visible.map((g)=>{
    const button=document.createElement('button');button.type='button';button.className='topic';button.dataset.id=g.id;button.setAttribute('role','listitem');button.setAttribute('aria-current',String(g.id===selected.id));
    const icon=document.createElement('span');icon.className='topic-icon';icon.textContent=g.icon;
    const text=document.createElement('span');const b=document.createElement('b');b.textContent=g.title;const small=document.createElement('small');small.textContent=g.short;text.append(b,small);
    const arrow=document.createElement('span');arrow.className='topic-arrow';arrow.textContent='→';button.append(icon,text,arrow);button.addEventListener('click',()=>selectGuide(g));return button;
  }));
  emptyEl.style.display=visible.length?'none':'block';
}

search.addEventListener('input',()=>paintList(search.value));
playButton.addEventListener('click',play);replayButton.addEventListener('click',play);
paintList();drawFrame(0);selectGuide(guides[0]);
