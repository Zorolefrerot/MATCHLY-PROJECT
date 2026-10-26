const canvas = document.querySelector('#motion');
const ctx = canvas.getContext('2d', { alpha: false });
const duration = 38;
const icon = new Image();
icon.src = '../site-assets/shopflow-icon.png';

const progressFill = document.querySelector('#progress-fill');
const status = document.querySelector('#status');
const replayButton = document.querySelector('#replay');
const exportButton = document.querySelector('#export');
let animationStart = 0;
let animationRunning = false;
let completionCallback = null;
let animationFrameId = 0;

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const easeOut = (value) => 1 - Math.pow(1 - clamp(value), 3);
const easeInOut = (value) => {
  const x = clamp(value);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const mix = (a, b, t) => a + (b - a) * t;

function roundRect(x, y, width, height, radius, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lineWidth; ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawText(text, x, y, size, color, weight = 600, align = 'left', maxWidth) {
  ctx.font = `${weight} ${size}px Inter, "DM Sans", system-ui, sans-serif`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if (maxWidth) ctx.fillText(text, x, y, maxWidth);
  else ctx.fillText(text, x, y);
}

function drawWrapped(text, x, y, maxWidth, lineHeight, size, color, weight = 500) {
  ctx.font = `${weight} ${size}px Inter, "DM Sans", system-ui, sans-serif`;
  ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const words = text.split(' '); let line = ''; let row = 0;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, y + row * lineHeight); line = word; row += 1;
    } else line = candidate;
  }
  if (line) ctx.fillText(line, x, y + row * lineHeight);
}

