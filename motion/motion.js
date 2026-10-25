const canvas = document.querySelector('#motion');
const ctx = canvas.getContext('2d', { alpha: false });
const duration = 26;
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

function drawWrapped(text, x, y, maxWidth, lineHeight, size, color, weight = 500) {
  ctx.font = `${weight} ${size}px Inter, "DM Sans", system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
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

function drawBackground(time, light = false) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (light) {
    gradient.addColorStop(0, '#f7fbff');
    gradient.addColorStop(0.5, '#e7f1fd');
    gradient.addColorStop(1, '#d8e8f8');
  } else {
    gradient.addColorStop(0, '#071827');
    gradient.addColorStop(0.55, '#0b2742');
    gradient.addColorStop(1, '#102f4d');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(810 + Math.sin(time * 0.35) * 110, 300, 40, 760, 460, 850);
  glow.addColorStop(0, light ? 'rgba(48,145,235,.16)' : 'rgba(24,125,239,.28)');
  glow.addColorStop(1, 'rgba(7,24,39,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = light ? 0.16 : 0.18;
  ctx.strokeStyle = light ? '#6c98bd' : '#7aafd3';
  ctx.lineWidth = 1;
  for (let x = 52; x < 1080; x += 84) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1920); ctx.stroke();
  }
  for (let y = 42; y < 1920; y += 84) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke();
  }
  ctx.restore();

  for (let i = 0; i < 18; i += 1) {
    const x = (i * 173 + Math.sin(time * 0.4 + i) * 55 + 1080) % 1080;
    const y = (i * 211 + Math.cos(time * 0.3 + i) * 48 + 1920) % 1920;
    const radius = 2 + (i % 3);
    ctx.globalAlpha = (light ? 0.12 : 0.2) + (Math.sin(time + i) + 1) * 0.08;
    ctx.fillStyle = i % 4 === 0 ? '#55d8a2' : '#80c3ff';
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPill(text, x, y, width, background = '#eaf4ff', color = '#1868b7') {
  roundRect(x, y, width, 48, 24, background);
  drawText(text, x + width / 2, y + 31, 18, color, 800, 'center');
}

function drawSectionHeading(kicker, title, subtitle, t, light = false) {
  const enter = easeOut(t / 0.72);
  const titleColor = light ? '#10243a' : '#f7fbff';
  const subColor = light ? '#5f7387' : '#b9cbd9';
  ctx.save();
  ctx.globalAlpha = enter;
  drawText(kicker.toUpperCase(), 90 + (1 - enter) * 35, 180, 20, light ? '#2874ba' : '#68dfa9', 800);
  drawText(title[0], 88 + (1 - enter) * 35, 300, 64, titleColor, 800);
  if (title[1]) drawText(title[1], 88 + (1 - enter) * 35, 375, 64, titleColor, 800);
  drawWrapped(subtitle, 92 + (1 - enter) * 35, title[1] ? 435 : 382, 820, 38, 25, subColor, 500);
  ctx.restore();
}

function drawPhoneFrame(x, y, w, h, time) {
  ctx.save();
  ctx.shadowColor = '#05111e66';
  ctx.shadowBlur = 45;
  ctx.shadowOffsetY = 24;
  roundRect(x, y, w, h, 48, '#ffffff', '#dce8f3', 2);
  ctx.shadowColor = 'transparent';
  roundRect(x + 15, y + 15, w - 30, h - 30, 36, '#f7f9fc');
  roundRect(x + w / 2 - 50, y + 23, 100, 16, 9, '#d8e0e9');
  drawText('ShopFlow', x + 56, y + 103, 27, '#13304e', 800);
  roundRect(x + w - 100, y + 74, 54, 44, 14, '#e8f3ff');
  drawText('•••', x + w - 73, y + 102, 19, '#237bd0', 800, 'center');
  ctx.restore();
}

function drawRows(x, y, w, rows, time, color = '#1475d1') {
  rows.forEach((row, index) => {
    const rowY = y + index * 124;
    const enter = easeOut((time - index * 0.11) / 0.45);
    ctx.save();
    ctx.globalAlpha = enter;
    ctx.translate((1 - enter) * 50, 0);
    roundRect(x, rowY, w, 102, 22, '#ffffff', '#e7edf3');
    roundRect(x + 18, rowY + 18, 64, 64, 18, row.tint || '#e8f4ff');
    drawText(row.glyph || '•', x + 50, rowY + 60, 32, row.color || color, 900, 'center');
    drawText(row.name, x + 102, rowY + 45, 22, '#192f48', 800);
    drawText(row.detail, x + 102, rowY + 73, 16, '#8292a2', 500);
    if (row.right) drawText(row.right, x + w - 20, rowY + 59, 17, '#2774b5', 800, 'right');
    ctx.restore();
  });
}

function drawIntro(time) {
  drawBackground(time);
  const inOut = easeOut(time / 1.1);
  const pulse = 1 + Math.sin(time * 2.1) * 0.025;
  ctx.save();
  ctx.globalAlpha = inOut;
  ctx.translate(540, 735);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = '#00000055'; ctx.shadowBlur = 55; ctx.shadowOffsetY = 25;
  roundRect(-150, -150, 300, 300, 66, '#ffffff');
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  if (icon.complete && icon.naturalWidth) ctx.drawImage(icon, -128, -128, 256, 256);
  ctx.restore();

  const titleAlpha = easeOut((time - 0.55) / 0.8);
  ctx.globalAlpha = titleAlpha;
  drawText('ShopFlow', 540, 1130, 90, '#f6f9fd', 850, 'center');
  drawText('Le commerce, mieux organisé.', 540, 1215, 31, '#b7ccdc', 500, 'center');
  const pillAlpha = easeOut((time - 1.45) / 0.6);
  ctx.globalAlpha = pillAlpha;
  drawPill('GÉREZ  ·  CALCULEZ  ·  FAITES GRANDIR', 252, 1320, 576, '#123b5b', '#84dcb7');
  ctx.globalAlpha = 1;
}

function drawOverview(time) {
  drawBackground(time, true);
  drawSectionHeading('Un seul outil, vos repères essentiels', ['Votre commerce,', 'plus lisible.'], 'Caisse, stock et activité réunis dans ShopFlow.', time, true);
  const cards = [
    { x: 90, y: 720, w: 900, h: 220, glyph: '↗', title: 'Caisse', sub: 'Enregistrer les ventes et retrouver les reçus', tint: '#eaf4ff', accent: '#1475d1' },
    { x: 90, y: 990, w: 900, h: 220, glyph: '▤', title: 'Stock', sub: 'Consulter le catalogue et les quantités', tint: '#e9f8f1', accent: '#17855d' },
    { x: 90, y: 1260, w: 900, h: 220, glyph: '▥', title: 'Suivi d’activité', sub: 'Retrouver ventes, dépenses et crédits enregistrés', tint: '#f2efff', accent: '#7253c7' },
  ];
  cards.forEach((card, index) => {
    const p = easeOut((time - index * 0.18) / 0.5);
    ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 45);
    roundRect(card.x, card.y, card.w, card.h, 28, '#ffffff', '#dce8f1', 2);
    roundRect(card.x + 28, card.y + 30, 156, 156, 28, card.tint);
    drawText(card.glyph, card.x + 106, card.y + 135, 80, card.accent, 800, 'center');
    drawText(card.title, card.x + 224, card.y + 91, 38, '#162c43', 800);
    drawText(card.sub, card.x + 224, card.y + 141, 21, '#6e8193', 500);
    drawText('→', card.x + card.w - 54, card.y + 122, 32, card.accent, 700, 'center');
    ctx.restore();
  });
}

function drawCheckout(time) {
  drawBackground(time);
  drawSectionHeading('Encaissement', ['La caisse,', 'sans détour.'], 'Enregistrez une vente et retrouvez son reçu dans l’historique.', time);
  const phoneX = 190, phoneY = 650, phoneW = 700, phoneH = 1050;
  const enter = easeOut(time / 0.7);
  ctx.save(); ctx.globalAlpha = enter; ctx.translate(0, (1 - enter) * 70);
  drawPhoneFrame(phoneX, phoneY, phoneW, phoneH, time);
  drawText('Nouvelle vente', phoneX + 48, phoneY + 170, 23, '#71859a', 600);
  drawText('Articles', phoneX + 48, phoneY + 228, 38, '#172e47', 800);
  drawRows(phoneX + 38, phoneY + 278, phoneW - 76, [
    { glyph: 'R', name: 'Riz', detail: 'Article du catalogue', right: '1 ×', color: '#1976d2', tint: '#eaf4ff' },
    { glyph: 'H', name: 'Huile', detail: 'Article du catalogue', right: '1 ×', color: '#16855f', tint: '#e9f8f1' },
    { glyph: 'B', name: 'Boissons', detail: 'Article du catalogue', right: '2 ×', color: '#8058c9', tint: '#f2efff' },
  ], time, '#1874d0');
  const totalIn = easeOut((time - 0.7) / 0.6);
  ctx.globalAlpha = totalIn;
  roundRect(phoneX + 40, phoneY + 690, phoneW - 80, 152, 25, '#eff7ff');
  drawText('Total de la vente', phoneX + 70, phoneY + 750, 22, '#6b7f92', 600);
  drawText('Prêt à encaisser', phoneX + 70, phoneY + 802, 32, '#133451', 800);
  roundRect(phoneX + 40, phoneY + 872, phoneW - 80, 82, 22, '#1269d3');
  drawText('ENREGISTRER LA VENTE', phoneX + phoneW / 2, phoneY + 924, 20, '#ffffff', 800, 'center');
  ctx.restore();
  const badge = easeOut((time - 1.55) / 0.4);
  ctx.globalAlpha = badge;
  roundRect(566, 590, 392, 86, 28, '#0e8a60');
  drawText('✓  Vente enregistrée', 762, 644, 24, '#ffffff', 800, 'center');
  ctx.globalAlpha = 1;
}

function drawInventory(time) {
  drawBackground(time, true);
  drawSectionHeading('Gestion de stock', ['Le stock,', 'à portée de main.'], 'Consultez les articles et gardez un œil sur les quantités.', time, true);
  const x = 80, y = 680, w = 920, h = 980;
  const enter = easeOut(time / 0.7);
  ctx.save(); ctx.globalAlpha = enter; ctx.translate(0, (1 - enter) * 70);
  roundRect(x, y, w, h, 34, '#ffffff', '#d7e3ed', 2);
  drawText('CATALOGUE', x + 44, y + 76, 19, '#778a9d', 800);
  drawText('Vos articles', x + 44, y + 145, 42, '#172f49', 800);
  drawPill('STOCK', x + w - 182, y + 50, 132, '#e9f8f1', '#17855d');
  drawRows(x + 34, y + 195, w - 68, [
    { glyph: 'R', name: 'Riz', detail: 'Sac · Stock suivi', right: 'Disponible', color: '#1475d1' },
    { glyph: 'H', name: 'Huile', detail: 'Bidon · Stock suivi', right: 'Disponible', color: '#16855f' },
    { glyph: 'B', name: 'Boissons', detail: 'Pack · Stock suivi', right: 'À vérifier', color: '#7554c7' },
  ], time, '#1475d1');
  const p = easeOut((time - 0.7) / 0.5);
  ctx.globalAlpha = p;
  roundRect(x + 42, y + 640, w - 84, 216, '#f2f8fd');
  drawText('UN REPÈRE POUR VOTRE JOURNÉE', x + 76, y + 704, 17, '#2979bc', 800);
  drawText('Quantités et seuils d’alerte', x + 76, y + 766, 28, '#18324b', 800);
  drawText('Les informations restent celles de votre boutique.', x + 76, y + 812, 18, '#718396', 500);
  ctx.restore();
}

function drawReports(time) {
  drawBackground(time);
  drawSectionHeading('Suivi d’activité', ['Les bons repères', 'pour décider.'], 'Retrouvez les données que vous avez enregistrées dans ShopFlow.', time);
  const cardX = 82, cardY = 700, cardW = 916;
  const enter = easeOut(time / 0.7);
  ctx.save(); ctx.globalAlpha = enter; ctx.translate(0, (1 - enter) * 55);
  roundRect(cardX, cardY, cardW, 880, 34, '#ffffff');
  drawText('VUE D’ENSEMBLE', cardX + 42, cardY + 76, 18, '#798b9e', 800);
  drawText('Activité enregistrée', cardX + 42, cardY + 140, 39, '#19304a', 800);
  roundRect(cardX + 42, cardY + 182, 254, 160, 24, '#eef6ff');
  roundRect(cardX + 318, cardY + 182, 254, 160, 24, '#eef9f3');
  roundRect(cardX + 594, cardY + 182, 278, 160, 24, '#f5f1ff');
  drawText('VENTES', cardX + 70, cardY + 230, 16, '#6382a0', 800);
  drawText('Dépenses', cardX + 346, cardY + 230, 16, '#4e866f', 800);
  drawText('Crédits', cardX + 622, cardY + 230, 16, '#7666a2', 800);
  drawText('Suivies', cardX + 70, cardY + 295, 28, '#1a4f82', 800);
  drawText('Suivies', cardX + 346, cardY + 295, 28, '#20734f', 800);
  drawText('Suivis', cardX + 622, cardY + 295, 28, '#604d9a', 800);

  drawText('ÉVOLUTION', cardX + 44, cardY + 418, 17, '#75889b', 800);
  const chartX = cardX + 70, chartY = cardY + 740, chartW = 770, chartH = 265;
  ctx.strokeStyle = '#e7edf2'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const gy = chartY - i * 68;
    ctx.beginPath(); ctx.moveTo(chartX, gy); ctx.lineTo(chartX + chartW, gy); ctx.stroke();
  }
  const bars = [0.38, 0.57, 0.46, 0.72, 0.64, 0.88, 0.68, 0.96];
  bars.forEach((height, i) => {
    const progress = easeOut((time - 0.3 - i * 0.08) / 0.6);
    const barH = (chartH - 12) * height * progress;
    const bx = chartX + i * 91;
    const gradient = ctx.createLinearGradient(0, chartY - barH, 0, chartY);
    gradient.addColorStop(0, '#1e8cf0'); gradient.addColorStop(1, '#68c7ff');
    roundRect(bx, chartY - barH, 38, barH, 16, gradient);
  });
  ctx.restore();
}

function drawEndCard(time) {
  drawBackground(time);
  const pulse = easeOut(time / 0.8);
  ctx.save(); ctx.globalAlpha = pulse;
  ctx.shadowColor = '#00000055'; ctx.shadowBlur = 42; ctx.shadowOffsetY = 20;
  roundRect(380, 370, 320, 320, 72, '#ffffff');
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  if (icon.complete && icon.naturalWidth) ctx.drawImage(icon, 400, 390, 280, 280);
  ctx.restore();
  const enter = easeOut((time - 0.45) / 0.8);
  ctx.globalAlpha = enter;
  drawText('ShopFlow', 540, 875, 92, '#f7fbff', 850, 'center');
  drawText('Gérez. Calculez. Faites grandir.', 540, 965, 33, '#a9c0d2', 600, 'center');
  const cta = easeOut((time - 1.2) / 0.6);
  ctx.globalAlpha = cta;
  roundRect(205, 1110, 670, 116, 58, '#1072d7');
  drawText('VOTRE COMMERCE, MIEUX ORGANISÉ', 540, 1182, 22, '#ffffff', 850, 'center');
  drawText('Android · iPhone en web app', 540, 1335, 24, '#d0e1ee', 600, 'center');
  drawText('Découvrez ShopFlow sur notre site', 540, 1390, 20, '#8eddb8', 600, 'center');
  ctx.globalAlpha = 1;
}

function renderAt(time) {
  const t = clamp(time, 0, duration);
  if (t < 4) drawIntro(t);
  else if (t < 8) drawOverview(t - 4);
  else if (t < 13) drawCheckout(t - 8);
  else if (t < 18) drawInventory(t - 13);
  else if (t < 22) drawReports(t - 18);
  else drawEndCard(t - 22);

  const p = t / duration;
  const section = t < 4 ? 'Marque' : t < 8 ? 'Présentation' : t < 13 ? 'Caisse' : t < 18 ? 'Stock' : t < 22 ? 'Suivi' : 'Conclusion';
  progressFill.style.width = `${p * 100}%`;
  if (animationRunning) status.textContent = `${section} · ${Math.floor(t).toString().padStart(2, '0')} s / ${duration} s`;
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
    status.textContent = 'Animation terminée. Tu peux la relancer ou enregistrer le rendu.';
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
    const blob = new Blob(chunks, { type: recordedMime });
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
