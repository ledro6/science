// Логотип и баннеры серии. Каждый ассет — функция, рисующая один холст нужного размера:
// 3D-рендер знака (Three.js, те же материалы и свет, что в ролике) + типографика Apple.
// brand.html?a=<имя ассета> рисует его в #out; capture.js сохраняет PNG.
import { THREE, MAT, roundedBox, glassEdges, shadowsOn } from '../apple/engine.mjs';
import * as MODELS from '../apple/models.mjs';
const { makeAnt } = MODELS;

export const NAME = 'L³';                  // имя канала
export const DESCRIPTOR = 'законы природы';
export const SLOGAN = 'Мир в кубе';          // слоган канала
const SLOGAN_LINES = ['Мир', 'в кубе'];
const FONT = '"Inter Display", Inter, sans-serif';
// Масштаб вывода: ассеты описаны в логических пикселях, файл рендерится в K раз крупнее (3D — тоже, без апскейла).
export const K = +(new URLSearchParams(location.search).get('k') || 2);
const ACCENT = { dark: '#FF453A', paper: '#D70015' };   // signal-red дизайн-системы
const C = { black: '#000000', paper: '#f5f5f7', ink: '#1d1d1f', white: '#ffffff', muted: '#86868b', mutedPaper: '#6e6e73', card: '#161617' };

// ---------- 3D: один рендерер на всё ----------
const r3 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
r3.setPixelRatio(1); r3.toneMapping = THREE.ACESFilmicToneMapping; r3.outputColorSpace = THREE.SRGBColorSpace;
r3.shadowMap.enabled = true; r3.shadowMap.type = THREE.PCFSoftShadowMap;

function studio(dark) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', dark ? '#0b0b0c' : '#d0d0d4', dark ? .55 : 1.1));
  const key = new THREE.DirectionalLight('#ffffff', dark ? 2.6 : 2.1); key.position.set(3, 9, 6);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  const rimL = new THREE.DirectionalLight('#ffffff', dark ? 3.4 : 1.3); rimL.position.set(-6, 3, -5);
  const rimR = new THREE.DirectionalLight('#ffffff', dark ? 2.4 : 1); rimR.position.set(6, 2, -4);
  scene.add(key, rimL, rimR);
  return scene;
}
function camAt(w, h, az, el, dist, target = [0, 0, 0], fov = 22) {
  const cam = new THREE.PerspectiveCamera(fov, w / h, .1, 100);
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  cam.position.set(target[0] + dist * Math.cos(e) * Math.sin(a), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(e) * Math.cos(a));
  cam.lookAt(...target); return cam;
}
function snap(scene, cam, w, h) {
  r3.setSize(w * K, h * K, false); r3.setClearColor(0x000000, 0); r3.render(scene, cam);
  const c = document.createElement('canvas'); c.width = w * K; c.height = h * K;
  c.getContext('2d').drawImage(r3.domElement, 0, 0); return c;
}
// Вставить 3D-рендер в логических координатах (холст рендера в K раз крупнее)
function put(g, img, x, y) { g.drawImage(img, x, y, img.width / K, img.height / K); }

// Знак: алюминиевый куб, от передней грани которого отслаивается стеклянная пластина (площадь vs объём).
function markScene(dark, { gap = .34, tilt = 0 } = {}) {
  const scene = studio(dark);
  const g = new THREE.Group();
  const cube = new THREE.Mesh(roundedBox(1, .06, 4), MAT.aluminium()); cube.castShadow = true; g.add(cube);
  const paneGeo = new THREE.BoxGeometry(.98, .98, .012);
  const pane = new THREE.Mesh(paneGeo, MAT.glass(dark ? .2 : .32)); pane.position.z = .5 + gap;
  const edges = glassEdges(paneGeo, dark ? '#ffffff' : '#1d1d1f', dark ? .9 : .75); edges.position.copy(pane.position);
  g.add(pane, edges); g.rotation.y = tilt;
  scene.add(g);
  return scene;
}
export function markRender(size, dark, o = {}) {
  const sc = markScene(dark, o);
  return snap(sc, camAt(size, size, o.az ?? 38, o.el ?? 24, o.dist ?? 6.1, [0, 0, .14]), size, size);
}
function exploded(dark, n = 3, spread = .5) {
  const scene = studio(dark), g = new THREE.Group(), geo = roundedBox(1, .06, 3), m = MAT.aluminium();
  const h = (n - 1) / 2;
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
    const b = new THREE.Mesh(geo, m); b.position.set((x - h) * (1 + spread), (y - h) * (1 + spread), (z - h) * (1 + spread)); g.add(b);
  }
  scene.add(g); return scene;
}
function antRender(w, h, dark) {
  const scene = studio(dark), ant = makeAnt(); ant.pose({}); scene.add(ant);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: dark ? .45 : .16 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  return snap(scene, camAt(w, h, 62, 12, 4.6, [.05, .32, 0], 24), w, h);
}

