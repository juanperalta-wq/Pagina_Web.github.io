'use strict';

/* ============================================================
   DEV//SIM_01 — INTERACTION & RENDER SYSTEMS
   ------------------------------------------------------------
   1. State & helpers
   2. Three.js topographic scene
   3. Live FPS telemetry
   4. HUD (scroll, coordinates)
   5. Inspector + Lab controls
   6. Project filters & modal
   7. GSAP entrance / Slow-UP / scramble
   ============================================================ */

/* ------------------------------------------------------------
   1. STATE & HELPERS
   ------------------------------------------------------------ */

const state = {
  grid: 90,
  amplitude: 0.8,
  speed: 1,
  mode: 'wireframe',
  lang: 'es',
  filter: 'all',
  scroll: 0,
  scrollTarget: 0
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

const dom = {
  fpsValue: document.getElementById('fpsValue'),
  fpsMini: document.getElementById('fpsMini'),
  frameTime: document.getElementById('frameTime'),
  fpsGraph: document.getElementById('fpsGraph'),
  meshInfo: document.getElementById('meshInfo'),
  trisInfo: document.getElementById('trisInfo'),
  renderModeLabel: document.getElementById('renderModeLabel'),
  waveSpeed: document.getElementById('waveSpeed'),
  waveSpeedValue: document.getElementById('waveSpeedValue'),
  inspector: document.getElementById('inspector'),
  inspectorToggle: document.getElementById('inspectorToggle'),
  inspectorBody: document.getElementById('inspectorBody'),
  forceRange: document.getElementById('forceRange'),
  forceValue: document.getElementById('forceValue'),
  countRange: document.getElementById('countRange'),
  countValue: document.getElementById('countValue'),
  resetSim: document.getElementById('resetSim'),
  scopeAmp: document.getElementById('scopeAmp'),
  scopeGrid: document.getElementById('scopeGrid'),
  scopeMode: document.getElementById('scopeMode'),
  scrollProgress: document.getElementById('scrollProgress'),
  coordX: document.getElementById('coordX'),
  coordY: document.getElementById('coordY'),
  coordZ: document.getElementById('coordZ'),
  modal: document.getElementById('project-modal'),
  modalBody: document.getElementById('modal-body')
};

/* ------------------------------------------------------------
   1B. LANGUAGE / I18N
   ------------------------------------------------------------ */

const translations = {
  es: {
    'meta.title': 'DEV//SIM_01 — Ingeniero de Videojuegos y Simulaciones',
    'meta.description': 'Portafolio de desarrollo de videojuegos con Unity y Unreal Engine, simulaciones en tiempo real, C#, gráficos 3D y experiencias VR.',

    'a11y.skip': 'Ir al contenido',
    'a11y.logo': 'DEV SIM 01, inicio',
    'a11y.mainNav': 'Navegación principal',
    'a11y.heroVisual': 'Visualización de motor en tiempo real',
    'a11y.filters': 'Filtrar proyectos por categoría',
    'a11y.inspector': 'Inspector de motor gráfico',
    'a11y.renderMode': 'Modo de render',
    'a11y.waveSpeed': 'Velocidad de las ondas',
    'a11y.closeModal': 'Cerrar ficha técnica',
    'a11y.langToggle': 'Idioma actual: español. Cambiar a inglés',
    'a11y.langToggleTitle': 'Cambiar a inglés',

    'nav.projects': 'Proyectos',
    'nav.lab': 'Lab & Física',
    'nav.stack': 'Stack',
    'nav.contact': 'Contacto',

    'hero.title1': 'Creación de',
    'hero.title2': 'Videojuegos',
    'hero.title3': 'Simulaciones',
    'hero.subtitle': 'Desarrollo de mecánicas de gameplay, sistemas físicos en tiempo real, entornos 3D interactivos y experiencias VR/AR optimizadas con Unity, Unreal Engine y C#.',
    'hero.explore': 'Explorar Proyectos',
    'hero.try': 'Probar Simulación',
    'hero.move': 'MUEVE EL CURSOR',

    'projects.title': 'Proyectos',
    'projects.titleAccent': 'Destacados',
    'projects.desc': 'Sistemas jugables, tecnología de render y simulaciones de alto rendimiento construidas para producción.',
    'projects.entries': 'ENTRADAS',
    'projects.empty': 'No hay proyectos en la biblioteca todavía. Añade entradas en projects.json.',

    'filter.all': 'Todos',

    'card.viewSheet': 'Ver Ficha Técnica',

    'lab.title': 'Sandbox',
    'lab.titleAccent': '/ Lab de Simulación',
    'lab.desc': 'El terreno del fondo es una malla WebGL en vivo. Modifica sus parámetros y observa el resultado en tiempo real.',
    'lab.copy': 'El fondo de este portafolio renderiza un terreno topográfico procedural con Three.js: ondas calculadas en CPU, malla dinámica y luz volumétrica cian / violeta que responde al cursor y al scroll.',
    'lab.amplitude': 'AMPLITUD DE ONDAS',
    'lab.density': 'DENSIDAD DE MALLA',
    'lab.reset': 'REINICIAR SISTEMA',

    'stack.title': 'Stack',
    'stack.titleAccent': 'Técnico',
    'stack.desc': 'Stack de desarrollo centrado en Unity, Unreal Engine y C# para crear videojuegos y simulaciones en tiempo real.',
    'stack.engines': 'Motores',
    'stack.programming': 'Lenguaje',
    'stack.areas': 'Áreas de desarrollo',
    'stack.areaPlay': 'Gameplay',
    'stack.areaSystems': 'Sistemas interactivos',
    'stack.areaSim': 'Simulación en tiempo real',

    'contact.title': '¿Construimos el próximo',
    'contact.titleAccent': 'mundo virtual?',
    'contact.desc': 'Disponible para estudios de videojuegos, proyectos de simulación industrial, VR/AR y desarrollo técnico.',

    'inspector.solid': 'SÓLIDO',
    'mode.solid': 'SÓLIDO',
    'mode.wireframe': 'WIREFRAME',
    'mode.solidScope': 'SOLID',
    'mode.wire': 'WIRE',

    'modal.title': 'Ficha técnica',
    'modal.challenge': 'Reto Técnico',
    'modal.solution': 'Arquitectura & Solución',
    'modal.result': 'RESULTADO / TELEMETRÍA',

    'lang.switched': 'Idioma cambiado a español.'
  },

  en: {
    'meta.title': 'DEV//SIM_01 — Game Dev & Simulation Engineer',
    'meta.description': 'Game development portfolio with Unity and Unreal Engine, real-time simulation, C#, 3D graphics and VR experience.',

    'a11y.skip': 'Skip to content',
    'a11y.logo': 'DEV SIM 01, home',
    'a11y.mainNav': 'Main navigation',
    'a11y.heroVisual': 'Real-time engine visualization',
    'a11y.filters': 'Filter projects by category',
    'a11y.inspector': 'Graphics engine inspector',
    'a11y.renderMode': 'Render mode',
    'a11y.waveSpeed': 'Wave velocity',
    'a11y.closeModal': 'Close tech sheet',
    'a11y.langToggle': 'Current language: English. Switch to Spanish',
    'a11y.langToggleTitle': 'Switch to Spanish',

    'nav.projects': 'Projects',
    'nav.lab': 'Lab & Physics',
    'nav.stack': 'Stack',
    'nav.contact': 'Contact',

    'hero.title1': 'Building',
    'hero.title2': 'Games',
    'hero.title3': 'Simulations',
    'hero.subtitle': 'Development of gameplay mechanics, real-time physics systems, interactive 3D environments and optimized VR/AR experiences with Unity, Unreal Engine and C#.',
    'hero.explore': 'Explore Projects',
    'hero.try': 'Try Simulation',
    'hero.move': 'MOVE THE CURSOR',

    'projects.title': 'Featured',
    'projects.titleAccent': 'Projects',
    'projects.desc': 'Gameplay systems, rendering technology and high-performance simulations built for production.',
    'projects.entries': 'ENTRIES',
    'projects.empty': 'No projects in the library yet. Add entries to projects.json.',

    'filter.all': 'All',

    'card.viewSheet': 'View Tech Sheet',

    'lab.title': 'Sandbox',
    'lab.titleAccent': '/ Simulation Lab',
    'lab.desc': 'The background terrain is a live WebGL mesh. Adjust its parameters and watch the result in real time.',
    'lab.copy': 'This portfolio background renders a procedural topographic terrain with Three.js: CPU-computed waves, a dynamic mesh and cyan / violet volumetric light that reacts to the cursor and scroll.',
    'lab.amplitude': 'WAVE AMPLITUDE',
    'lab.density': 'MESH DENSITY',
    'lab.reset': 'RESET SYSTEM',

    'stack.title': 'Tech',
    'stack.titleAccent': 'Stack',
    'stack.desc': 'Development stack focused on Unity, Unreal Engine and C# for building games and real-time simulations.',
    'stack.engines': 'Engines',
    'stack.programming': 'Language',
    'stack.areas': 'Development Areas',
    'stack.areaPlay': 'Gameplay',
    'stack.areaSystems': 'Interactive Systems',
    'stack.areaSim': 'Real-Time Simulation',

    'contact.title': 'Shall we build the next',
    'contact.titleAccent': 'virtual world?',
    'contact.desc': 'Available for game studios, industrial simulation projects, VR/AR and technical development.',

    'inspector.solid': 'SOLID',
    'mode.solid': 'SOLID',
    'mode.wireframe': 'WIREFRAME',
    'mode.solidScope': 'SOLID',
    'mode.wire': 'WIRE',

    'modal.title': 'Tech Sheet',
    'modal.challenge': 'Technical Challenge',
    'modal.solution': 'Architecture & Solution',
    'modal.result': 'RESULT / TELEMETRY',

    'lang.switched': 'Language switched to English.'
  }
};

const LANG_STORAGE_KEY = 'devsim.lang';
let scrambleAbort = null;
let currentModalId = null;

function t(key, lang) {
  const dictionary = translations[lang || state.lang] || translations.es;
  const value = dictionary[key];
  return typeof value === 'string' ? value : (translations.es[key] || '');
}

function readStoredLang() {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    return saved === 'en' || saved === 'es' ? saved : null;
  } catch (error) {
    return null;
  }
}

function applyStaticTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = translations[lang][element.dataset.i18n];
    if (typeof value === 'string') element.textContent = value;
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    const value = translations[lang][element.dataset.i18nAria];
    if (typeof value === 'string') element.setAttribute('aria-label', value);
  });

  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    const label = heroTitle.textContent.replace(/\s+/g, ' ').trim();
    if (label) heroTitle.setAttribute('aria-label', label);
  }
}

function updateLanguageMetadata(lang) {
  document.title = t('meta.title', lang);
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', t('meta.description', lang));
}

function updateLanguageToggle(lang) {
  const toggle = document.getElementById('langToggle');
  if (!toggle) return;

  const label = t('a11y.langToggle', lang);
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('title', t('a11y.langToggleTitle', lang));
  toggle.setAttribute('aria-pressed', String(lang === 'en'));

  toggle.querySelectorAll('.lang-opt').forEach((option) => {
    option.classList.toggle('is-active', option.dataset.lang === lang);
  });
}

function updateRenderModeLabels() {
  if (dom.renderModeLabel) {
    dom.renderModeLabel.textContent = state.mode === 'solid' ? t('mode.solid') : t('mode.wireframe');
  }
  if (dom.scopeMode) {
    dom.scopeMode.textContent = state.mode === 'solid' ? t('mode.solidScope') : t('mode.wire');
  }
}

function announceLanguage(lang) {
  const status = document.getElementById('langStatus');
  if (status) status.textContent = t('lang.switched', lang);
}

function applyLanguage(lang, options) {
  const next = translations[lang] ? lang : 'es';
  const announce = !options || options.announce !== false;

  if (typeof scrambleAbort === 'function') scrambleAbort();

  state.lang = next;

  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch (error) {
    /* Storage unavailable: language still applies for this session. */
  }

  document.documentElement.lang = next;
  applyStaticTranslations(next);
  updateLanguageMetadata(next);
  updateLanguageToggle(next);
  updateRenderModeLabels();
  updateProjectCardsLanguage();

  if (currentModalId && dom.modal && dom.modal.classList.contains('open')) {
    renderModal(currentModalId);
  }

  if (announce) announceLanguage(next);
}

function initI18n() {
  const toggle = document.getElementById('langToggle');
  const initial = readStoredLang() || 'es';

  applyLanguage(initial, { announce: false });

  if (toggle) {
    toggle.addEventListener('click', () => {
      applyLanguage(state.lang === 'es' ? 'en' : 'es');
    });
  }
}

/* ------------------------------------------------------------
   2. THREE.JS TOPOGRAPHIC SCENE
   ------------------------------------------------------------ */

const three = {
  ready: false,
  scene: null,
  camera: null,
  renderer: null,
  mesh: null,
  overlay: null,
  geo: null,
  base: null,
  wireMat: null,
  solidMat: null,
  overlayMat: null,
  particles: null,
  cyanLight: null,
  violetLight: null,
  time: 0,
  lastNow: 0,
  pointerX: 0,
  pointerY: 0,
  targetPointerX: 0,
  targetPointerY: 0,
  pointerAmount: 0,
  pointerTargetAmount: 0,
  scroll: 0
};

const TERRAIN_SIZE = 52;

