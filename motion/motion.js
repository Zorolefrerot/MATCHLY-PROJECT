const canvas = document.querySelector('#motion');
const ctx = canvas.getContext('2d', { alpha: false });
const duration = 38;
const icon = new Image();
icon.src = '../site-assets/shopflow-icon.png';

const spriteFiles = {
  front: 'presenter-front.png', happy: 'presenter-happy.png', thinking: 'presenter-thinking.png',
  pointing: 'presenter-pointing.png', walkA: 'presenter-walk-a.png', walkB: 'presenter-walk-b.png',
};
const mascot = Object.fromEntries(Object.entries(spriteFiles).map(([key, file]) => {
  const image = new Image();
  image.src = `./assets/${file}`;
  return [key, image];
}));

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
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  if (maxWidth) ctx.fillText(text, x, y, maxWidth);
  else ctx.fillText(text, x, y);
}

function drawWrapped(text, x, y, maxWidth, lineHeight, size, color, weight = 500, align = 'left') {
  ctx.font = `${weight} ${size}px Inter, "DM Sans", system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  const words = text.split(' ');
  let line = '';
  let lineNo = 0;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineNo * lineHeight);
      line = word;
      lineNo += 1;
    } else line = candidate;
  }
  if (line) ctx.fillText(line, x, y + lineNo * lineHeight);
}

function drawBackground(time, theme = 'night') {
  const palettes = {
    night: ['#071827', '#0b2947', '#143b5d'],
    ice: ['#f7fbff', '#e5f1fb', '#d3e6f7'],
    mint: ['#062b2b', '#0b4a4b', '#17686b'],
    violet: ['#19152f', '#30245b', '#463578'],
    warm: ['#fff8ef', '#f6e8dc', '#e7ddf8'],
  };
  const [top, middle, bottom] = palettes[theme] || palettes.night;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, top); gradient.addColorStop(0.52, middle); gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const light = theme === 'ice' || theme === 'warm';
  const glow = ctx.createRadialGradient(810 + Math.sin(time * .42) * 140, 380, 30, 760, 520, 840);
  glow.addColorStop(0, light ? 'rgba(40,136,219,.16)' : 'rgba(54,160,255,.24)');
  glow.addColorStop(1, 'rgba(4,20,35,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 15; i += 1) {
    const x = (i * 223 + Math.sin(time * (.5 + (i % 3) * .1) + i) * 68 + 1080) % 1080;
    const y = (i * 181 + Math.cos(time * .31 + i * 1.7) * 48 + 1920) % 1920;
    ctx.globalAlpha = (light ? .075 : .13) + (Math.sin(time * 1.15 + i) + 1) * .06;
    ctx.fillStyle = i % 4 === 0 ? '#76e2b1' : '#a4d6ff';
    ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPill(text, x, y, width, background = '#eaf4ff', color = '#1868b7', height = 48) {
  roundRect(x, y, width, height, height / 2, background);
  drawText(text, x + width / 2, y + height * .66, height * .37, color, 850, 'center', width - 18);
}

function drawLogo(x, y, size, rotation = 0, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rotation);
  ctx.shadowColor = '#00000045'; ctx.shadowBlur = size * .18; ctx.shadowOffsetY = size * .08;
  roundRect(-size / 2, -size / 2, size, size, size * .22, '#ffffff');
  ctx.shadowColor = 'transparent';
  if (icon.complete && icon.naturalWidth) ctx.drawImage(icon, -size * .43, -size * .43, size * .86, size * .86);
  ctx.restore();
}

function drawMascot(name, centerX, groundY, height, time, options = {}) {
  let key = name;
  if (name === 'walk') key = Math.floor(time * 3.2) % 2 ? 'walkA' : 'walkB';
  const image = mascot[key];
  if (!image || !image.complete || !image.naturalWidth) return;
  const { alpha = 1, drift = 0, tilt = 0, bounce = 4, mirror = false } = options;
  const bob = Math.sin(time * 3.2) * bounce;
  const width = height * image.naturalWidth / image.naturalHeight;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(centerX + drift, groundY + bob);
  ctx.rotate(tilt + Math.sin(time * 1.8) * .008);
  ctx.scale(mirror ? -1 : 1, 1);
  ctx.shadowColor = '#0413213b'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.drawImage(image, -width / 2, -height, width, height);
  ctx.restore();
}

function drawSpeech(text, x, y, width, time, options = {}) {
  const p = easeOut(time / .38);
  if (!p) return;
  const { height = 158, dark = false, size = 27, align = 'left' } = options;
  ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 24);
  ctx.shadowColor = '#06152648'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 10;
  roundRect(x, y, width, height, 26, dark ? '#123957' : '#ffffff', dark ? '#3d739a' : '#dce9f2', 2);
  ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.moveTo(x + width - 56, y + height - 4); ctx.lineTo(x + width - 28, y + height - 4); ctx.lineTo(x + width - 47, y + height + 25); ctx.closePath();
  ctx.fillStyle = dark ? '#123957' : '#ffffff'; ctx.fill();
  drawWrapped(text, x + 24, y + 48, width - 48, size + 12, size, dark ? '#f8fbff' : '#182f46', 760, align);
  ctx.restore();
}

function drawHeading(kicker, title, subtitle, time, light = false, align = 'left') {
  const p = easeOut(time / .58);
  const x = align === 'center' ? 540 : 84;
  const textAlign = align;
  const ink = light ? '#142b43' : '#f7fbff';
  const sub = light ? '#5e7285' : '#b4c9db';
  const offset = align === 'center' ? 0 : (1 - p) * 46;
  ctx.save(); ctx.globalAlpha = p;
  drawText(kicker.toUpperCase(), x + offset, 166, 20, light ? '#2376b8' : '#79e2b4', 850, textAlign, align === 'center' ? 900 : undefined);
  drawText(title, x + offset, 278, 66, ink, 900, textAlign, align === 'center' ? 940 : undefined);
  drawWrapped(subtitle, x + offset, 348, align === 'center' ? 900 : 850, 39, 27, sub, 550, textAlign);
  ctx.restore();
}

function drawPhone(x, y, w, h, time, type = 'android') {
  const safari = type === 'iphone';
  const entrance = .25 + .75 * easeOut(time / .7);
  ctx.save(); ctx.globalAlpha = entrance;
  ctx.translate((1 - entrance) * (safari ? 100 : -110), (1 - entrance) * 24);
  ctx.rotate((safari ? -1 : 1) * (1 - entrance) * .035);
  ctx.shadowColor = '#00101d70'; ctx.shadowBlur = 46; ctx.shadowOffsetY = 25;
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
  return { sx, sy: sy + (safari ? 114 : 47), sw, sh: sh - (safari ? 181 : 67), safari };
}

function drawAppHeader(screen, yOffset = 0) {
  const { sx, sy, sw } = screen;
  const y = sy + yOffset;
  roundRect(sx + 17, y + 13, 37, 37, 11, '#e7f2ff');
  if (icon.complete && icon.naturalWidth) ctx.drawImage(icon, sx + 21, y + 17, 29, 29);
  drawText('ShopFlow', sx + 66, y + 39, 21, '#173451', 850);
  roundRect(sx + sw - 56, y + 12, 39, 39, 13, '#eef5fa');
  drawText('•••', sx + sw - 36, y + 38, 15, '#4a6b87', 800, 'center');
  drawText('Bonjour !', sx + 20, y + 92, 17, '#718397', 600);
  drawText('Votre activité', sx + 20, y + 126, 25, '#17314a', 850);
  return y + 148;
}

function drawTap(x, y, time, start) {
  const p = clamp((time - start) / .7);
  if (!p) return;
  ctx.save(); ctx.globalAlpha = 1 - p * .78;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, 12 + p * 38, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#46a9ffcc'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawIntro(time) {
  drawBackground(time, 'night');
  const entrance = easeOut(time / .55);
  drawLogo(540, mix(228, 255, entrance), 172, (1 - entrance) * -.18, .9 + entrance * .1);
  ctx.globalAlpha = .95;
  drawText('Bonjour !', 540, 500, 76, '#f8fbff', 900, 'center');
  drawText('Je suis votre guide ShopFlow.', 540, 566, 32, '#bad0e1', 650, 'center');
  drawMascot(time < 1.3 ? 'front' : 'happy', 540, 1830, 690, time, { alpha: .96, drift: mix(70, 0, entrance), tilt: (1 - entrance) * .04, bounce: 3 });
  drawSpeech('Suivez-moi, je vous explique l’essentiel.', 300, 780, 600, time - .35, { dark: true, size: 29, height: 146 });
  drawPill('SHOPFLOW · LA GESTION DU COMMERCE', 275, 1858, 530, '#123c5a', '#81e0b5', 42);
}

function drawQuestion(time) {
  drawBackground(time, 'violet');
  drawText('Mais au fait…', 540, 290, 40, '#b6c9dd', 700, 'center');
  const p = easeOut(time / .55);
  ctx.globalAlpha = p;
  drawText('C’est quoi', 540, 430, 83, '#ffffff', 900, 'center');
  drawText('ShopFlow ?', 540, 530, 92, '#84dfb4', 900, 'center');
  drawMascot('thinking', 330, 1715, 760, time, { alpha: .98, drift: mix(170, 0, p), tilt: -.02 * (1 - p), bounce: 5 });
  drawSpeech('Bonne question !', 485, 865, 470, time - .45, { size: 31, height: 124 });
  const orbit = 0.5 + Math.sin(time * 3.4) * .5;
  drawLogo(830, 1395 + orbit * 18, 112, Math.sin(time * 1.8) * .08, .92);
}

function drawDefinition(time) {
  drawBackground(time, 'ice');
  drawHeading('La réponse, en une phrase', 'ShopFlow, c’est…', '', time, true);
  const p = easeOut((time - .3) / .45);
  ctx.save(); ctx.globalAlpha = p;
  roundRect(82, 465, 916, 265, 34, '#ffffff', '#d8e7f3', 2);
  drawWrapped('Un outil de gestion qui aide les commerces à organiser leurs ventes, leurs articles et leur suivi quotidien.', 132, 555, 810, 47, 34, '#18334d', 760);
  ctx.restore();
  const chips = [
    { x: 84, text: 'VENTES & REÇUS', tint: '#e8f3ff', ink: '#1c6dac' },
    { x: 390, text: 'ARTICLES & STOCK', tint: '#eaf8f0', ink: '#237751' },
    { x: 704, text: 'SUIVI', tint: '#f2edff', ink: '#7254ad' },
  ];
  chips.forEach((chip, i) => {
    const q = easeOut((time - .6 - i * .16) / .34);
    ctx.save(); ctx.globalAlpha = q; ctx.translate((1 - q) * 32, 0);
    drawPill(chip.text, chip.x, 797, 290, chip.tint, chip.ink, 56);
    ctx.restore();
  });
  drawMascot('pointing', 815, 1770, 690, time, { alpha: .98, drift: Math.sin(time * 1.3) * 10, bounce: 4 });
  drawSpeech('Et voici comment ça aide, avec des exemples.', 86, 1110, 565, time - .85, { size: 27, height: 150 });
}

function drawAndroidSale(time) {
  drawBackground(time, 'ice');
  drawHeading('Exemple 1 · Android', 'Une vente,', 'du panier au reçu.', 'Le visuel montre un exemple de parcours dans l’application ShopFlow.', time, true);
  drawPill('APERÇU ILLUSTRATIF', 84, 459, 280, '#e6f1fb', '#2876b6', 42);
  const device = drawPhone(74, 570, 526, 1210, time, 'android');
  const appY = drawAppHeader(device);
  drawText('Nouvelle vente', device.sx + 20, appY + 27, 18, '#6a7e91', 700);
  drawText('Choisir des articles', device.sx + 20, appY + 66, 23, '#1a334d', 850);
  const rows = [
    { label: 'Riz', sub: 'Article du catalogue', tint: '#eaf4ff', ink: '#1475d1' },
    { label: 'Boisson', sub: 'Article du catalogue', tint: '#e9f8f1', ink: '#16855f' },
    { label: 'Autre article', sub: 'Exemple illustratif', tint: '#f2efff', ink: '#7554c7' },
  ];
  const rowY = appY + 94;
  rows.forEach((row, i) => {
    const q = easeOut((time - .2 - i * .24) / .38);
    const yy = rowY + i * 100;
    ctx.save(); ctx.globalAlpha = q; ctx.translate((1 - q) * -46, 0);
    roundRect(device.sx + 13, yy, device.sw - 26, 82, 17, '#ffffff', '#e6edf3');
    roundRect(device.sx + 24, yy + 14, 54, 54, 15, row.tint);
    drawText(row.label[0], device.sx + 51, yy + 50, 24, row.ink, 850, 'center');
    drawText(row.label, device.sx + 91, yy + 34, 17, '#20384f', 800);
    drawText(row.sub, device.sx + 91, yy + 58, 12, '#8797a6', 500);
    roundRect(device.sx + device.sw - 64, yy + 22, 38, 38, 13, '#edf5fc');
    drawText('+', device.sx + device.sw - 45, yy + 49, 23, '#1872c2', 800, 'center');
    ctx.restore();
  });
  const cartY = rowY + 314;
  const cart = easeOut((time - 1.1) / .5);
  ctx.globalAlpha = cart;
  roundRect(device.sx + 14, cartY, device.sw - 28, 174, 21, '#edf5fc');
  drawText('PANIER', device.sx + 33, cartY + 35, 13, '#52718e', 850);
  drawText(`${time > 2.4 ? '2 articles' : 'Articles sélectionnés'}`, device.sx + 33, cartY + 70, 18, '#18334d', 800);
  drawText('Total calculé à la validation', device.sx + 33, cartY + 98, 12, '#76889a', 550);
  roundRect(device.sx + 23, cartY + 116, device.sw - 46, 44, 14, '#126fd0');
  drawText('ENREGISTRER LA VENTE', device.sx + device.sw / 2, cartY + 144, 13, '#ffffff', 850, 'center');
  drawTap(device.sx + device.sw / 2, cartY + 137, time, 2.2);
  const receipt = easeOut((time - 3.2) / .45);
  ctx.save(); ctx.globalAlpha = receipt; ctx.translate(0, (1 - receipt) * 80);
  ctx.shadowColor = '#071b2d50'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 12;
  roundRect(618, 1297, 390, 228, 25, '#ffffff', '#dce8f2', 2); ctx.shadowColor = 'transparent';
  roundRect(646, 1326, 56, 56, 17, '#e7f8ee');
  drawText('✓', 674, 1365, 34, '#168255', 900, 'center');
  drawText('Vente enregistrée', 720, 1354, 21, '#17334d', 850);
  drawText('Reçu disponible dans l’historique.', 648, 1420, 15, '#75899d', 600);
  drawPill('REÇU PRÊT', 648, 1453, 165, '#edf5fc', '#2575b6', 38);
  ctx.restore();
  drawMascot('pointing', 850, 1780, 560, time, { alpha: .98, drift: Math.sin(time * 1.1) * 9 });
  drawSpeech('Exemple : vous vendez du riz et une boisson. La vente est enregistrée, le reçu reste dans l’historique.', 620, 790, 389, time - .7, { size: 24, height: 232 });
}

function drawStock(time) {
  drawBackground(time, 'mint');
  drawHeading('Exemple 2 · Le stock', 'Repérer ce qui', 'est à vérifier.', 'Le catalogue donne un aperçu des articles et de leur état.', time);
  drawPill('APERÇU ILLUSTRATIF', 84, 459, 280, '#114b4c', '#8ae3bd', 42);
  const device = drawPhone(444, 573, 530, 1210, time, 'android');
  const appY = drawAppHeader(device);
  drawText('Marchandises & stock', device.sx + 20, appY + 28, 20, '#17334c', 850);
  drawText('Catalogue', device.sx + 20, appY + 64, 14, '#718598', 600);
  const items = [
    { name: 'Riz', label: 'Stock suivi', tint: '#e8f5ee', ink: '#1777c5', bar: .79 },
    { name: 'Huile', label: 'Stock suivi', tint: '#e8f5ee', ink: '#16885d', bar: .57 },
    { name: 'Boisson', label: 'À surveiller', tint: '#fff2df', ink: '#c57c28', bar: .23 },
  ];
  items.forEach((item, i) => {
    const q = easeOut((time - i * .22) / .4);
    const yy = appY + 89 + i * 142 - Math.sin(clamp((time - 1) / 4) * Math.PI) * 16;
    ctx.save(); ctx.globalAlpha = q; ctx.translate(0, (1 - q) * 32);
    roundRect(device.sx + 14, yy, device.sw - 28, 123, 17, '#ffffff', '#e4eee8');
    roundRect(device.sx + 26, yy + 17, 46, 46, 14, item.tint);
    drawText(item.name[0], device.sx + 49, yy + 48, 20, item.ink, 850, 'center');
    drawText(item.name, device.sx + 86, yy + 40, 17, '#18364a', 800);
    drawText(item.label, device.sx + 86, yy + 65, 13, i === 2 ? '#bd7626' : '#829496', 600);
    roundRect(device.sx + 27, yy + 91, device.sw - 54, 9, 5, '#e8efeb');
    const amount = i === 2 ? mix(item.bar, .55, easeOut((time - 3.2) / 1.3)) : item.bar;
    roundRect(device.sx + 27, yy + 91, (device.sw - 54) * amount, 9, 5, item.ink);
    ctx.restore();
  });
  const alert = easeOut((time - .8) / .55);
  ctx.save(); ctx.globalAlpha = alert; ctx.translate((1 - alert) * -180, 0);
  ctx.shadowColor = '#00171540'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 13;
  roundRect(72, 790, 390, 290, 29, '#ffffff'); ctx.shadowColor = 'transparent';
  roundRect(101, 820, 60, 60, 18, '#fff2de');
  drawText('!', 131, 863, 34, '#c77b23', 900, 'center');
  drawText('À surveiller', 180, 845, 24, '#17364a', 850);
  drawText('Exemple de repère de stock.', 101, 929, 17, '#738799', 600);
  roundRect(101, 971, 330, 72, 18, '#eaf8f0');
  drawText('Vérifier le réapprovisionnement', 266, 1016, 14, '#19704e', 800, 'center');
  ctx.restore();
  drawMascot('walk', 265, 1790, 580, time, { alpha: .96, drift: Math.sin(time * 1.45) * 18, tilt: Math.sin(time * 2) * .015, bounce: 6 });
  drawSpeech('Avant de servir le prochain client, un coup d’œil au stock.', 75, 1130, 400, time - 1.15, { size: 25, height: 190 });
}

function drawIphone(time) {
  drawBackground(time, 'warm');
  drawHeading('Et sur iPhone ?', 'Safari ouvre', 'la version web.', 'ShopFlow s’ouvre dans le navigateur; ce n’est pas une application IPA/App Store.', time, true);
  drawPill('WEB APP · SAFARI', 84, 459, 250, '#eee7ff', '#6951a5', 42);
  const device = drawPhone(251, 574, 578, 1205, time, 'iphone');
  const appY = drawAppHeader(device);
  drawText('Les repères du jour', device.sx + 20, appY + 63, 23, '#18334d', 850);
  const cards = [
    { x: device.sx + 15, label: 'VENTES', color: '#2378bc', tint: '#e9f3ff', glyph: '↗' },
    { x: device.sx + device.sw / 2 + 4, label: 'DÉPENSES', color: '#27815a', tint: '#eaf8f0', glyph: '−' },
    { x: device.sx + 15, label: 'STOCK', color: '#aa7029', tint: '#fff2e1', glyph: '▤' },
    { x: device.sx + device.sw / 2 + 4, label: 'CRÉDITS', color: '#7157b3', tint: '#f2edff', glyph: '◷' },
  ];
  cards.forEach((card, i) => {
    const q = easeOut((time - i * .15) / .4);
    const yy = appY + 89 + Math.floor(i / 2) * 145;
    ctx.save(); ctx.globalAlpha = q; ctx.translate(0, (1 - q) * 22);
    roundRect(card.x, yy, device.sw / 2 - 23, 128, 18, card.tint);
    drawText(card.glyph, card.x + 22, yy + 39, 26, card.color, 850);
    drawText(card.label, card.x + 20, yy + 75, 12, card.color, 850);
    roundRect(card.x + 20, yy + 94, device.sw / 2 - 65, 7, 4, '#ffffffc0');
    roundRect(card.x + 20, yy + 94, (device.sw / 2 - 65) * (.52 + .1 * Math.sin(time * 2 + i)), 7, 4, card.color);
    ctx.restore();
  });
  const action = easeOut((time - 1.7) / .5);
  ctx.save(); ctx.globalAlpha = action; ctx.translate(0, (1 - action) * 90);
  ctx.shadowColor = '#14233436'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  roundRect(95, 1285, 490, 232, 25, '#ffffff'); ctx.shadowColor = 'transparent';
  drawText('Depuis Safari', 128, 1331, 18, '#697c8e', 700);
  roundRect(127, 1350, 424, 96, 18, '#eef4fb');
  roundRect(148, 1368, 59, 59, 16, '#dceaff');
  drawText('+', 178, 1408, 35, '#176fc4', 800, 'center');
  drawText('Ajouter à l’écran d’accueil', 227, 1408, 16, '#22384d', 800);
  drawText('L’icône sera accessible depuis l’accueil.', 128, 1482, 15, '#738599', 650);
  ctx.restore();
  drawMascot('pointing', 902, 1770, 470, time, { alpha: .97, drift: Math.sin(time * 1.2) * 8 });
  drawSpeech('Sur iPhone : ouvrez /app/ dans Safari, puis ajoutez l’icône à l’accueil.', 620, 820, 390, time - .8, { size: 24, height: 204 });
  drawTap(741, 1640, time, 1.45);
}

function drawActivity(time) {
  drawBackground(time, 'violet');
  drawHeading('Et pour le suivi ?', 'Retrouver', 'ses repères.', 'Ventes, dépenses et crédits saisis dans ShopFlow, réunis pour faire le point.', time);
  const x = 82, y = 555, w = 916, h = 1035;
  const entry = easeOut(time / .6);
  ctx.save(); ctx.globalAlpha = entry; ctx.translate((1 - entry) * 65, 0);
  ctx.shadowColor = '#02051056'; ctx.shadowBlur = 38; ctx.shadowOffsetY = 18;
  roundRect(x, y, w, h, 34, '#ffffff'); ctx.shadowColor = 'transparent';
  drawText('SHOPFLOW  /  TABLEAU DE BORD', x + 42, y + 70, 17, '#71869b', 850);
  drawText('Votre activité', x + 42, y + 136, 38, '#17334d', 850);
  const blocks = [
    { x: x + 38, title: 'Ventes', label: 'Enregistrées', color: '#1476c5', tint: '#eaf4ff' },
    { x: x + 326, title: 'Dépenses', label: 'Saisies', color: '#258259', tint: '#ebf8f0' },
    { x: x + 614, title: 'Crédits', label: 'À suivre', color: '#7153b3', tint: '#f2efff' },
  ];
  blocks.forEach((b, i) => {
    const q = easeOut((time - i * .19) / .45);
    ctx.save(); ctx.globalAlpha = q;
    roundRect(b.x, y + 177, 252, 160, 22, b.tint);
    drawText(b.title.toUpperCase(), b.x + 20, y + 222, 15, b.color, 850);
    drawText(b.label, b.x + 20, y + 275, 23, '#203a52', 800);
    drawText(i === 0 ? '↗' : i === 1 ? '−' : '◷', b.x + 216, y + 222, 29, b.color, 850, 'center');
    ctx.restore();
  });
  drawText('EXEMPLE DE TENDANCE', x + 44, y + 408, 16, '#72859a', 850);
  const chartX = x + 60, chartY = y + 840, chartW = 770, chartH = 340;
  ctx.strokeStyle = '#e8edf2'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const gy = chartY - i * 82;
    ctx.beginPath(); ctx.moveTo(chartX, gy); ctx.lineTo(chartX + chartW, gy); ctx.stroke();
  }
  const values = [.28, .5, .4, .72, .55, .84, .65, .94];
  values.forEach((value, i) => {
    const q = easeOut((time - .35 - i * .13) / .48);
    const barH = chartH * value * q;
    const barX = chartX + i * 94;
    const color = i > 5 ? '#57d6a6' : '#1685e0';
    const gr = ctx.createLinearGradient(0, chartY - barH, 0, chartY);
    gr.addColorStop(0, color); gr.addColorStop(1, i > 5 ? '#b0f1d2' : '#96d5ff');
    roundRect(barX, chartY - barH, 42, barH, 18, gr);
  });
  ctx.restore();
  drawMascot('happy', 840, 1778, 330, time, { alpha: .98, drift: Math.sin(time * 1.4) * 7, bounce: 6 });
  drawSpeech('Faites le point sur ce que vous avez saisi.', 580, 1513, 400, time - .7, { size: 24, height: 142 });
}

function drawEnd(time) {
  drawBackground(time, 'night');
  const q = easeOut(time / .55);
  drawLogo(540, mix(190, 315, q), 174, (1 - q) * .17, q);
  drawText('ShopFlow', 540, 570, 82, '#f7fbff', 900, 'center');
  drawText('Les essentiels du commerce, au même endroit.', 540, 635, 29, '#b4c9da', 650, 'center', 920);
  drawMascot('happy', 820, 1660, 495, time, { alpha: .98, drift: (1 - q) * 150, bounce: 8 });
  const card = easeOut((time - .45) / .4);
  ctx.globalAlpha = card;
  roundRect(83, 820, 520, 286, 30, '#103653', '#2876a8', 2);
  drawText('ANDROID', 123, 875, 17, '#80c4ff', 850);
  drawText('Application de gestion', 123, 920, 24, '#f2f8fc', 800);
  drawText('IPHONE', 123, 988, 17, '#8ce2ba', 850);
  drawText('Web app dans Safari', 123, 1033, 24, '#f2f8fc', 800);
  roundRect(83, 1167, 520, 86, 43, '#1174d8');
  drawText('DÉCOUVREZ SHOPFLOW', 343, 1222, 20, '#ffffff', 900, 'center');
  drawText('Les écrans de ce film sont illustratifs.', 540, 1438, 21, '#a6bdd0', 650, 'center');
  ctx.globalAlpha = 1;
}

const scenes = [
  { start: 0, end: 3.5, label: 'Présentation', draw: drawIntro },
  { start: 3.5, end: 6.5, label: 'La question', draw: drawQuestion },
  { start: 6.5, end: 10, label: 'La définition', draw: drawDefinition },
  { start: 10, end: 17, label: 'Exemple Android · une vente', draw: drawAndroidSale },
  { start: 17, end: 23, label: 'Exemple · le stock', draw: drawStock },
  { start: 23, end: 29, label: 'iPhone · Safari', draw: drawIphone },
  { start: 29, end: 34, label: 'Le suivi d’activité', draw: drawActivity },
  { start: 34, end: 38, label: 'ShopFlow', draw: drawEnd },
];

function drawTransition(time) {
  const scene = scenes.slice(1).find((item) => time >= item.start && time < item.start + .3);
  if (!scene) return;
  const progress = (time - scene.start) / .3;
  const alpha = (1 - easeOut(progress)) * .72;
  const index = scenes.indexOf(scene);
  ctx.save(); ctx.globalAlpha = alpha;
  if (index % 3 === 1) {
    ctx.strokeStyle = '#a3e5ff'; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.arc(540, 960, mix(35, 1250, easeOut(progress)), 0, Math.PI * 2); ctx.stroke();
  } else if (index % 3 === 2) {
    const x = mix(1140, -400, easeInOut(progress));
    ctx.fillStyle = '#f2fbff'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 180, 0); ctx.lineTo(x - 300, 1920); ctx.lineTo(x - 480, 1920); ctx.closePath(); ctx.fill();
  } else {
    const y = mix(-250, 1940, easeInOut(progress));
    ctx.fillStyle = '#62d6e5'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y - 220); ctx.lineTo(1080, y - 95); ctx.lineTo(0, y + 125); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function renderAt(time) {
  const t = clamp(time, 0, duration);
  const scene = scenes.find((item) => t >= item.start && t < item.end) || scenes[scenes.length - 1];
  scene.draw(t - scene.start);
  drawTransition(t);
  progressFill.style.width = `${(t / duration) * 100}%`;
  if (animationRunning) status.textContent = `${scene.label} · ${Math.floor(t).toString().padStart(2, '0')} s / ${duration} s`;
}

function animationFrame(now) {
  if (!animationRunning) return;
  const t = (now - animationStart) / 1000;
  if (t >= duration) {
    renderAt(duration);
    animationRunning = false;
    if (completionCallback) completionCallback();
    completionCallback = null;
    animationFrameId = 0;
    status.textContent = 'Film terminé. Tu peux le relancer ou enregistrer la vidéo.';
    return;
  }
  renderAt(t);
  animationFrameId = requestAnimationFrame(animationFrame);
}

function play(onComplete) {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  completionCallback = onComplete || null;
  animationRunning = true;
  animationStart = performance.now();
  status.textContent = 'Lecture en cours… garde cette page au premier plan.';
  renderAt(0);
  animationFrameId = requestAnimationFrame(animationFrame);
}

replayButton.addEventListener('click', () => play());

exportButton.addEventListener('click', () => {
  if (!canvas.captureStream || !window.MediaRecorder) {
    status.textContent = 'Ce navigateur ne peut pas enregistrer le film. Essaie Chrome ou Edge à jour.';
    return;
  }
  const formats = [
    { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  const selected = formats.find(({ mime }) => MediaRecorder.isTypeSupported(mime));
  if (!selected) {
    status.textContent = 'Aucun format vidéo compatible trouvé. Essaie Chrome ou Edge à jour.';
    return;
  }
  exportButton.disabled = true; replayButton.disabled = true;
  exportButton.textContent = '● Enregistrement…';
  status.textContent = 'Enregistrement en cours… ne ferme pas la page.';
  const stream = canvas.captureStream(30);
  const chunks = [];
  let recorder;
  let recordedMime = selected.mime;
  let recordedExt = selected.ext;
  try {
    recorder = new MediaRecorder(stream, { mimeType: selected.mime, videoBitsPerSecond: 8_000_000 });
  } catch {
    recorder = new MediaRecorder(stream);
    recordedMime = recorder.mimeType || 'video/webm';
    recordedExt = recordedMime.includes('mp4') ? 'mp4' : 'webm';
  }
  recorder.ondataavailable = (event) => { if (event.data && event.data.size) chunks.push(event.data); };
  recorder.onerror = () => {
    status.textContent = 'L’enregistrement a échoué. Essaie un navigateur de bureau récent.';
    stream.getTracks().forEach((track) => track.stop());
    exportButton.disabled = false; replayButton.disabled = false;
    exportButton.textContent = '↓ Enregistrer la vidéo';
  };
  recorder.onstop = () => {
    const mime = recorder.mimeType || recordedMime;
    if (mime.includes('mp4')) recordedExt = 'mp4';
    else if (mime.includes('webm')) recordedExt = 'webm';
    const blob = new Blob(chunks, { type: mime });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl; link.download = `ShopFlow-motion.${recordedExt}`;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    stream.getTracks().forEach((track) => track.stop());
    exportButton.disabled = false; replayButton.disabled = false;
    exportButton.textContent = '↓ Enregistrer la vidéo';
    status.textContent = `Téléchargement lancé : ShopFlow-motion.${recordedExt}. ${recordedExt === 'webm' ? 'Convertis-le en MP4 dans CapCut ou Shotcut.' : 'Le fichier est déjà au format MP4.'}`;
  };
  renderAt(0);
  recorder.start(250);
  play(() => recorder.state !== 'inactive' && recorder.stop());
});

const requiredImages = [icon, ...Object.values(mascot)];
let imagesReady = 0;
const repaintWhenReady = () => {
  imagesReady += 1;
  if (imagesReady >= requiredImages.length) renderAt(0);
};
requiredImages.forEach((image) => {
  if (image.complete && image.naturalWidth) repaintWhenReady();
  else image.addEventListener('load', repaintWhenReady, { once: true });
});
renderAt(0);