// ---------- 2D ----------
function txt(g, s, x, y, { size = 100, w = 700, col = C.white, align = 'left', track = -.04, base = 'alphabetic' } = {}) {
  g.save(); g.font = `${w} ${size}px ${FONT}`; g.letterSpacing = (track * size).toFixed(2) + 'px';
  g.textBaseline = base;
  if (s.includes('³')) {
    // «³» — знак канала L³: всегда акцентным цветом
    const acc = col === C.ink ? ACCENT.paper : ACCENT.dark, total = g.measureText(s).width;
    let cx = x + (align === 'center' ? -total / 2 : align === 'right' ? -total : 0);
    g.textAlign = 'left';
    s.split('³').forEach((part, i) => {
      if (i) { g.fillStyle = acc; g.fillText('³', cx, y); cx += g.measureText('³').width; }
      g.fillStyle = col; g.fillText(part, cx, y); cx += g.measureText(part).width;
    });
  } else { g.fillStyle = col; g.textAlign = align; g.fillText(s, x, y); }
  g.restore();
}
function measure(g, s, size, w = 700, track = -.04) {
  g.save(); g.font = `${w} ${size}px ${FONT}`; g.letterSpacing = (track * size).toFixed(2) + 'px';
  const m = g.measureText(s).width; g.restore(); return m;
}
function fill(g, w, h, col) { g.fillStyle = col; g.fillRect(0, 0, w, h); }
function glowUnder(g, x, y, r, a = .12) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
}
// Плоский знак (для мелких размеров): изометрический куб из двух тонов + контур отслоившейся грани.
export function flatMark(g, cx, cy, s, { ink = C.white, tone2 = '#86868b', tone3 = '#3a3a3c', line = null } = {}) {
  const k = s / 2, ix = Math.cos(Math.PI / 6) * k, iy = Math.sin(Math.PI / 6) * k;
  const top = [[cx, cy - k], [cx + ix, cy - k + iy], [cx, cy - k + 2 * iy], [cx - ix, cy - k + iy]];
  const left = [[cx - ix, cy - k + iy], [cx, cy - k + 2 * iy], [cx, cy + k], [cx - ix, cy + k - iy]];
  const right = [[cx, cy - k + 2 * iy], [cx + ix, cy - k + iy], [cx + ix, cy + k - iy], [cx, cy + k]];
  const poly = (p, col) => { g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = col; g.fill(); };
  poly(top, ink); poly(left, tone2); poly(right, tone3);
  // «стеклянная» передняя-правая грань, отслоившаяся по нормали
  const off = [ix * .32, iy * .32];
  g.save(); g.strokeStyle = line || ink; g.lineWidth = Math.max(1.5, s * .022); g.lineJoin = 'round';
  g.beginPath(); right.forEach(([x, y], i) => { const p = [x + off[0], y + off[1]]; i ? g.lineTo(...p) : g.moveTo(...p); }); g.closePath(); g.stroke(); g.restore();
}
function lockup(g, x, y, size, dark, { descriptor = true, align = 'left' } = {}) {
  const ink = dark ? C.white : C.ink, mut = dark ? C.muted : C.mutedPaper;
  txt(g, NAME, x, y, { size, col: ink, align });
  if (descriptor) txt(g, DESCRIPTOR, x + (align === 'left' ? size * .04 : 0), y + size * .62, { size: size * .3, w: 500, col: mut, align, track: -.005 });
}