function buildTerrainGeometry(segments) {
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const position = geo.attributes.position;
  const count = position.count;
  const base = new Float32Array(count * 2);
  const colors = new Float32Array(count * 3);
  const near = new THREE.Color(0x00f0ff);
  const far = new THREE.Color(0x7000ff);
  const mixed = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);

    base[i * 2] = x;
    base[i * 2 + 1] = z;

    const depth = 1 - (z + TERRAIN_SIZE / 2) / TERRAIN_SIZE;
    const t = clamp(depth * 0.86 + 0.08 + (x / TERRAIN_SIZE) * 0.12, 0, 1);
    mixed.copy(near).lerp(far, t);

    colors[i * 3] = mixed.r;
    colors[i * 3 + 1] = mixed.g;
    colors[i * 3 + 2] = mixed.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.userData.base = base;
  return geo;
}

function updateMeshStats() {
  if (dom.meshInfo) dom.meshInfo.textContent = state.grid + ' × ' + state.grid;
  if (dom.trisInfo) {
    const tris = state.grid * state.grid * 2;
    dom.trisInfo.textContent = tris >= 1000 ? (tris / 1000).toFixed(1) + 'K' : String(tris);
  }
  if (dom.scopeGrid) dom.scopeGrid.textContent = state.grid + '²';
}

function makePoints(count, color, size, spread, depthOffset) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = Math.random() * 15 + 1.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 54 - 8 + depthOffset;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: color,
    size: size,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  return new THREE.Points(geo, mat);
}

function initThree() {
  if (!window.THREE) {
    setSceneOffline();
    return;
  }

  const canvas = document.getElementById('sim-canvas');
  if (!canvas) return;

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04070c, 0.019);

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 8.4, 16.5);
    camera.lookAt(0, -1.4, -8);

    scene.add(new THREE.AmbientLight(0x0b2233, 1.4));
    const hemisphere = new THREE.HemisphereLight(0x00f0ff, 0x1c0035, 1.1);
    scene.add(hemisphere);

    const cyanLight = new THREE.PointLight(0x00f0ff, 60, 70, 2);
    cyanLight.position.set(-10, 7, 4);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0x7000ff, 78, 80, 2);
    violetLight.position.set(11, 9, -8);
    scene.add(violetLight);

    const direction = new THREE.DirectionalLight(0x8fdcff, 1.35);
    direction.position.set(-6, 14, 7);
    scene.add(direction);

    const geo = buildTerrainGeometry(state.grid);

    const wireMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false
    });

    const solidMat = new THREE.MeshStandardMaterial({
      color: 0x0a1620,
      roughness: 0.34,
      metalness: 0.86,
      flatShading: true,
      emissive: 0x061522,
      emissiveIntensity: 1.15,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const overlayMat = wireMat.clone();
    overlayMat.opacity = 0.16;

    const mesh = new THREE.Mesh(geo, state.mode === 'solid' ? solidMat : wireMat);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const overlay = new THREE.Mesh(geo, overlayMat);
    overlay.frustumCulled = false;
    overlay.visible = state.mode === 'solid';
    scene.add(overlay);

    const particles = makePoints(220, 0x7df9ff, 0.075, 52, 0);
    const dust = makePoints(120, 0x9d7bff, 0.1, 58, 6);
    scene.add(particles);
    scene.add(dust);

    three.scene = scene;
    three.camera = camera;
    three.renderer = renderer;
    three.mesh = mesh;
    three.overlay = overlay;
    three.geo = geo;
    three.base = geo.userData.base;
    three.wireMat = wireMat;
    three.solidMat = solidMat;
    three.overlayMat = overlayMat;
    three.particles = particles;
    three.dust = dust;
    three.cyanLight = cyanLight;
    three.violetLight = violetLight;
    three.ready = true;

    updateMeshStats();
    setRenderMode(state.mode);

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    requestAnimationFrame(animateScene);
  } catch (error) {
    console.warn('[DEV//SIM] WebGL scene unavailable:', error);
    setSceneOffline();
  }
}

function setSceneOffline() {
  three.ready = false;
  if (dom.fpsValue) dom.fpsValue.textContent = 'OFF';
  if (dom.fpsMini) dom.fpsMini.textContent = 'OFF';
  if (dom.frameTime) dom.frameTime.textContent = 'NO GPU';
  if (dom.meshInfo) dom.meshInfo.textContent = 'N/A';
  if (dom.trisInfo) dom.trisInfo.textContent = 'N/A';
  document.querySelectorAll('[data-render-mode]').forEach((button) => {
    button.disabled = true;
    button.style.opacity = '0.4';
  });
}

function onResize() {
  if (!three.ready) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  three.camera.aspect = width / height;
  three.camera.updateProjectionMatrix();
  three.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  three.renderer.setSize(width, height);
}

function updateTerrain() {
  if (!three.ready) return;
  const position = three.geo.attributes.position;
  const base = three.base;
  const count = position.count;
  const t = three.time;
  const amplitude = state.amplitude;

  const mouseX = three.pointerX * 26;
  const mouseZ = -3 + three.pointerY * 16;
  const influence = three.pointerAmount;

  for (let i = 0; i < count; i++) {
    const x = base[i * 2];
    const z = base[i * 2 + 1];

    let y =
      Math.sin(x * 0.33 + t * 1.15) * 0.52 +
      Math.cos(z * 0.26 - t * 0.85) * 0.42 +
      Math.sin((x + z) * 0.17 + t * 0.68) * 0.3;

    if (influence > 0.001) {
      const dx = x - mouseX;
      const dz = z - mouseZ;
      const distanceSq = dx * dx + dz * dz;
      y += Math.exp(-distanceSq * 0.012) * influence * Math.sin(distanceSq * 0.25 - t * 2.2) * 1.1;
    }

    position.setY(i, y * amplitude - 1.4);
  }

  position.needsUpdate = true;
}

function animateScene(now) {
  requestAnimationFrame(animateScene);
  if (!three.ready || document.hidden) return;

  const delta = three.lastNow ? Math.min((now - three.lastNow) / 1000, 0.06) : 0.016;
  three.lastNow = now;

  const speed = reducedMotion ? 0 : state.speed;
  three.time += delta * speed;

  three.pointerX = lerp(three.pointerX, three.targetPointerX, 0.05);
  three.pointerY = lerp(three.pointerY, three.targetPointerY, 0.05);
  three.pointerAmount = lerp(three.pointerAmount, three.pointerTargetAmount, 0.04);
  three.scroll = lerp(three.scroll, state.scrollTarget, 0.055);

  updateTerrain();

  const camera = three.camera;
  const idleX = Math.sin(three.time * 0.11) * 0.35;
  camera.position.x = three.pointerX * 1.5 + idleX;
  camera.position.y = 8.4 - three.pointerY * 0.85 + three.scroll * 3;
  camera.position.z = 16.5 - three.scroll * 3.8;
  camera.lookAt(0, -1.4 - three.scroll * 0.9, -8);

  if (three.cyanLight) {
    three.cyanLight.position.x = -10 + three.pointerX * 3;
    three.cyanLight.position.y = 7 - three.pointerY * 1.5;
  }
  if (three.violetLight) {
    three.violetLight.position.x = 11 + three.pointerX * 2;
    three.violetLight.position.y = 9 + three.pointerY * 1.2;
  }

  if (three.particles) {
    three.particles.rotation.y += delta * 0.012;
    three.particles.position.y = Math.sin(three.time * 0.22) * 0.25;
  }
  if (three.dust) {
    three.dust.rotation.y -= delta * 0.008;
  }

  three.renderer.render(three.scene, three.camera);

  updateFPS(now);
  updateCoordinates();
}

