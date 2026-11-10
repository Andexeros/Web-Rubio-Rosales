// Escena 3D reutilizable: cielo, cordillera, luz solar y una casa.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { buildHouse, applyBuild, addEdges, BUILD_END } from './house.js';

export const LIGHTS = {
  day: { top: '#9fb9c4', horizon: '#efe9dc', sun: '#fff4e2', sunI: 3.2, hemi: 0.6, sunPos: [30, 30, 26], mountain: '#7f8f9a', dusk: 0, exposure: 1 },
  golden: { top: '#7d9aa6', horizon: '#f2d6aa', sun: '#ffd29a', sunI: 3.6, hemi: 0.7, sunPos: [-34, 16, 24], mountain: '#8a8688', dusk: 0.25, exposure: 1.05 },
  dusk: { top: '#34476a', horizon: '#e9a57e', sun: '#ffb07a', sunI: 1.1, hemi: 0.35, sunPos: [-40, 8, -10], mountain: '#4b4a55', dusk: 1, exposure: 1.1 },
  scan: { top: '#0e221c', horizon: '#173a31', sun: '#ffffff', sunI: 2.6, hemi: 0.6, sunPos: [26, 34, 30], mountain: '#1c3d34', dusk: 0, exposure: 1 }
};

function skyDome(top, horizon) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, horizon: { value: new THREE.Color(horizon) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.05,0.,1.); gl_FragColor = vec4(mix(horizon, top, pow(h,0.7)),1.); }'
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), mat);
  m.renderOrder = -1;
  return m;
}

