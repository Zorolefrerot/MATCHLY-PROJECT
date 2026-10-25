const canvas = document.querySelector('#motion');
const ctx = canvas.getContext('2d', { alpha: false });
const duration = 36;
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
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
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
    } else {
      line = candidate;
    }
  }
  if (line) ctx.fillText(line, x, y + lineNo * lineHeight);
}

function drawBackground(time, theme = 'night') {
  const themes = {
    night: ['#071827', '#0a2b48', '#123858'],
    ice: ['#f8fbff', '#e5f1fb', '#d1e6f8'],
    mint: ['#062b2b', '#0b4b4b', '#12636a'],
    violet: ['#18142f', '#30245b', '#433474'],
    warm: ['#fff8f0', '#f7e9db', '#e9ddff'],
  };
  const [top, middle, bottom] = themes[theme] || themes.night;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.52, middle);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const isLight = theme === 'ice' || theme === 'warm';
  const glow = ctx.createRadialGradient(820 + Math.sin(time * 0.47) * 150, 390, 25, 760, 480, 780);
  glow.addColorStop(0, isLight ? 'rgba(36,135,219,.17)' : 'rgba(40,153,255,.24)');
  glow.addColorStop(1, 'rgba(7,24,39,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // A few drifting glints give depth without turning every scene into the same grid.
  for (let i = 0; i < 17; i += 1) {
    const x = (i * 211 + Math.sin(time * (0.55 + i % 3 * 0.12) + i) * 78 + 1080) % 1080;
    const y = (i * 173 + Math.cos(time * 0.35 + i * 1.7) * 60 + 1920) % 1920;
    const radius = 2 + (i % 3);
    ctx.globalAlpha = (isLight ? 0.08 : 0.15) + (Math.sin(time * 1.2 + i) + 1) * 0.065;
    ctx.fillStyle = i % 4 === 0 ? '#64e2ae' : '#9bd1ff';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPill(text, x, y, width, background = '#eaf4ff', color = '#1868b7', h = 48) {
  roundRect(x, y, width, h, h / 2, background);
  drawText(text, x + width / 2, y + h * 0.66, h * 0.37, color, 800, 'center', width - 18);
}

function drawHeading(kicker, line1, line2, subtitle, time, light = false, align = 'left') {
  const p = easeOut(time / 0.62);
  const color = light ? '#142b43' : '#f7fbff';
  const subColor = light ? '#5c7185' : '#b5c9da';
  const x = align === 'center' ? 540 : 86;
  const textAlign = align;
  const drift = (1 - p) * (align === 'center' ? 0 : 45);
  ctx.save();
  ctx.globalAlpha = p;
  drawText(kicker.toUpperCase(), x + drift, 172, 20, light ? '#2477bc' : '#70e2ae', 850, textAlign, align === 'center' ? 900 : undefined);
  drawText(line1, x + drift, 276, 63, color, 850, textAlign, align === 'center' ? 920 : undefined);
  if (line2) drawText(line2, x + drift, 350, 63, color, 850, textAlign, align === 'center' ? 920 : undefined);
  drawWrapped(subtitle, x + drift, line2 ? 414 : 350, align === 'center' ? 880 : 845, 35, 23, subColor, 520, textAlign);
  ctx.restore();
}

function drawLogo(x, y, size, rotation = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.shadowColor = '#0000004a';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.08;
  roundRect(-size / 2, -size / 2, size, size, size * 0.23, '#ffffff');
  ctx.shadowColor = 'transparent';
  if (icon.complete && icon.naturalWidth) ctx.drawImage(icon, -size * 0.43, -size * 0.43, size * 0.86, size * 0.86);
  ctx.restore();
}

function drawSpeech(text, x, y, width, time, light = true) {
  const p = easeOut(time / 0.32);
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(0, (1 - p) * 18);
  ctx.shadowColor = '#03142342';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 9;
  roundRect(x, y, width, 104, 24, light ? '#ffffff' : '#103958', light ? '#d8e7f3' : '#276089', 2);
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.moveTo(x + width - 58, y + 96);
  ctx.lineTo(x + width - 28, y + 96);
  ctx.lineTo(x + width - 46, y + 122);
  ctx.closePath();
  ctx.fillStyle = light ? '#ffffff' : '#103958';
  ctx.fill();
  drawWrapped(text, x + 23, y + 43, width - 46, 31, 19, light ? '#172f48' : '#f5f9fc', 760);
  ctx.restore();
}

// A friendly young presenter, drawn in Canvas so the mascot remains crisp in the 1080×1920 export.
function drawPresenter(x, y, scale, time, pose = 'open', opacity = 1) {
  const bob = Math.sin(time * 3.1) * 5;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);

  // Soft contact shadow and back arm.
  ctx.fillStyle = '#03111d35';
  ctx.beginPath(); ctx.ellipse(0, 474, 170, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#174b75';
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.moveTo(-93, 293); ctx.quadraticCurveTo(-172, 328, -174, 390); ctx.stroke();
  ctx.fillStyle = '#8a5033';
  ctx.beginPath(); ctx.arc(-174, 393, 20, 0, Math.PI * 2); ctx.fill();

  // Jacket and shirt.
  ctx.fillStyle = '#123c63';
  ctx.beginPath();
  ctx.moveTo(-122, 246); ctx.quadraticCurveTo(-105, 218, -67, 211);
  ctx.lineTo(-34, 198); ctx.lineTo(32, 198); ctx.lineTo(68, 211);
  ctx.quadraticCurveTo(110, 220, 125, 260); ctx.lineTo(150, 468);
  ctx.quadraticCurveTo(0, 500, -150, 468); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f5f7f4';
  ctx.beginPath(); ctx.moveTo(-39, 203); ctx.lineTo(0, 248); ctx.lineTo(40, 203); ctx.lineTo(24, 435); ctx.lineTo(-24, 435); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#60d7a5';
  ctx.beginPath(); ctx.moveTo(-8, 245); ctx.lineTo(8, 245); ctx.lineTo(13, 340); ctx.lineTo(0, 360); ctx.lineTo(-13, 340); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#dbe6ec'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-74, 228); ctx.lineTo(-31, 281); ctx.lineTo(-18, 214); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(74, 228); ctx.lineTo(31, 281); ctx.lineTo(18, 214); ctx.stroke();
  ctx.fillStyle = '#65d9a8'; ctx.beginPath(); ctx.arc(91, 330, 6, 0, Math.PI * 2); ctx.fill();

  // Raised gesturing arm (the pose changes between scenes).
  ctx.strokeStyle = '#174b75';
  ctx.lineWidth = 38;
  ctx.beginPath();
  if (pose === 'wave') {
    ctx.moveTo(88, 273); ctx.quadraticCurveTo(152, 246, 139, 185); ctx.quadraticCurveTo(126, 142, 143, 106);
  } else if (pose === 'point-left') {
    ctx.moveTo(-94, 279); ctx.quadraticCurveTo(-164, 251, -188, 226); ctx.lineTo(-235, 226);
  } else if (pose === 'point-right') {
    ctx.moveTo(94, 278); ctx.quadraticCurveTo(168, 246, 195, 205); ctx.lineTo(243, 205);
  } else {
    const sway = Math.sin(time * 1.8) * 13;
    ctx.moveTo(96, 278); ctx.quadraticCurveTo(176, 260 + sway, 202, 316 + sway);
  }
  ctx.stroke();
  const handX = pose === 'point-left' ? -240 : pose === 'point-right' ? 250 : pose === 'wave' ? 145 : 204;
  const handY = pose === 'wave' ? 100 + Math.sin(time * 7) * 7 : pose === 'point-left' ? 226 : pose === 'point-right' ? 205 : 320 + Math.sin(time * 2) * 13;
  ctx.fillStyle = '#8a5033';
  ctx.beginPath(); ctx.arc(handX, handY, 23, 0, Math.PI * 2); ctx.fill();
  if (pose === 'wave') {
    ctx.strokeStyle = '#8a5033'; ctx.lineWidth = 12;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.moveTo(handX + i * 7 - 10, handY - 10); ctx.lineTo(handX + i * 8 - 15, handY - 38 - i * 3); ctx.stroke();
    }
  } else if (pose === 'point-left' || pose === 'point-right') {
    const dir = pose === 'point-left' ? -1 : 1;
    ctx.strokeStyle = '#8a5033'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(handX, handY); ctx.lineTo(handX + dir * 28, handY - 7); ctx.stroke();
  }

  // Neck, ears, face and hair.
  ctx.fillStyle = '#75432f';
  roundRect(-35, 176, 70, 72, 24, '#75432f');
  ctx.fillStyle = '#8c5337';
  ctx.beginPath(); ctx.ellipse(0, 112, 91, 111, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-87, 130, 16, 25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(87, 130, 16, 25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#633622';
  ctx.beginPath(); ctx.ellipse(0, 48, 93, 61, 0, Math.PI, Math.PI * 2); ctx.fill();
  const curls = [[-76,58,21],[-48,30,20],[-15,21,22],[20,24,22],[53,34,20],[78,59,19],[-88,81,15],[91,82,15]];
  curls.forEach(([cx, cy, r], i) => {
    ctx.fillStyle = i % 2 ? '#48291f' : '#633622';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  });
  // Brows and softly smiling mouth.
  ctx.strokeStyle = '#48291f'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-60, 91); ctx.quadraticCurveTo(-39, 78, -17, 88); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(17, 88); ctx.quadraticCurveTo(40, 78, 61, 91); ctx.stroke();
  ctx.fillStyle = '#f2c7a5';
  ctx.beginPath(); ctx.arc(-50, 119, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(50, 119, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#593125'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-25, 160); ctx.quadraticCurveTo(0, 180, 27, 158); ctx.stroke();
  ctx.fillStyle = '#f5f5f2';
  ctx.beginPath(); ctx.moveTo(-14, 162); ctx.quadraticCurveTo(0, 171, 14, 162); ctx.lineTo(8, 170); ctx.lineTo(-8, 170); ctx.closePath(); ctx.fill();

  // Distinct chocolate-tinted glasses: visible brown lenses, dark frame and a warm reflection.
  ctx.fillStyle = 'rgba(86, 48, 28, .74)';
  ctx.strokeStyle = '#40261d'; ctx.lineWidth = 8;
  roundRect(-73, 99, 64, 47, 15, 'rgba(86, 48, 28, .74)', '#40261d', 8);
  roundRect(9, 99, 64, 47, 15, 'rgba(86, 48, 28, .74)', '#40261d', 8);
  ctx.beginPath(); ctx.moveTo(-9, 118); ctx.quadraticCurveTo(0, 110, 9, 118); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-73, 115); ctx.lineTo(-88, 108); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(73, 115); ctx.lineTo(88, 108); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,221,177,.72)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-60, 110); ctx.lineTo(-45, 105); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(22, 110); ctx.lineTo(37, 105); ctx.stroke();

  ctx.restore();
}

function drawPhone(x, y, w, h, time, type = 'android') {
  const isApple = type === 'iphone';
  const inP = easeOut(time / 0.72);
  ctx.save();
  ctx.globalAlpha = inP;
  ctx.translate((1 - inP) * (isApple ? 120 : -145), (1 - inP) * 25);
  ctx.rotate((isApple ? -1 : 1) * (1 - inP) * 0.035);
  ctx.shadowColor = '#00101d70'; ctx.shadowBlur = 48; ctx.shadowOffsetY = 27;
  roundRect(x, y, w, h, 67, '#101a24', '#89a6be', 4);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  roundRect(x + 15, y + 16, w - 30, h - 32, 53, '#fbfcfd');
  const sx = x + 31, sy = y + 30, sw = w - 62, sh = h - 60;
  if (isApple) {
    roundRect(x + w / 2 - 70, y + 25, 140, 24, 14, '#101a24');
    drawText('9:41', sx + 16, sy + 29, 15, '#1c2a38', 800);
    drawText('●●●  ▰', sx + sw - 18, sy + 29, 14, '#1c2a38', 700, 'right');
    roundRect(sx + 10, sy + 48, sw - 20, 55, 20, '#edf1f5');
    drawText('aA', sx + 36, sy + 82, 16, '#5b6c7b', 700);
    drawText('/app/', sx + sw / 2, sy + 82, 18, '#25394b', 700, 'center');
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
  return { sx, sy: sy + (isApple ? 114 : 47), sw, sh: sh - (isApple ? 181 : 67), isApple };
}

function drawAppHeader(screen, yOffset = 0, time = 0) {
  const { sx, sy, sw } = screen;
  const y = sy + yOffset;
  roundRect(sx + 17, y + 13, 37, 37, 11, '#e7f2ff');
  if (icon.complete && icon.naturalWidth) ctx.drawImage(icon, sx + 21, y + 17, 29, 29);
  drawText('ShopFlow', sx + 66, y + 39, 21, '#173451', 850);
  roundRect(sx + sw - 56, y + 12, 39, 39, 13, '#eef5fa');
  drawText('•••', sx + sw - 36, y + 38, 15, '#4a6b87', 800, 'center');
  drawText('Bonjour 👋', sx + 20, y + 92, 17, '#718397', 600);
  drawText('Votre activité', sx + 20, y + 126, 25, '#17314a', 850);
  return y + 148;
}

function drawTap(x, y, time, start) {
  const p = clamp((time - start) / 0.75);
  if (!p) return;
  ctx.save();
  ctx.globalAlpha = 1 - p * 0.75;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, 13 + p * 37, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#46a9ffcc'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawIntro(time) {
  drawBackground(time, 'night');
  const logoT = 0.76 + easeOut(time / 0.8) * 0.24;
  drawLogo(540, mix(224, 260, easeOut(time / 0.62)), 168, (1 - logoT) * -0.2, logoT);
  const title = 0.7 + easeOut(time / 0.7) * 0.3;
  ctx.globalAlpha = title;
  drawText('ShopFlow', 540, 490, 76, '#f6f9fd', 900, 'center');
  drawText('Le commerce, mieux organisé.', 540, 555, 26, '#a9c2d5', 600, 'center');
  drawPresenter(mix(625, 540, easeOut(time / 0.6)), 1250, 1.04, time, 'wave', 0.78 + easeOut(time / 0.7) * 0.22);
  drawSpeech('Salut ! Je te présente ShopFlow.', 440, 745, 550, time - 1.05, false);
  drawPill('CAISSE  ·  STOCK  ·  SUIVI', 294, 1815, 492, '#123c5a', '#81e0b5', 48);
}

function drawChallenge(time) {
  drawBackground(time, 'violet');
  drawHeading('Le quotidien d’un commerce', 'Moins de notes.', 'Plus de clarté.', 'Ventes, articles et dépenses : retrouvez vos repères au même endroit.', time);
  drawPresenter(190, 1280, 0.78, time, 'point-right', easeOut(time / 0.5));
  drawSpeech('On remet tout en ordre.', 96, 690, 360, time - 0.3);

  // Loose paper slips swoop together into one clear workflow.
  const papers = [
    { x: 575, y: 735, rot: -0.14, label: 'VENTES', tint: '#fff1db', color: '#a16a24' },
    { x: 705, y: 920, rot: 0.12, label: 'ARTICLES', tint: '#e4f2ff', color: '#2475b5' },
    { x: 565, y: 1110, rot: -0.09, label: 'DÉPENSES', tint: '#e8f7ee', color: '#248057' },
  ];
  papers.forEach((paper, i) => {
    const settle = easeInOut((time - i * 0.23) / 1.55);
    const x = mix(paper.x + 75, 680 + (i - 1) * 24, settle);
    const y = mix(paper.y + Math.sin(time * 6 + i) * 38, 830 + i * 132, settle);
    const rot = mix(paper.rot + Math.sin(time * 4 + i) * 0.06, 0, settle);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = '#080b2633'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 12;
    roundRect(-166, -78, 332, 156, 22, paper.tint);
    ctx.shadowColor = 'transparent';
    drawText(paper.label, -130, -28, 17, paper.color, 850);
    for (let j = 0; j < 3; j += 1) {
      roundRect(-130, 4 + j * 27, 170 + ((i + j) % 2) * 56, 7, 4, '#9db1c1aa');
    }
    drawText(i === 0 ? '✓' : '•', 112, 45, 32, paper.color, 900, 'center');
    ctx.restore();
  });
  const check = easeOut((time - 1.5) / 0.45);
  ctx.globalAlpha = check;
  roundRect(559, 1460, 374, 76, 38, '#61dda9');
  drawText('Une vue plus claire  ✓', 746, 1508, 23, '#073322', 850, 'center');
  ctx.globalAlpha = 1;
}

function drawCheckout(time) {
  drawBackground(time, 'ice');
  drawHeading('Android · application ShopFlow', 'Encaissement,', 'pas à pas.', 'Sélectionnez les articles, enregistrez la vente et retrouvez le reçu.', time, true);
  drawPill('APERÇU ILLUSTRATIF', 84, 472, 277, '#e7f2fc', '#2876b6', 43);
  const device = drawPhone(265, 585, 550, 1190, time, 'android');
  const appY = drawAppHeader(device, 0, time);
  drawText('Nouvelle vente', device.sx + 20, appY + 29, 19, '#6a7e91', 700);
  drawText('Choisir des articles', device.sx + 20, appY + 69, 25, '#1a334d', 850);
  const rows = [
    { label: 'Riz', sub: 'Article du catalogue', tint: '#eaf4ff', accent: '#1475d1' },
    { label: 'Huile', sub: 'Article du catalogue', tint: '#e9f8f1', accent: '#16855f' },
    { label: 'Boissons', sub: 'Article du catalogue', tint: '#f2efff', accent: '#7554c7' },
  ];
  const rowY = appY + 100;
  rows.forEach((row, i) => {
    const p = easeOut((time - 0.35 - i * 0.2) / 0.36);
    const yy = rowY + i * 102;
    ctx.save(); ctx.globalAlpha = p; ctx.translate((1 - p) * 80, 0);
    roundRect(device.sx + 15, yy, device.sw - 30, 84, 17, '#ffffff', '#e8edf2');
    roundRect(device.sx + 26, yy + 14, 54, 54, 15, row.tint);
    drawText(row.label[0], device.sx + 53, yy + 51, 25, row.accent, 850, 'center');
    drawText(row.label, device.sx + 95, yy + 36, 18, '#21384f', 800);
    drawText(row.sub, device.sx + 95, yy + 60, 13, '#8797a6', 500);
    roundRect(device.sx + device.sw - 66, yy + 22, 38, 38, 13, '#edf5fc');
    drawText('+', device.sx + device.sw - 47, yy + 49, 24, '#1872c2', 800, 'center');
    ctx.restore();
  });
  const cartY = rowY + 320;
  const p = easeOut((time - 1.1) / 0.5);
  ctx.globalAlpha = p;
  roundRect(device.sx + 15, cartY, device.sw - 30, 185, 22, '#edf5fc');
  drawText('PANIER', device.sx + 35, cartY + 38, 14, '#52718e', 850);
  drawText(`${Math.floor(clamp((time - 1.1) / 2.8) * 3)} article${time > 3.7 ? 's' : ''} sélectionné${time > 3.7 ? 's' : ''}`, device.sx + 35, cartY + 75, 19, '#18334d', 800);
  drawText('Total calculé à la validation', device.sx + 35, cartY + 104, 13, '#76889a', 550);
  roundRect(device.sx + 25, cartY + 121, device.sw - 50, 48, 15, '#126fd0');
  drawText('ENREGISTRER LA VENTE', device.sx + device.sw / 2, cartY + 151, 14, '#ffffff', 850, 'center');
  drawTap(device.sx + device.sw / 2, cartY + 145, time, 2.55);
  const receipt = easeOut((time - 3.15) / 0.46);
  ctx.save(); ctx.globalAlpha = receipt; ctx.translate(0, (1 - receipt) * 120);
  ctx.shadowColor = '#071b2d52'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 14;
  roundRect(647, 1330, 352, 236, 26, '#ffffff', '#dbe8f2', 2);
  ctx.shadowColor = 'transparent';
  roundRect(675, 1360, 55, 55, 18, '#e7f8ee');
  drawText('✓', 703, 1399, 34, '#168255', 900, 'center');
  drawText('Vente enregistrée', 750, 1388, 21, '#17334d', 850);
  drawText('Reçu disponible dans l’historique.', 678, 1454, 15, '#75899d', 600);
  drawPill('REÇU PRÊT', 679, 1480, 158, '#edf5fc', '#2575b6', 36);
  ctx.restore();
  drawPresenter(895, 1575, 0.48, time, 'point-left', easeOut((time - 0.75) / 0.5));
  drawSpeech('La vente et son reçu restent dans l’historique.', 668, 1117, 337, time - 1.2);
}

function drawInventory(time) {
  drawBackground(time, 'mint');
  drawHeading('Stock · articles et quantités', 'Le stock,', 'sous vos yeux.', 'Consultez vos articles et gardez un œil sur les seuils d’alerte.', time);
  drawPill('APERÇU ILLUSTRATIF', 84, 472, 277, '#114b4c', '#8ae3bd', 43);
  const device = drawPhone(130, 590, 520, 1115, time, 'android');
  const appY = drawAppHeader(device, 0, time);
  drawText('Marchandises & stock', device.sx + 20, appY + 32, 21, '#17334c', 850);
  drawText('Catalogue', device.sx + 20, appY + 69, 15, '#718598', 600);
  const items = [
    { name: 'Riz', detail: 'Stock suivi', color: '#1777c5', width: 0.78 },
    { name: 'Huile', detail: 'Stock suivi', color: '#16885d', width: 0.54 },
    { name: 'Boissons', detail: 'À surveiller', color: '#d48728', width: 0.22 },
  ];
  items.forEach((item, i) => {
    const scroll = Math.sin(clamp((time - 1) / 4) * Math.PI) * 18;
    const yy = appY + 95 + i * 143 - scroll;
    const p = easeOut((time - i * 0.22) / 0.42);
    ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 36);
    roundRect(device.sx + 15, yy, device.sw - 30, 122, 18, '#ffffff', '#e3eee9');
    roundRect(device.sx + 28, yy + 18, 46, 46, 14, i === 2 ? '#fff2df' : '#e8f5ee');
    drawText(item.name[0], device.sx + 51, yy + 49, 21, item.color, 850, 'center');
    drawText(item.name, device.sx + 88, yy + 42, 17, '#18364a', 800);
    drawText(item.detail, device.sx + 88, yy + 66, 13, i === 2 ? '#bd7626' : '#829496', 600);
    roundRect(device.sx + 28, yy + 88, device.sw - 56, 9, 5, '#e8efeb');
    const barW = (device.sw - 56) * (i === 2 ? mix(item.width, 0.56, easeOut((time - 3.5) / 1.2)) : item.width);
    roundRect(device.sx + 28, yy + 88, barW, 9, 5, item.color);
    ctx.restore();
  });

  const alertP = easeOut((time - 1.1) / 0.55);
  ctx.save(); ctx.globalAlpha = alertP; ctx.translate((1 - alertP) * 240, 0);
  ctx.shadowColor = '#00171540'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 14;
  roundRect(620, 770, 390, 310, 30, '#ffffff');
  ctx.shadowColor = 'transparent';
  roundRect(650, 800, 60, 60, 19, '#fff2de');
  drawText('!', 680, 842, 34, '#c77b23', 900, 'center');
  drawText('À surveiller', 730, 824, 25, '#17364a', 850);
  drawText('Un article approche du seuil.', 650, 910, 17, '#738799', 600);
  roundRect(650, 954, 330, 74, 19, '#eaf8f0');
  drawText('Vérifier le réapprovisionnement', 815, 1000, 15, '#19704e', 800, 'center');
  ctx.restore();
  drawPresenter(845, 1470, 0.59, time, 'point-left', easeOut((time - 0.8) / 0.5));
  drawSpeech('Un repère visuel quand le stock baisse.', 592, 1190, 391, time - 1.25);
  const arrowP = easeOut((time - 3.4) / 0.6);
  ctx.globalAlpha = arrowP;
  drawText('↘', 884, 1124, 47, '#7be0b1', 900, 'center');
  ctx.globalAlpha = 1;
}

function drawIphone(time) {
  drawBackground(time, 'warm');
  drawHeading('iPhone · version web dans Safari', 'La même gestion,', 'dans Safari.', 'Ouvrez l’adresse de l’application terminée par /app/ — puis ajoutez l’icône à l’accueil.', time, true);
  drawPill('WEB APP · PAS UNE IPA', 84, 472, 305, '#eee7ff', '#6951a5', 43);
  const device = drawPhone(251, 600, 578, 1185, time, 'iphone');
  const appY = drawAppHeader(device, 0, time);
  drawText('Votre activité', device.sx + 20, appY + 27, 18, '#73879a', 650);
  drawText('Les repères du jour', device.sx + 20, appY + 66, 24, '#18334d', 850);
  const cards = [
    { x: device.sx + 16, label: 'VENTES', tint: '#e9f3ff', color: '#2378bc', icon: '↗' },
    { x: device.sx + device.sw / 2 + 4, label: 'DÉPENSES', tint: '#eaf8f0', color: '#27815a', icon: '−' },
    { x: device.sx + 16, label: 'STOCK', tint: '#fff2e1', color: '#aa7029', icon: '▤' },
    { x: device.sx + device.sw / 2 + 4, label: 'CRÉDITS', tint: '#f2edff', color: '#7157b3', icon: '◷' },
  ];
  cards.forEach((card, i) => {
    const p = easeOut((time - i * 0.15) / 0.42);
    const yy = appY + 92 + Math.floor(i / 2) * 150;
    ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 24);
    roundRect(card.x, yy, device.sw / 2 - 24, 132, 18, card.tint);
    drawText(card.icon, card.x + 24, yy + 40, 27, card.color, 850);
    drawText(card.label, card.x + 22, yy + 76, 13, card.color, 850);
    roundRect(card.x + 22, yy + 94, device.sw / 2 - 70, 7, 4, '#ffffffb8');
    roundRect(card.x + 22, yy + 94, (device.sw / 2 - 70) * (0.48 + 0.12 * Math.sin(time * 2 + i)), 7, 4, card.color);
    ctx.restore();
  });
  // Safari toolbar is part of the phone drawing; the share action expands into the real Add-to-Home-Screen path.
  const action = easeOut((time - 2.1) / 0.55);
  ctx.save(); ctx.globalAlpha = action; ctx.translate(0, (1 - action) * 70);
  ctx.shadowColor = '#14233431'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  roundRect(108, 1265, 425, 236, 24, '#ffffff');
  ctx.shadowColor = 'transparent';
  drawText('Depuis Safari', 140, 1311, 17, '#697c8e', 700);
  roundRect(138, 1340, 365, 101, 18, '#eef4fb');
  roundRect(158, 1359, 58, 58, 16, '#dceaff');
  drawText('＋', 187, 1398, 34, '#176fc4', 800, 'center');
  drawText('Ajouter à l’écran', 237, 1383, 16, '#22384d', 800);
  drawText('d’accueil', 237, 1407, 16, '#22384d', 800);
  drawText('Sans App Store · sans IPA', 140, 1474, 14, '#738599', 650);
  ctx.restore();
  drawPresenter(911, 1574, 0.48, time, 'point-left', easeOut((time - 0.65) / 0.55));
  drawSpeech('Sur iPhone : Safari, puis “Ajouter à l’écran”.', 620, 1084, 370, time - 1.1);
  drawTap(742, 1635, time, 1.75);
}