function rebuildTerrain(segments) {
  state.grid = segments;
  updateMeshStats();
  updateUILabels();

  if (!three.ready) return;

  const oldGeo = three.geo;
  const geo = buildTerrainGeometry(segments);
  three.geo = geo;
  three.base = geo.userData.base;
  three.mesh.geometry = geo;
  three.overlay.geometry = geo;
  oldGeo.dispose();
}

function setRenderMode(mode) {
  state.mode = mode === 'solid' ? 'solid' : 'wireframe';

  document.querySelectorAll('[data-render-mode]').forEach((button) => {
    button.classList.toggle('active', button.dataset.renderMode === state.mode);
  });

  updateRenderModeLabels();

  if (!three.ready) return;
  three.mesh.material = state.mode === 'solid' ? three.solidMat : three.wireMat;
  three.overlay.visible = state.mode === 'solid';
}

/* ------------------------------------------------------------
   3. LIVE FPS TELEMETRY
   ------------------------------------------------------------ */

const fpsData = {
  frames: 0,
  last: 0,
  samples: []
};

function updateFPS(now) {
  fpsData.frames++;

  if (!fpsData.last) {
    fpsData.last = now;
    return;
  }

  const elapsed = now - fpsData.last;
  if (elapsed < 500) return;

  const fps = Math.round((fpsData.frames * 1000) / elapsed);
  fpsData.frames = 0;
  fpsData.last = now;

  fpsData.samples.push(fps);
  if (fpsData.samples.length > 42) fpsData.samples.shift();

  if (dom.fpsValue) dom.fpsValue.textContent = String(fps);
  if (dom.fpsMini) dom.fpsMini.textContent = String(fps);
  if (dom.frameTime) dom.frameTime.textContent = (1000 / Math.max(fps, 1)).toFixed(1) + ' ms';

  drawFPSGraph();
}

function drawFPSGraph() {
  const canvas = dom.fpsGraph;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || 272;
  const height = 44;

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(125, 249, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let y = 11; y < height; y += 11) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }

  const samples = fpsData.samples;
  const maxFPS = 120;
  const barSlot = width / 42;

  for (let i = 0; i < samples.length; i++) {
    const value = clamp(samples[i] / maxFPS, 0, 1);
    const barHeight = Math.max(1, value * (height - 9));
    const alpha = 0.18 + (i / Math.max(samples.length - 1, 1)) * 0.68;
    ctx.fillStyle = i === samples.length - 1
      ? 'rgba(125, 249, 255, 0.95)'
      : 'rgba(0, 240, 255, ' + alpha.toFixed(3) + ')';
    ctx.fillRect(i * barSlot + 1, height - barHeight - 4, Math.max(1, barSlot - 1.5), barHeight);
  }

  const targetY = height - (60 / maxFPS) * (height - 9) - 4;
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(0, targetY);
  ctx.lineTo(width, targetY);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ------------------------------------------------------------
   4. HUD: SCROLL, COORDINATES
   ------------------------------------------------------------ */

function initScroll() {
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    state.scrollTarget = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    if (dom.scrollProgress) {
      dom.scrollProgress.style.width = (state.scrollTarget * 100).toFixed(2) + '%';
    }
    document.body.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.55);
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

function updateCoordinates() {
  if (!three.ready || !dom.coordX) return;
  if (!updateCoordinates.lastRun) updateCoordinates.lastRun = 0;
  const now = performance.now();
  if (now - updateCoordinates.lastRun < 140) return;
  updateCoordinates.lastRun = now;

  const camera = three.camera;
  const format = (value) => (value < 0 ? '-' : '+') + Math.abs(value).toFixed(2).padStart(5, '0');

  dom.coordX.textContent = format(camera.position.x);
  dom.coordY.textContent = format(camera.position.y);
  dom.coordZ.textContent = format(camera.position.z);
}

function initPointer() {
  window.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    three.targetPointerX = (event.clientX / window.innerWidth) * 2 - 1;
    three.targetPointerY = (event.clientY / window.innerHeight) * 2 - 1;
    three.pointerTargetAmount = 1;
  }, { passive: true });
}

/* ------------------------------------------------------------
   5. INSPECTOR + LAB CONTROLS
   ------------------------------------------------------------ */

function updateUILabels() {
  if (dom.forceRange && dom.forceValue) {
    dom.forceValue.textContent = dom.forceRange.value;
  }
  if (dom.forceRange && dom.scopeAmp) {
    dom.scopeAmp.textContent = (Number(dom.forceRange.value) / 100).toFixed(2);
  }
  if (dom.countRange && dom.countValue) {
    dom.countValue.textContent = dom.countRange.value + ' × ' + dom.countRange.value;
  }
  if (dom.countRange && dom.scopeGrid) {
    dom.scopeGrid.textContent = dom.countRange.value + '²';
  }
  if (dom.waveSpeed && dom.waveSpeedValue) {
    dom.waveSpeedValue.textContent = state.speed.toFixed(2) + '×';
  }
  updateMeshStats();
}

function applyAmplitude(rawValue) {
  const raw = clamp(Number(rawValue), 0, 100);
  state.amplitude = 0.15 + (raw / 100) * 1.3;
  if (dom.forceValue) dom.forceValue.textContent = String(raw);
  if (dom.scopeAmp) dom.scopeAmp.textContent = (raw / 100).toFixed(2);
}

function setInspectorCollapsed(collapsed) {
  if (!dom.inspector) return;
  dom.inspector.classList.toggle('collapsed', collapsed);
  if (dom.inspectorToggle) {
    dom.inspectorToggle.setAttribute('aria-expanded', String(!collapsed));
  }
  if (dom.inspectorBody) {
    dom.inspectorBody.setAttribute('aria-hidden', String(collapsed));
    if ('inert' in dom.inspectorBody) dom.inspectorBody.inert = collapsed;
  }
}

function initInspector() {
  if (dom.inspectorToggle) {
    setInspectorCollapsed(window.innerWidth < 1760 || !finePointer);

    dom.inspectorToggle.addEventListener('click', () => {
      setInspectorCollapsed(!dom.inspector.classList.contains('collapsed'));
    });
  }

  document.querySelectorAll('[data-render-mode]').forEach((button) => {
    button.addEventListener('click', () => setRenderMode(button.dataset.renderMode));
  });

  if (dom.waveSpeed) {
    dom.waveSpeed.addEventListener('input', () => {
      state.speed = Number(dom.waveSpeed.value) / 100;
      if (dom.waveSpeedValue) dom.waveSpeedValue.textContent = state.speed.toFixed(2) + '×';
    });
  }

  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.metaKey || event.ctrlKey) return;
    if (event.key.toLowerCase() === 'i' && event.altKey && dom.inspector) {
      setInspectorCollapsed(!dom.inspector.classList.contains('collapsed'));
    }
  });
}

