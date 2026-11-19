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
    summary:'Ajoutez au catalogue les articles vendus par votre boutique. Cette animation utilise uniquement des exemples fictifs.',
    steps:['Ouvrez « Marchandises & Stock », puis « Ajouter une marchandise ».','Saisissez le nom et la catégorie de l’article.','Ajoutez une photo si vous le souhaitez, puis indiquez l’unité, la quantité, le prix d’achat, le prix de vente et le seuil d’alerte.','La maquette s’arrête avant l’enregistrement : aucun article n’est créé par ce tutoriel.'],
  },
  {
    id:'stock', icon:'▤', title:'Comment consulter le stock ?', short:'Recherche, quantités et actions d’article.', kind:'stock',
    summary:'La page « Mes Marchandises & Stock » permet de rechercher les articles, consulter leurs quantités et ouvrir leurs actions.',
    steps:['Ouvrez « Mes Marchandises & Stock ».','Recherchez un article ou parcourez le tableau et les cartes.','Vérifiez la quantité et le seuil d’alerte défini pour cet article.','« + Stock » ouvre la saisie d’un arrivage; cette démonstration ne modifie pas le stock.'],
  },
  {
    id:'sale', icon:'◎', title:'Comment préparer un ticket ?', short:'Articles, paiement et choix des frais de livraison.', kind:'sale',
    summary:'Parcourez le vrai parcours de caisse en mode illustratif : la démonstration s’arrête avant la confirmation et ne crée jamais de vente.',
    steps:['Ouvrez « Caisse & Vente Rapide » et ajoutez un article au ticket avec « Facture + ».','Ajustez les quantités dans le ticket et choisissez le mode de paiement à titre d’exemple.','Choisissez « Sans frais » ou « Avec frais » de livraison; le montant ajouté dépend de la saisie du vendeur.','Vérifiez le total et la monnaie à rendre. Le tutoriel s’arrête avant toute validation : aucune vente n’est enregistrée.'],
  },
  {
    id:'receipt', icon:'▧', title:'Comment vérifier un reçu ?', short:'Aperçu, Image PNG, impression et WhatsApp.', kind:'receipt',
    summary:'Le reçu comporte un aperçu et les formats proposés dans l’application. Les exemples et actions montrés ici restent simulés.',
    steps:['Consultez l’aperçu schématique du reçu et relisez les articles, le total et les frais éventuels.','Au besoin, ouvrez « Infos client / livraison » pour vérifier les champs facultatifs.','Les options proposées sont « Image PNG », « Imprimer » et « Envoyer sur WhatsApp ».','Cette maquette ne télécharge aucun fichier, n’ouvre pas WhatsApp et n’envoie aucun message.'],
  },
  {
    id:'credits', icon:'◷', title:'Comment consulter le carnet des crédits ?', short:'Soldes restants, avances notées et rappels.', kind:'credits',
    summary:'Le carnet suit les crédits et les avances saisies par le commerçant. ShopFlow ne reçoit ni ne traite l’argent d’une avance.',
    steps:['Ouvrez « Carnet Bon / Crédit Clients » depuis « Plus ».','Consultez le montant restant et les avances déjà enregistrées.','« Encaisser avance » sert à noter une avance reçue hors de l’application; le tutoriel ne crée pas de paiement.','« Rappel WhatsApp » prépare un message à vérifier. Aucun message n’est envoyé par cette animation.'],
  },
  {
    id:'currency', icon:'¤', title:'Comment changer rapidement de devise ?', short:'Passer de FC à USD depuis l’en-tête.', kind:'currency',
    summary:'Le bouton de devise dans l’en-tête de gestion bascule l’affichage sans passer par Paramètres.',
    steps:['Repérez le bouton FC / USD près du nom ShopFlow.','Touchez-le pour afficher les montants dans l’autre devise.','Le taux initial est de 2 400 FC pour 1 USD; un taux personnalisé de la boutique peut être conservé.','Cette bascule ne lance ni ne modifie aucun paiement.'],
  },
  {
    id:'ai', icon:'✦', title:'Comment poser une question à ShopFlow AI ?', short:'Question, réponse et vérification.', kind:'ai',
    summary:'Les réponses en ligne dépendent de la connexion et de la disponibilité du service. Elles doivent être vérifiées.',
    steps:['Ouvrez « ShopFlow AI » depuis « Plus ».','Posez une question, par exemple : « Comment ajouter un article ? ».','Lisez la réponse et vérifiez les informations avant de les utiliser.','La démonstration n’analyse aucune donnée de boutique et ne déclenche aucune action.'],
  },
  {
    id:'shop', icon:'⌂', title:'Comment créer ma boutique ?', short:'La création se fait dans l’application, pas sur la vitrine.', kind:'shop',
    summary:'Le site public présente ShopFlow; il ne crée pas de boutique. La création se déroule dans l’application.',
    steps:['Installez ou ouvrez l’application ShopFlow.','Suivez le parcours d’inscription / création de boutique dans l’application.','Renseignez les informations demandées dans cet espace sécurisé.','Cette page d’aide ne crée aucun compte et ne collecte pas vos informations.'],
  },
  {
    id:'subscription', icon:'◇', title:'Comment consulter les formules ?', short:'Tarifs mensuels et annuels informatifs.', kind:'subscription',
    summary:'Les prix affichés sont informatifs. Le choix d’une formule n’active aucun paiement réel.',
    steps:['Ouvrez « Abonnement » dans l’application ou consultez les formules de la vitrine.','Mensuel : Starter 5 USD / 12 000 FC; Pro 12 USD / 28 800 FC; Business 25 USD / 60 000 FC.','Annuel : Starter 50 USD / 120 000 FC; Pro 120 USD / 288 000 FC; Business 250 USD / 600 000 FC — 10 mois facturés sur 12.','Taux public : 1 USD = 2 400 FC. Cette maquette n’accepte aucun paiement.'],
    note:'Les tarifs restent informatifs. Aucun prestataire ni paiement réel n’est activé par cette démonstration.',
  },
  {
    id:'backup', icon:'↧', title:'Comment sauvegarder mes données ?', short:'Consulter les options de sauvegarde disponibles.', kind:'backup',
    summary:'Les options de sauvegarde dépendent de l’appareil et de la version ShopFlow; vérifiez toujours le résultat avant de changer de téléphone.',
    steps:['Ouvrez les paramètres de l’application.','Repérez les commandes de sauvegarde ou d’export disponibles dans votre version.','Conservez une copie dans un endroit sûr et vérifiez qu’elle est accessible.','Cette animation ne lit, n’exporte ni ne supprime aucune donnée.'],
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
  const sectionTitle={add:'Ajouter une marchandise',stock:'Mes Marchandises & Stock',sale:'Caisse & Vente Rapide',receipt:'Aperçu du reçu',credits:'Carnet Bon / Crédit Clients',currency:'Devise FC / USD',ai:'ShopFlow AI',shop:'Créer ma boutique',subscription:'Abonnement',backup:'Sauvegarde'}[selected.kind]||'Tutoriel';
  drawText('Illustration schématique',sx+4,sy+137,13,'#75889b',650);
  drawText(sectionTitle,sx+4,sy+177,22,'#18324b',850);
  drawTutorialScreen(sx,sy+210,sw,time);
  ctx.restore();
}