function drawActivity(time) {
  drawBackground(time, 'violet');
  drawHeading('Une vue utile au quotidien', 'Voir l’essentiel.', 'Décider plus sereinement.', 'Ventes, dépenses et crédits saisis : retrouvez vos repères dans un seul espace.', time);
  const x = 83, y = 585, w = 900, h = 950;
  const p = easeOut(time / 0.7);
  ctx.save(); ctx.globalAlpha = p; ctx.translate((1 - p) * 70, 0);
  ctx.shadowColor = '#02051060'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  roundRect(x, y, w, h, 35, '#ffffff'); ctx.shadowColor = 'transparent';
  drawText('SHOPFLOW  /  TABLEAU DE BORD', x + 43, y + 69, 17, '#71869b', 850);
  drawText('Votre activité', x + 43, y + 133, 39, '#17334d', 850);
  const metricCards = [
    { x: x + 38, title: 'Ventes', label: 'Enregistrées', color: '#1476c5', tint: '#eaf4ff' },
    { x: x + 324, title: 'Dépenses', label: 'Saisies', color: '#258259', tint: '#ebf8f0' },
    { x: x + 610, title: 'Crédits', label: 'À suivre', color: '#7153b3', tint: '#f2efff' },
  ];
  metricCards.forEach((card, i) => {
    const k = easeOut((time - i * 0.22) / 0.48);
    ctx.save(); ctx.globalAlpha = k;
    roundRect(card.x, y + 174, 250, 158, 22, card.tint);
    drawText(card.title.toUpperCase(), card.x + 22, y + 218, 15, card.color, 850);
    drawText(card.label, card.x + 22, y + 270, 24, '#203a52', 800);
    drawText(i === 0 ? '↗' : i === 1 ? '−' : '◷', card.x + 210, y + 222, 30, card.color, 850, 'center');
    ctx.restore();
  });
  drawText('TENDANCE DES VENTES ENREGISTRÉES', x + 43, y + 399, 16, '#72859a', 850);
  const chartX = x + 60, chartY = y + 760, chartW = 777, chartH = 300;
  ctx.strokeStyle = '#e8edf2'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const gy = chartY - i * 74;
    ctx.beginPath(); ctx.moveTo(chartX, gy); ctx.lineTo(chartX + chartW, gy); ctx.stroke();
  }
  const values = [0.3, 0.55, 0.41, 0.72, 0.51, 0.86, 0.68, 0.97];
  values.forEach((value, i) => {
    const k = easeOut((time - 0.3 - i * 0.16) / 0.5);
    const barH = chartH * value * k;
    const bx = chartX + i * 96;
    const hue = i > 5 ? '#56d7a5' : '#1685e0';
    const gr = ctx.createLinearGradient(0, chartY - barH, 0, chartY);
    gr.addColorStop(0, hue); gr.addColorStop(1, i > 5 ? '#b0f1d2' : '#96d5ff');
    roundRect(bx, chartY - barH, 42, barH, 18, gr);
  });
  ctx.restore();
  drawPresenter(858, 1635, 0.52, time, 'open', easeOut((time - 0.65) / 0.5));
  drawSpeech('Vous retrouvez ce que vous avez enregistré.', 578, 1500, 388, time - 1.2);
}