function initLab() {
  if (dom.forceRange) {
    dom.forceRange.addEventListener('input', () => applyAmplitude(dom.forceRange.value));
  }

  let densityTimer = 0;
  if (dom.countRange) {
    dom.countRange.addEventListener('input', () => {
      const segments = clamp(Number(dom.countRange.value), 40, 130);
      if (dom.countValue) dom.countValue.textContent = segments + ' × ' + segments;
      if (dom.scopeGrid) dom.scopeGrid.textContent = segments + '²';

      window.clearTimeout(densityTimer);
      densityTimer = window.setTimeout(() => rebuildTerrain(segments), 130);
    });
  }

  if (dom.resetSim) {
    dom.resetSim.addEventListener('click', () => {
      const previousGrid = state.grid;
      window.clearTimeout(densityTimer);

      if (dom.forceRange) dom.forceRange.value = '50';
      applyAmplitude(50);

      if (dom.countRange) dom.countRange.value = '90';
      if (dom.countValue) dom.countValue.textContent = '90 × 90';
      if (dom.scopeGrid) dom.scopeGrid.textContent = '90²';

      state.speed = 1;
      if (dom.waveSpeed) dom.waveSpeed.value = '100';
      if (dom.waveSpeedValue) dom.waveSpeedValue.textContent = '1.00×';

      setRenderMode('wireframe');
      three.time = 0;

      if (previousGrid !== 90) {
        rebuildTerrain(90);
      } else {
        state.grid = 90;
      }
      updateUILabels();
    });
  }

  if (dom.forceRange) applyAmplitude(dom.forceRange.value);
  updateUILabels();
}

/* ------------------------------------------------------------
   6. PROJECT LIBRARY (projects.json)
   ------------------------------------------------------------ */

const PROJECTS_URL = 'projects.json';

const projectLibrary = {
  categories: [],
  projects: [],
  byId: new Map()
};

function escapeHTML(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function localized(value, lang) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const preferred = value[lang];
  if (typeof preferred === 'string') return preferred;
  return typeof value.es === 'string' ? value.es : '';
}

function clipText(value, max) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

function categoryLabel(id, lang) {
  const category = projectLibrary.categories.find((item) => item.id === id);
  if (!category) return id;
  return localized(category.label, lang) || id;
}

function safeURL(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(?:https?:|mailto:)/i.test(value)) return value;
  if (value.startsWith('#') || value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return value;
  return '';
}