// ---------- L³ ----------
function avatarL3(g, w, h, dark = true) {
  fill(g, w, h, dark ? C.black : C.paper);
  const size = w * .5, tw = measure(g, 'L³', size, 700, -.05);
  // оптический центр: ³ лёгкий и висит вверху, поэтому блок чуть левее и ниже геометрического центра
  txt(g, 'L³', (w - tw) / 2 - w * .01, h / 2 + size * .36, { size, col: dark ? C.white : C.ink, track: -.05 });
}
// Панорама 3240×1440 для трёх закреплённых роликов TikTok (в сетке профиля видна полоса 3:4 каждого)
let PANO = null;
function panorama() {
  if (PANO) return PANO;
  const c = document.createElement('canvas'); c.width = 3240 * K; c.height = 1440 * K;
  const g = c.getContext('2d'); g.scale(K, K); fill(g, 3240, 1440, C.black);
  // плитка 1 — «L», плитка 2 — красная «³», плитка 3 — слоган
  const ls = 1250;
  txt(g, 'L', 1080 / 2 - measure(g, 'L', ls, 700, -.05) / 2, 1160, { size: ls, col: C.white, track: -.05 });
  txt(g, '³', 1080 + 1080 / 2 - measure(g, '³', ls, 700, -.05) / 2, 1160, { size: ls, col: C.white, track: -.05 });
  SLOGAN_LINES.forEach((l, i) => txt(g, l, 2160 + 110, 700 + i * 230, { size: 210, col: C.white, track: -.035 }));
  return PANO = c;
}
function pinTile(g, i) { fill(g, 1080, 1920, C.black); g.drawImage(panorama(), i * 1080 * K, 0, 1080 * K, 1440 * K, 0, 240, 1080, 1440); }

// ---------- заставки выпусков: TikTok / Shorts (1080×1920) и YouTube (1280×720) ----------
// Новый выпуск = новая запись здесь; hero — 3D-объект обложки.
export const EPISODES = [
  { n: 1, law: 'Закон квадрата и куба', hook: ['Почему', 'нет гигантов'], number: '×1 000 000', numberLabel: 'вес гигантского муравья', hero: 'ant' },
];
const HEROES = { ant: (w, h, dark) => antRender(w, h, dark), cube: (w, h, dark) => markRender(Math.min(w, h), dark) };
function epTikTok(g, ep) {
  const w = 1080, h = 1920; fill(g, w, h, C.black); glowUnder(g, 540, 1080, 520, .07);
  put(g, HEROES[ep.hero](1080, 1080, true), 0, 560);
  txt(g, 'L³', 90, 360, { size: 110, col: C.white, track: -.05 });
  txt(g, `№ ${ep.n}`, 250, 352, { size: 44, w: 600, col: C.muted, track: 0 });
  // кегль хука подбирается так, чтобы самая длинная строка уместилась в 900 px
  const hs = Math.min(150, ...ep.hook.map(l => 150 * 900 / measure(g, l, 150, 700, -.04)));
  txt(g, ep.hook[0], 90, 540, { size: hs, col: C.white });
  txt(g, ep.hook[1], 90, 540 + hs, { size: hs, col: C.white });
  txt(g, ep.law, 94, 1580, { size: 48, w: 600, col: C.white, track: -.01 });
}
// YouTube Shorts: вертикальная обложка. В ленте Shorts низ карточки закрыт названием ролика,
// поэтому весь текст — в верхних двух третях; акцент — главная цифра выпуска (объём/масса = красный).
function epShorts(g, ep) {
  const w = 1080, h = 1920; fill(g, w, h, C.black); glowUnder(g, 540, 1180, 520, .07);
  put(g, HEROES[ep.hero](1080, 1080, true), 0, 640);
  txt(g, 'L³', 90, 360, { size: 110, col: C.white, track: -.05 });
  txt(g, `№ ${ep.n}`, 250, 352, { size: 44, w: 600, col: C.muted, track: 0 });
  const ns = Math.min(170, 900 / Math.max(1, measure(g, ep.number, 170, 700, -.045) / 170));
  txt(g, ep.number, 86, 600, { size: ns, col: ep.numberAccent === false ? C.white : ACCENT.dark, track: -.045 });
  txt(g, ep.numberLabel, 94, 680, { size: 52, w: 500, col: C.muted, track: 0 });
}
function epYouTube(g, ep) {
  const w = 1280, h = 720; fill(g, w, h, C.black); glowUnder(g, 960, 430, 420, .07);
  put(g, HEROES[ep.hero](620, 720, true), 680, 0);
  txt(g, ep.number, 70, 330, { size: 116, col: ep.numberAccent === false ? C.white : ACCENT.dark, track: -.045 });
  txt(g, ep.numberLabel, 76, 400, { size: 40, w: 500, col: C.muted, track: 0 });
  txt(g, 'L³', 70, 660, { size: 64, col: C.white, track: -.05 });
  txt(g, `№ ${ep.n} · ${ep.law}`, 170, 652, { size: 30, w: 600, col: C.white, track: 0 });
}