function drawEndCard(time) {
  drawBackground(time, 'night');
  const p = easeOut(time / 0.75);
  drawLogo(540, mix(140, 350, p), 168, (1 - p) * 0.22, p);
  const title = easeOut((time - 0.25) / 0.58);
  ctx.globalAlpha = title;
  drawText('ShopFlow', 540, 650, 84, '#f7fbff', 900, 'center');
  drawText('Gérez. Calculez. Faites grandir.', 540, 715, 28, '#b2c9db', 650, 'center');
  drawPresenter(810, 1210, 0.76, time, 'open', easeOut((time - 0.55) / 0.55));
  const cta = easeOut((time - 0.75) / 0.55);
  ctx.globalAlpha = cta;
  roundRect(104, 980, 492, 242, 30, '#103653', '#2876a8', 2);
  drawText('ANDROID', 144, 1034, 17, '#80c4ff', 850);
  drawText('Application de gestion', 144, 1079, 24, '#f2f8fc', 800);
  drawText('IPHONE', 144, 1140, 17, '#8ce2ba', 850);
  drawText('Web app dans Safari', 144, 1185, 24, '#f2f8fc', 800);
  roundRect(104, 1322, 492, 82, 41, '#1072d7');
  drawText('DÉCOUVREZ SHOPFLOW', 350, 1374, 20, '#ffffff', 900, 'center');
  drawText('Visuels illustratifs · aucune donnée réelle', 540, 1542, 18, '#9ab2c7', 600, 'center');
  ctx.globalAlpha = 1;
}