// Cordillera al fondo (guiño a la cordillera mendocina): banda de relieve con nieve.
function mountains(color, seed = 3) {
  const W = 2200, D = 260, sx = 260, sz = 40;
  const geo = new THREE.PlaneGeometry(W, D, sx, sz);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const rock = new THREE.Color(color), snow = new THREE.Color('#f3f3f0'), tmp = new THREE.Color();
  const ridge = (x, z) => {
    let h = 0, amp = 1, f = 0.004;
    for (let o = 0; o < 6; o++) {
      const n = 1 - Math.abs(Math.sin(x * f + seed * (o + 1) * 1.7) * Math.cos(z * f * 1.3 + o * 2.1 + seed));
      h += n * n * amp; amp *= 0.5; f *= 2.05;
    }
    return h;
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const back = (z + D / 2) / D; // 0 al frente, 1 al fondo
    const h = ridge(x, z) * (40 + 70 * (1 - back)) * Math.min(1, (1 - back) * 3) - 8;
    pos.setY(i, h);
    const sn = THREE.MathUtils.smoothstep(h, 52, 70);
    tmp.copy(rock).lerp(snow, sn);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  m.position.set(0, 0, -470);
  const g = new THREE.Group();
  g.add(m);
  return g;
}

function grassTex(dark) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = dark ? '#46553a' : '#7a8b58'; g.fillRect(0, 0, 512, 512);
  let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 40000; i++) {
    const l = r();
    g.fillStyle = l > 0.5 ? `rgba(170,180,120,${r() * 0.22})` : `rgba(40,60,30,${r() * 0.22})`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(220, 220); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createStage(canvas, opts = {}) {
  const {
    variant = 'mirador', light = 'day', scan = false, pixelRatio = Math.min(devicePixelRatio, 1.75),
    shadowSize = 2048, preserve = false, antialias = true
  } = opts;
  const L = LIGHTS[light];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias, alpha: false, preserveDrawingBuffer: preserve, powerPreference: 'high-performance' });
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = L.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = scan;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = scan ? 0.5 : 0.55;
  scene.fog = new THREE.Fog(L.horizon, 80, 640);
  scene.add(skyDome(L.top, L.horizon));
  if (!scan) scene.add(mountains(L.mountain));

  const hemi = new THREE.HemisphereLight(L.top, '#6d6a55', L.hemi);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(L.sun, L.sunI);
  sun.position.set(...L.sunPos);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);

  const house = buildHouse(variant, { dusk: L.dusk });
  scene.add(house);

  // Terreno.
  const groundMat = scan
    ? new THREE.MeshStandardMaterial({ color: '#112a23', roughness: 1 })
    : new THREE.MeshStandardMaterial({ map: grassTex(light === 'dusk'), roughness: 1 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(900, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  if (!scan) {
    // Vereda de grava y parche de tierra bajo la casa.
    const paver = new THREE.MeshStandardMaterial({ color: '#cfcac0', roughness: 0.9 });
    const b0 = house.userData.bounds;
    for (let i = 0; i < 9; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.8), paver);
      p.position.set(b0.maxX - 2 + Math.sin(i * 0.5) * 0.3, 0.04, b0.maxZ + 3 + i * 1.3);
      p.receiveShadow = true;
      scene.add(p);
    }
  } else {
    const grid = new THREE.GridHelper(80, 80, '#d5e8a1', '#2f5a4c');
    grid.material.transparent = true; grid.material.opacity = 0.35;
    grid.position.y = 0.02;
    scene.add(grid);
  }


  // Luces cálidas interiores para el atardecer.
  if (L.dusk > 0.5) {
    const b = house.userData.bounds;
    const warm = new THREE.PointLight('#ffb66b', 30, 22, 1.6);
    warm.position.set((b.minX + b.maxX) / 2, 2, b.maxZ + 1.5);
    scene.add(warm);
  }

  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 2500);
  const state = { scanX: Infinity };

  // Modo relevamiento: plano de corte que convierte el render en plano.
  let scanSheet, solidPlane, edgePlane, labels = [];
  if (scan) {
    solidPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
    edgePlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    house.traverse(o => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.clippingPlanes = [solidPlane];
      }
    });
    const lineMat = new THREE.LineBasicMaterial({ color: '#d5e8a1', transparent: true, opacity: 0.85, clippingPlanes: [edgePlane] });
    addEdges(house, lineMat);
    const b = house.userData.bounds;
    const sheet = new THREE.Mesh(
      new THREE.PlaneGeometry(b.maxZ - b.minZ + 10, b.topY + 4),
      new THREE.MeshBasicMaterial({ color: '#d5e8a1', transparent: true, opacity: 0.12, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    sheet.rotation.y = Math.PI / 2;
    sheet.position.set(0, (b.topY + 4) / 2, (b.minZ + b.maxZ) / 2);
    const H = b.topY + 4, Dz = b.maxZ - b.minZ + 10;
    const edgeLine = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(Dz, H)), new THREE.LineBasicMaterial({ color: '#e9f6c4' }));
    edgeLine.rotation.y = Math.PI / 2;
    edgeLine.position.copy(sheet.position);
    scanSheet = new THREE.Group();
    scanSheet.add(sheet, edgeLine);
    scene.add(scanSheet);

    // Cotas.
    const fmt = n => n.toFixed(2).replace('.', ',') + ' m';
    const dim = (a, bb, text) => {
      const pts = [a, bb];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, lineMat);
      scene.add(line);
      const c = document.createElement('canvas'); c.width = 256; c.height = 64;
      const g = c.getContext('2d');
      g.fillStyle = '#d5e8a1'; g.font = '600 34px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, 128, 32);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      spr.scale.set(4, 1, 1);
      spr.position.copy(a).add(bb).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.7, 0));
      spr.renderOrder = 10;
      scene.add(spr);
      labels.push(spr);
    };
    const z = b.maxZ + 4.2;
    dim(new THREE.Vector3(b.minX, 0.05, z), new THREE.Vector3(b.maxX, 0.05, z), fmt(b.maxX - b.minX));
    const x = b.minX - 1.5;
    dim(new THREE.Vector3(x, 0.05, b.minZ), new THREE.Vector3(x, 0.05, b.maxZ), fmt(b.maxZ - b.minZ));
    dim(new THREE.Vector3(x, 0, b.minZ), new THREE.Vector3(x, b.topY, b.minZ), fmt(b.topY));
  }

  function setScan(x) {
    if (!scan) return;
    state.scanX = x;
    solidPlane.constant = -x;
    edgePlane.constant = x;
    scanSheet.position.x = x;
    labels.forEach(s => { s.material.opacity = s.position.x < x - 1 ? 1 : 0; });
  }

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  return {
    renderer, scene, camera, house, sun,
    setBuild: p => applyBuild(house, p),
    setScan, resize,
    render: () => renderer.render(scene, camera),
    BUILD_END,
    dispose: () => { renderer.dispose(); pmrem.dispose(); }
  };
}