function normalizeCategories(categories) {
  const seen = new Set();

  return (Array.isArray(categories) ? categories : [])
    .filter((category) => category && typeof category.id === 'string' && category.id.trim())
    .filter((category) => {
      const id = category.id.trim();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((category) => ({
      id: category.id.trim(),
      label: category.label && typeof category.label === 'object'
        ? category.label
        : { es: category.id, en: category.id }
    }));
}

function normalizeProjects(projects) {
  const seen = new Set();

  return (Array.isArray(projects) ? projects : [])
    .filter((project) => project && typeof project.id === 'string' && /^[a-z0-9_-]+$/i.test(project.id))
    .filter((project) => typeof project.category === 'string' && project.category.trim())
    .filter((project) => {
      if (seen.has(project.id)) return false;
      seen.add(project.id);
      return true;
    })
    .map((project) => ({
      ...project,
      category: project.category.trim(),
      specs: Array.isArray(project.specs) ? project.specs : [],
      details: project.details && typeof project.details === 'object' ? project.details : {}
    }));
}

async function loadProjectLibrary() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(PROJECTS_URL, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error('HTTP ' + response.status);

    const data = await response.json();
    const categories = normalizeCategories(data.categories);
    const projects = normalizeProjects(data.projects);
    const known = new Set(categories.map((category) => category.id));

    projects.forEach((project) => {
      if (known.has(project.category)) return;
      known.add(project.category);
      categories.push({
        id: project.category,
        label: { es: project.category, en: project.category }
      });
    });

    projectLibrary.categories = categories;
    projectLibrary.projects = projects;
    projectLibrary.byId = new Map(projects.map((project) => [project.id, project]));
    return true;
  } catch (error) {
    projectLibrary.categories = [];
    projectLibrary.projects = [];
    projectLibrary.byId = new Map();
    console.warn('[DEV//SIM] No se pudo cargar projects.json:', error);
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

/* ------------------------------------------------------------
   6B. PROJECT FILTERS
   ------------------------------------------------------------ */

function updateFilterLabels() {
  document.querySelectorAll('.filter-btn').forEach((button) => {
    const id = button.dataset.filter;
    button.textContent = id === 'all' ? t('filter.all') : categoryLabel(id, state.lang);
  });
}

function renderFilters() {
  const container = document.querySelector('.filters');
  if (!container) return;

  const ids = ['all', ...projectLibrary.categories.map((category) => category.id)];

  const buttons = ids.map((id) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-btn' + (id === state.filter ? ' active' : '');
    button.dataset.filter = id;
    button.setAttribute('aria-pressed', String(id === state.filter));
    button.textContent = id === 'all' ? t('filter.all') : categoryLabel(id, state.lang);
    return button;
  });

  container.replaceChildren(...buttons);
}

function updateResultsCount(visible) {
  const resultsCount = document.getElementById('resultsCount');
  if (resultsCount) resultsCount.textContent = String(visible).padStart(2, '0');
}

function updateProjectTotal() {
  const resultsTotal = document.getElementById('resultsTotal');
  if (resultsTotal) resultsTotal.textContent = String(projectLibrary.projects.length).padStart(2, '0');
}

function applyProjectFilter(category, options) {
  const next = category || 'all';
  const known = next === 'all' || projectLibrary.categories.some((item) => item.id === next);
  state.filter = known ? next : 'all';

  document.querySelectorAll('.filter-btn').forEach((button) => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  let visible = 0;

  document.querySelectorAll('.bento-grid .card').forEach((card) => {
    const show = state.filter === 'all' || card.dataset.category === state.filter;
    card.style.display = show ? 'flex' : 'none';
    if (show) visible++;
  });

  updateResultsCount(visible);

  if ((!options || options.refresh !== false) && window.ScrollTrigger) {
    window.ScrollTrigger.refresh();
  }
}

function initFilters() {
  const container = document.querySelector('.filters');
  if (!container) return;

  container.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-btn');
    if (!button || !container.contains(button)) return;
    applyProjectFilter(button.dataset.filter);
  });
}

/* ------------------------------------------------------------
   6C. PROJECT CARDS
   ------------------------------------------------------------ */

function createGenericArtwork(project) {
  const uid = 'gen-' + project.id;
  const accent = project.category === 'videojuegos'
    ? '#ff5c7a'
    : project.category === 'shaders-tech' ? '#a78bfa' : '#00f0ff';
  const secondary = project.category === 'videojuegos' ? '#00f0ff' : '#7000ff';
  const code = escapeHTML(project.mediaCode || 'PROJECT');
  const category = escapeHTML(categoryLabel(project.category, state.lang).toUpperCase());
  const title = escapeHTML(clipText(localized(project.title, state.lang), 42));

  return [
    '<svg class="card-art" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">',
    '  <defs>',
    '    <linearGradient id="' + uid + '-bg" x1="0" y1="0" x2="1" y2="1">',
    '      <stop offset="0" stop-color="#050b14"/><stop offset=".55" stop-color="#0a1020"/><stop offset="1" stop-color="#09061a"/>',
    '    </linearGradient>',
    '    <radialGradient id="' + uid + '-glow" cx="50%" cy="50%" r="50%">',
    '      <stop stop-color="' + accent + '" stop-opacity=".28"/><stop offset="1" stop-color="' + accent + '" stop-opacity="0"/>',
    '    </radialGradient>',
    '    <linearGradient id="' + uid + '-line" x1="0" y1="0" x2="1" y2="0">',
    '      <stop stop-color="' + accent + '" stop-opacity=".08"/><stop offset=".55" stop-color="' + accent + '" stop-opacity=".9"/><stop offset="1" stop-color="' + secondary + '" stop-opacity=".15"/>',
    '    </linearGradient>',
    '    <pattern id="' + uid + '-grid" width="38" height="38" patternUnits="userSpaceOnUse">',
    '      <path d="M38 0H0v38" fill="none" stroke="' + accent + '" stroke-opacity=".09" stroke-width="1"/>',
    '    </pattern>',
    '  </defs>',
    '  <rect width="800" height="480" fill="url(#' + uid + '-bg)"/>',
    '  <rect width="800" height="480" fill="url(#' + uid + '-grid)"/>',
    '  <circle cx="620" cy="140" r="240" fill="url(#' + uid + '-glow)"/>',
    '  <g fill="none" stroke="' + accent + '" stroke-width="1" opacity=".34">',
    '    <circle cx="620" cy="140" r="72"/><circle cx="620" cy="140" r="116" stroke-dasharray="3 10"/><circle cx="620" cy="140" r="160" stroke-dasharray="1 14"/>',
    '    <path d="M620 -20v320M460 140h320" opacity=".35"/>',
    '  </g>',
    '  <g fill="none" stroke="url(#' + uid + '-line)" stroke-width="1.4">',
    '    <path d="M-30 326C110 290 190 356 320 330s210-64 330-30 120 52 210 26"/>',
    '    <path d="M-30 348C110 312 194 376 326 350s212-60 328-26 118 46 206 22" opacity=".55"/>',
    '  </g>',
    '  <g fill="' + accent + '"><circle cx="620" cy="140" r="3"/><circle cx="510" cy="238" r="2.5"/><circle cx="700" cy="262" r="2"/></g>',
    '  <g font-family="\'JetBrains Mono\',monospace" fill="' + accent + '" opacity=".72">',
    '    <text x="32" y="44" font-size="11" data-project-art-code>' + code + ' // ' + category + '</text>',
    '    <text x="32" y="64" fill="#8b9bb0" opacity=".72" font-size="11">ARCHIVE // REAL-TIME BUILD</text>',
    '    <text x="32" y="392" font-size="22" fill="#dffcff" data-project-art-title>' + title + '</text>',
    '    <text x="32" y="414" fill="#8b9bb0" opacity=".7" font-size="11">' + category + '</text>',
    '  </g>',
    '</svg>'
  ].join('\n');
}

function createProjectArt(project) {
  const visual = typeof project.visual === 'string' ? project.visual.replace(/[^a-z0-9-]/gi, '') : '';
  const template = visual ? document.getElementById('art-' + visual) : null;
  const wrapper = document.createElement('div');

  if (template) {
    const prefix = 'art-' + project.id + '-';
    wrapper.innerHTML = template.innerHTML
      .replace(/\bid="([a-z0-9]+)-/gi, 'id="' + prefix + '$1-')
      .replace(/url\(#([a-z0-9]+)-/gi, 'url(#' + prefix + '$1-');
    if (wrapper.firstElementChild) return wrapper.firstElementChild;
  }

  wrapper.innerHTML = createGenericArtwork(project);
  return wrapper.firstElementChild;
}

function createProjectCard(project) {
  const card = document.createElement('article');
  const layout = project.layout === 'featured' ? 'featured' : project.layout === 'wide' ? 'wide' : 'standard';

  card.className = 'card' + (layout === 'featured' ? ' featured' : layout === 'wide' ? ' card--wide' : '');
  card.dataset.category = project.category;
  card.dataset.projectId = project.id;
  card.dataset.tilt = '';
  card.dataset.tiltMax = layout === 'wide' ? '5' : '6';
  card.dataset.tiltSpeed = '800';
  card.dataset.tiltGlare = '';
  card.dataset.tiltMaxGlare = layout === 'wide' ? '0.14' : '0.18';

  const link = project.link && typeof project.link === 'object' ? project.link : {};
  const url = safeURL(link.url);
  const linkMarkup = url
    ? '<a href="' + escapeHTML(url) + '" class="link-code" target="_blank" rel="noopener noreferrer"><span data-project-link>' + escapeHTML(localized(link.label, state.lang)) + '</span> ↗</a>'
    : '';

  card.innerHTML = [
    '<div class="card-media">',
    '  <div class="media-overlay"></div>',
    '  <div class="media-top">',
    '    <span class="tag" data-project-tag>' + escapeHTML(localized(project.tags, state.lang)) + '</span>',
    '    <span class="media-code">' + escapeHTML(project.mediaCode || 'PROJECT') + '</span>',
    '  </div>',
    '  <div class="media-bottom">',
    '    <span class="play-hint"><span class="play-glyph">▶</span> <span data-project-preview>' + escapeHTML(localized(project.preview, state.lang)) + '</span></span>',
    '    <span class="media-engine">' + escapeHTML(project.engine || '') + '</span>',
    '  </div>',
    '  <span class="scan-beam" aria-hidden="true"></span>',
    '</div>',
    '<div class="card-body">',
    '  <div class="meta"><span class="meta-dot"></span><span data-project-meta>' + escapeHTML(localized(project.tech, state.lang)) + '</span></div>',
    '  <h3 data-project-title>' + escapeHTML(localized(project.title, state.lang)) + '</h3>',
    '  <p data-project-desc>' + escapeHTML(localized(project.description, state.lang)) + '</p>',
    '  <div class="card-specs">' + project.specs.map((spec) => '<span data-project-spec>' + escapeHTML(localized(spec, state.lang)) + '</span>').join('') + '</div>',
    '  <div class="card-footer">',
    '    <button class="btn-detail" type="button" onclick="openModal(\'' + project.id + '\')"><span data-project-cta>' + escapeHTML(t('card.viewSheet', state.lang)) + '</span> <span class="btn-detail-arrow" aria-hidden="true">→</span></button>',
    '    ' + linkMarkup,
    '  </div>',
    '</div>'
  ].join('\n');

  const media = card.querySelector('.card-media');
  const art = createProjectArt(project);
  if (media && art) media.insertBefore(art, media.firstChild);

  return card;
}

function renderProjects() {
  const grid = document.getElementById('projects-grid');
  const empty = document.getElementById('projectsEmpty');
  if (!grid) return;

  grid.replaceChildren(...projectLibrary.projects.map(createProjectCard));
  if (empty) empty.hidden = projectLibrary.projects.length > 0;

  updateProjectTotal();
  applyProjectFilter(state.filter, { refresh: false });
}

function updateProjectCardsLanguage() {
  const lang = state.lang;

  document.querySelectorAll('.card[data-project-id]').forEach((card) => {
    const project = projectLibrary.byId.get(card.dataset.projectId);
    if (!project) return;

    const setText = (selector, value) => {
      const element = card.querySelector(selector);
      if (element) element.textContent = value;
    };

    setText('[data-project-tag]', localized(project.tags, lang));
    setText('[data-project-preview]', localized(project.preview, lang));
    setText('[data-project-meta]', localized(project.tech, lang));
    setText('[data-project-title]', localized(project.title, lang));
    setText('[data-project-desc]', localized(project.description, lang));
    setText('[data-project-cta]', t('card.viewSheet', lang));
    setText('[data-project-link]', localized(project.link && project.link.label, lang));

    card.querySelectorAll('[data-project-spec]').forEach((element, index) => {
      if (project.specs[index] != null) element.textContent = localized(project.specs[index], lang);
    });

    const artTitle = card.querySelector('[data-project-art-title]');
    if (artTitle) artTitle.textContent = clipText(localized(project.title, lang), 42);

    const artCode = card.querySelector('[data-project-art-code]');
    if (artCode) {
      artCode.textContent = (project.mediaCode || 'PROJECT') + ' // ' + categoryLabel(project.category, lang).toUpperCase();
    }
  });

  updateFilterLabels();
}

/* ------------------------------------------------------------
   6D. PROJECT MODAL
   ------------------------------------------------------------ */

let lastFocusedElement = null;

function getProjectDetails(id) {
  const project = projectLibrary.byId.get(id);
  if (!project) return null;

  const lang = state.lang === 'en' ? 'en' : 'es';
  const details = project.details[lang] || project.details.es || project.details.en || {};

  return {
    title: localized(project.title, lang),
    tech: localized(project.tech, lang),
    challenge: localized(details.challenge, lang),
    solution: localized(details.solution, lang),
    metrics: localized(details.metrics, lang)
  };
}

function renderModal(id) {
  const data = getProjectDetails(id);
  if (!data || !dom.modalBody) return false;

  dom.modalBody.innerHTML =
    '<span class="meta"><span class="meta-dot"></span>' + escapeHTML(data.tech) + '</span>' +
    '<h3 id="modalTitle">' + escapeHTML(data.title) + '</h3>' +
    '<div class="modal-field"><strong>' + escapeHTML(t('modal.challenge')) + '</strong><p>' + escapeHTML(data.challenge) + '</p></div>' +
    '<div class="modal-field"><strong>' + escapeHTML(t('modal.solution')) + '</strong><p>' + escapeHTML(data.solution) + '</p></div>' +
    '<div class="modal-result"><span>' + escapeHTML(t('modal.result')) + '</span>' + escapeHTML(data.metrics) + '</div>';

  return true;
}

function openModal(id) {
  const data = getProjectDetails(id);
  if (!data || !dom.modal || !dom.modalBody) return;

  currentModalId = id;
  lastFocusedElement = document.activeElement;
  renderModal(id);

  dom.modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  const closeButton = dom.modal.querySelector('.close-modal');
  if (closeButton) {
    window.setTimeout(() => closeButton.focus(), 80);
  }

  if (window.gsap && !reducedMotion) {
    const content = dom.modal.querySelector('.modal-content');
    window.gsap.fromTo(dom.modal, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' });
    if (content) {
      window.gsap.fromTo(
        content,
        { y: 26, opacity: 0, scale: 0.985 },
        { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out', delay: 0.04, clearProps: 'transform' }
      );
    }
  }
}

function closeModal() {
  if (!dom.modal) return;
  dom.modal.classList.remove('open');
  document.body.style.overflow = '';
  currentModalId = null;

  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

function initModal() {
  if (!dom.modal) return;

  dom.modal.addEventListener('click', (event) => {
    if (event.target === dom.modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!dom.modal.classList.contains('open')) return;

    if (event.key === 'Escape') {
      closeModal();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = Array.from(
        dom.modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.disabled && element.getClientRects().length > 0);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

window.openModal = openModal;
window.closeModal = closeModal;

/* ------------------------------------------------------------
   7. GSAP ENTRANCE / SLOW-UP / SCRAMBLE / TILT
   ------------------------------------------------------------ */

function runScan(card) {
  const media = card.querySelector('.card-media');
  if (!media) return;

  media.classList.remove('is-scanning');
  void media.offsetWidth;
  media.classList.add('is-scanning');

  window.setTimeout(() => media.classList.remove('is-scanning'), 1650);
}

function disposeTilt(card) {
  if (card && card.vanillaTilt) {
    card.vanillaTilt.destroy();
  }
  if (card) card.dataset.tiltReady = '0';
}

function initTilt(card) {
  if (!card || !finePointer || reducedMotion) return;
  if (!window.VanillaTilt) return;
  if (card.dataset.tiltReady === '1') return;

  window.VanillaTilt.init(card, {
    max: Number(card.dataset.tiltMax) || 6,
    speed: 900,
    glare: true,
    'max-glare': Number(card.dataset.tiltMaxGlare) || 0.16,
    scale: 1.012,
    perspective: 1200,
    gyroscope: false,
    easing: 'cubic-bezier(.22,.61,.36,1)'
  });

  card.dataset.tiltReady = '1';
}

function initTiltAll() {
  document.querySelectorAll('.bento-grid .card').forEach((card) => initTilt(card));
}

function finishCardReveal(card) {
  if (!card) return;
  card.classList.add('is-revealed');

  const art = card.querySelector('.card-art');
  const media = card.querySelector('.card-media');
  const body = card.querySelector('.card-body');

  if (art) art.classList.add('is-revealed');

  if (window.gsap) {
    window.gsap.set(card, { clearProps: 'transform,filter,opacity,willChange' });
    if (art) window.gsap.set(art, { clearProps: 'transform,filter' });
    if (media) window.gsap.set(media, { clearProps: 'transform,filter' });
    if (body) window.gsap.set(body, { clearProps: 'transform,filter' });
  }

  initTilt(card);
}

function animateHero() {
  const gsap = window.gsap;
  const content = document.querySelector('.hero-content');
  const visual = document.querySelector('.hero-visual');
  const footer = document.querySelector('.hero-footer');
  const title = document.querySelector('.hero-title');
  if (!content) return;

  const children = Array.from(content.children);

  gsap.set(children, { opacity: 0, y: 45 });
  if (visual) gsap.set(visual, { opacity: 0, x: 26 });
  if (footer) gsap.set(footer, { opacity: 0, y: 16 });

  const timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.12 });

  timeline.to(children, {
    opacity: 1,
    y: 0,
    duration: 0.95,
    stagger: 0.09,
    clearProps: 'transform'
  }, 0);

  if (title) {
    timeline.fromTo(title,
      { filter: 'blur(8px)' },
      { filter: 'blur(0px)', duration: 1.2, ease: 'power2.out', clearProps: 'filter' },
      0.05
    );
  }

  if (visual) {
    timeline.to(visual, { opacity: 1, x: 0, duration: 1.15, ease: 'power3.out' }, 0.3);
  }

  if (footer) {
    timeline.to(footer, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.55);
  }
}

function initScrollReveals() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const cards = gsap.utils.toArray('.bento-grid .card');
  const revealElements = gsap.utils.toArray('[data-reveal]');

  gsap.set(cards, { y: 45, opacity: 0, filter: 'blur(6px)' });
  gsap.set(revealElements, { y: 45, opacity: 0, filter: 'blur(6px)' });

  ScrollTrigger.batch(cards, {
    start: 'top 88%',
    once: true,
    interval: 0.12,
    batchMax: 4,
    onEnter: (batch) => {
      batch.forEach((card, index) => {
        const art = card.querySelector('.card-art');
        const media = card.querySelector('.card-media');

        const timeline = gsap.timeline({
          delay: index * 0.14,
          onComplete: () => finishCardReveal(card)
        });

        timeline.to(card, {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1.05,
          ease: 'power3.out'
        }, 0);

        if (media) {
          timeline.fromTo(media,
            { y: 14, filter: 'blur(4px)' },
            { y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' },
            0.04
          );
        }

        if (art) {
          timeline.fromTo(art,
            { scale: 1.08 },
            { scale: 1, duration: 1.4, ease: 'power2.out' },
            0.02
          );
        }

        timeline.add(() => runScan(card), 1.3);
      });
    }
  });

  ScrollTrigger.batch(revealElements, {
    start: 'top 90%',
    once: true,
    interval: 0.1,
    onEnter: (batch) => {
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        onComplete: () => {
          batch.forEach((element) => {
            element.classList.add('is-revealed');
            gsap.set(element, { clearProps: 'transform,filter,opacity,willChange' });
          });
        }
      });
    }
  });
}

function revealEverything() {
  document.documentElement.classList.add('reveal-fallback');
  document.querySelectorAll('.card, [data-reveal], .card-art').forEach((element) => {
    element.classList.add('is-revealed');
  });
  initTiltAll();
}

function initScramble() {
  const title = document.getElementById('heroTitle');
  if (!title || title.dataset.scrambled === '1') return;
  title.dataset.scrambled = '1';

  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.nodeValue && node.nodeValue.trim().length > 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  if (!nodes.length) return;

  const originals = nodes.map((node) => node.nodeValue);
  const startIndices = [];
  let totalChars = 0;

  originals.forEach((text) => {
    startIndices.push(totalChars);
    totalChars += text.length;
  });

  const ariaLabel = title.textContent.replace(/\s+/g, ' ').trim();
  title.setAttribute('aria-label', ariaLabel);

  if (reducedMotion) return;

  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/[]{}=+*^?#$%&';
  const startTime = performance.now() + 380;
  const revealWindow = 1250;
  let frameId = 0;
  let aborted = false;

  scrambleAbort = () => {
    aborted = true;
    window.cancelAnimationFrame(frameId);
    nodes.forEach((node, index) => {
      node.nodeValue = originals[index];
    });
    scrambleAbort = null;
  };

  function frame(now) {
    if (aborted) return;

    const elapsed = now - startTime;
    let finished = true;

    nodes.forEach((node, nodeIndex) => {
      const original = originals[nodeIndex];
      let output = '';

      for (let i = 0; i < original.length; i++) {
        const character = original[i];

        if (character === ' ' || character === '\n' || character === '\t') {
          output += character;
          continue;
        }

        const globalIndex = startIndices[nodeIndex] + i;
        const revealAt = (globalIndex / Math.max(totalChars - 1, 1)) * revealWindow + 160;

        if (elapsed >= revealAt) {
          output += character;
        } else {
          finished = false;
          const glyphIndex = (globalIndex * 13 + Math.floor(now / 42) + i * 7) % glyphs.length;
          output += glyphs[glyphIndex];
        }
      }

      node.nodeValue = output;
    });

    if (elapsed < 0) finished = false;

    if (!finished) {
      frameId = requestAnimationFrame(frame);
    } else {
      nodes.forEach((node, index) => {
        node.nodeValue = originals[index];
      });
      scrambleAbort = null;
    }
  }

  frameId = requestAnimationFrame(frame);
}

function initAnimations() {
  const hasGSAP = !!window.gsap;
  const hasScrollTrigger = hasGSAP && !!window.ScrollTrigger;

  if (!hasGSAP || reducedMotion) {
    revealEverything();
    if (!reducedMotion) window.setTimeout(initScramble, 300);
    window.__revealReady = true;
    return;
  }

  try {
    animateHero();

    if (hasScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      initScrollReveals();

      window.addEventListener('load', () => {
        window.ScrollTrigger.refresh();
      });

      window.setTimeout(() => window.ScrollTrigger.refresh(), 650);
    } else {
      document.documentElement.classList.add('reveal-fallback');
      initTiltAll();
    }

    window.setTimeout(initScramble, 480);
    window.__revealReady = true;
  } catch (error) {
    console.warn('[DEV//SIM] Entrance animation fallback:', error);
    revealEverything();
    window.setTimeout(initScramble, 300);
    window.__revealReady = true;
  }
}

/* ------------------------------------------------------------
   BOOT
   ------------------------------------------------------------ */

async function init() {
  window.__revealReady = true;

  try {
    await loadProjectLibrary();
    initI18n();
    renderFilters();
    renderProjects();
    initPointer();
    initScroll();
    initThree();
    initInspector();
    initLab();
    initFilters();
    initModal();
    drawFPSGraph();
    initAnimations();
  } catch (error) {
    console.warn('[DEV//SIM] Initialization fallback:', error);
    revealEverything();
    window.__revealReady = true;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}


