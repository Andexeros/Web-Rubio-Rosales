// Constructor paramétrico de casas modernas por etapas de obra.
// Cada pieza guarda su etapa (0 fundaciones … 6 exterior) para animar la construcción.
import * as THREE from 'three';

export const STAGES = ['Fundaciones', 'Estructura', 'Losas', 'Muros', 'Aberturas', 'Cubierta', 'Exterior'];
export const BUILD_END = STAGES.length + 0.7;

// Ruido determinístico para que cada render sea reproducible.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function woodTexture(light) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = light ? '#a9805a' : '#7d5a40';
  g.fillRect(0, 0, 256, 256);
  const r = rng(7);
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = `rgba(${light ? '70,40,20' : '40,20,10'},${0.05 + r() * 0.12})`;
    g.lineWidth = 1 + r() * 2;
    const x = r() * 256;
    g.beginPath(); g.moveTo(x, 0);
    g.bezierCurveTo(x + r() * 10 - 5, 80, x + r() * 10 - 5, 170, x + r() * 6 - 3, 256);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function noiseTexture(base, amp, seed, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  const r = rng(seed);
  for (let i = 0; i < size * 14; i++) {
    const v = r() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${r() * amp})`;
    g.fillRect(r() * size, r() * size, 1 + r() * 2, 1 + r() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function stoneTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#6f675d'; g.fillRect(0, 0, 256, 256);
  const r = rng(21);
  for (let y = 0; y < 256; y += 18 + Math.floor(r() * 10)) {
    let x = -r() * 30;
    const h = 16 + r() * 10;
    while (x < 256) {
      const w = 26 + r() * 40;
      const l = 95 + r() * 60;
      g.fillStyle = `rgb(${l + 8},${l},${l - 10})`;
      g.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
      x += w;
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function interiorTexture(dusk) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 128);
  if (dusk) { grd.addColorStop(0, '#ffe2b0'); grd.addColorStop(0.15, '#c98a4c'); grd.addColorStop(1, '#6e4528'); }
  else { grd.addColorStop(0, '#5b5a55'); grd.addColorStop(0.2, '#3b3b37'); grd.addColorStop(1, '#262622'); }
  g.fillStyle = grd; g.fillRect(0, 0, 512, 128);
  const r = rng(dusk ? 77 : 78);
  for (let i = 0; i < 26; i++) {
    const w = 18 + r() * 60, h = 14 + r() * 40, x = r() * 512;
    g.fillStyle = dusk ? `rgba(60,30,15,${0.35 + r() * 0.4})` : `rgba(20,20,18,${0.4 + r() * 0.4})`;
    g.fillRect(x, 128 - h, w, h);
  }
  if (dusk) for (let i = 0; i < 10; i++) {
    const x = r() * 512;
    const rg = g.createRadialGradient(x, 6, 1, x, 6, 40);
    rg.addColorStop(0, 'rgba(255,240,200,.95)'); rg.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = rg; g.fillRect(x - 40, 0, 80, 60);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createMaterials({ dusk = 0 } = {}) {
  const concreteMap = noiseTexture('#b9b5ac', 0.09, 3);
  const whiteMap = noiseTexture('#eeebe4', 0.04, 5);
  const wood = woodTexture(true);
  const woodDeck = woodTexture(false);
  const stone = stoneTexture();
  const m = {
    concrete: new THREE.MeshStandardMaterial({ map: concreteMap, roughness: 0.92 }),
    white: new THREE.MeshStandardMaterial({ map: whiteMap, roughness: 0.85 }),
    wood: new THREE.MeshStandardMaterial({ map: wood, roughness: 0.7 }),
    deck: new THREE.MeshStandardMaterial({ map: woodDeck, roughness: 0.8 }),
    stone: new THREE.MeshStandardMaterial({ map: stone, roughness: 0.95 }),
    dark: new THREE.MeshStandardMaterial({ color: '#2b2f2e', roughness: 0.45, metalness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: '#3a3f3d', roughness: 0.4, metalness: 0.7 }),
    slab: new THREE.MeshStandardMaterial({ map: concreteMap, color: '#d8d4cb', roughness: 0.9 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#8fa9ad', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.42,
      envMapIntensity: 2.2, clearcoat: 1, depthWrite: false
    }),
    interior: (() => {
      const t = interiorTexture(dusk > 0.5);
      return new THREE.MeshStandardMaterial({
        map: t, roughness: 0.95, emissive: new THREE.Color('#ffffff'), emissiveMap: t,
        emissiveIntensity: dusk > 0.5 ? 0.9 : 0.12
      });
    })(),
    water: new THREE.MeshPhysicalMaterial({
      color: '#3fa2b5', roughness: 0.03, metalness: 0.15, envMapIntensity: 2.4, clearcoat: 1,
      emissive: new THREE.Color('#2ab3d6'), emissiveIntensity: dusk * 0.6
    }),
    coping: new THREE.MeshStandardMaterial({ map: whiteMap, color: '#e6e1d6', roughness: 0.8 }),
    gravel: new THREE.MeshStandardMaterial({ map: noiseTexture('#cfc6b4', 0.18, 9), roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: '#5b4632', roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#56723c', roughness: 0.95 }),
    leaf2: new THREE.MeshStandardMaterial({ color: '#6c8444', roughness: 0.95 }),
    shrub: new THREE.MeshStandardMaterial({ color: '#4c6a3d', roughness: 1 }),
    foliage: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true }),
  };
  [concreteMap, whiteMap, stone].forEach(t => t.repeat.set(2, 2));
  return m;
}

// Variantes: volúmenes { x,z (centro), w,d, y (base), h (altura libre), clad, sides{s,e,n,w}, ov, slab, slats }
// Lados: 'g' vidrio, 's' muro, 'm' mixto (muro + vidrio). Frente hacia +z.
export const VARIANTS = {
  mirador: {
    volumes: [
      { x: 0, z: 0, w: 14, d: 9, y: 0.35, h: 3.1, clad: 'concrete', sides: { s: 'g', e: 'm', n: 's', w: 's' }, ov: 0.5 },
      { x: 2.6, z: -0.6, w: 10.5, d: 7.4, y: 4.1, h: 3, clad: 'wood', sides: { s: 'm', e: 'g', n: 's', w: 's' }, ov: 0.6, slab: false, slats: 's' }
    ],
    pool: { x: -1.5, z: 8.6, w: 9.5, d: 3.4 },
    deck: { x: 0, z: 6.4, w: 17, d: 3.6 },
    trees: [[-12, -3, 1.2], [-10.5, 6, 0.9], [11.5, 7, 1], [13, -5, 1.3], [-6, -9, 1.1], [7, -10, 1]],
    shrubs: 18, seed: 4
  },
  patio: {
    volumes: [
      { x: -2, z: 0, w: 16, d: 7.5, y: 0.35, h: 3.2, clad: 'white', sides: { s: 'g', e: 's', n: 's', w: 's' }, ov: 1.2 },
      { x: 7.5, z: 3.5, w: 6, d: 13, y: 0.35, h: 3.2, clad: 'white', sides: { s: 's', e: 'm', n: 's', w: 'g' }, ov: 0.9 },
    ],
    pool: { x: 0, z: 7.5, w: 7, d: 3 },
    deck: { x: -1, z: 6.6, w: 13, d: 5.2 },
    trees: [[-12, 8, 1.3], [-13, -4, 1], [3, -8, 1.2], [14, -4, 0.9], [-4, 13, 0.8]],
    shrubs: 22, seed: 11
  },
  piedra: {
    volumes: [
      { x: 0, z: 0, w: 12, d: 9, y: 0.35, h: 3, clad: 'stone', sides: { s: 'm', e: 'g', n: 's', w: 's' }, ov: 0.3 },
      { x: -1.6, z: 1.2, w: 13, d: 7, y: 3.7, h: 2.9, clad: 'dark', sides: { s: 'g', e: 'm', n: 's', w: 'g' }, ov: 0.8, slab: false },
    ],
    deck: { x: 2, z: 6.5, w: 12, d: 3 },
    trees: [[-11, 5, 1.2], [10, 9, 1], [12, -4, 1.3], [-9, -8, 1.2], [3, -11, 1]],
    shrubs: 16, seed: 23
  },
  lineal: {
    volumes: [
      { x: 0, z: 0, w: 20, d: 7, y: 0.35, h: 3.2, clad: 'concrete', sides: { s: 'g', e: 'g', n: 's', w: 's' }, ov: 1.6, slats: 'w' },
    ],
    pool: { x: 3, z: 7.8, w: 12, d: 2.6 },
    deck: { x: 0, z: 5.6, w: 22, d: 3.2 },
    trees: [[-14, 6, 1.3], [-13, -5, 1], [14, 8, 1.1], [15, -3, 1.2], [0, -9, 1.3]],
    shrubs: 20, seed: 31
  }
};

export function buildHouse(variantName = 'mirador', opts = {}) {
  const v = VARIANTS[variantName];
  const mats = opts.materials || createMaterials(opts);
  const group = new THREE.Group();
  const parts = [];
  const r = rng(v.seed || 1);

  const add = (mesh, stage, anim = 'drop', delay = 0) => {
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.stage = stage;
    mesh.userData.anim = anim;
    mesh.userData.delay = delay;
    mesh.userData.base = mesh.position.clone();
    group.add(mesh);
    parts.push(mesh);
    return mesh;
  };
  const box = (w, h, d, mat, x, y, z) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    return m;
  };
  const cladMat = (c) => mats[c] || mats.concrete;

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, topY = 0;

  v.volumes.forEach((vol, vi) => {
    const { x, z, w, d, y, h } = vol;
    const ov = vol.ov ?? 0.4;
    const slabT = 0.3, roofT = 0.35;
    const floorY = vol.slab === false ? y : y + slabT;
    const delayV = vi > 0 ? 0.6 : 0;
    const supports = v.volumes.some((o, oi) => oi > vi && o.slab === false);
    minX = Math.min(minX, x - w / 2); maxX = Math.max(maxX, x + w / 2);
    minZ = Math.min(minZ, z - d / 2); maxZ = Math.max(maxZ, z + d / 2);

    if (vol.slab !== false) {
      add(box(w + 0.4, 0.35, d + 0.4, mats.concrete, x, 0, z), 0, 'grow', delayV);
      add(box(w, slabT, d, mats.slab, x, y, z), 2, 'drop', delayV);
    }

    // Estructura: columnas perimetrales.
    const colsX = Math.max(2, Math.ceil(w / 4.2) + 1);
    const colsZ = Math.max(2, Math.ceil(d / 4.2) + 1);
    for (let i = 0; i < colsX; i++) {
      for (let j = 0; j < colsZ; j++) {
        if (i !== 0 && i !== colsX - 1 && j !== 0 && j !== colsZ - 1) continue;
        const cx = x - w / 2 + 0.15 + (w - 0.3) * (i / (colsX - 1));
        const cz = z - d / 2 + 0.15 + (d - 0.3) * (j / (colsZ - 1));
        add(box(0.22, h, 0.22, mats.steel, cx, floorY, cz), 1, 'grow', delayV + (i + j) * 0.03);
      }
    }

    // Cerramientos por lado.
    const sides = vol.sides || {};
    const sideDefs = {
      s: { len: w, nx: 0, nz: 1, cx: x, cz: z + d / 2, alongX: true },
      n: { len: w, nx: 0, nz: -1, cx: x, cz: z - d / 2, alongX: true },
      e: { len: d, nx: 1, nz: 0, cx: x + w / 2, cz: z, alongX: false },
      w: { len: d, nx: -1, nz: 0, cx: x - w / 2, cz: z, alongX: false },
    };
    Object.entries(sideDefs).forEach(([key, sd], si) => {
      const type = sides[key] || 's';
      const segs = type === 'g' ? [['g', 0, 1]] : type === 'm' ? [['s', 0, 0.38], ['g', 0.38, 1]] : [['s', 0, 1]];
      segs.forEach(([kind, a, b]) => {
        const segLen = sd.len * (b - a);
        const off = -sd.len / 2 + sd.len * (a + b) / 2;
        const inset = kind === 'g' ? 0.16 : 0.1;
        const px = sd.alongX ? sd.cx + off : sd.cx - sd.nx * inset;
        const pz = sd.alongX ? sd.cz - sd.nz * inset : sd.cz + off;
        const T = kind === 'g' ? 0.04 : 0.2;
        const gw = sd.alongX ? segLen : T, gd = sd.alongX ? T : segLen;
        if (kind === 's') {
          add(box(gw, h, gd, cladMat(vol.clad), px, floorY, pz), 3, 'grow', delayV + si * 0.08);
        } else {
          add(box(gw, h, gd, mats.glass, px, floorY, pz), 4, 'drop', delayV + si * 0.08).castShadow = false;
          const n = Math.max(1, Math.round(segLen / 2.3));
          for (let k = 0; k <= n; k++) {
            const t = -segLen / 2 + segLen * (k / n);
            const mx = sd.alongX ? px + t : px;
            const mz = sd.alongX ? pz : pz + t;
            add(box(sd.alongX ? 0.07 : 0.1, h, sd.alongX ? 0.1 : 0.07, mats.dark, mx, floorY, mz), 4, 'grow', delayV + si * 0.08 + k * 0.02);
          }
          add(box(sd.alongX ? segLen : 0.1, 0.08, sd.alongX ? 0.1 : segLen, mats.dark, px, floorY, pz), 4, 'drop', delayV);
        }
      });
    });

    // Interior (se ve detrás del vidrio; de noche, iluminado).
    add(box(w - 0.7, h - 0.05, d - 0.7, mats.interior, x, floorY, z), 4, 'grow', delayV + 0.1).castShadow = false;

    // Listones de madera sobre una fachada.
    if (vol.slats) {
      const sd = sideDefs[vol.slats];
      const span = sd.len * (vol.slats === 'w' || vol.slats === 'e' ? 1 : 0.38);
      const start = -sd.len / 2;
      const count = Math.floor(span / 0.2);
      for (let k = 0; k < count; k++) {
        const t = start + 0.1 + k * 0.2;
        const px = sd.alongX ? sd.cx + t : sd.cx + sd.nx * 0.14;
        const pz = sd.alongX ? sd.cz + sd.nz * 0.14 : sd.cz + t;
        add(box(sd.alongX ? 0.07 : 0.12, h, sd.alongX ? 0.12 : 0.07, mats.wood, px, floorY, pz), 5, 'grow', delayV + 0.3 + k * 0.006);
      }
    }

    // Cubierta con alero.
    const roofY = floorY + h;
    const roofStage = supports ? 2 : 5;
    add(box(w + ov * 2, roofT, d + ov * 2, mats.slab, x, roofY, z), roofStage, 'drop', supports ? 0.5 : delayV);
    add(box(w + ov * 2 + 0.02, 0.12, d + ov * 2 + 0.02, mats.dark, x, roofY + roofT - 0.06, z), 5, 'drop', delayV + 0.1);
    topY = Math.max(topY, roofY + roofT);
  });

  // Exterior: deck, pileta, árboles y arbustos.
  if (v.deck) {
    const { x, z, w, d } = v.deck;
    add(box(w, 0.25, d, mats.deck, x, 0, z), 6, 'grow', 0);
  }
  if (v.pool) {
    const { x, z, w, d } = v.pool;
    const c = 0.35, ph = 0.55;
    add(box(w + c * 2, ph, c, mats.coping, x, 0, z - d / 2 - c / 2), 6, 'grow', 0.1);
    add(box(w + c * 2, ph, c, mats.coping, x, 0, z + d / 2 + c / 2), 6, 'grow', 0.12);
    add(box(c, ph, d, mats.coping, x - w / 2 - c / 2, 0, z), 6, 'grow', 0.14);
    add(box(c, ph, d, mats.coping, x + w / 2 + c / 2, 0, z), 6, 'grow', 0.16);
    add(box(w, ph - 0.1, d, mats.water, x, 0, z), 6, 'grow', 0.25);
  }
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.17, 2.6, 7); trunkGeo.translate(0, 1.3, 0);
  const blob = (rad, sy, detail, seed) => {
    const g = new THREE.SphereGeometry(rad, 14 + detail * 4, 10 + detail * 3);
    const pos = g.attributes.position;
    const o = seed * 1.37;
    for (let k = 0; k < pos.count; k++) {
      const X = pos.getX(k), Y = pos.getY(k), Z = pos.getZ(k);
      const n = Math.sin(X * 2.1 + o) * Math.cos(Z * 2.3 - o) * 0.5 + Math.sin(Y * 3.1 + X * 1.7 + o * 2) * 0.35 + Math.sin((X + Z) * 5.3 + o) * 0.12;
      const f = 1 + n * 0.16;
      pos.setXYZ(k, X * f, Y * f * sy, Z * f);
    }
    g.computeVertexNormals();
    return g;
  };
  const leafGeo = new THREE.IcosahedronGeometry(1, 1);
  (v.trees || []).forEach(([tx, tz, s], i) => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, mats.trunk);
    trunk.castShadow = true;
    tree.add(trunk);
    const poplar = i % 2 === 0;
    // Copa formada por cientos de racimos de follaje (instanciados) para una silueta natural.
    const clusters = poplar ? 300 : 340;
    const cy = poplar ? 6.2 : 3.9, ry = poplar ? 3.7 : 1.6, rx = poplar ? 1.1 : 2.2;
    if (poplar) trunk.scale.set(1, 1.6, 1);
    const inst = new THREE.InstancedMesh(leafGeo, mats.foliage, clusters);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
    const base = new THREE.Color(poplar ? '#5d7a3c' : '#536f37'), c = new THREE.Color();
    for (let k = 0; k < clusters; k++) {
      const u = r() * Math.PI * 2, w = Math.acos(2 * r() - 1), rad = 0.55 + 0.45 * Math.cbrt(r());
      P.set(Math.sin(w) * Math.cos(u) * rx * rad, cy + Math.cos(w) * ry * rad, Math.sin(w) * Math.sin(u) * rx * rad);
      Q.setFromEuler(E.set(r() * 3, r() * 3, r() * 3));
      const sc = 0.24 + r() * 0.2;
      M.compose(P, Q, S.set(sc, sc * 0.8, sc));
      inst.setMatrixAt(k, M);
      const light = (P.y - cy) / ry * 0.07 + (r() - 0.5) * 0.1;
      c.copy(base).offsetHSL((r() - 0.5) * 0.04, 0, light);
      inst.setColorAt(k, c);
    }
    inst.castShadow = inst.receiveShadow = true;
    tree.add(inst);
    tree.position.set(tx, 0, tz);
    tree.scale.setScalar(s);
    tree.userData.scale = s;
    add(tree, 6, 'pop', 0.2 + i * 0.06);
  });
  for (let i = 0; i < (v.shrubs || 0); i++) {
    const ang = r() * Math.PI * 2;
    const rad = 0.5 + r() * 2.5;
    // Arbustos en el borde de la casa.
    const side = Math.floor(r() * 4);
    let sx, sz;
    if (side === 0) { sx = minX + r() * (maxX - minX); sz = maxZ + 0.9 + r() * 0.6; }
    else if (side === 1) { sx = maxX + 1 + r() * 0.8; sz = minZ + r() * (maxZ - minZ); }
    else if (side === 2) { sx = minX - 1 - r() * 0.8; sz = minZ + r() * (maxZ - minZ); }
    else { sx = minX + r() * (maxX - minX); sz = minZ - 1 - r() * 0.8; }
    if (v.deck && Math.abs(sx - v.deck.x) < v.deck.w / 2 + 0.3 && Math.abs(sz - v.deck.z) < v.deck.d / 2 + 0.3) continue;
    if (v.pool && Math.abs(sx - v.pool.x) < v.pool.w / 2 + 0.8 && Math.abs(sz - v.pool.z) < v.pool.d / 2 + 0.8) continue;
    const g = blob(0.45 + r() * 0.4, 1, 1, i * 7 + 3);
    const sh = new THREE.Mesh(g, mats.shrub);
    sh.position.set(sx + Math.cos(ang) * 0.1, 0.25, sz + Math.sin(ang) * 0.1 * rad);
    sh.scale.y = 0.7;
    sh.userData.scale = 1;
    add(sh, 6, 'pop', 0.3 + r() * 0.5);
  }

  group.userData = { parts, mats, bounds: { minX, maxX, minZ, maxZ, topY } };
  return group;
}

const ease = t => 1 - Math.pow(1 - t, 3);

// p va de 0 (terreno vacío) a BUILD_END (casa terminada).
export function applyBuild(group, p) {
  for (const m of group.userData.parts) {
    const t = Math.min(1, Math.max(0, (p - m.userData.stage - m.userData.delay) * 1.6));
    const e = ease(t);
    m.visible = t > 0.001;
    if (!m.visible) continue;
    const b = m.userData.base;
    if (m.userData.anim === 'grow') {
      m.scale.y = Math.max(e, 0.001);
      m.position.y = b.y;
    } else if (m.userData.anim === 'pop') {
      const s = (m.userData.scale || 1) * e;
      m.scale.set(s, m.userData.anim === 'pop' && m.geometry ? s * 0.7 : s, s);
    } else {
      m.position.y = b.y + (1 - e) * 3.2;
    }
  }
}

// Agrega aristas tipo plano a cada pieza (para el modo relevamiento).
export function addEdges(group, material) {
  for (const m of group.userData.parts) {
    m.traverse(o => {
      if (o.isMesh && o.geometry) {
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 20), material);
        e.userData.isEdge = true;
        o.add(e);
      }
    });
  }
}