const scenes = [
  { start: 0, end: 4, name: 'ShopFlow, en bref', draw: drawIntro },
  { start: 4, end: 7, name: 'Le quotidien du commerce', draw: drawChallenge },
  { start: 7, end: 14, name: 'Android · ventes et reçus', draw: drawCheckout },
  { start: 14, end: 20, name: 'Android · articles et stock', draw: drawInventory },
  { start: 20, end: 27, name: 'iPhone · web app dans Safari', draw: drawIphone },
  { start: 27, end: 32, name: 'Les repères d’activité', draw: drawActivity },
  { start: 32, end: 36, name: 'Découvrez ShopFlow', draw: drawEndCard },
];

function drawTransition(time) {
  const boundary = scenes.slice(1).find((scene) => time >= scene.start && time < scene.start + 0.33);
  if (!boundary) return;
  const p = (time - boundary.start) / 0.33;
  const alpha = (1 - easeOut(p)) * 0.85;
  const index = scenes.indexOf(boundary);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (index % 3 === 1) {
    const radius = mix(30, 1250, easeOut(p));
    ctx.strokeStyle = '#8fddff'; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.arc(540, 960, radius, 0, Math.PI * 2); ctx.stroke();
  } else if (index % 3 === 2) {
    const x = mix(1150, -320, easeInOut(p));
    ctx.fillStyle = '#e8fbff';
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 190, 0); ctx.lineTo(x - 270, 1920); ctx.lineTo(x - 450, 1920); ctx.closePath(); ctx.fill();
  } else {
    const y = mix(-270, 1920, easeInOut(p));
    ctx.fillStyle = '#70dff0';
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y - 260); ctx.lineTo(1080, y - 120); ctx.lineTo(0, y + 140); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function renderAt(time) {
  const t = clamp(time, 0, duration);
  const scene = scenes.find((item) => t >= item.start && t < item.end) || scenes[scenes.length - 1];
  scene.draw(t - scene.start);
  drawTransition(t);
  progressFill.style.width = `${(t / duration) * 100}%`;
  if (animationRunning) status.textContent = `${scene.name} · ${Math.floor(t).toString().padStart(2, '0')} s / ${duration} s`;
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
    status.textContent = 'Animation terminée. Tu peux la relancer ou enregistrer la vidéo.';
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
    status.textContent = 'Ce navigateur ne sait pas enregistrer le canevas. Essaie Chrome ou Edge sur ordinateur.';
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

  exportButton.disabled = true;
  replayButton.disabled = true;
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

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size) chunks.push(event.data);
  };
  recorder.onerror = () => {
    status.textContent = 'L’enregistrement a échoué. Essaie un navigateur de bureau récent.';
    stream.getTracks().forEach((track) => track.stop());
    exportButton.disabled = false;
    replayButton.disabled = false;
    exportButton.textContent = '↓ Enregistrer la vidéo';
  };
  recorder.onstop = () => {
    const mime = recorder.mimeType || recordedMime;
    if (mime.includes('mp4')) recordedExt = 'mp4';
    else if (mime.includes('webm')) recordedExt = 'webm';
    const blob = new Blob(chunks, { type: mime });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `ShopFlow-motion.${recordedExt}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    stream.getTracks().forEach((track) => track.stop());
    exportButton.disabled = false;
    replayButton.disabled = false;
    exportButton.textContent = '↓ Enregistrer la vidéo';
    status.textContent = `Téléchargement lancé : ShopFlow-motion.${recordedExt}. ${recordedExt === 'webm' ? 'Convertis-le en MP4 dans CapCut ou Shotcut.' : 'Le fichier est déjà au format MP4.'}`;
  };

  renderAt(0);
  recorder.start(250);
  play(() => recorder.state !== 'inactive' && recorder.stop());
});

if (icon.complete) renderAt(0);
else icon.addEventListener('load', () => renderAt(0), { once: true });