function drawTutorialScreen(x,y,w,time) {
  if(selected.kind==='add'){
    rounded(x,y,w,430,22,'#ffffff','#e7edf2');
    const fields=[['Nom de l’article','Article démo'],['Catégorie','À choisir'],['Unité / quantité','À saisir'],['Prix d’achat','À saisir'],['Prix de vente','À saisir'],['Alerte stock bas','Seuil à définir']];
    fields.forEach((field,i)=>{
      const yy=y+17+i*57;
      drawText(field[0],x+22,yy+10,12,'#78899a',650);
      rounded(x+18,yy+17,w-36,34,10,'#f7f9fb','#e8edf2');
      drawText(field[1],x+32,yy+40,14,'#52687b',600);
    });
    rounded(x+20,y+366,w-40,45,14,'#e8eef4');drawText('Démo arrêtée avant « Ajouter au stock »',x+w/2,y+394,12,'#516b82',800,'center');
  } else if(selected.kind==='stock') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    rounded(x+15,y+12,w-30,39,11,'#f7f9fb','#e8edf2');drawText('Filtrer vos marchandises…',x+29,y+37,12,'#8797a4',550);
    const rows=[['Collier doré','Bijoux · Quantité : 12'],['Sac à main','Accessoires · Quantité : 4'],['E-book pratique','E-books · Quantité : 18']];
    rows.forEach((r,i)=>{
      const yy=y+61+i*119;rounded(x+14,yy,w-28,107,14,'#fff','#e6edf2');
      rounded(x+25,yy+13,42,42,12,['#fff1d8','#e9f7f0','#f0eaff'][i]);drawText('✦',x+46,yy+40,18,['#b78128','#22846c','#7654b0'][i],850,'center');
      drawText(r[0],x+78,yy+30,14,'#223a50',800);drawText(r[1],x+78,yy+50,10,'#8393a1',600);
      drawPillSmall('+ Stock',x+24,yy+63,100,31,'#edf5fc','#2575b6');drawPillSmall('+1 Vente',x+132,yy+63,105,31,'#e9f8ef','#19704e');
    });
  } else if(selected.kind==='sale') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    drawText('Ticket de démonstration',x+19,y+26,14,'#18324b',800);
    [['Collier doré','Bijoux'],['Bracelet perlé','Bijoux']].forEach((r,i)=>{
      const yy=y+39+i*57;rounded(x+13,yy,w-26,49,12,'#fff','#e6edf2');
      drawText(r[0],x+25,yy+22,13,'#223a50',800);drawText(r[1]+' · Qté 1',x+25,yy+39,10,'#8393a1',600);
      drawText('−   1   +',x+w-79,yy+31,12,'#256da6',800,'center');
    });
    drawText('Paiement',x+19,y+166,12,'#18324b',800);
    drawText('Cash · Mobile Money · Carte · Crédit',x+19,y+188,10,'#526d82',650);
    drawText('Livraison (choix du vendeur)',x+19,y+223,12,'#18324b',800);
    drawPillSmall('Sans frais',x+17,y+235,111,35,'#dff4e9','#1d744f');drawPillSmall('Avec frais',x+137,y+235,111,35,'#edf5fc','#2575b6');
    rounded(x+15,y+284,w-30,47,12,'#edf5fc');drawText('Total / monnaie à rendre : aperçu',x+w/2,y+313,11,'#466780',750,'center');
    rounded(x+15,y+347,w-30,49,13,'#f1f4f7');drawText('ARRÊT AVANT TOUTE VALIDATION',x+w/2,y+377,11,'#516b82',850,'center');
  } else if(selected.kind==='receipt') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    drawText('REÇU · EXEMPLE FICTIF',x+19,y+31,14,'#18324b',850);
    drawText('Client démo · Aperçu uniquement',x+19,y+56,11,'#75889b',600);
    [['Collier doré · 1','45 000 FC'],['Bracelet perlé · 1','28 000 FC']].forEach((r,i)=>{const yy=y+93+i*42;drawText(r[0],x+20,yy,12,'#52687b',650);drawText(r[1],x+w-20,yy,12,'#263e54',750,'right');});
    rounded(x+15,y+185,w-30,48,12,'#102a45');drawText('TOTAL EXEMPLE · 73 000 FC',x+w/2,y+215,13,'#ffffff',850,'center');
    drawPillSmall('Infos client / livraison',x+15,y+247,w-30,35,'#edf5fc','#2575b6');
    drawPillSmall('Image PNG  ·  Imprimer  ·  WhatsApp',x+15,y+293,w-30,40,'#e9f8ef','#19704e');
    drawText('Aucun fichier ni message n’est envoyé.',x+w/2,y+367,10,'#75889b',650,'center');
  } else if(selected.kind==='credits') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    drawText('Exemple fictif · solde restant',x+19,y+30,13,'#a15c2b',800);
    rounded(x+15,y+44,w-30,67,14,'#fff3e2');drawText('95 000 FC',x+31,y+87,23,'#89551e',850);
    rounded(x+15,y+124,w-30,127,15,'#fff','#e6edf2');
    drawText('Client démo',x+29,y+157,14,'#223a50',800);drawText('Avance enregistrée : 100 000 / 195 000 FC',x+29,y+183,10,'#75889b',600);
    drawPillSmall('Encaisser avance',x+25,y+201,102,32,'#edf5fc','#2575b6');drawPillSmall('Rappel WhatsApp',x+137,y+201,107,32,'#e9f8ef','#19704e');
    drawText('Aucun paiement ni rappel effectué.',x+w/2,y+292,10,'#75889b',650,'center');
  } else if(selected.kind==='currency') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    drawText('Bouton dans l’en-tête ShopFlow',x+w/2,y+40,13,'#75889b',700,'center');
    drawPillSmall('FC   ⇄   USD',x+38,y+66,w-76,54,'#eaf4ff','#176fc4');
    drawText('EXEMPLE AU TAUX INITIAL',x+w/2,y+166,12,'#75889b',800,'center');
    drawText('12 000 FC = 5 USD',x+w/2,y+213,22,'#18324b',850,'center');
    drawText('1 USD = 2 400 FC',x+w/2,y+246,13,'#526d82',650,'center');
    drawText('Affichage uniquement · aucun paiement',x+w/2,y+303,11,'#75889b',650,'center');
  } else if(selected.kind==='ai') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    rounded(x+15,y+18,w-30,83,17,'#eaf3ff');drawText('Vous',x+32,y+44,13,'#2471b2',850);wrap('Comment ajouter un article ?',x+32,y+69,w-70,20,14,'#1e3449',650);
    rounded(x+15,y+121,w-30,170,17,'#f1f8f4');drawText('ShopFlow AI · exemple',x+32,y+150,13,'#20805a',850);wrap('Ouvrez « Marchandises & Stock », puis « Ajouter une marchandise ». Vérifiez toujours les réponses.',x+32,y+180,w-70,23,14,'#263f52',600);
    drawPillSmall('Réponses en ligne selon la connexion',x+15,y+316,w-30,40,'#fff5df','#93661e');
  } else if(selected.kind==='shop') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    drawText('Création dans l’application',x+w/2,y+58,17,'#18324b',850,'center');
    drawPillSmall('Application ShopFlow · inscription',x+22,y+97,w-44,46,'#eaf4ff','#176fc4');
    wrap('La vitrine publique ne crée pas de boutique. Ce guide n’ouvre pas de formulaire et ne collecte aucune information.',x+28,y+205,w-56,25,14,'#52687b',600);
    drawPillSmall('Démo informative · aucun compte créé',x+22,y+326,w-44,43,'#f1f4f7','#516b82');
  } else if(selected.kind==='subscription') {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    drawText('Tarifs informatifs · taux 2 400 FC / USD',x+17,y+26,11,'#52687b',750);
    drawPillSmall('MENSUEL   /   ANNUEL · 2 MOIS OFFERTS',x+15,y+39,w-30,35,'#eaf4ff','#176fc4');
    const rows=[['Starter','5 / 50 USD','12 000 / 120 000 FC'],['Pro','12 / 120 USD','28 800 / 288 000 FC'],['Business','25 / 250 USD','60 000 / 600 000 FC']];
    rows.forEach((r,i)=>{const yy=y+88+i*75;rounded(x+14,yy,w-28,65,13,'#f8fafc','#e4eaf0');drawText(r[0],x+25,yy+24,14,'#223b51',850);drawText(r[1],x+w-22,yy+24,12,'#223b51',800,'right');drawText(r[2]+' · USD / FC annuel',x+25,yy+48,10,'#718395',550);});
    drawText('Aucun paiement n’est traité.',x+w/2,y+337,11,'#75889b',700,'center');
  } else {
    rounded(x,y,w,450,22,'#ffffff','#e7edf2');
    drawText('Sauvegarde / export disponibles',x+22,y+39,17,'#18324b',850);
    wrap('Les commandes exactes dépendent de votre version et de votre appareil. Vérifiez toujours la copie avant de changer de téléphone.',x+22,y+85,w-44,24,14,'#6c7f91',600);
    drawPillSmall('Maquette illustrative · aucun fichier exporté',x+16,y+230,w-32,48,'#eaf4ff','#176fc4');
    drawText('Aucune donnée n’est lue, exportée ou supprimée.',x+w/2,y+337,10,'#7c8e9f',600,'center');
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
  drawText(selected.kind==='subscription'?'Tarifs informatifs · aucun paiement':'Illustration schématique · aucune opération réelle',360,1215,14,'#a8bdcd',650,'center');
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
  noteEl.textContent=guide.note||'Illustration schématique uniquement : aucune vente, avance, modification de stock, export, paiement ou message WhatsApp n’est exécuté.';
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