function drawBackground(time, theme = 'night') {
  const palette = {
    night: ['#071827', '#0b2947', '#143b5d'],
    ice: ['#f8fbff', '#e5f1fb', '#d3e6f7'],
    mint: ['#062b2b', '#0b4a4b', '#17686b'],
    violet: ['#19152f', '#30245b', '#463578'],
    warm: ['#fff8ef', '#f6e8dc', '#e7ddf8'],
  }[theme];
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, palette[0]); gradient.addColorStop(.52, palette[1]); gradient.addColorStop(1, palette[2]);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const light = theme === 'ice' || theme === 'warm';
  const glow = ctx.createRadialGradient(815 + Math.sin(time * .42) * 140, 390, 30, 760, 520, 820);
  glow.addColorStop(0, light ? 'rgba(40,136,219,.17)' : 'rgba(54,160,255,.24)');
  glow.addColorStop(1, 'rgba(4,20,35,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, 1080, 1920);
  for (let i = 0; i < 14; i += 1) {
    const x = (i * 223 + Math.sin(time * (.5 + i % 3 * .1) + i) * 66 + 1080) % 1080;
    const y = (i * 181 + Math.cos(time * .31 + i * 1.7) * 48 + 1920) % 1920;
    ctx.globalAlpha = (light ? .07 : .13) + (Math.sin(time * 1.2 + i) + 1) * .06;
    ctx.fillStyle = i % 4 === 0 ? '#78e0b1' : '#a5d5ff';
    ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPill(text, x, y, width, background = '#eaf4ff', color = '#1868b7', height = 48) {
  roundRect(x, y, width, height, height / 2, background);
  drawText(text, x + width / 2, y + height * .66, height * .36, color, 850, 'center', width - 18);
}

function drawLogo(x, y, size, rotation = 0, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rotation);
  ctx.shadowColor = '#00000045'; ctx.shadowBlur = size * .18; ctx.shadowOffsetY = size * .08;
  roundRect(-size / 2, -size / 2, size, size, size * .22, '#ffffff'); ctx.shadowColor = 'transparent';
  if (icon.complete && icon.naturalWidth) ctx.drawImage(icon, -size * .43, -size * .43, size * .86, size * .86);
  ctx.restore();
}

// Original, animated stick-figure guide drawn in Canvas from the user's pose references.
function drawStickman(centerX, groundY, scale, pose, time, alpha = 1) {
  const bob = Math.sin(time * 3.1) * 4;
  const walk = Math.sin(time * 6.2) * 35;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(centerX, groundY + bob); ctx.scale(scale, scale);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = '#07182724'; ctx.beginPath(); ctx.ellipse(0, 0, 115, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#10233d'; ctx.lineWidth = 8;

  // Legs: the walk pose alternates the strides instead of looping a single bounce.
  if (pose === 'walk') {
    ctx.beginPath(); ctx.moveTo(0, -250); ctx.lineTo(-45 + walk, -125); ctx.lineTo(-82 + walk, -6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -250); ctx.lineTo(44 - walk, -125); ctx.lineTo(82 - walk, -6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-92 + walk, -6); ctx.quadraticCurveTo(-113 + walk, 2, -77 + walk, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(72 - walk, -6); ctx.quadraticCurveTo(104 - walk, 1, 89 - walk, 5); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(0, -250); ctx.lineTo(-48, -125); ctx.lineTo(-82, -6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -250); ctx.lineTo(48, -125); ctx.lineTo(82, -6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-92, -6); ctx.quadraticCurveTo(-113, 2, -77, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(72, -6); ctx.quadraticCurveTo(104, 1, 89, 5); ctx.stroke();
  }

  // Plain stick-figure body, kept distinct from the former suited character.
  ctx.beginPath(); ctx.moveTo(0, -444); ctx.lineTo(0, -250); ctx.stroke();

  // Arms and the gesture for the current part of the explanation.
  ctx.strokeStyle = '#10233d'; ctx.lineWidth = 8;
  if (pose === 'write') {
    ctx.beginPath(); ctx.moveTo(-4, -420); ctx.lineTo(-54, -362); ctx.lineTo(-22, -309); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -420); ctx.lineTo(57, -383); ctx.lineTo(90, -411); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#10233d'; ctx.lineWidth = 5;
    roundRect(48, -375, 105, 82, 8, '#ffffff', '#10233d', 5);
    ctx.beginPath(); ctx.moveTo(72, -352); ctx.lineTo(125, -352); ctx.moveTo(72, -333); ctx.lineTo(118, -333); ctx.stroke();
    ctx.strokeStyle = '#1475d1'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(84, -408); ctx.lineTo(113, -376); ctx.stroke();
  } else if (pose === 'think') {
    ctx.beginPath(); ctx.moveTo(-4, -420); ctx.lineTo(-65, -366); ctx.lineTo(-32, -330); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -420); ctx.lineTo(46, -365); ctx.lineTo(28, -423); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(28, -427, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (pose === 'point') {
    ctx.beginPath(); ctx.moveTo(-4, -420); ctx.lineTo(-67, -364); ctx.lineTo(-33, -319); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -420); ctx.lineTo(65, -455); ctx.lineTo(126, -516); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(126, -516); ctx.lineTo(153, -544); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(126, -516, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (pose === 'walk') {
    ctx.beginPath(); ctx.moveTo(-4, -420); ctx.lineTo(-65, -365); ctx.lineTo(-92 - walk * .55, -310); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -420); ctx.lineTo(63, -365); ctx.lineTo(93 + walk * .55, -310); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-92 - walk * .55, -310, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(93 + walk * .55, -310, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (pose === 'wave') {
    ctx.beginPath(); ctx.moveTo(-4, -420); ctx.lineTo(-58, -363); ctx.lineTo(-25, -321); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -420); ctx.lineTo(48, -468); ctx.lineTo(42, -522); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(42, -522, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.moveTo(40 + i * 5, -529); ctx.lineTo(34 + i * 7, -550 - i * 2); ctx.stroke(); }
  } else {
    const gesture = Math.sin(time * 2) * 10;
    ctx.beginPath(); ctx.moveTo(-4, -420); ctx.lineTo(-62, -367); ctx.lineTo(-35, -318); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -420); ctx.lineTo(66, -392 + gesture); ctx.lineTo(130, -390 + gesture); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(137, -390 + gesture, 14, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // Head, face and three simple hair strokes.
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#10233d'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(0, -520, 74, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-35, -586); ctx.quadraticCurveTo(-9, -610, 20, -604); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, -590); ctx.lineTo(45, -617); ctx.stroke();
  ctx.fillStyle = '#10233d';
  ctx.beginPath(); ctx.ellipse(-23, -528, 7, 12, -.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(22, -531, 7, 12, .12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#10233d'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-28, -498); ctx.quadraticCurveTo(0, -471, 31, -500); ctx.stroke();
  if (pose === 'think') {
    drawText('?', 83, -594, 58, '#1475d1', 900, 'center');
  }
  ctx.restore();
}

function drawSpeech(text, x, y, width, time, { height = 154, dark = false, size = 27 } = {}) {
  const p = easeOut(time / .38); if (!p) return;
  ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 22);
  ctx.shadowColor = '#06152645'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 9;
  roundRect(x, y, width, height, 26, dark ? '#123957' : '#ffffff', dark ? '#35769c' : '#dce9f2', 2);
  ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.moveTo(x + width - 62, y + height - 3); ctx.lineTo(x + width - 33, y + height - 3); ctx.lineTo(x + width - 51, y + height + 25); ctx.closePath();
  ctx.fillStyle = dark ? '#123957' : '#ffffff'; ctx.fill();
  drawWrapped(text, x + 24, y + 49, width - 48, size + 12, size, dark ? '#f8fbff' : '#182f46', 760);
  ctx.restore();
}

function drawHeading(kicker, title, subtitle, time, light = false) {
  const p = easeOut(time / .58);
  ctx.save(); ctx.globalAlpha = p;
  drawText(kicker.toUpperCase(), 82 + (1 - p) * 44, 165, 20, light ? '#2376b8' : '#79e2b4', 850);
  drawText(title, 82 + (1 - p) * 44, 275, 66, light ? '#142b43' : '#f7fbff', 900);
  drawWrapped(subtitle, 84 + (1 - p) * 44, 344, 860, 38, 26, light ? '#5e7285' : '#b4c9db', 550);
  ctx.restore();
}

function drawPhone(x, y, w, h, time, type = 'android') {
  const safari = type === 'iphone';
  const p = .38 + .62 * easeOut(time / .7);
  ctx.save(); ctx.globalAlpha = p; ctx.translate((1 - p) * (safari ? 85 : -100), (1 - p) * 25);
  ctx.rotate((safari ? -1 : 1) * (1 - p) * .03);
  ctx.shadowColor = '#00101d70'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 24;
  roundRect(x, y, w, h, 62, '#101a24', '#8aa5bd', 4);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  roundRect(x + 15, y + 16, w - 30, h - 32, 49, '#fbfcfd');
  const sx = x + 31, sy = y + 30, sw = w - 62, sh = h - 60;
  if (safari) {
    roundRect(x + w / 2 - 70, y + 25, 140, 24, 14, '#101a24');
    drawText('9:41', sx + 16, sy + 29, 15, '#1c2a38', 800);
    drawText('●●●  ▰', sx + sw - 18, sy + 29, 14, '#1c2a38', 700, 'right');
    roundRect(sx + 10, sy + 48, sw - 20, 55, 20, '#edf1f5');
    drawText('aA', sx + 36, sy + 82, 16, '#5b6c7b', 700);
    drawText('/app/', sx + sw / 2, sy + 82, 18, '#25394b', 750, 'center');
    drawText('↻', sx + sw - 35, sy + 82, 20, '#526778', 700, 'center');
    roundRect(sx, sy + 114, sw, sh - 181, 17, '#f7fafc');
    roundRect(x + w / 2 - 55, y + h - 36, 110, 6, 4, '#1d2935');
  } else {
    drawText('9:41', sx + 17, sy + 31, 15, '#243447', 800);
    drawText('●●●  ▰', sx + sw - 18, sy + 31, 14, '#243447', 700, 'right');
    ctx.fillStyle = '#14283d'; ctx.beginPath(); ctx.arc(x + w / 2, y + 33, 6, 0, Math.PI * 2); ctx.fill();
    roundRect(sx, sy + 47, sw, sh - 67, 18, '#f6f9fc');
    roundRect(x + w / 2 - 45, y + h - 28, 90, 5, 3, '#a8b4bf');
  }
  ctx.restore();
  return { sx, sy: sy + (safari ? 114 : 47), sw, sh: sh - (safari ? 181 : 67) };
}

function drawAppHeader(screen) {
  const { sx, sy, sw } = screen;
  roundRect(sx + 17, sy + 13, 37, 37, 11, '#e7f2ff');
  if (icon.complete && icon.naturalWidth) ctx.drawImage(icon, sx + 21, sy + 17, 29, 29);
  drawText('ShopFlow', sx + 66, sy + 39, 21, '#173451', 850);
  roundRect(sx + sw - 56, sy + 12, 39, 39, 13, '#eef5fa');
  drawText('•••', sx + sw - 36, sy + 38, 15, '#4a6b87', 800, 'center');
  drawText('Bonjour !', sx + 20, sy + 92, 17, '#718397', 600);
  drawText('Votre activité', sx + 20, sy + 126, 25, '#17314a', 850);
  return sy + 148;
}

function drawTap(x, y, time, start) {
  const p = clamp((time - start) / .7); if (!p) return;
  ctx.save(); ctx.globalAlpha = 1 - p * .78; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, 12 + p * 38, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#46a9ffcc'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawIntro(time) {
  drawBackground(time, 'night');
  const p = easeOut(time / .6); drawLogo(540, mix(220, 252, p), 170, (1 - p) * -.15, .92);
  drawText('Bonjour !', 540, 480, 78, '#f8fbff', 900, 'center');
  drawText('Je suis le guide ShopFlow.', 540, 545, 32, '#bad0e1', 650, 'center');
  drawStickman(mix(790, 670, p), 1700, 1.16, time < 1.25 ? 'write' : 'wave', time, .98);
  drawSpeech('Je vous présente l’essentiel.', 98, 860, 495, time - .45, { dark: true, size: 30, height: 144 });
  drawPill('UN OUTIL POUR LE QUOTIDIEN DU COMMERCE', 250, 1810, 580, '#123c5a', '#81e0b5', 46);
}

function drawQuestion(time) {
  drawBackground(time, 'violet');
  drawText('Mais au fait…', 540, 290, 42, '#b8cadd', 700, 'center');
  const p = easeOut(time / .6); ctx.globalAlpha = p;
  drawText('C’est quoi', 540, 440, 86, '#ffffff', 900, 'center');
  drawText('ShopFlow ?', 540, 545, 94, '#84dfb4', 900, 'center');
  drawStickman(mix(180, 355, p), 1690, 1.25, 'think', time, .98);
  drawSpeech('Une bonne question !', 500, 860, 450, time - .45, { size: 30, height: 130 });
  drawLogo(830, 1390 + Math.sin(time * 3) * 14, 108, Math.sin(time * 1.5) * .08, .9);
}

function drawDefinition(time) {
  drawBackground(time, 'ice');
  drawHeading('La réponse, en une phrase', 'ShopFlow, c’est…', 'Un outil de gestion pour organiser les ventes, les articles et le suivi du commerce.', time, true);
  const p = easeOut((time - .2) / .45); ctx.globalAlpha = p;
  roundRect(82, 480, 916, 235, 34, '#ffffff', '#d8e7f3', 2);
  drawWrapped('Caisse, stock, reçus et repères d’activité sont réunis dans une seule application.', 132, 568, 810, 47, 34, '#18334d', 760);
  ctx.globalAlpha = 1;
  const chips = [
    { x: 84, label: 'VENTES & REÇUS', bg: '#e8f3ff', fg: '#1c6dac' },
    { x: 390, label: 'ARTICLES & STOCK', bg: '#eaf8f0', fg: '#237751' },
    { x: 704, label: 'SUIVI', bg: '#f2edff', fg: '#7254ad' },
  ];
  chips.forEach((chip, i) => {
    const q = easeOut((time - .55 - i * .14) / .34);
    ctx.save(); ctx.globalAlpha = q; ctx.translate((1 - q) * 30, 0);
    drawPill(chip.label, chip.x, 785, 290, chip.bg, chip.fg, 56); ctx.restore();
  });
  drawStickman(850, 1775, 1.15, 'point', time, .97);
  drawSpeech('Exemple : un bijoutier suit les ventes de colliers et bracelets, comme une boutique de vêtements suit ses articles.', 88, 1100, 600, time - .7, { size: 26, height: 184 });
}

function drawAndroidSale(time) {
  drawBackground(time, 'ice');
  drawHeading('Exemple 1 · Android', 'Une vente,', 'Du panier au reçu : sélectionner des bijoux et enregistrer la vente.', time, true);
  drawPill('APERÇU ILLUSTRATIF', 84, 452, 280, '#e6f1fb', '#2876b6', 42);
  const screen = drawPhone(74, 555, 526, 1220, time, 'android');
  const appY = drawAppHeader(screen);
  drawText('Nouvelle vente', screen.sx + 20, appY + 27, 18, '#6a7e91', 700);
  drawText('Choisir des articles', screen.sx + 20, appY + 66, 23, '#1a334d', 850);
  const items = [
    { name: 'Collier doré', sub: 'Bijoux · Pièce', color: '#b68128', tint: '#fff4dc' },
    { name: 'Bracelet perlé', sub: 'Bijoux · Pièce', color: '#197c70', tint: '#e5f7f1' },
    { name: 'Boucles d’oreilles', sub: 'Bijoux · Paire', color: '#7354aa', tint: '#f2edff' },
  ];
  const rowY = appY + 94;
  items.forEach((item, i) => {
    const q = easeOut((time - .2 - i * .23) / .36); const yy = rowY + i * 100;
    ctx.save(); ctx.globalAlpha = q; ctx.translate((1 - q) * -46, 0);
    roundRect(screen.sx + 13, yy, screen.sw - 26, 82, 17, '#ffffff', '#e6edf3');
    roundRect(screen.sx + 24, yy + 14, 54, 54, 15, item.tint);
    drawText('✦', screen.sx + 51, yy + 51, 25, item.color, 850, 'center');
    drawText(item.name, screen.sx + 91, yy + 34, 17, '#20384f', 800);
    drawText(item.sub, screen.sx + 91, yy + 58, 12, '#8797a6', 500);
    roundRect(screen.sx + screen.sw - 64, yy + 22, 38, 38, 13, '#edf5fc');
    drawText('+', screen.sx + screen.sw - 45, yy + 49, 23, '#1872c2', 800, 'center');
    ctx.restore();
  });
  const cartY = rowY + 314; const cart = easeOut((time - 1.05) / .5); ctx.globalAlpha = cart;
  roundRect(screen.sx + 14, cartY, screen.sw - 28, 174, 21, '#edf5fc');
  drawText('PANIER', screen.sx + 33, cartY + 35, 13, '#52718e', 850);
  drawText('Collier + bracelet', screen.sx + 33, cartY + 70, 18, '#18334d', 800);
  drawText('Total calculé à la validation', screen.sx + 33, cartY + 98, 12, '#76889a', 550);
  roundRect(screen.sx + 23, cartY + 116, screen.sw - 46, 44, 14, '#126fd0');
  drawText('ENREGISTRER LA VENTE', screen.sx + screen.sw / 2, cartY + 144, 13, '#ffffff', 850, 'center');
  drawTap(screen.sx + screen.sw / 2, cartY + 137, time, 2.15);
  const receipt = easeOut((time - 3.1) / .45); ctx.save(); ctx.globalAlpha = receipt; ctx.translate(0, (1 - receipt) * 75);
  ctx.shadowColor = '#071b2d50'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 12;
  roundRect(618, 1290, 390, 228, 25, '#ffffff', '#dce8f2', 2); ctx.shadowColor = 'transparent';
  roundRect(646, 1320, 56, 56, 17, '#e7f8ee'); drawText('✓', 674, 1359, 34, '#168255', 900, 'center');
  drawText('Vente enregistrée', 720, 1348, 21, '#17334d', 850);
  drawText('Reçu disponible dans l’historique.', 648, 1417, 15, '#75899d', 600);
  drawPill('REÇU PRÊT', 648, 1450, 165, '#edf5fc', '#2575b6', 38); ctx.restore();
  drawStickman(850, 1780, 1.06, 'point', time, .98);
  drawSpeech('Exemple : vous vendez un collier et un bracelet. Le reçu reste accessible dans l’historique.', 620, 785, 389, time - .7, { size: 24, height: 208 });
}

function drawStock(time) {
  drawBackground(time, 'mint');
  drawHeading('Exemple 2 · Articles & stock', 'Repérer ce qui', 'Est à vérifier : bijoux, accessoires, vêtements, chaussures et e-books.', time);
  drawPill('APERÇU ILLUSTRATIF', 84, 452, 280, '#114b4c', '#8ae3bd', 42);
  const screen = drawPhone(444, 565, 530, 1210, time, 'android'); const appY = drawAppHeader(screen);
  drawText('Marchandises & stock', screen.sx + 20, appY + 28, 20, '#17334c', 850);
  drawText('Catalogue', screen.sx + 20, appY + 64, 14, '#718598', 600);
  const items = [
    { name: 'Bracelet perlé', cat: 'Bijoux', color: '#b68128', fill: '#fff4dc', bar: .78 },
    { name: 'Sac à main', cat: 'Accessoires', color: '#16885d', fill: '#e8f5ee', bar: .55 },
    { name: 'E-book pratique', cat: 'E-books', color: '#7054aa', fill: '#f2edff', bar: .23 },
  ];
  items.forEach((item, i) => {
    const q = easeOut((time - i * .21) / .4); const yy = appY + 89 + i * 142 - Math.sin(clamp((time - .8) / 4) * Math.PI) * 15;
    ctx.save(); ctx.globalAlpha = q; ctx.translate(0, (1 - q) * 30);
    roundRect(screen.sx + 14, yy, screen.sw - 28, 123, 17, '#ffffff', '#e4eee8');
    roundRect(screen.sx + 26, yy + 17, 46, 46, 14, item.fill); drawText('✦', screen.sx + 49, yy + 48, 20, item.color, 850, 'center');
    drawText(item.name, screen.sx + 86, yy + 40, 16, '#18364a', 800);
    drawText(item.cat, screen.sx + 86, yy + 65, 13, i === 2 ? '#bd7626' : '#829496', 600);
    roundRect(screen.sx + 27, yy + 91, screen.sw - 54, 9, 5, '#e8efeb');
    const amount = i === 2 ? mix(item.bar, .56, easeOut((time - 3.1) / 1.2)) : item.bar;
    roundRect(screen.sx + 27, yy + 91, (screen.sw - 54) * amount, 9, 5, item.color); ctx.restore();
  });
  const alert = easeOut((time - .8) / .55); ctx.save(); ctx.globalAlpha = alert; ctx.translate((1 - alert) * -175, 0);
  ctx.shadowColor = '#00171540'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 13;
  roundRect(72, 790, 390, 290, 29, '#ffffff'); ctx.shadowColor = 'transparent';
  roundRect(101, 820, 60, 60, 18, '#fff2de'); drawText('!', 131, 863, 34, '#c77b23', 900, 'center');
  drawText('À surveiller', 180, 845, 24, '#17364a', 850);
  drawText('Un article approche du seuil choisi.', 101, 929, 17, '#738799', 600);
  roundRect(101, 971, 330, 72, 18, '#eaf8f0'); drawText('Vérifier la quantité', 266, 1016, 16, '#19704e', 800, 'center'); ctx.restore();
  drawStickman(265, 1790, 1.14, 'walk', time, .97);
  drawSpeech('Avant un réassort, vérifiez les quantités visibles dans le catalogue.', 76, 1132, 400, time - 1.05, { size: 24, height: 188 });
}

function drawIphone(time) {
  drawBackground(time, 'warm');
  drawHeading('Exemple 3 · iPhone', 'Safari ouvre', 'La version web. L’application reste séparée : ouvrez l’adresse qui se termine par /app/.', time, true);
  drawPill('WEB APP · SAFARI', 84, 452, 250, '#eee7ff', '#6951a5', 42);
  const screen = drawPhone(251, 565, 578, 1215, time, 'iphone'); const appY = drawAppHeader(screen);
  drawText('Vue d’ensemble', screen.sx + 20, appY + 63, 22, '#18334d', 850);
  const cards = [
    { x: screen.sx + 15, name: 'VENTES', color: '#2378bc', fill: '#e9f3ff', glyph: '↗' },
    { x: screen.sx + screen.sw / 2 + 4, name: 'DÉPENSES', color: '#27815a', fill: '#eaf8f0', glyph: '−' },
    { x: screen.sx + 15, name: 'STOCK', color: '#aa7029', fill: '#fff2e1', glyph: '▤' },
    { x: screen.sx + screen.sw / 2 + 4, name: 'CRÉDITS', color: '#7157b3', fill: '#f2edff', glyph: '◷' },
  ];
  cards.forEach((card, i) => {
    const q = easeOut((time - i * .14) / .4); const yy = appY + 89 + Math.floor(i / 2) * 145;
    ctx.save(); ctx.globalAlpha = q; ctx.translate(0, (1 - q) * 22);
    roundRect(card.x, yy, screen.sw / 2 - 23, 128, 18, card.fill);
    drawText(card.glyph, card.x + 22, yy + 39, 26, card.color, 850); drawText(card.name, card.x + 20, yy + 75, 12, card.color, 850);
    roundRect(card.x + 20, yy + 94, screen.sw / 2 - 65, 7, 4, '#ffffffc0');
    roundRect(card.x + 20, yy + 94, (screen.sw / 2 - 65) * (.52 + .1 * Math.sin(time * 2 + i)), 7, 4, card.color); ctx.restore();
  });
  const action = easeOut((time - 1.7) / .5); ctx.save(); ctx.globalAlpha = action; ctx.translate(0, (1 - action) * 82);
  ctx.shadowColor = '#14233436'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  roundRect(95, 1285, 490, 232, 25, '#ffffff'); ctx.shadowColor = 'transparent';
  drawText('Depuis Safari', 128, 1331, 18, '#697c8e', 700); roundRect(127, 1350, 424, 96, 18, '#eef4fb');
  roundRect(148, 1368, 59, 59, 16, '#dceaff'); drawText('+', 178, 1408, 35, '#176fc4', 800, 'center');
  drawText('Ajouter à l’écran d’accueil', 227, 1408, 16, '#22384d', 800);
  drawText('Retrouvez l’icône depuis l’accueil.', 128, 1482, 15, '#738599', 650); ctx.restore();
  drawStickman(901, 1775, .97, 'explain', time, .97);
  drawSpeech('Sur iPhone, ouvrez /app/ dans Safari puis utilisez « Ajouter à l’écran d’accueil ».', 618, 790, 390, time - .75, { size: 24, height: 210 });
  drawTap(742, 1640, time, 1.5);
}

function drawActivity(time) {
  drawBackground(time, 'violet');
  drawHeading('Dernier exemple · suivi', 'Faire le point', 'Sur son activité : retrouver les ventes, dépenses et crédits saisis.', time);
  const x = 82, y = 548, w = 916, h = 1050; const p = easeOut(time / .65);
  ctx.save(); ctx.globalAlpha = p; ctx.translate((1 - p) * 58, 0);
  ctx.shadowColor = '#02051056'; ctx.shadowBlur = 38; ctx.shadowOffsetY = 18;
  roundRect(x, y, w, h, 34, '#ffffff'); ctx.shadowColor = 'transparent';
  drawText('SHOPFLOW  /  VUE D’ENSEMBLE', x + 42, y + 70, 17, '#71869b', 850);
  drawText('Repères du commerce', x + 42, y + 136, 38, '#17334d', 850);
  const blocks = [
    { x: x + 38, title: 'Ventes', label: 'Enregistrées', color: '#1476c5', tint: '#eaf4ff' },
    { x: x + 326, title: 'Dépenses', label: 'Saisies', color: '#258259', tint: '#ebf8f0' },
    { x: x + 614, title: 'Crédits', label: 'À suivre', color: '#7153b3', tint: '#f2efff' },
  ];
  blocks.forEach((b, i) => {
    const q = easeOut((time - i * .17) / .45); ctx.save(); ctx.globalAlpha = q;
    roundRect(b.x, y + 177, 252, 160, 22, b.tint); drawText(b.title.toUpperCase(), b.x + 20, y + 222, 15, b.color, 850);
    drawText(b.label, b.x + 20, y + 275, 23, '#203a52', 800); drawText(i === 0 ? '↗' : i === 1 ? '−' : '◷', b.x + 216, y + 222, 29, b.color, 850, 'center'); ctx.restore();
  });
  drawText('ILLUSTRATION D’UNE TENDANCE', x + 44, y + 408, 16, '#72859a', 850);
  const chartX = x + 60, chartY = y + 840, chartW = 770, chartH = 340;
  ctx.strokeStyle = '#e8edf2'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) { const gy = chartY - i * 82; ctx.beginPath(); ctx.moveTo(chartX, gy); ctx.lineTo(chartX + chartW, gy); ctx.stroke(); }
  [.28,.5,.4,.72,.55,.84,.65,.94].forEach((value, i) => {
    const q = easeOut((time - .3 - i * .12) / .48); const barH = chartH * value * q; const bx = chartX + i * 94;
    const color = i > 5 ? '#57d6a6' : '#1685e0'; const gr = ctx.createLinearGradient(0, chartY - barH, 0, chartY);
    gr.addColorStop(0, color); gr.addColorStop(1, i > 5 ? '#b0f1d2' : '#96d5ff'); roundRect(bx, chartY - barH, 42, barH, 18, gr);
  });
  ctx.restore();
  drawStickman(850, 1780, .98, 'wave', time, .98);
  drawSpeech('Chaque chiffre présenté doit venir de vos propres données saisies.', 570, 1535, 410, time - .7, { size: 24, height: 145 });
}

function drawEnd(time) {
  drawBackground(time, 'night'); const p = easeOut(time / .55);
  drawLogo(540, mix(185, 300, p), 172, (1 - p) * .17, p);
  drawText('ShopFlow', 540, 565, 82, '#f7fbff', 900, 'center');
  drawText('La gestion du commerce, plus claire.', 540, 630, 30, '#b4c9da', 650, 'center', 920);
  drawStickman(815, 1660, 1.08, 'wave', time, .98);
  const q = easeOut((time - .4) / .4); ctx.globalAlpha = q;
  roundRect(83, 820, 520, 285, 30, '#103653', '#2876a8', 2);
  drawText('ANDROID', 123, 875, 17, '#80c4ff', 850); drawText('Application de gestion', 123, 920, 24, '#f2f8fc', 800);
  drawText('IPHONE', 123, 988, 17, '#8ce2ba', 850); drawText('Web app dans Safari', 123, 1033, 24, '#f2f8fc', 800);
  roundRect(83, 1167, 520, 86, 43, '#1174d8'); drawText('DÉCOUVREZ SHOPFLOW', 343, 1222, 20, '#ffffff', 900, 'center');
  drawText('Bijoux · accessoires · mode · e-books · alimentation', 540, 1450, 19, '#a6bdd0', 650, 'center');
  drawText('Écrans illustratifs, pas de vraies transactions.', 540, 1492, 17, '#82a0b6', 600, 'center'); ctx.globalAlpha = 1;
}

const scenes = [
  { start: 0, end: 3.5, label: 'Présentation', draw: drawIntro },
  { start: 3.5, end: 6.5, label: 'La question', draw: drawQuestion },
  { start: 6.5, end: 10, label: 'La définition', draw: drawDefinition },
  { start: 10, end: 17, label: 'Exemple · Android et vente', draw: drawAndroidSale },
  { start: 17, end: 23, label: 'Exemple · articles et stock', draw: drawStock },
  { start: 23, end: 29, label: 'Exemple · iPhone dans Safari', draw: drawIphone },
  { start: 29, end: 34, label: 'Suivi d’activité', draw: drawActivity },
  { start: 34, end: 38, label: 'Conclusion', draw: drawEnd },
];

function drawTransition(time) {
  const scene = scenes.slice(1).find((item) => time >= item.start && time < item.start + .3); if (!scene) return;
  const p = (time - scene.start) / .3, alpha = (1 - easeOut(p)) * .72, index = scenes.indexOf(scene);
  ctx.save(); ctx.globalAlpha = alpha;
  if (index % 3 === 1) { ctx.strokeStyle = '#a3e5ff'; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(540, 960, mix(35, 1250, easeOut(p)), 0, Math.PI * 2); ctx.stroke(); }
  else if (index % 3 === 2) { const x = mix(1140, -400, easeInOut(p)); ctx.fillStyle = '#f2fbff'; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+180,0); ctx.lineTo(x-300,1920); ctx.lineTo(x-480,1920); ctx.closePath(); ctx.fill(); }
  else { const y = mix(-250, 1940, easeInOut(p)); ctx.fillStyle = '#62d6e5'; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(1080,y-220); ctx.lineTo(1080,y-95); ctx.lineTo(0,y+125); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

function renderAt(time) {
  const t = clamp(time, 0, duration); const scene = scenes.find((item) => t >= item.start && t < item.end) || scenes[scenes.length - 1];
  scene.draw(t - scene.start); drawTransition(t); progressFill.style.width = `${(t / duration) * 100}%`;
  if (animationRunning) status.textContent = `${scene.label} · ${Math.floor(t).toString().padStart(2, '0')} s / ${duration} s`;
}

function animationFrame(now) {
  if (!animationRunning) return;
  const t = (now - animationStart) / 1000;
  if (t >= duration) { renderAt(duration); animationRunning = false; if (completionCallback) completionCallback(); completionCallback = null; animationFrameId = 0; status.textContent = 'Film terminé. Tu peux le relancer ou enregistrer la vidéo.'; return; }
  renderAt(t); animationFrameId = requestAnimationFrame(animationFrame);
}

function play(onComplete) {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  completionCallback = onComplete || null; animationRunning = true; animationStart = performance.now();
  status.textContent = 'Lecture en cours… garde cette page au premier plan.'; renderAt(0); animationFrameId = requestAnimationFrame(animationFrame);
}

replayButton.addEventListener('click', () => play());
exportButton.addEventListener('click', () => {
  if (!canvas.captureStream || !window.MediaRecorder) { status.textContent = 'Ce navigateur ne peut pas enregistrer le film. Essaie Chrome ou Edge à jour.'; return; }
  const formats = [
    { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' }, { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' }, { mime: 'video/webm;codecs=vp8', ext: 'webm' }, { mime: 'video/webm', ext: 'webm' },
  ];
  const selected = formats.find(({ mime }) => MediaRecorder.isTypeSupported(mime));
  if (!selected) { status.textContent = 'Aucun format vidéo compatible trouvé. Essaie Chrome ou Edge à jour.'; return; }
  exportButton.disabled = true; replayButton.disabled = true; exportButton.textContent = '● Enregistrement…'; status.textContent = 'Enregistrement en cours… ne ferme pas la page.';
  const stream = canvas.captureStream(30), chunks = []; let recorder, recordedMime = selected.mime, recordedExt = selected.ext;
  try { recorder = new MediaRecorder(stream, { mimeType: selected.mime, videoBitsPerSecond: 8_000_000 }); }
  catch { recorder = new MediaRecorder(stream); recordedMime = recorder.mimeType || 'video/webm'; recordedExt = recordedMime.includes('mp4') ? 'mp4' : 'webm'; }
  recorder.ondataavailable = (event) => { if (event.data && event.data.size) chunks.push(event.data); };
  recorder.onerror = () => { status.textContent = 'L’enregistrement a échoué. Essaie un navigateur de bureau récent.'; stream.getTracks().forEach((track) => track.stop()); exportButton.disabled = false; replayButton.disabled = false; exportButton.textContent = '↓ Enregistrer la vidéo'; };
  recorder.onstop = () => {
    const mime = recorder.mimeType || recordedMime;
    if (mime.includes('mp4')) recordedExt = 'mp4'; else if (mime.includes('webm')) recordedExt = 'webm';
    const blob = new Blob(chunks, { type: mime }), objectUrl = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = objectUrl; link.download = `ShopFlow-motion.${recordedExt}`; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000); stream.getTracks().forEach((track) => track.stop());
    exportButton.disabled = false; replayButton.disabled = false; exportButton.textContent = '↓ Enregistrer la vidéo';
    status.textContent = `Téléchargement lancé : ShopFlow-motion.${recordedExt}. ${recordedExt === 'webm' ? 'Convertis-le en MP4 dans CapCut ou Shotcut.' : 'Le fichier est déjà au format MP4.'}`;
  };
  renderAt(0); recorder.start(250); play(() => recorder.state !== 'inactive' && recorder.stop());
});

const isEmbed = new URLSearchParams(location.search).get('embed') === '1';
const preparePlayer = () => {
  renderAt(0);
  if (isEmbed) window.setTimeout(() => play(), 250);
};
if (icon.complete && icon.naturalWidth) preparePlayer();
else icon.addEventListener('load', preparePlayer, { once: true });