// ---------- ассеты ----------
export const ASSETS = {
  // Знак
  'logo-mark-3d-black': { w: 2048, h: 2048, draw(g, w, h) { fill(g, w, h, C.black); glowUnder(g, w / 2, h * .55, w * .45, .06); put(g, markRender(w, true), 0, 0); } },
  'logo-mark-3d-paper': { w: 2048, h: 2048, draw(g, w, h) { fill(g, w, h, C.paper); put(g, markRender(w, false), 0, 0); } },
  'logo-mark-3d-transparent': { w: 2048, h: 2048, alpha: true, draw(g, w, h) { put(g, markRender(w, true), 0, 0); } },
  'logo-mark-flat-white': { w: 1024, h: 1024, alpha: true, draw(g, w, h) { flatMark(g, w * .47, h * .5, w * .66); } },
  'logo-mark-flat-ink': { w: 1024, h: 1024, alpha: true, draw(g, w, h) { flatMark(g, w * .47, h * .5, w * .66, { ink: C.ink, tone2: '#6e6e73', tone3: '#c9cbcf' }); } },
  // Знак + имя
  'logo-lockup-black': { w: 3000, h: 1000, draw(g, w, h) { fill(g, w, h, C.black); put(g, markRender(900, true), 60, 50); lockup(g, 1000, 560, 300, true); } },
  'logo-lockup-paper': { w: 3000, h: 1000, draw(g, w, h) { fill(g, w, h, C.paper); put(g, markRender(900, false), 60, 50); lockup(g, 1000, 560, 300, false); } },
  // Аватар: один файл для TikTok, Instagram, YouTube, VK, Telegram (круглая обрезка — знак в центральных 70%)
  'avatar': { w: 1080, h: 1080, draw(g, w, h) { fill(g, w, h, C.black); glowUnder(g, w / 2, h * .56, w * .42, .07); put(g, markRender(w, true, { dist: 7.4 }), 0, 0); } },
  'avatar-paper': { w: 1080, h: 1080, draw(g, w, h) { fill(g, w, h, C.paper); put(g, markRender(w, false, { dist: 7.4 }), 0, 0); } },
  // YouTube: шапка канала 2560×1440, безопасная зона для всех устройств — центр 1546×423
  'youtube-banner': { w: 2560, h: 1440, draw(g, w, h) {
    fill(g, w, h, C.black);
    // кубы — справа в безопасной зоне (видны и на телефоне), текст — слева, ничего не пересекается
    const sx = (w - 1546) / 2, sy = (h - 423) / 2;
    const ex = snap(exploded(true, 3, .55), camAt(600, 600, 38, 26, 22), 600, 600);
    put(g, ex, sx + 1546 - 560, h / 2 - 300);
    put(g, markRender(400, true), sx - 20, sy + 12);
    lockup(g, sx + 400, sy + 210, 150, true);
    txt(g, 'Новый закон каждую неделю', sx + 404, sy + 380, { size: 40, w: 500, col: C.muted, track: 0 });
  } },
  // YouTube: водяной знак 150×150 (плоский, белый)
  'youtube-watermark': { w: 150, h: 150, alpha: true, draw(g, w, h) { flatMark(g, w * .47, h * .5, w * .7); } },
  // YouTube: шаблон превью пилота 1280×720
  'youtube-thumbnail-ep1': { w: 1280, h: 720, draw(g, w, h) {
    fill(g, w, h, C.black); glowUnder(g, 900, 430, 420, .07);
    put(g, antRender(620, 720, true), 680, 0);
    txt(g, '×1 000 000', 70, 330, { size: 116, col: C.white, track: -.045 });
    txt(g, 'вес гигантского муравья', 76, 400, { size: 40, w: 500, col: C.muted, track: 0 });
    txt(g, '№ 1 · Закон квадрата и куба', 76, 650, { size: 30, w: 600, col: C.white, track: 0 });
  } },
  // VK: обложка сообщества 1920×768 (на телефоне видна центральная часть ~1196 px)
  'vk-cover': { w: 1920, h: 768, draw(g, w, h) {
    fill(g, w, h, C.black);
    const ex = snap(exploded(true, 3, .55), camAt(900, 768, 38, 26, 22), 900, 768);
    g.globalAlpha = .85; put(g, ex, 1180, 0); g.globalAlpha = 1;
    put(g, markRender(300, true), 362, 210);
    lockup(g, 680, 420, 120, true);
    txt(g, 'Новый закон каждую неделю', 686, 560, { size: 30, w: 500, col: C.muted, track: 0 });
  } },
  // Telegram: заглавный пост канала 1280×720 (у каналов нет шапки — закреплённый пост её заменяет)
  'telegram-header': { w: 1280, h: 720, draw(g, w, h) {
    fill(g, w, h, C.paper); put(g, markRender(560, false), 680, 80);
    lockup(g, 90, 360, 120, false);
    txt(g, 'Каждую неделю — ещё один закон,', 94, 520, { size: 34, w: 500, col: C.ink, track: 0 });
    txt(g, 'показанный как новый продукт.', 94, 566, { size: 34, w: 500, col: C.ink, track: 0 });
  } },
  // Вертикальная обложка пилота 1080×1920 для TikTok / Reels / VK Клипов (текст в полосе 3:4: y 240–1680)
  'cover-vertical-ep1': { w: 1080, h: 1920, draw(g, w, h) {
    fill(g, w, h, C.black); glowUnder(g, 540, 1080, 520, .07);
    put(g, antRender(1080, 1080, true), 0, 560);
    txt(g, 'Почему', 90, 470, { size: 150, col: C.white });
    txt(g, 'нет гигантов', 90, 620, { size: 150, col: C.white });
    txt(g, '№ 1 · Закон квадрата и куба', 94, 1560, { size: 44, w: 600, col: C.muted, track: 0 });
  } },
  // Instagram: обложки «Актуального» 1080×1920, в круге видна центральная часть
  'ig-highlight-laws': { w: 1080, h: 1920, draw(g, w, h) { fill(g, w, h, C.black); flatMark(g, 530, 960, 420); } },
  'ig-highlight-numbers': { w: 1080, h: 1920, draw(g, w, h) { fill(g, w, h, C.black); txt(g, '×', 540, 1060, { size: 420, col: C.white, align: 'center' }); } },
  // ---------- L³: аватары YouTube и TikTok (чистая типографика — читается и на 40 px) ----------
  'yt-avatar': { w: 1080, h: 1080, draw(g, w, h) { avatarL3(g, w, h); } },
  'tt-avatar': { w: 1080, h: 1080, draw(g, w, h) { avatarL3(g, w, h); } },
  'tt-avatar-paper': { w: 1080, h: 1080, draw(g, w, h) { avatarL3(g, w, h, false); } },
  // ---------- L³: шапка YouTube (новая) ----------
  'yt-banner-l3': { w: 2560, h: 1440, draw(g, w, h) {
    // только знак и слоган, по центру безопасной зоны 1546×423
    fill(g, w, h, C.black);
    const ls = 300, ss = 110, gap = 90;
    const lw = measure(g, 'L³', ls, 700, -.05), sw = measure(g, SLOGAN, ss, 600, -.025);
    const x0 = (w - (lw + gap + sw)) / 2, base = h / 2 + ls * .36;
    txt(g, 'L³', x0, base, { size: ls, col: C.white, track: -.05 });
    txt(g, SLOGAN, x0 + lw + gap, base - 6, { size: ss, w: 600, col: C.white, track: -.025 });
  } },
  // ---------- L³: TikTok — триптих из трёх закреплённых роликов (у TikTok нет шапки профиля) ----------
  'tt-pin-1': { w: 1080, h: 1920, draw(g, w, h) { pinTile(g, 0); } },
  'tt-pin-2': { w: 1080, h: 1920, draw(g, w, h) { pinTile(g, 1); } },
  'tt-pin-3': { w: 1080, h: 1920, draw(g, w, h) { pinTile(g, 2); } },
  'tt-pin-preview': { w: 3240, h: 1440, draw(g, w, h) { g.drawImage(panorama(), 0, 0, 3240, 1440); } },
  'ig-highlight-about': { w: 1080, h: 1920, draw(g, w, h) { fill(g, w, h, C.paper); txt(g, 'L³', 540, 1100, { size: 380, col: C.ink, align: 'center' }); } },
};

