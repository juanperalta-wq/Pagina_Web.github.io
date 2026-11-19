'use strict';

/* ============================================================
   DEV//SIM_01 — INTERACTION & RENDER SYSTEMS
   ------------------------------------------------------------
   1. State & helpers
   2. Three.js topographic scene
   3. Live FPS telemetry
   4. HUD (cursor, scroll, coordinates)
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

  if (dom.renderModeLabel) {
    dom.renderModeLabel.textContent = state.mode === 'solid' ? 'SÓLIDO' : 'WIREFRAME';
  }
  if (dom.scopeMode) {
    dom.scopeMode.textContent = state.mode === 'solid' ? 'SOLID' : 'WIRE';
  }

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
   4. HUD: CURSOR, SCROLL, COORDINATES
   ------------------------------------------------------------ */

function initCursor() {
  if (!finePointer || reducedMotion) return;

  const ring = document.querySelector('.cursor-ring');
  const dot = document.querySelector('.cursor-dot');
  if (!ring || !dot) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  document.documentElement.classList.add('cursor-ready');

  window.addEventListener('mousemove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    dot.style.transform = 'translate3d(' + targetX + 'px, ' + targetY + 'px, 0)';
    document.documentElement.classList.add('cursor-active');
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', () => {
    document.documentElement.classList.remove('cursor-active');
  });

  document.documentElement.addEventListener('mouseenter', () => {
    document.documentElement.classList.add('cursor-active');
  });

  const hoverSelector = 'a, button, input, [data-tilt], .filter-btn';
  document.addEventListener('pointerover', (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest(hoverSelector)) {
      document.documentElement.classList.add('cursor-hover');
    }
  });
  document.addEventListener('pointerout', (event) => {
    const target = event.target;
    const related = event.relatedTarget;
    if (
      target instanceof Element &&
      target.closest(hoverSelector) &&
      !(related instanceof Element && related.closest(hoverSelector))
    ) {
      document.documentElement.classList.remove('cursor-hover');
    }
  });

  function animateCursor() {
    requestAnimationFrame(animateCursor);
    currentX = lerp(currentX, targetX, 0.17);
    currentY = lerp(currentY, targetY, 0.17);
    ring.style.transform = 'translate3d(' + currentX + 'px, ' + currentY + 'px, 0)';
  }

  requestAnimationFrame(animateCursor);
}

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
   6. PROJECT FILTERS & MODAL
   ------------------------------------------------------------ */

function initFilters() {
  const buttons = Array.from(document.querySelectorAll('.filter-btn'));
  const cards = Array.from(document.querySelectorAll('.bento-grid .card'));
  const resultsCount = document.getElementById('resultsCount');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');

      const category = button.dataset.filter;
      let visible = 0;

      cards.forEach((card) => {
        const show = category === 'all' || card.dataset.category === category;
        card.style.display = show ? 'flex' : 'none';
        if (show) visible++;
      });

      if (resultsCount) resultsCount.textContent = String(visible).padStart(2, '0');

      if (window.ScrollTrigger) {
        window.ScrollTrigger.refresh();
      }
    });
  });
}

const projectDetails = {
  sim1: {
    title: 'Simulador Dinámico de Fluidos y Estructuras',
    tech: 'Unreal Engine 5 • C++ • Chaos Physics • OpenXR',
    challenge: 'Simular fracturas en tiempo real y flujo de fluidos manteniendo 90 FPS estables en visores VR standalone.',
    solution: 'Implementación de pre-fractura jerárquica mediante Chaos Geometry Collections, LODs dinámicos basados en distancia al jugador y cálculo asíncrono de colisiones en hilos secundarios.',
    metrics: 'Reducción del 42% en tiempo de frame de CPU y latencia motion-to-photon inferior a 18ms.'
  },
  game1: {
    title: 'Protocolo Aegis: Tactical Shooter',
    tech: 'Unity • C# • NavMesh • Behaviour Trees',
    challenge: 'Crear escuadrones enemigos capaces de flanquear y coordinar fuego de supresión sin depender de rutas pre-programadas.',
    solution: 'Sistema de evaluación táctica de puntos de cobertura mediante Raycasting espacial y árboles de comportamiento modulares.',
    metrics: 'Soporte para 24 agentes simultáneos con un costo menor a 1.5ms por frame.'
  },
  tech1: {
    title: 'Simulación de Multitudes (100k Entidades)',
    tech: 'HLSL • Compute Shaders • GPU Instancing',
    challenge: 'Renderizar y simular el comportamiento colectivo (Boids) de 100,000 entidades sin saturar el bus CPU-GPU.',
    solution: 'Almacenamiento de posiciones y velocidades en ComputeBuffers y ejecución paralela de reglas de cohesión, alineación y separación directamente en la GPU.',
    metrics: '120 FPS constantes en resolución 1440p con 100,000 instancias activas.'
  }
};

let lastFocusedElement = null;

function openModal(id) {
  const data = projectDetails[id];
  if (!data || !dom.modal || !dom.modalBody) return;

  lastFocusedElement = document.activeElement;

  dom.modalBody.innerHTML =
    '<span class="meta"><span class="meta-dot"></span>' + data.tech + '</span>' +
    '<h3 id="modalTitle">' + data.title + '</h3>' +
    '<div class="modal-field"><strong>Reto Técnico</strong><p>' + data.challenge + '</p></div>' +
    '<div class="modal-field"><strong>Arquitectura &amp; Solución</strong><p>' + data.solution + '</p></div>' +
    '<div class="modal-result"><span>RESULTADO / TELEMETRÍA</span>' + data.metrics + '</div>';

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

  function frame(now) {
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
      requestAnimationFrame(frame);
    } else {
      nodes.forEach((node, index) => {
        node.nodeValue = originals[index];
      });
    }
  }

  requestAnimationFrame(frame);
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

function init() {
  window.__revealReady = true;

  try {
    initPointer();
    initScroll();
    initCursor();
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


