// Escenas 3D del sitio: obra en vivo (hero) y relevamiento render → plano (scroll).
import { createStage } from './scene.js';
import { STAGES, BUILD_END } from './house.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const fit = aspect => Math.max(1, Math.pow(1.25 / aspect, 0.62));
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

function whenNear(el, cb, margin = '50% 0px') {
  if (!('IntersectionObserver' in window)) return cb();
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); cb(); } }, { rootMargin: margin });
  io.observe(el);
}

function visibility(el) {
  const st = { on: true };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { st.on = es[0].isIntersecting; }, { rootMargin: '10% 0px' }).observe(el);
  }
  return st;
}

/* ---------- HERO: la casa se construye etapa por etapa ---------- */
function initHero() {
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('hero-canvas');
  if (!hero || !canvas) return;
  const mobile = () => innerWidth < 760;
  const s = createStage(canvas, {
    variant: 'mirador', light: 'day',
    pixelRatio: Math.min(devicePixelRatio, mobile() ? 1.5 : 1.75),
    shadowSize: mobile() ? 1024 : 2048
  });
  const num = document.getElementById('stage-num');
  const label = document.getElementById('stage-label');
  const bar = document.getElementById('stage-bar');
  const vis = visibility(hero);
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const DURATION = 7.5;
  let t0 = performance.now(), started = false, lastStage = -1;

  function size() {
    const w = hero.clientWidth, h = hero.clientHeight;
    s.resize(w, h);
    if (mobile()) s.camera.setViewOffset(w, h, 0, -h * 0.17, w, h);
    else s.camera.setViewOffset(w, h, -w * 0.22, 0, w, h);
  }
  size();
  addEventListener('resize', size);
  addEventListener('pointermove', e => {
    pointer.tx = e.clientX / innerWidth - 0.5;
    pointer.ty = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  document.querySelector('.replay')?.addEventListener('click', () => { t0 = performance.now(); });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!vis.on || document.hidden) return;
    const el = (now - t0) / 1000;
    const k = reduce ? 1 : clamp(el / DURATION);
    const p = BUILD_END * easeInOut(k);
    s.setBuild(p);

    const st = Math.min(STAGES.length - 1, Math.floor(p));
    if (st !== lastStage) {
      lastStage = st;
      num.textContent = String(st + 1).padStart(2, '0');
      label.textContent = k >= 1 ? 'Casa terminada' : STAGES[st];
    }
    if (k >= 1 && label.textContent !== 'Casa terminada') label.textContent = 'Casa terminada';
    bar.style.width = (k * 100).toFixed(1) + '%';

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    const scroll = clamp(scrollY / innerHeight);
    const T = now / 1000;
    const ang = 0.78 + (reduce ? 0 : Math.sin(T * 0.07) * 0.22) + pointer.x * 0.18;
    const radius = 44 * fit(s.camera.aspect) + scroll * 6;
    const height = lerp(17, 4.8, easeInOut(k)) + pointer.y * -1.6 + scroll * 6;
    s.camera.position.set(Math.sin(ang) * radius, height, Math.cos(ang) * radius);
    s.camera.lookAt(0, 3 + scroll * 2, 0);
    s.render();
    if (!started) { started = true; t0 = performance.now(); requestAnimationFrame(() => hero.classList.add('live')); }
  }
  requestAnimationFrame(frame);
}

/* ---------- RELEVAMIENTO: el scroll convierte el render en plano ---------- */
function initScan() {
  const sec = document.getElementById('relevamiento');
  const canvas = document.getElementById('scan-canvas');
  if (!sec || !canvas) return;
  whenNear(sec, () => {
    const mobile = () => innerWidth < 760;
    const s = createStage(canvas, {
      variant: 'mirador', light: 'scan', scan: true,
      pixelRatio: Math.min(devicePixelRatio, 1.5), shadowSize: 1024
    });
    s.setBuild(s.BUILD_END);
    const b = s.house.userData.bounds;
    const steps = [...sec.querySelectorAll('.scan-steps li')];
    const pct = document.getElementById('scan-pct');
    const wrap = sec.querySelector('.scan-canvas-wrap');
    let dirty = true, active = -1;

    function size() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      s.resize(w, h);
      if (mobile()) s.camera.setViewOffset(w, h, 0, h * 0.2, w, h);
      else s.camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
      dirty = true;
    }
    size();
    addEventListener('resize', size);
    addEventListener('scroll', () => { dirty = true; }, { passive: true });

    function frame() {
      requestAnimationFrame(frame);
      if (!dirty) return;
      dirty = false;
      const r = sec.getBoundingClientRect();
      const q = clamp(-r.top / Math.max(1, r.height - innerHeight));
      const scanT = smooth(0.12, 0.88, q);
      s.setScan(lerp(b.minX - 4, b.maxX + 4, scanT));
      const ang = lerp(1.05, 0.55, q);
      const rad = 46 * fit(s.camera.aspect);
      s.camera.position.set(Math.sin(ang) * rad, lerp(9, 15, q), Math.cos(ang) * rad);
      s.camera.lookAt(0, 3, 0);
      s.render();
      const idx = q < 0.34 ? 0 : q < 0.67 ? 1 : 2;
      if (idx !== active) { active = idx; steps.forEach((li, i) => li.classList.toggle('active', i === idx)); }
      pct.textContent = Math.round(scanT * 100) + '%';
      sec.classList.add('live');
    }
    requestAnimationFrame(frame);
  }, '80% 0px');
}

if (webglOK()) {
  try { initHero(); } catch (e) { console.warn('Hero 3D no disponible', e); }
  try { initScan(); } catch (e) { console.warn('Relevamiento 3D no disponible', e); }
}