// Выпуски 2+: apple/episodes/index.json → для каждого cover.json (тексты) и hero.mjs (3D-герой обложки)
export async function init() {
  let list = [];
  try { list = await (await fetch('/apple/episodes/index.json')).json(); } catch (e) { return; }
  for (const id of list) {
    try {
      const ep = await (await fetch(`/apple/episodes/${id}/cover.json`)).json();
      const mod = await import(`/apple/episodes/${id}/hero.mjs`);
      HEROES[id] = (w, h, dark) => {
        const scene = studio(dark), { object, cam } = mod.default(THREE, { MAT, roundedBox, glassEdges, shadowsOn, models: MODELS });
        scene.add(object);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: dark ? .45 : .16 }));
        floor.rotation.x = -Math.PI / 2; floor.position.y = cam.floorY ?? 0; floor.receiveShadow = true; if (cam.floor !== false) scene.add(floor);
        return snap(scene, camAt(w, h, cam.az ?? 35, cam.el ?? 15, cam.dist ?? 6, cam.target ?? [0, .5, 0], cam.fov ?? 24), w, h);
      };
      ep.hero = id; EPISODES.push(ep); registerEpisode(ep);
    } catch (e) { console.error('episode ' + id + ': ' + e.message); }
  }
}
function registerEpisode(ep) {
  ASSETS[`ep${ep.n}-tiktok-cover`] = { w: 1080, h: 1920, draw(g) { epTikTok(g, ep); } };
  ASSETS[`ep${ep.n}-shorts-cover`] = { w: 1080, h: 1920, draw(g) { epShorts(g, ep); } };
}
for (const ep of EPISODES) {
  ASSETS[`ep${ep.n}-tiktok-cover`] = { w: 1080, h: 1920, draw(g) { epTikTok(g, ep); } };
  ASSETS[`ep${ep.n}-shorts-cover`] = { w: 1080, h: 1920, draw(g) { epShorts(g, ep); } };   // YouTube — только Shorts
}

export async function draw(name) {
  const a = ASSETS[name]; if (!a) throw new Error('нет ассета ' + name);
  const out = document.getElementById('out'); out.width = a.w * K; out.height = a.h * K;
  const g = out.getContext('2d'); g.setTransform(K, 0, 0, K, 0, 0); g.clearRect(0, 0, a.w, a.h);
  a.draw(g, a.w, a.h);
}
